import { attachHook } from "../../runtime/lifecycle";
import { nativeUiRuntime } from "./state";

// These render, HUD, and state listeners live until Frida unloads the script.
export function attachTracked(
  address: NativePointer,
  callbacks: ScriptInvocationListenerCallbacks,
): InvocationListener {
  const listener = attachHook(address, callbacks);
  nativeUiRuntime.state.trackedListeners.push(listener);
  return listener;
}
