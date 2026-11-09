import { runOnRenderThread } from "./renderCleanup";
import { disposeOwnedPopups, hasOwnedPopups } from "../nativeUi/runtime/popupOwnership";
import { disableNativeListeners, disposeNativeListeners } from "../nativeUi/platform/memory";
import { stopSliderPoll } from "../nativeUi/dialogs/outline";
import { nativeUiRuntime, outlineState } from "../nativeUi/runtime/state";
import { nativeUiServices } from "../nativeUi/runtime/services";
import { detachOwnedNode } from "../nativeUi/widgets/display";
import { runtimeState } from "./controllers";
import { onDispose } from "./lifecycle";

let registered = false;
let disposal: Promise<void> | undefined;

export function installNativeUiDisposal(): void {
  if (registered) return;
  registered = true;
  onDispose(disposeNativeUi);
}

export function disposeNativeUi(): Promise<void> {
  if (disposal) return disposal;
  const errors: string[] = [];
  const attempt = (cleanup: () => void) => {
    try {
      cleanup();
    } catch (error) {
      errors.push(String(error));
    }
  };
  outlineState.outlineEnabled = false;
  outlineState.reopenOutlineOnHome = false;
  attempt(stopSliderPoll);
  // Listener-slot writes are safe without invoking game scene code. Make callbacks
  // unreachable before waiting for another frame, including the timeout case.
  attempt(disableNativeListeners);
  nativeUiServices.openOutline = undefined;
  nativeUiServices.openCredits = undefined;
  nativeUiServices.setOutlineEnabled = undefined;
  nativeUiServices.firstMount = undefined;

  const state = nativeUiRuntime.state;
  const nodes = new Map<string, NativePointer>();
  if (state) {
    const add = (node: NativePointer | null | undefined) => {
      attempt(() => {
        if (node && !node.isNull()) nodes.set(node.toString(), node);
      });
    };
    for (const key of [
      "debugButton",
      "buildTag",
      "pendingBuildTag",
      "pendingLicenseTag",
      "pendingFpsTag",
      "fpsTag",
      "licenseTag",
      "telegramButton",
      "telegramClip",
      "menuObjKj6",
      "menuObjX0on",
      "menuObjBvh",
      "menuObjDgl",
    ]) {
      add(state[key]);
      state[key] = null;
    }
    for (const key of [
      "debugButtonRef",
      "settingsButtonRef",
      "menuWidgetMJl",
      "menuWidgetEJZ",
      "menuWidgetBmx",
      "menuWidgetQ8h7",
      "menuWidgetE7l",
    ]) {
      add(state[key]?.button);
      state[key] = null;
    }
    const layout = state.menuLayout;
    if (layout) {
      add(layout.primaryNode);
      add(layout.secondaryNode);
      add(layout.primaryWidget?.button);
      add(layout.secondaryWidget?.button);
      for (const widget of layout.widgets || []) add(widget?.button);
      layout.primaryNode = layout.secondaryNode = null;
      layout.primaryWidget = layout.secondaryWidget = null;
      layout.widgets = [];
    }
    // The core also holds references to launchers created by the native fallback.
    for (const key of ["debugButtonRef", "settingsButtonRef"] as const) {
      const reference = runtimeState[key];
      attempt(() => {
        if (reference && nodes.has(reference.button.toString())) runtimeState[key] = null;
      });
    }
    state.debugButtonClip = state.fpsTextField = state.licenseTextField = null;
    state.menuArmed = false;
  }
  const removeOwnedUi = () => {
    attempt(disposeOwnedPopups);
    for (const node of nodes.values()) attempt(() => detachOwnedNode(node));
    attempt(disposeNativeListeners);
    outlineState.outlinePopupState = null;
    outlineState.outlinePopupOpen = false;
  };
  if (nodes.size || hasOwnedPopups()) {
    disposal = runOnRenderThread(removeOwnedUi).catch((error) => {
      errors.push(String(error));
    });
  } else {
    removeOwnedUi();
    disposal = Promise.resolve();
  }
  disposal = disposal.then(() => {
    if (errors.length) throw new Error("Native UI cleanup failed: " + errors.join("; "));
  });
  return disposal;
}
