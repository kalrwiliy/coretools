import { scheduleTimeout, scheduleInterval, cancelInterval } from "../../runtime/lifecycle";
import { installNativeUiDisposal } from "../../runtime/nativeUiDisposal";
import { getGameState } from "../../engine/gameState";
import { isValidPtr } from "../../engine/memory";
import { setChildColor } from "../../engine/movieClip";
import { removeFromStage } from "../../engine/sceneGraph";
import { setSettingsMenuVisible } from "../../menu/settings/lifecycle";
import { mainMenuState } from "../../menu/settings/state";
import { menuLayout } from "../../menu/styles/selection";
import {
  PING_COLOR_DEFAULT,
  PING_COLOR_HIGH,
  PING_THRESHOLD,
  STATE_BATTLE,
  STATE_HOME,
} from "../../runtime/constants";
import { runtimeState } from "../../runtime/controllers";
import { setButtonText } from "../../ui/button";
import { openCreditsPopup } from "../dialogs/credits";
import { installOutlineColorHook, openOutlinePopup } from "../dialogs/outline";
import { startButtonWatchdog } from "../hud/launchers";
import { showToast } from "../dialogs/popupWidgets";
import { computeLayout } from "../widgets/layout";
import { bindNatives } from "./bindings";
import { attachTracked } from "./hooks";
import { armOnFirstMount } from "./lifecycle";
import { nativeUiServices } from "./services";
import {
  nativeUiBindings,
  nativeUiConfig,
  nativeUiOffsets,
  nativeUiRuntime,
  outlineState,
} from "./state";
import { installTouchDragHook } from "./touch";
export function initNativesUnit(): void {
  installNativeUiDisposal();
  nativeUiRuntime.state = {
    libgBase: null,
    libgReady: false,
    targetGameState: -1,
    armedFlagOed: false,
    menuArmed: false,
    inStateSwitch: false,
    loginState: null,
    loginPanelYDirty: false,
    armDeadline: 0,
    hideInterval: null,
    yxkcInterval: null,
    pendingLoginPanelY: 0,
    trackedListeners: [],
    widgetInterval: null,
    menuObjDgl: null,
    menuWidgetQ8h7: null,
    flagTBbx: false,
    flagNnwp: false,
    frameCounter: 0,
    fps: 0,
    clearScreenBlack: false,
    stageRoot: null,
    telegramButton: null,
    telegramClip: null,
    menuWidgetE7l: null,
    menuObjKj6: null,
    menuWidgetMJl: null,
    menuObjX0on: null,
    menuWidgetEJZ: null,
    menuObjBvh: null,
    menuWidgetBmx: null,
    menuLayout: {
      primaryNode: null,
      primaryWidget: null,
      secondaryNode: null,
      secondaryWidget: null,
      widgets: [],
      horizontalIndex: 0,
      verticalIndex: 0,
      scale: nativeUiConfig.defaultMenuScale,
    },
  };
  menuLayout.scale = function () {
    return computeLayout().scale;
  };
  nativeUiServices.openOutline = function () {
    outlineState.reopenOutlineOnHome = false;
    openOutlinePopup();
    return;
  };
  nativeUiServices.setOutlineEnabled = function (enabled: boolean): boolean {
    if (enabled && !installOutlineColorHook()) {
      outlineState.outlineEnabled = false;
      showToast("Outline renderer unavailable");
      return false;
    }
    outlineState.outlineEnabled = enabled;
    return enabled;
  };
  nativeUiServices.openCredits = function () {
    return openCreditsPopup();
  };
  nativeUiRuntime.licenseExpiresAt = 0;

  scheduleTimeout(pollForLibg, 0);
  nativeUiRuntime.libgPollInterval = scheduleInterval(function () {
    pollForLibg();
    if (nativeUiRuntime.state.libgReady) {
      cancelInterval(nativeUiRuntime.libgPollInterval);
    }
    return;
  }, 250);
  nativeUiServices.firstMount = armOnFirstMount;
}
export function bootstrapNatives(libgBase: any): void {
  nativeUiRuntime.state.libgBase = libgBase.base;
  bindNatives(nativeUiRuntime.state.libgBase);
  installOutlineColorHook();
  installTouchDragHook();
  try {
    const eglMod = Process.findModuleByName("libEGL.so") || Process.findModuleByName("libegl.so");
    let swapBuffers: any;
    if (eglMod && (swapBuffers = eglMod.findExportByName("eglSwapBuffers"))) {
      const glesMod =
        Process.findModuleByName("libGLESv2.so") || Process.findModuleByName("libGLESv3.so");
      const glClear: any = glesMod
        ? new NativeFunction(glesMod.getExportByName("glClear"), "void", ["uint"])
        : null;
      const glClearColor: any = glesMod
        ? new NativeFunction(glesMod.getExportByName("glClearColor"), "void", [
            "float",
            "float",
            "float",
            "float",
          ])
        : null;
      const COLOR_BUFFER_BIT = 16384;
      attachTracked(swapBuffers, {
        onEnter: function () {
          let isHome: any;
          let gameStateManager: any;
          let now: any;
          let fps: any;
          let indicatorColor: any;
          ++nativeUiRuntime.state.frameCounter;
          if (nativeUiRuntime.state.clearScreenBlack && glClear && glClearColor) {
            try {
              glClearColor(0, 0, 0, 1);
              glClear(COLOR_BUFFER_BIT);
            } catch (error) {}
          }
          if (nativeUiRuntime.state.frameCounter % 30 === 0) {
            nativeUiRuntime.state.frameTick30 =
              (nativeUiRuntime.state.frameTick30 ? nativeUiRuntime.state.frameTick30 : 0) + 1;
            if (mainMenuState.isOpen) {
              if (isValidPtr(mainMenuState.popup)) {
                try {
                  const visible = mainMenuState.popup.add(72).readU8();
                  if (visible !== 1) {
                    setSettingsMenuVisible(true);
                    if (
                      !nativeUiRuntime.state.popupHiddenSeen ||
                      nativeUiRuntime.state.frameCounter === 0
                    ) {
                      nativeUiRuntime.state.popupHiddenSeen = true;
                    }
                  }
                } catch (error) {}
              } else if (!nativeUiRuntime.state.popupMissingSeen) {
                nativeUiRuntime.state.popupMissingSeen = true;
              }
            }
            isHome = false;
            try {
              gameStateManager = nativeUiBindings.getGameStateManager();
              isHome =
                isValidPtr(gameStateManager) && getGameState(gameStateManager) === STATE_BATTLE;
            } catch (error) {}
            if (!isHome) {
              if (!nativeUiRuntime.state.settingsRebuildPending) {
                if (
                  nativeUiRuntime.state.frameTick30 % 30 === 0 ||
                  !isValidPtr(mainMenuState.button)
                ) {
                  nativeUiRuntime.state.settingsRebuildPending = true;
                  scheduleTimeout(function () {
                    nativeUiRuntime.state.settingsRebuildPending = false;
                    if (mainMenuState.isOpen) return;
                    if (isValidPtr(mainMenuState.button)) {
                      try {
                        removeFromStage(mainMenuState.button);
                      } catch (error) {}
                    }
                    mainMenuState.button = null;
                  }, 0);
                }
              }
            } else if (!isValidPtr(mainMenuState.button)) {
              now = Date.now();
              if (!nativeUiRuntime.state.settingsRebuildPending) {
                if (
                  now -
                    (nativeUiRuntime.state.settingsRebuildAt
                      ? nativeUiRuntime.state.settingsRebuildAt
                      : 0) >
                  10000
                ) {
                  nativeUiRuntime.state.settingsRebuildPending = true;
                  nativeUiRuntime.state.settingsRebuildAt = now;
                  scheduleTimeout(function () {
                    nativeUiRuntime.state.settingsRebuildPending = false;
                    // Recheck ownership before completing this deferred rebuild request.
                    if (mainMenuState.isOpen || isValidPtr(mainMenuState.button)) return;
                    return;
                  }, 0);
                }
              }
            }
          }
          if (
            mainMenuState.pingVisible &&
            nativeUiRuntime.state.frameCounter % 15 === 0 &&
            isValidPtr(mainMenuState.pingButton) &&
            mainMenuState.pingClip
          ) {
            try {
              fps = (nativeUiRuntime.state.fps ? nativeUiRuntime.state.fps : 0) | 0;
              indicatorColor = fps > PING_THRESHOLD ? PING_COLOR_HIGH : PING_COLOR_DEFAULT;
              setButtonText(mainMenuState.pingButton, "Text", "ping: " + fps);
              setButtonText(mainMenuState.pingButton, "txt", "ping: " + fps);
              setChildColor(mainMenuState.pingClip, "Text", indicatorColor);
              setChildColor(mainMenuState.pingClip, "txt", indicatorColor);
            } catch (error) {}
            return;
          }
          return;
        },
      });
      scheduleInterval(function () {
        nativeUiRuntime.state.fps = nativeUiRuntime.state.frameCounter;
        nativeUiRuntime.state.frameCounter = 0;
      }, 1000);
    }
  } catch (error) {}
  attachTracked(nativeUiRuntime.state.libgBase.add(nativeUiOffsets.LOGIN_STATE_ENTER), {
    onEnter: function (args: any) {
      nativeUiRuntime.state.loginState = args[0];
    },
  });
  attachTracked(nativeUiRuntime.state.libgBase.add(nativeUiOffsets.GSM_SET_NEXT_STATE), {
    onEnter: function (args: any) {
      let nextState: any;
      try {
        if (!nativeUiRuntime.state.gameStateManager)
          nativeUiRuntime.state.gameStateManager = args[0];
      } catch (error) {}
      nextState = args[1].toInt32();
      if (nextState === STATE_HOME && !nativeUiRuntime.state.menuArmed) {
        try {
          armOnFirstMount();
        } catch (error) {}
        return;
      }
      return;
    },
  });
  scheduleTimeout(function () {
    try {
      if (!nativeUiRuntime.state.buttonWatchdog) startButtonWatchdog();
    } catch (error) {}
    if (!nativeUiRuntime.state.menuArmed) {
      try {
        armOnFirstMount(true);
      } catch (error) {}

      return;
    }
    return;
  }, 10000);
  attachTracked(nativeUiRuntime.state.libgBase.add(nativeUiOffsets.HOME_SCREEN_ENTER), {
    onEnter: function () {
      if (!outlineState.reopenOutlineOnHome) return;
      outlineState.reopenOutlineOnHome = false;
      scheduleTimeout(function () {
        if (!openOutlinePopup()) {
          outlineState.reopenOutlineOnHome = true;
        }
      }, 900);
      return;
    },
  });
  attachTracked(nativeUiRuntime.state.libgBase.add(nativeUiOffsets.BUTTON_SET_STATE), {
    onEnter: function (args: any) {
      if (nativeUiRuntime.state.menuArmed) {
        try {
          if (typeof runtimeState.CoretoolsDebugMenu !== "undefined") {
            runtimeState.CoretoolsDebugMenu.handleButtonPress(args);
          }
        } catch (error) {}
        return;
      }
      return;
    },
  });
}
export function pollForLibg(): void {
  if (nativeUiRuntime.state.libgReady) return;
  const libgModule = Process.findModuleByName("libg.so");

  if (!libgModule) return;
  nativeUiRuntime.state.libgReady = true;
  try {
    bootstrapNatives(libgModule);
  } catch (error) {}
}
