declare const e7: any;
import { getMovieClip } from "../../engine/assets";
import { natives } from "../../engine/bindings";
import { isValidPtr } from "../../engine/memory";
import { getTextFieldByName } from "../../engine/movieClip";
import { installCameraHook } from "../../features/camera/offsetHook";
import { cameraOffsetState } from "../../features/camera/offsetState";
import { nativeUiServices } from "../../nativeUi/runtime/services";
import { runtimeState } from "../../runtime/controllers";
import { coreState } from "../../runtime/coreState";
import { setButtonText } from "../../ui/button";
import { setNodeAction } from "../../ui/nodeActions";
import { hideUi, showFloater, showUi } from "../../ui/visibility";
import { dragState } from "../settings/dragState";
import { closeSettingsMenu } from "../settings/lifecycle";
import { openMenu, showPage } from "../settings/menu";
import { mainMenuState } from "../settings/state";
import { flipToggle } from "../settings/toggleButton";
import { toggleGroup } from "../settings/toggleState";
import { bsreMenu } from "../styles/bsre/index";
import { selectMenuStyle } from "../styles/MenuStyleSwitcher";
import { menuStyleState } from "../styles/selection";
import { switchgearMenu } from "../styles/switchgear/index";
import { goTutorial } from "./actions";
import { closeDebugMenu, openDebugMenu } from "./menu";

export function dispatchMenuAction(action: any, onDebugClose?: () => void): boolean {
  if (!action) return false;

  if (action.kind === "fpstoggle") {
    mainMenuState.pingVisible = !mainMenuState.pingVisible;
    if (isValidPtr(mainMenuState.pingButton)) {
      try {
        mainMenuState.pingButton.add(72).writeU8(mainMenuState.pingVisible ? 1 : 0);
      } catch (error) {}
    }
    if (mainMenuState.menuButtons && isValidPtr(mainMenuState.menuButtons[0])) {
      const text = mainMenuState.pingVisible ? "ping on" : "ping off";
      setButtonText(mainMenuState.menuButtons[0], "Text", text);
      setButtonText(mainMenuState.menuButtons[0], "txt", text);
    }
    return true;
  }

  if (action.kind === "quit") {
    try {
      const abortFn = Module.findGlobalExportByName("abort");
      if (abortFn) {
        new NativeFunction(abortFn, "void", [])();
      }
    } catch (error) {}
    return true;
  }

  if (action.kind === "_CaCaCa119") {
    if (nativeUiServices.openCredits) {
      nativeUiServices.openCredits();
    } else {
      showFloater("credits unavailable");
    }
    return true;
  }

  if (action.kind === "draghdl") {
    dragState.dragging = true;
    if (isValidPtr(mainMenuState.clip)) {
      dragState.dragStartMenuX = mainMenuState.clip.add(32).readFloat();
      dragState.dragStartMenuY = mainMenuState.clip.add(36).readFloat();
    }
    dragState.dragStartTouchX = dragState.lastTouchX;
    dragState.dragStartTouchY = dragState.lastTouchY;
    dragState.ptrId = dragState.lastPtr;
    return true;
  }

  if (action.kind === "dbgmenu") {
    if (coreState.debugMenuOpen) {
      closeDebugMenu();
    } else {
      openDebugMenu();
    }
    try {
      const debugButtonRef = runtimeState.debugButtonRef;
      if (debugButtonRef && isValidPtr(debugButtonRef.button)) {
        setNodeAction(debugButtonRef.button, {
          kind: "dbgmenu",
        });
      }
    } catch (error) {}
    try {
      const debugClipRef = runtimeState.debugButtonRef;
      if (debugClipRef && isValidPtr(debugClipRef.clip)) {
        setNodeAction(debugClipRef.clip, {
          kind: "dbgmenu",
        });
      }
    } catch (error) {}
    try {
      const settingsButtonRef = runtimeState.settingsButtonRef;
      if (settingsButtonRef && isValidPtr(settingsButtonRef.button)) {
        setNodeAction(settingsButtonRef.button, {
          kind: "_CaCaCa209",
        });
      }
    } catch (error) {}
    try {
      const settingsClipRef = runtimeState.settingsButtonRef;
      if (settingsClipRef && isValidPtr(settingsClipRef.clip)) {
        setNodeAction(settingsClipRef.clip, {
          kind: "_CaCaCa209",
        });
      }
    } catch (error) {}
    return true;
  }

  if (action.kind === "editpage") {
    showPage(mainMenuState.page === 1 ? 2 : 1);
    return true;
  }

  if (action.kind === "camnav") {
    if (action.label === "next page") {
      if (mainMenuState.page === 1) {
        showPage(2);
      } else {
        showFloater("u fall twice for it? :P");
      }
    } else if (action.label === "last page") {
      if (mainMenuState.page === 2) {
        showPage(1);
      } else {
        showFloater("this is the first page :P");
      }
    }
    return true;
  }

  if (action.kind === "toggle2") {
    for (let toggleIndex = 0; toggleIndex < toggleGroup.items.length; toggleIndex++) {
      if (toggleGroup.items[toggleIndex].id !== action.id) continue;

      flipToggle(toggleGroup.items[toggleIndex]);
      if (action.id === 0) {
        if (runtimeState.autoDodgeApi) {
          runtimeState.autoDodgeApi.setEnabled(toggleGroup.items[toggleIndex].enabled);
        }
      }
      if (action.id === 1) {
        if (nativeUiServices.setOutlineEnabled) {
          const toggle = toggleGroup.items[toggleIndex];
          const enabled = nativeUiServices.setOutlineEnabled(toggle.enabled);
          if (enabled !== toggle.enabled) flipToggle(toggle);
        }
      }
      if (action.id === 3) {
        if (toggleGroup.items[toggleIndex].enabled) {
          hideUi();
        } else {
          showUi();
        }
      }
      if (action.id === 4) {
        if (runtimeState.autoDodgeApi) {
          runtimeState.autoDodgeApi.setOption4(toggleGroup.items[toggleIndex].enabled);
        }
      }
      if (action.id === 5) {
        cameraOffsetState.frozen = toggleGroup.items[toggleIndex].enabled;
        if (!cameraOffsetState.frozen) {
          cameraOffsetState.frozenPos = null;
        }
        if (cameraOffsetState.frozen) {
          installCameraHook();
        }
      }
      if (action.id === 2) {
        if (runtimeState.killauraApi) {
          const killauraOn = runtimeState.killauraApi.toggle();
          toggleGroup.items[toggleIndex].enabled = killauraOn;
          showFloater("Killaura: " + (killauraOn ? "ON" : "OFF"));
        } else {
          showFloater("killaura not ready");
        }
      }
      if (action.id === 6) {
        if (runtimeState.aimbotApi) {
          const wasOn = runtimeState.aimbotApi.getStatus().active;
          if (wasOn) {
            runtimeState.aimbotApi.disable();
          } else {
            runtimeState.aimbotApi.enable();
          }
          toggleGroup.items[toggleIndex].enabled = !wasOn;
          showFloater("Aimbot: " + (!wasOn ? "ON" : "OFF"));
        } else {
          showFloater("aimbot not ready");
        }
      }
      if (action.id === 5) {
        showFloater("work in progress!");
      }
      return true;
    }
    return true;
  }

  if (action.kind === "_CaCaCa209") {
    const style = menuStyleState.current || "coretools";
    if (style === "switchgear" && switchgearMenu) {
      try {
        if (mainMenuState.isOpen) {
          closeSettingsMenu();
        }
      } catch (error) {}
      try {
        switchgearMenu.toggle();
      } catch (error) {}
      return true;
    }
    const style2 = menuStyleState.current || "coretools";
    if (style2 === "bsre1" && bsreMenu) {
      try {
        if (mainMenuState.isOpen) {
          closeSettingsMenu();
        }
      } catch (error) {}
      try {
        bsreMenu.toggle();
      } catch (error) {}
      return true;
    }
    try {
      if (switchgearMenu && switchgearMenu.isOpen()) {
        switchgearMenu.close();
      }
    } catch (error) {}
    try {
      if (bsreMenu && bsreMenu.isOpen()) {
        bsreMenu.close();
      }
    } catch (error) {}
    if (mainMenuState.isOpen) {
      closeSettingsMenu();
    } else {
      openMenu();
    }
    return true;
  }

  if (action.kind === "close") {
    closeDebugMenu();
    return true;
  }

  if (action.kind === "category") {
    if (action.title === "Misc") {
      coreState.miscExpanded = !coreState.miscExpanded;
      openDebugMenu();
    } else if (action.title === "Battle") {
      coreState.battleExpanded = !coreState.battleExpanded;
      openDebugMenu();
    } else if (action.title === "Menu Styles") {
      coreState.menuStylesExpanded = !coreState.menuStylesExpanded;
      openDebugMenu();
    }
    return true;
  }

  if (action.kind === "mini") {
    if (action.id === 0) {
      coreState.miscExpanded = !coreState.miscExpanded;
      openDebugMenu();
    } else if (action.id === 2) {
      coreState.battleExpanded = !coreState.battleExpanded;
      openDebugMenu();
    }
    return true;
  }

  if (action.kind === "item") {
    if (action.label === "Go Tutorial") {
      goTutorial(onDebugClose);
    } else if (action.label === "FPS Unlock") {
      if (runtimeState.debugFeaturesApi) {
        runtimeState.debugFeaturesApi.toggleFpsUnlock();
        showFloater(
          "FPS Unlock: " + (runtimeState.debugFeaturesApi.isFpsUnlockOn() ? "ON" : "OFF"),
        );
      } else {
        showFloater("dbgfeat not ready");
      }
    } else if (action.label === "Camera Mode") {
      if (runtimeState.debugFeaturesApi) {
        runtimeState.debugFeaturesApi.toggleCameraMode();
        showFloater(
          "Camera Mode: " + (runtimeState.debugFeaturesApi.isCameraModeOn() ? "ON (6)" : "OFF (3)"),
        );
      } else {
        showFloater("dbgfeat not ready");
      }
    } else if (action.label === "Spectators 69") {
      if (runtimeState.debugFeaturesApi) {
        runtimeState.debugFeaturesApi.toggleSpectators();
        showFloater(
          "Spectators: " + (runtimeState.debugFeaturesApi.isSpectatorsOn() ? "ON (69)" : "OFF"),
        );
      } else {
        showFloater("dbgfeat not ready");
      }
    } else if (action.label === "Chat Spam") {
      if (runtimeState.debugFeaturesApi) {
        const spamResult = runtimeState.debugFeaturesApi.toggleChatSpam();
        showFloater(spamResult);
      } else {
        showFloater("dbgfeat not ready");
      }
    } else if (action.label === "Killaura") {
      if (runtimeState.killauraApi) {
        showFloater("Killaura: " + (runtimeState.killauraApi.toggle() ? "ON" : "OFF"));
      } else {
        showFloater("killaura not ready");
      }
    } else if (action.label === "Aimbot") {
      if (runtimeState.aimbotApi) {
        const aimState = runtimeState.aimbotApi.getStatus();
        if (aimState.active) {
          runtimeState.aimbotApi.disable();
        } else {
          runtimeState.aimbotApi.enable();
        }
        showFloater("Aimbot: " + (runtimeState.aimbotApi.getStatus().active ? "ON" : "OFF"));
      } else {
        showFloater("aimbot not ready");
      }
    } else if (action.label === "Brawler Outline") {
      if (typeof nativeUiServices.openOutline === "function") {
        nativeUiServices.openOutline();
      } else {
        showFloater("Outline unavailable");
      }
    } else if (action.label === "Floater") {
      showFloater("Floater test OK");
    } else if (action.label === "Main menu") {
      showUi(onDebugClose);
    } else if (action.label === "Stage Probe") {
      try {
        const root = natives.getStage();
        const targets: any[][] = [
          ["root80", root.add(128).readPointer()],
          ["c0", root.add(192).readPointer()],
          ["b8", root.add(184).readPointer()],
          ["x150", root.add(336).readPointer()],
          ["e8", root.add(232).readPointer()],
          ["glob", coreState.base.add(21288888).readPointer()],
        ];
        const results: any[] = [];
        for (let targetIndex = 0; targetIndex < targets.length; targetIndex++) {
          try {
            const clip = getMovieClip("sc/debug.sc", "debug_menu_text");
            if (!isValidPtr(clip)) {
              results.push(targets[targetIndex][0] + ":clipnull");
              continue;
            }
            let textField = getTextFieldByName(clip, "Text");
            if (!isValidPtr(textField)) {
              textField = getTextFieldByName(clip, "text");
            }
            if (isValidPtr(textField)) {
              natives.setText(textField, e7("STAGE-" + targets[targetIndex][0]));
            }
            try {
              natives.setWidgetFrame(clip, 1);
            } catch (error) {}
            clip.add(32).writeFloat(60);
            clip.add(36).writeFloat(80 + targetIndex * 45);
            natives.addChild(targets[targetIndex][1], clip);
            results.push(targets[targetIndex][0] + ":added");
          } catch (error: any) {
            results.push(targets[targetIndex][0] + ":FAIL " + error);
          }
        }
        showFloater("Stage probe placed (" + targets.length + ")");
      } catch (error) {}
    } else if (action.label === "coretools (default)") {
      const style = menuStyleState.current || "coretools";
      if (style !== "coretools") {
        selectMenuStyle("coretools");
        showFloater("Menu style: coretools");
      } else {
        showFloater("Menu style already: coretools");
      }
    } else if (action.label === "Switchgear+ (new)") {
      const style = menuStyleState.current || "coretools";
      if (style !== "switchgear") {
        selectMenuStyle("switchgear");
        showFloater("Menu style: Switchgear+");
      } else {
        showFloater("Menu style already: Switchgear+");
      }
    } else if (action.label === "Bsre1 (old)") {
      const style = menuStyleState.current || "coretools";
      if (style !== "bsre1") {
        selectMenuStyle("bsre1");
        showFloater("Menu style: Bsre1 (old)");
      } else {
        showFloater("Menu style already: Bsre1 (old)");
      }
    } else {
      showFloater(action.label);
    }
    return true;
  }

  return false;
}
