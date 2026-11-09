import { whenLibgLoaded } from "../engine/loader";
import { MERGED_LAUNCHER } from "./constants";
import { runtimeState } from "./controllers";
import { initCore, onButtonPressed, startCore } from "./coreHooks";
import { coreState } from "./coreState";

export function initializeCore(): void {
  runtimeState.pointerSizeProbe = (typeof Process !== "undefined" && Process.pointerSize) || 8;

  runtimeState.aimbotApi = null;
  runtimeState.autoDodgeApi = null;
  runtimeState.killauraApi = null;
  runtimeState.debugFeaturesApi = null;
  runtimeState.settingsButtonRef = null;
  runtimeState.debugButtonRef = null;

  runtimeState.menuScaleX = 1.3;
  runtimeState.menuScaleY = 0.55;

  runtimeState.togglesBaseY = 0;

  runtimeState.uiScLoaded = false;

  runtimeState.CoretoolsDebugMenu = {
    startCore: startCore,
    handleButtonPress: onButtonPressed,
    isInitialized: function () {
      return coreState.initialized;
    },
  };

  if (typeof (MERGED_LAUNCHER as unknown) === "undefined") {
    // state 16 -> 17 was an opaque (always-true) predicate
    whenLibgLoaded(initCore);
  }
}
