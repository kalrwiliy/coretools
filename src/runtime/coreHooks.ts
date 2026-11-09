import { attachHook, scheduleTimeout } from "./lifecycle";
import { natives } from "../engine/bindings";
import { isInTree } from "../engine/displayObject";
import { whenLibgLoaded } from "../engine/loader";
import { isValidPtr, libgFunction, ptrEquals } from "../engine/memory";
import { LibgOffsets } from "../engine/offsets";
import { dispatchMenuAction } from "../menu/debug/dispatcher";
import { closeDebugMenu, isInDebugShell, openDebugMenu } from "../menu/debug/menu";
import { getNodeAction, setNodeAction } from "../ui/nodeActions";
import { isBattleActionWanted, scheduleBattleAction } from "./battleController";
import { runtimeState } from "./controllers";
import { coreState } from "./coreState";
import {
  onGameStateUpdate,
  onReturnHome,
  onReturnHomeAlt,
  scheduleRefresh,
  startStateWatch,
} from "./gameStateWatcher";
export function initCore(libgBase: any): void {
  var nativeButtonSetMovieClip: any;
  if (coreState.initialized) return;
  coreState.initialized = true;
  coreState.base = libgBase.base;
  try {
    coreState.size = libgBase.size;
  } catch (error) {}
  natives.malloc = new NativeFunction(
    Process.getModuleByName("libc.so").getExportByName("malloc"),
    "pointer",
    ["int"],
  );
  natives.calloc = new NativeFunction(
    Process.getModuleByName("libc.so").getExportByName("calloc"),
    "pointer",
    ["int", "int"],
  );
  natives.stringCtor = libgFunction(LibgOffsets.String_ctor, "pointer", ["pointer", "pointer"]);
  nativeButtonSetMovieClip = libgFunction(LibgOffsets.CustomButton_setMovieClip, "void", [
    "pointer",
    "pointer",
    "int",
  ]);
  natives.buttonSetMovieClip = function (button: any, clip: any, enabled: any) {
    try {
      const vtable = button.readPointer();
      if (vtable && !vtable.isNull()) {
        const setMovieClip = vtable.add(360).readPointer();
        if (setMovieClip && !setMovieClip.isNull()) {
          return new NativeFunction(setMovieClip, "void", ["pointer", "pointer", "int"])(
            button,
            clip,
            enabled,
          );
        }
      }
    } catch (error) {}
    return nativeButtonSetMovieClip(button, clip, enabled);
  };
  natives.addChild = libgFunction(LibgOffsets.Sprite_addChild, "int", ["pointer", "pointer"]);
  natives.removeChild = libgFunction(LibgOffsets.Sprite_removeChild, "int", ["pointer", "pointer"]);
  natives.setChildText = libgFunction(LibgOffsets.GameButton_setText, "void", [
    "pointer",
    "pointer",
    "pointer",
  ]);
  natives.setXY = libgFunction(LibgOffsets.DisplayObject_setXY, "void", [
    "pointer",
    "float",
    "float",
  ]);
  natives.buttonCtor = libgFunction(LibgOffsets.GameButton_ctor, "pointer", ["pointer"]);
  natives.gotoAndStopFrame = libgFunction(LibgOffsets.MovieClip_gotoAndStopFrameIndex, "void", [
    "pointer",
    "int",
  ]);
  natives.getStage = libgFunction(LibgOffsets.GUI_getInstance, "pointer", []);
  natives.showFloaterText = libgFunction(LibgOffsets.GUI_showFloaterTextAtDefaultPos, "void", [
    "pointer",
    "pointer",
    "float",
    "int",
    "int",
  ]);
  natives.getChildByName = libgFunction(LibgOffsets.MovieClip_getMovieClipByName, "pointer", [
    "pointer",
    "pointer",
  ]);
  natives.getTextFieldByName = libgFunction(LibgOffsets.MovieClip_getTextFieldByName, "pointer", [
    "pointer",
    "pointer",
  ]);
  natives.setChildVisible = libgFunction(LibgOffsets.MovieClip_setChildVisible, "void", [
    "pointer",
    "pointer",
    "int",
  ]);
  natives.setText = libgFunction(LibgOffsets.TextField_setText, "void", ["pointer", "pointer"]);
  natives.setColor = libgFunction(LibgOffsets.TextField_setTextColor, "void", ["pointer", "uint"]);
  natives.menuWrapperCtor = libgFunction(LibgOffsets.GUIContainer_ctor, "pointer", [
    "pointer",
    "pointer",
  ]);
  natives.getButtonByName = libgFunction(LibgOffsets.GameButton_createButton, "pointer", [
    "pointer",
    "pointer",
  ]);
  natives.sliderCtor = libgFunction(LibgOffsets.Slider_ctor, "pointer", [
    "pointer",
    "pointer",
    "pointer",
    "pointer",
    "int",
  ]);
  natives.getMovieClip = libgFunction(LibgOffsets.MovieClipHelper_getMovieClip, "pointer", [
    "pointer",
    "pointer",
    "int",
  ]);
  natives.gotoAndPlayFrameRange = libgFunction(
    LibgOffsets.MovieClip_gotoAndPlayFrameIndex,
    "void",
    ["pointer", "int", "int", "int"],
  );
  natives.constructObject1055348 = libgFunction(LibgOffsets.ctor_1055348, "void", [
    "pointer",
    "int",
  ]);
  natives.getGameStateManager = libgFunction(
    LibgOffsets.GameStateManager_getInstance,
    "pointer",
    [],
  );
  natives.gsmSetState = libgFunction(LibgOffsets.GameStateManager_changeState, "void", [
    "pointer",
    "uint",
  ]);
  natives.gsmUpdate = libgFunction(LibgOffsets.GameStateManager_applyPendingState, "void", [
    "pointer",
  ]);
  natives.getMessageManager = libgFunction(LibgOffsets.MessageManager_getInstance, "pointer", []);
  natives.getPlayerAvatar = libgFunction(LibgOffsets.getPlayerAvatar, "pointer", []);
  natives.startTutorial = libgFunction(LibgOffsets.startTutorial, "pointer", [
    "pointer",
    "pointer",
    "int",
  ]);
  natives.getBattle = libgFunction(LibgOffsets.BattleMode_getInstance, "pointer", []);
  natives.exitBattleToHome = libgFunction(LibgOffsets.BattleMode_exitToHome, "void", [
    "pointer",
    "int",
    "int",
    "int",
    "int",
  ]);
  natives.getBattleSubObject = libgFunction(LibgOffsets.BattleMode_getField2608, "pointer", [
    "pointer",
  ]);
  attachHook(coreState.base.add(LibgOffsets.AddFriendDropDown_ctor), {
    onLeave: function () {
      if (isBattleActionWanted()) {
        scheduleBattleAction("_AaAaAaAa11");
      }
    },
  });
  attachHook(coreState.base.add(LibgOffsets.homeReturnHookTarget), {
    onLeave: onReturnHome,
  });
  if (LibgOffsets.homeReturnHookTarget2) {
    attachHook(coreState.base.add(LibgOffsets.homeReturnHookTarget2), {
      onLeave: onReturnHomeAlt,
    });
  }
  attachHook(coreState.base.add(LibgOffsets.GameStateManager_applyPendingState), {
    onLeave: onGameStateUpdate,
  });
  attachHook(coreState.base.add(LibgOffsets.CustomButton_setState), {
    onEnter: onButtonPressed,
  });
  startStateWatch();
  scheduleTimeout(scheduleRefresh, 2000);
}
export function onButtonPressed(button: any): void {
  if (!coreState.initialized) return;
  const target = button[0];
  if (!isValidPtr(target)) return;
  if (button[1].toInt32() !== 1) return;
  const now = Date.now();
  if (now - coreState.lastPressAt < 200) return;
  if (ptrEquals(target, coreState.debugButton)) {
    coreState.lastPressAt = now;
    if (coreState.debugMenuOpen) {
      closeDebugMenu();
      return;
    }
    openDebugMenu();
    return;
  }
  const action = getNodeAction(target);
  if (action) {
    coreState.lastPressAt = now;
    dispatchMenuAction(action);
    return;
  }
  if (coreState._dbgShell && isInDebugShell(target)) {
    coreState.lastPressAt = now;
    dispatchMenuAction({
      kind: "dbgmenu",
    });
    return;
  }
  const settingsButtonRef = runtimeState.settingsButtonRef;
  if (settingsButtonRef && settingsButtonRef.clip && isInTree(target, settingsButtonRef.clip)) {
    coreState.lastPressAt = now;
    dispatchMenuAction({
      kind: "_CaCaCa209",
    });
    return;
  }
  if (coreState.debugMenuOpen) {
    coreState.lastPressAt = now;
    closeDebugMenu();
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
      const settingsButton = runtimeState.settingsButtonRef;
      if (settingsButton && isValidPtr(settingsButton.button)) {
        setNodeAction(settingsButton.button, {
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
    return;
  }
  if (coreState.debugMenuItems) {
    for (let itemIndex = 0; itemIndex < coreState.debugMenuItems.length; itemIndex++) {
      if (ptrEquals(target, coreState.debugMenuItems[itemIndex].button)) {
        coreState.lastPressAt = now;
        dispatchMenuAction({
          kind: "item",
          label: coreState.debugMenuItems[itemIndex].label,
        });
        return;
      }
    }
  }
}
export function startCore(libgBase: any): void {
  if (coreState.initialized) return;
  if (libgBase && isValidPtr(libgBase)) {
    initCore({ base: libgBase });
    return;
  }
  whenLibgLoaded(initCore);
}
