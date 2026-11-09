type Cleanup = () => void | Promise<void>;
export interface DisposalReport {
  disposed: true;
  errors: string[];
}

let phase: "running" | "disposing" | "disposed" = "running";
let disposal: Promise<DisposalReport> | undefined;
let installed = false;
const cleanups = new Set<Cleanup>();
const timers = new Map<number, "timeout" | "interval">();
const listeners = new Set<InvocationListener>();

export function isDisposing(): boolean {
  return phase !== "running";
}

export function onDispose(cleanup: Cleanup): () => void {
  if (phase === "disposed") throw new Error("Script has been disposed");
  cleanups.add(cleanup);
  return () => {
    cleanups.delete(cleanup);
  };
}

export function scheduleTimeout(callback: ScheduledCallback, delay = 0, ...args: any[]): TimeoutId {
  if (isDisposing()) return 0;
  const id = globalThis.setTimeout(() => {
    timers.delete(id);
    if (!isDisposing()) callback(...args);
  }, delay);
  timers.set(id, "timeout");
  return id;
}

export function scheduleInterval(
  callback: ScheduledCallback,
  delay: number,
  ...args: any[]
): IntervalId {
  if (isDisposing()) return 0;
  const id = globalThis.setInterval(() => {
    if (!isDisposing()) callback(...args);
  }, delay);
  timers.set(id, "interval");
  return id;
}

export function cancelTimeout(id: TimeoutId): void {
  timers.delete(id);
  globalThis.clearTimeout(id);
}

export function cancelInterval(id: IntervalId): void {
  timers.delete(id);
  globalThis.clearInterval(id);
}

function trackHook(
  target: NativePointerValue,
  callbacks: ScriptInvocationListenerCallbacks,
  allowDuringCleanup: boolean,
): InvocationListener {
  if (phase === "disposed" || (!allowDuringCleanup && isDisposing())) {
    throw new Error("Cannot install a hook while disposing");
  }
  const listener = Interceptor.attach(
    target,
    allowDuringCleanup
      ? callbacks
      : {
          onEnter: callbacks.onEnter
            ? function (args) {
                if (!isDisposing()) callbacks.onEnter!.call(this, args);
              }
            : undefined,
          onLeave: callbacks.onLeave
            ? function (result) {
                if (!isDisposing()) callbacks.onLeave!.call(this, result);
              }
            : undefined,
        },
  );
  const subscription = {
    detach() {
      if (!listeners.delete(subscription)) return;
      listener.detach();
    },
  };
  listeners.add(subscription);
  return subscription;
}

export function attachHook(
  target: NativePointerValue,
  callbacks: ScriptInvocationListenerCallbacks,
): InvocationListener {
  return trackHook(target, callbacks, false);
}

/** Destruction notifications must still run while owned native widgets are removed. */
export function attachCleanupHook(
  target: NativePointerValue,
  callbacks: ScriptInvocationListenerCallbacks,
): InvocationListener {
  return trackHook(target, callbacks, true);
}

export function dispose(): Promise<DisposalReport> {
  if (disposal) return disposal;
  phase = "disposing";
  const errors: string[] = [];
  let pinned = false;
  try {
    Script.pin();
    pinned = true;
  } catch (error) {
    errors.push(String(error));
  }
  for (const [id, kind] of timers) {
    try {
      if (kind === "timeout") globalThis.clearTimeout(id);
      else globalThis.clearInterval(id);
    } catch (error) {
      errors.push(String(error));
    }
  }
  timers.clear();
  // Begin on a microtask so reentrant calls see the same promise.
  disposal = Promise.resolve().then(async () => {
    try {
      while (cleanups.size) {
        const batch = [...cleanups].reverse();
        cleanups.clear();
        const results = await Promise.allSettled(
          batch.map((cleanup) => Promise.resolve().then(cleanup)),
        );
        for (const result of results) {
          if (result.status === "rejected") errors.push(String(result.reason));
        }
      }
    } finally {
      for (const listener of [...listeners]) {
        try {
          listener.detach();
        } catch (error) {
          errors.push(String(error));
        }
      }
      listeners.clear();
      phase = "disposed";
      if (pinned) {
        try {
          Script.unpin();
        } catch (error) {
          errors.push(String(error));
        }
      }
    }
    return { disposed: true as const, errors };
  });
  return disposal;
}

export function initializeDisposal(): void {
  if (installed) return;
  installed = true;
  // globalThis stays alive until script unload; ordinary GC must not tear down the mod.
  Script.bindWeak(globalThis, () => {
    void dispose();
  });
  rpc.exports.dispose = dispose;
}
