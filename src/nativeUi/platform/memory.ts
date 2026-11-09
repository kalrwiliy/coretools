import { isDisposing } from "../../runtime/lifecycle";
import { nativeUiBindings } from "../runtime/state";

export const listenerCallbacks = new Map<string, NativeCallback<"void", ["pointer", "pointer"]>>();

interface ListenerRegistration {
  holder: NativePointer;
  listener: NativePointer;
  button?: NativePointer;
}
const listenerRegistrations = new Map<string, ListenerRegistration>();
const pendingReleaseErrors: string[] = [];

export function attachButtonListener(button: NativePointer, holder: NativePointer): void {
  const registration = listenerRegistrations.get(holder.toString());
  if (registration) registration.button = button;
  button.add(168).writePointer(holder);
}

/** Stop new button dispatches without releasing callbacks that native code may already hold. */
export function disableNativeListeners(): void {
  const errors: string[] = [];
  for (const registration of listenerRegistrations.values()) {
    if (!registration.button) continue;
    try {
      const slot = registration.button.add(168);
      if (slot.readPointer().equals(registration.holder)) slot.writePointer(ptr(0));
    } catch (error) {
      errors.push(String(error));
    }
  }
  if (errors.length) throw new Error("Native listener disabling failed: " + errors.join("; "));
}

function releaseListener(holder: NativePointer, errors: string[]): void {
  const key = holder.toString();
  const registration = listenerRegistrations.get(key);
  if (!registration) return;
  // Clear the owning button first, before removing the executable callback address.
  if (registration.button) {
    try {
      const slot = registration.button.add(168);
      if (slot.readPointer().equals(holder)) slot.writePointer(ptr(0));
    } catch (error) {
      errors.push(String(error));
    }
  }
  let disconnected = false;
  try {
    registration.listener.add(Process.pointerSize).writePointer(ptr(0));
    disconnected = true;
  } catch (error) {
    errors.push(String(error));
  }
  try {
    registration.holder.writePointer(ptr(0));
    disconnected = true;
  } catch (error) {
    errors.push(String(error));
  }
  // Retain executable callbacks if native memory can still reach them. An explicit
  // dispose reports the failure; releasing JS ownership here would make it unsafe.
  if (disconnected) {
    listenerRegistrations.delete(key);
    listenerCallbacks.delete(key);
  }
}

export function releaseNativeListener(holder: NativePointer): void {
  releaseListener(holder, pendingReleaseErrors);
}

export function releaseButtonListener(button: NativePointer): void {
  try {
    releaseNativeListener(button.add(168).readPointer());
  } catch (error) {
    pendingReleaseErrors.push(String(error));
  }
}

export function disposeNativeListeners(): void {
  const errors = pendingReleaseErrors.splice(0);
  for (const entry of Array.from(listenerRegistrations.values())) {
    try {
      releaseListener(entry.holder, errors);
    } catch (error) {
      errors.push(String(error));
    }
  }
  if (errors.length) throw new Error("Native listener release failed: " + errors.join("; "));
}

export function createNativeListener(onPress: any): any {
  const callback = new NativeCallback(
    function (a1: any, a2: any) {
      if (isDisposing()) return;
      try {
        onPress(a1, a2);
      } catch (error) {}
    },
    "void",
    ["pointer", "pointer"],
  );
  const listener = nativeUiBindings.calloc(Process.pointerSize * 2, 1);
  listener.add(Process.pointerSize).writePointer(callback);
  const holder = nativeUiBindings.calloc(Process.pointerSize * 2, 1);
  holder.writePointer(listener);
  listenerCallbacks.set(holder.toString(), callback);
  listenerRegistrations.set(holder.toString(), { holder, listener });
  return holder;
}

export function createScString(text: any): any {
  const str = nativeUiBindings.malloc(128);
  nativeUiBindings.stringCtor(str, Memory.allocUtf8String(String(text)));

  return str;
}

export function isValidPtr(pointer: any): boolean {
  try {
    return !!(pointer && !pointer.isNull() && pointer.compare(ptr(65536)) > 0);
  } catch (error) {
    return false;
  }
}

export function cstr(text: any): NativePointer {
  return Memory.allocUtf8String(String(text));
}

export function createScString32(text: any): any {
  const str = nativeUiBindings.calloc(32, 1);
  return (nativeUiBindings.stringCtor as any).call(nativeUiBindings, str, cstr(text ? text : ""));
}
