import {
  cancelInterval,
  scheduleTimeout,
  attachHook,
  scheduleInterval,
} from "../../../runtime/lifecycle";
import { runtimeState } from "../../../runtime/controllers";
import { menuStyleState } from "../selection";
import { setVisible, toggleQuickFlag } from "./menu";
import { natives, OFFSETS, state } from "./state";
import {
  findStage,
  getScreenState,
  isValidPtr,
  libgFn,
  setActive,
  setQuickBarVisible,
  showTitle,
} from "./widgets";

export function setNodeVisible(node: any, visible: any): void {
  if (!isValidPtr(node)) return;
  try {
    node.add(8).writeU8(visible ? 1 : 0);
  } catch (error) {}
  try {
    node.add(72).writeU8(visible ? 1 : 0);
  } catch (error) {}
}

export function setPage(page: any): void {
  state.page = page;
  refreshPage();
}

export function refreshPage(): void {
  var visible: any, index: any, settingsVisible: any;
  visible = state.visible;
  if (isValidPtr(state.titleLabel)) {
    setNodeVisible(state.titleLabel, visible && state.page !== 3);
  }
  for (index = 0; index < state.mainTabs.length; index++) {
    setNodeVisible(state.mainTabs[index].button, visible && state.page === 1);
  }
  for (index = 0; index < state.combatTabs.length; index++) {
    setNodeVisible(state.combatTabs[index].button, visible && state.page === 2);
  }
  settingsVisible = visible && state.page === 3;
  for (index = 0; index < state.sliderNodes.length; index++) {
    setNodeVisible(state.sliderNodes[index], settingsVisible);
  }
  for (index = 0; index < state.settingsLabels.length; index++) {
    setNodeVisible(state.settingsLabels[index], settingsVisible);
  }
  for (index = 0; index < state.settingsToggles.length; index++) {
    setNodeVisible(
      state.settingsToggles[index].container || state.settingsToggles[index].button,
      settingsVisible,
    );
  }
  if (isValidPtr(state.settingsToggles[0]) && isValidPtr(state.settingsToggles[0].label)) {
    setNodeVisible(state.settingsToggles[0].label, settingsVisible);
  }
  for (index = 0; index < state.settingsToggles.length; index++) {
    if (isValidPtr(state.settingsToggles[index].label)) {
      setNodeVisible(state.settingsToggles[index].label, settingsVisible);
    }
  }
  if (state.backButton) {
    setNodeVisible(state.backButton.button, settingsVisible);
  }
}

export function teardown(): void {
  var stage: any, labelIndex: any, buttonIndex: any;
  stage = findStage();
  try {
    if (isValidPtr(stage) && isValidPtr(state.clip)) natives.removeChild(stage, state.clip);
  } catch (error) {}
  try {
    if (isValidPtr(stage) && isValidPtr(state.menuButton))
      natives.removeChild(stage, state.menuButton);
  } catch (error) {}
  try {
    if (isValidPtr(stage) && isValidPtr(state.quickButton))
      natives.removeChild(stage, state.quickButton);
  } catch (error) {}
  try {
    if (isValidPtr(stage) && isValidPtr(state.menuObj)) natives.removeChild(stage, state.menuObj);
  } catch (error) {}
  for (labelIndex = 0; labelIndex < state.infoLabels.length; labelIndex++) {
    try {
      if (isValidPtr(stage)) natives.removeChild(stage, state.infoLabels[labelIndex].clip);
    } catch (error) {}
  }
  for (buttonIndex = 0; buttonIndex < state.quickButtons.length; buttonIndex++) {
    try {
      if (isValidPtr(stage)) natives.removeChild(stage, state.quickButtons[buttonIndex]);
    } catch (error) {}
  }
  state.infoLabels = [];
  state.quickButtons = [];
  state.quickButtonClip = null;
  state.quickBarVisible = false;
  state.localized = [];
  state.quickButtonClips = [];
  state.quickFlags = [];
  state.clip = null;
  state.tf = null;
  state.active = false;
  state.menuButton = null;
  state.quickButton = null;
  state.menuButtonClip = null;
  state.lastButton = null;
  state.menuObj = null;
  state.menuClip = null;
  state.menuParts = [];
  state.visible = false;
  if (state.sliderTimer) {
    cancelInterval(state.sliderTimer);
    state.sliderTimer = null;
  }
  state.mainTabs = [];
  state.combatTabs = [];
  state.sliderNodes = [];
  state.settingsLabels = [];
  state.settingsToggles = [];
  state.titleLabel = null;
  state.sliders = [];
  state.backButton = null;
  state.page = 1;
}

function handleButtonPress(args: any): any {
  var node: any, now: any, quickButtonIndex: any, itemIndex: any, item: any;
  try {
    if ((menuStyleState.current || "coretools") !== "bsre1") {
      return undefined;
    }
    if (args[1].toInt32() !== 1) {
      return undefined;
    }
    node = args[0];
    if (!isValidPtr(node)) {
      return undefined;
    }
    if ((now = Date.now()) - state.lastTapTime < 200) {
      return undefined;
    }
    if (
      (isValidPtr(state.menuButton) && node.equals(state.menuButton)) ||
      (isValidPtr(state.menuButtonClip) && node.equals(state.menuButtonClip))
    ) {
      state.lastTapTime = now;
      setVisible(!state.visible);
      return undefined;
    }
    if (
      (isValidPtr(state.quickButton) && node.equals(state.quickButton)) ||
      (isValidPtr(state.quickButtonClip) && node.equals(state.quickButtonClip))
    ) {
      state.lastTapTime = now;
      setQuickBarVisible(!state.quickBarVisible);
      return undefined;
    }
    for (quickButtonIndex = 0; quickButtonIndex < state.quickButtons.length; quickButtonIndex++) {
      if (
        (isValidPtr(state.quickButtons[quickButtonIndex]) &&
          node.equals(state.quickButtons[quickButtonIndex])) ||
        (isValidPtr(state.quickButtonClips[quickButtonIndex]) &&
          node.equals(state.quickButtonClips[quickButtonIndex]))
      ) {
        state.lastTapTime = now;
        toggleQuickFlag(quickButtonIndex);
        return undefined;
      }
    }
    if (state.visible) {
      if (state.page === 1) {
        for (itemIndex = 0; itemIndex < state.mainTabs.length; itemIndex++) {
          if (!(
            (isValidPtr(state.mainTabs[itemIndex].button) &&
              node.equals(state.mainTabs[itemIndex].button)) ||
            (isValidPtr(state.mainTabs[itemIndex].clip) &&
              node.equals(state.mainTabs[itemIndex].clip))
          )) {
            continue;
          }
          state.lastTapTime = now;
          if (state.mainTabs[itemIndex].id === "Combat") {
            setPage(2);
          }
          return undefined;
        }
      } else if (state.page === 2) {
        for (itemIndex = 0; itemIndex < state.combatTabs.length; itemIndex++) {
          if (
            (isValidPtr(state.combatTabs[itemIndex].button) &&
              node.equals(state.combatTabs[itemIndex].button)) ||
            (isValidPtr(state.combatTabs[itemIndex].clip) &&
              node.equals(state.combatTabs[itemIndex].clip))
          ) {
            state.lastTapTime = now;
            if (state.combatTabs[itemIndex].id === "Auto Dodge") {
              setPage(3);
            } else if (state.combatTabs[itemIndex].id === "Back") {
              setPage(1);
            } else if (state.combatTabs[itemIndex].id === "Killaura") {
              // `a` here is the core binding (killaura controller object)
              if (runtimeState.killauraApi) {
                runtimeState.killauraApi.toggle();
              }
            }
            return undefined;
          }
        }
      } else if (state.page === 3) {
        if (
          state.backButton &&
          ((isValidPtr(state.backButton.button) && node.equals(state.backButton.button)) ||
            (isValidPtr(state.backButton.clip) && node.equals(state.backButton.clip)))
        ) {
          state.lastTapTime = now;
          setPage(2);
          return undefined;
        }
        for (itemIndex = 0; itemIndex < state.settingsToggles.length; itemIndex++) {
          item = state.settingsToggles[itemIndex];
          if (
            (isValidPtr(item.button) && node.equals(item.button)) ||
            (isValidPtr(item.clip) && node.equals(item.clip))
          ) {
            state.lastTapTime = now;
            item.enabled = !item.enabled;
            try {
              natives.setFrame(item.stateClip, item.enabled ? 0 : 1);
            } catch (error) {}
            return undefined;
          }
        }
      }
    }
    if (state.missedTaps < 8) {
      ++state.missedTaps;
    }
    return;
  } catch (error) {
    return;
  }
}

function handleScreenUpdate(): any {
  if (menuStyleState.current !== "bsre1") return;
  var screenState: any, retryDelays: any, retryIndex: any;
  try {
    if ((screenState = getScreenState()) === state.lastScreenState) {
      return undefined;
    }
    state.lastScreenState = screenState;
    if (screenState === 4 || screenState === 5) {
      teardown();
      retryDelays = [100, 600, 1500, 3000];
      for (retryIndex = 0; retryIndex < retryDelays.length; retryIndex++) {
        (function (r: any) {
          scheduleTimeout(function () {
            if (menuStyleState.current !== "bsre1") return;
            try {
              setActive();
            } catch (error) {}
          }, r);
        })(retryDelays[retryIndex]);
      }
    }
    return;
  } catch (error) {
    return;
  }
}

function refreshMenuLayout(): void {
  try {
    if (state.active && isValidPtr(state.clip)) {
      showTitle();
    }
    if (state.visible && !isValidPtr(state.menuObj)) {
      try {
        setVisible(true);
      } catch (error) {}
    }
  } catch (error) {}
}

export function setup(libg: any): void {
  if (state.initialized) return;
  state.initialized = true;
  state.base = libg.base;
  natives.malloc = new NativeFunction(
    Process.getModuleByName("libc.so").getExportByName("malloc"),
    "pointer",
    ["int"],
  );
  natives.stringCtor = libgFn(OFFSETS.stringCtor, "pointer", ["pointer", "pointer"]);
  natives.getMovieClipStr = libgFn(OFFSETS.getMovieClipStr, "pointer", ["pointer", "pointer"]);
  natives.getMovieClip = libgFn(OFFSETS.getMovieClip, "pointer", ["pointer", "pointer", "int"]);
  natives.debugMenuCtor = libgFn(OFFSETS.debugMenuCtor, "pointer", ["pointer", "pointer"]);
  natives.setXY = libgFn(OFFSETS.setXY, "void", ["pointer", "float", "float"]);
  natives.addChild = libgFn(OFFSETS.addChild, "int", ["pointer", "pointer"]);
  natives.removeChild = libgFn(OFFSETS.removeChild, "int", ["pointer", "pointer"]);
  natives.getChildByName = libgFn(OFFSETS.getChildByName, "pointer", ["pointer", "pointer"]);
  natives.sliderCtor = libgFn(OFFSETS.sliderCtor, "pointer", [
    "pointer",
    "pointer",
    "pointer",
    "pointer",
    "int",
  ]);
  natives.setFrameRange = libgFn(OFFSETS.setFrameRange, "void", ["pointer", "int", "int", "int"]);
  natives.calloc = new NativeFunction(
    Process.getModuleByName("libc.so").getExportByName("calloc"),
    "pointer",
    ["int", "int"],
  );
  natives.find = libgFn(OFFSETS.find, "pointer", ["pointer", "pointer"]);
  natives.setText = libgFn(OFFSETS.setText, "void", ["pointer", "pointer"]);
  natives.setFrame = libgFn(OFFSETS.setFrame, "void", ["pointer", "int"]);
  natives.loadSc = libgFn(OFFSETS.loadSc, "int", ["pointer", "int"]);
  natives.getStageOwner = libgFn(OFFSETS.getStageOwner, "pointer", []);
  natives.getScreenStateHolder = libgFn(OFFSETS.getScreenStateHolder, "pointer", []);
  natives.buttonCtor = libgFn(OFFSETS.buttonCtor, "pointer", ["pointer"]);
  natives.buttonSetClip = libgFn(OFFSETS.buttonSetClip, "void", ["pointer", "pointer", "int"]);
  natives.setChildText = libgFn(OFFSETS.setChildText, "void", ["pointer", "pointer", "pointer"]);
  attachHook(state.base!.add(OFFSETS.buttonPressFn), {
    onEnter: handleButtonPress,
  });
  attachHook(state.base!.add(OFFSETS.screenUpdateFn), {
    onLeave: handleScreenUpdate,
  });
  scheduleInterval(refreshMenuLayout, 1500);
}

export function waitForLibg(onReady?: () => void): void {
  var attempts: any, timer: any;
  attempts = 0;
  timer = scheduleInterval(function () {
    var a: any;
    ++attempts;
    a = Process.findModuleByName("libg.so");
    if (a) {
      cancelInterval(timer);
      scheduleTimeout(function () {
        try {
          setup(a);
          if (onReady) onReady();
        } catch (error) {}
      }, 2000);
      return;
    }
    if (attempts > 2000) {
      cancelInterval(timer);
    }
  }, 10);
}

export function setAutoDodge(enabled: any): void {
  try {
    if (runtimeState.autoDodgeApi) {
      runtimeState.autoDodgeApi.setEnabled(enabled);
      menuStyleState.autoDodgeEnabled = enabled;
    }
  } catch (error) {}
}
