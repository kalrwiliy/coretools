import { cancelInterval, scheduleInterval } from "../../runtime/lifecycle";
import { loadDebugSc } from "../../engine/assets";
import { getWidth, setVisible } from "../../engine/displayObject";
import { getGameState } from "../../engine/gameState";
import { isValidPtr as isValidPtrFromCore } from "../../engine/memory";
import { mainMenuState } from "../../menu/settings/state";
import { runtimeState } from "../../runtime/controllers";
import { setNodeAction } from "../../ui/nodeActions";
import { uiOwnership } from "../../webui/ownership";
import { isValidPtr } from "../platform/memory";
import { nativeUiBindings, nativeUiRuntime } from "../runtime/state";
import { getMovieClipFrom } from "../widgets/assets";
import { initButtonWithClip, setButtonText } from "../widgets/buttons";
import { addToStage, gotoFrame, setPositionRaw, setScaleRaw } from "../widgets/display";
import { computeLayout } from "../widgets/layout";
import { mountBuildTag, mountFpsTag, mountLicenseTag } from "./tags";
export function createDebugButton(): boolean {
  if (uiOwnership.webViewAttached) return true;
  if (nativeUiRuntime.state.debugButton && !nativeUiRuntime.state.debugButton.isNull()) {
    return true;
  }
  try {
    loadDebugSc();
  } catch (error) {
    throw error;
  }
  const clip: any = getMovieClipFrom("sc/debug.sc", "debug_button");
  if (!isValidPtr(clip)) return false;
  let button: any = ptr(0);
  try {
    button = nativeUiBindings.malloc(640);
    nativeUiBindings.gameButtonCtor(button);
    if (!initButtonWithClip(button, clip)) return false;
  } catch (error) {
    return false;
  }
  if (!isValidPtr(button)) {
    return false;
  }
  gotoFrame(clip, 1);
  const buttonScale = 1.14;
  const layoutScale = computeLayout().scale;
  setPositionRaw(button, Math.round(60 * layoutScale), Math.round(378 * layoutScale));
  setScaleRaw(button, buttonScale, buttonScale);
  setButtonText(button, "D");
  if (!addToStage(button)) {
    return false;
  }
  setButtonText(button, "D");
  nativeUiRuntime.state.debugButton = button;
  nativeUiRuntime.state.debugButtonClip = clip;
  nativeUiRuntime.state.debugButtonRef = { button: button, clip: clip };
  runtimeState.debugButtonRef = { button: button, clip: clip };
  try {
    setNodeAction(button, {
      kind: "dbgmenu",
    });
  } catch (error) {}
  try {
    setNodeAction(clip, {
      kind: "dbgmenu",
    });
  } catch (error) {}
  return true;
}
export function startButtonWatchdog(): void {
  if (nativeUiRuntime.state.buttonWatchdog) {
    cancelInterval(nativeUiRuntime.state.buttonWatchdog);
    nativeUiRuntime.state.buttonWatchdog = null;
  }
  let ticks = 0;
  nativeUiRuntime.state.buttonWatchdog = scheduleInterval(function () {
    if (++ticks > 6000) {
      cancelInterval(nativeUiRuntime.state.buttonWatchdog);
      nativeUiRuntime.state.buttonWatchdog = null;
      return;
    }
    const dbgOwn = runtimeState.debugButtonRef;
    const dbgAlive = dbgOwn && isValidPtrFromCore(dbgOwn.button);
    if (!dbgAlive) {
      if (!nativeUiRuntime.state.debugButton || nativeUiRuntime.state.debugButton.isNull()) {
        try {
          createDebugButton();
        } catch (error) {}
      }
    }
    const einst = runtimeState.settingsButtonRef;
    if (!einst || !isValidPtrFromCore(einst.button)) {
      try {
        createSettingsButton();
      } catch (error) {}
    }
    // Retry HUD attachment until a valid stage is available.
    if (!uiOwnership.webViewAttached && !nativeUiRuntime.state.buildTag) {
      try {
        mountBuildTag();
      } catch (error) {}
    }
    if (!uiOwnership.webViewAttached && !nativeUiRuntime.state.fpsTag) {
      try {
        mountFpsTag();
      } catch (error) {}
    }
    if (!uiOwnership.webViewAttached && !nativeUiRuntime.state.licenseTag) {
      try {
        mountLicenseTag();
      } catch (error) {}
      return;
    }
    return;
  }, 1200);
}
export function createSettingsButton(): boolean {
  if (uiOwnership.webViewAttached) return true;
  if (
    nativeUiRuntime.state.settingsButtonRef &&
    isValidPtrFromCore(nativeUiRuntime.state.settingsButtonRef.button)
  )
    return true;
  const clip: any = getMovieClipFrom("sc/ui.sc", "map_editor_big_exit_button");
  if (!isValidPtr(clip)) {
    return false;
  }
  let button: any = ptr(0);
  try {
    button = nativeUiBindings.malloc(640);
    nativeUiBindings.gameButtonCtor(button);
    if (!initButtonWithClip(button, clip)) return false;
  } catch (error) {
    return false;
  }
  if (!isValidPtr(button)) {
    return false;
  }
  gotoFrame(clip, 1);
  const debugButton = runtimeState.debugButtonRef
    ? runtimeState.debugButtonRef.button
    : runtimeState.debugButtonRef;
  let debugHalfWidth: any = isValidPtrFromCore(debugButton) ? getWidth(debugButton) / 2 : 80;
  if (!(debugHalfWidth > 1)) {
    debugHalfWidth = 80;
  }
  let settingsHalfWidth: any = getWidth(button) / 2;
  if (!(settingsHalfWidth > 1)) {
    settingsHalfWidth = 80;
  }
  const x = 74 - debugHalfWidth - 10 - settingsHalfWidth + 40 + 40 + 400 + 60 - 30;
  const y = 525 - 30 - 20 - 450 + 30;
  const scale = computeLayout().scale;
  setPositionRaw(button, Math.round((x / 1.229) * scale), Math.round((y / 1.229) * scale));
  setScaleRaw(button, 1.15, 1.15);
  setButtonText(button, "Einstellungen");
  if (!addToStage(button)) {
    return false;
  }
  setButtonText(button, "Einstellungen");
  mainMenuState.button = button;
  nativeUiRuntime.state.settingsButtonRef = { button: button, clip: clip };
  runtimeState.settingsButtonRef = { button: button, clip: clip };
  try {
    setNodeAction(button, {
      kind: "_CaCaCa209",
    });
  } catch (error) {}
  try {
    setNodeAction(clip, {
      kind: "_CaCaCa209",
    });
  } catch (error) {}
  try {
    const gameStateManager = nativeUiBindings.getGameStateManager();
    if (!(gameStateManager && getGameState(gameStateManager) === y)) {
      setVisible(button, false);
    }
  } catch (error) {}
  return true;
}
