import { cancelInterval, scheduleInterval } from "../../../runtime/lifecycle";
import { refreshPage, setAutoDodge } from "./lifecycle";
import { natives, state } from "./state";
import {
  createButton,
  createLabel,
  findStage,
  isDisplayObject,
  isValidPtr,
  newString,
  readChildName,
} from "./widgets";

export function toggleQuickFlag(index: number): void {
  state.quickFlags[index] = !state.quickFlags[index];
  if (index === 0) {
    setAutoDodge(state.quickFlags[0]);
  }
  const color = state.quickFlags[index] ? 5631573 : 16733525;
  const button = state.quickButtonClips[index];
  if (!isValidPtr(button)) return;
  let text = natives.find(button, Memory.allocUtf8String("Text"));
  if (!isValidPtr(text)) {
    text = natives.find(button, Memory.allocUtf8String("txt"));
  }
  if (isValidPtr(text)) {
    try {
      text.add(9).writeU8((color >>> 16) & 255);
      text.add(10).writeU8((color >>> 8) & 255);
      text.add(11).writeU8(color & 255);
    } catch (error) {}
    return;
  }
  return;
}

export function loadDebugSc(): boolean {
  try {
    natives.loadSc(newString("sc/debug.sc"), 0);
    natives.loadSc(newString("sc/debug.sc"), 1);
  } catch (error) {}
  try {
    return isValidPtr(natives.getMovieClipStr(newString("sc/debug.sc"), newString("debug_menu")));
  } catch (error) {
    return false;
  }
}

export function isTextName(name: any): boolean {
  name = String(name ? name : "").toLowerCase();
  return (
    name === "text" ||
    name === "txt" ||
    name === "title" ||
    name === "version" ||
    name === "label" ||
    name === "caption" ||
    name.indexOf("txt") >= 0 ||
    name.indexOf("text") >= 0
  );
}

export function forEachChild(clip: any, visit: (child: any, name: any) => void): void {
  try {
    const count = clip.add(192).readS16();
    if (count < 1 || count > 256) {
      return undefined;
    }
    const names = clip.add(152).readPointer();
    const children = clip.add(144).readPointer();
    if (!isValidPtr(names) || !isValidPtr(children)) {
      return undefined;
    }
    for (let o = 0; o < count; o++) {
      const child = children.add(o * 8).readPointer();
      if (isValidPtr(child)) {
        visit(child, readChildName(names, o));
      }
    }
    return;
  } catch (error) {
    return;
  }
}

export function hideTextChildren(clip: any): void {
  forEachChild(clip, function (child: any, name: any) {
    if (!isTextName(name)) return;
    try {
      child.add(8).writeU8(0);
    } catch (error) {}
    return;
  });
}

export function dimNonTextChildren(clip: any): void {
  forEachChild(clip, function (child: any, name: any) {
    if (isTextName(name)) return;
    try {
      child.add(9).writeU8(83);
      child.add(10).writeU8(83);
      child.add(11).writeU8(83);
    } catch (error) {}
    return;
  });
}

export function build(): boolean {
  var stage: any,
    menu: any,
    hideNames: string[],
    hi: number,
    hideNode: any,
    menuObj: any,
    zi: number;
  var screenW: number, readW: any, menuX: number, menuY: number, attach: any;
  var titleText: any,
    styleText: any,
    linkText: any,
    mainRu: string[],
    mainIds: string[],
    mb: number,
    mainBtn: any;
  var combatRu: string[], combatIds: string[], cb: number, combatBtn: any;
  var sliderNames: string[],
    sliderLabels: string[],
    sliderPos: number[][],
    sliderCount: number,
    k: number;
  var pos: number[],
    slider: any,
    sx: number,
    sy: number,
    labelNode: any,
    labelText: any,
    sliderName: any,
    box: any;
  var toggleRu: string[], tr: number, toggle: any, backBtn: any, dodgeTitle: any;

  state.menuParts = [];
  stage = findStage();
  if (!isDisplayObject(stage)) {
    return false;
  }
  if (!loadDebugSc()) {
    return false;
  }
  menu = natives.getMovieClip(
    Memory.allocUtf8String("sc/debug.sc"),
    Memory.allocUtf8String("debug_menu"),
    0,
  );
  if (!isValidPtr(menu)) {
    menu = natives.getMovieClipStr(newString("sc/debug.sc"), newString("debug_menu"));
  }
  if (!isValidPtr(menu)) {
    return false;
  }
  try {
    natives.setFrame(menu, 1);
  } catch (error) {}

  hideNames = ["debug_menu_input_button", "close_button", "clear_button"];
  for (hi = 0; hi < hideNames.length; hi++) {
    try {
      hideNode = natives.find(menu, Memory.allocUtf8String(hideNames[hi]));
      if (isValidPtr(hideNode)) {
        try {
          hideNode.add(8).writeU8(0);
        } catch (error) {}
        try {
          hideNode.add(32).writeFloat(-99999);
        } catch (error) {}
      }
    } catch (error) {}
  }

  menuObj = natives.malloc(544);
  if (!isValidPtr(menuObj)) {
    return false;
  }
  for (zi = 0; zi < 544; zi += 8) {
    try {
      menuObj.add(zi).writeU64(0);
    } catch (error) {}
  }
  natives.debugMenuCtor(menuObj, menu);

  screenW = 1280;
  try {
    if ((readW = stage.add(708).readS32()) >= 500) {
      if (readW <= 5000) {
        screenW = readW;
      }
    }
  } catch (error) {}
  menuX = Math.floor(screenW * 0.3) + 25 + 35 + 233 + 200 + 23;
  menuY = 55 + 35 - 33 + 20;
  try {
    menu.add(16).writeFloat(2.1);
    menu.add(28).writeFloat(0.53);
    menu.add(32).writeFloat(menuX);
    menu.add(36).writeFloat(menuY);
  } catch (error) {}

  hideTextChildren(menu);
  forEachChild(menu, function (child: any, name: any) {
    var lower: string;
    lower = String(name ? name : "").toLowerCase();
    if (isTextName(name)) {
      return;
    }
    if (
      lower.indexOf("button") >= 0 ||
      lower.indexOf("btn") >= 0 ||
      lower.indexOf("close") >= 0 ||
      lower.indexOf("clear") >= 0 ||
      lower.indexOf("input") >= 0 ||
      lower.indexOf("handle") >= 0
    ) {
      try {
        child.add(8).writeU8(0);
      } catch (error) {}
      try {
        child.add(32).writeFloat(-99999);
      } catch (error) {}
      return;
    }
    return;
  });
  attach = natives.addChild(stage, menuObj);
  state.menuObj = menuObj;
  state.menuClip = menu;
  titleText = createLabel("Меню", -335, 12, menu);
  state.titleLabel = titleText;
  styleText = createLabel("BSRE1 (style)", -445, 12, menu);
  if (isValidPtr(styleText)) {
    state.menuParts.push(styleText);
  }
  linkText = createLabel("t.me/coretools7", -235, 12, menu);
  if (isValidPtr(linkText)) {
    state.menuParts.push(linkText);
  }

  state.mainTabs = [];
  mainRu = ["Бой", "Утилиты", "Визуал", "Другое"];
  mainIds = ["Combat", "Utility", "Visual", "Other"];
  for (mb = 0; mb < mainRu.length; mb++) {
    mainBtn = createButton(mainRu[mb], -270 + mb * 52, 139, menu);
    if (!isValidPtr(mainBtn)) {
      continue;
    }
    state.mainTabs.push({
      button: mainBtn,
      clip: state.lastButtonClip,
      label: mainRu[mb],
      id: mainIds[mb],
    });
  }

  state.combatTabs = [];
  combatRu = ["Авто уклонение", "Киллаура", "Зум", "Назад"];
  combatIds = ["Auto Dodge", "Killaura", "Zoom", "Back"];
  for (cb = 0; cb < combatRu.length; cb++) {
    combatBtn = createButton(combatRu[cb], -270 + cb * 52, 139, menu);
    if (isValidPtr(combatBtn)) {
      state.combatTabs.push({
        button: combatBtn,
        clip: state.lastButtonClip,
        label: combatRu[cb],
        id: combatIds[cb],
      });
    }
  }

  state.sliderNodes = [];
  state.settingsLabels = [];
  state.settingsToggles = [];
  state.sliders = [];
  sliderNames = [
    "Слайдер 1",
    "Слайдер 2",
    "Слайдер 3",
    "Слайдер 4",
    "Слайдер 5",
    "Слайдер 6",
    "Слайдер 7",
    "Слайдер 8",
    "Слайдер 9",
    "Слайдер 10",
    "Слайдер 11",
    "Слайдер 12",
    "Слайдер 13",
    "Слайдер 14",
  ];
  sliderLabels = [
    "Ускорение",
    "",
    "Замедление",
    "",
    "Реакция",
    "Сдвиг",
    "Задержка сдвига",
    "Обзор",
    "Задержка",
    "Макс. угол",
    "Перезарядка",
    "Урон",
    "Задержка смены",
    "Шанс",
  ];
  sliderPos = [
    [-244, 136],
    [-244, 177],
    [-244, 262],
    [-244, 303],
    [-244, 388],
    [-244, 473],
    [-244, 558],
    [-244, 643],
    [-59, 141],
    [-59, 226],
    [-143, 286],
    [-143, 371],
    [-145, 456],
    [-145, 541],
  ];
  sliderCount = 0;
  for (k = 0; k < sliderNames.length; k++) {
    sx = (pos = sliderPos[k])[0];
    sy = pos[1];
    labelNode = ptr(0);
    labelText = ptr(0);
    sliderName = sliderLabels[k] || sliderNames[k];
    if (sliderLabels[k]) {
      labelNode = createLabel(sliderLabels[k], sx - 85, sy - 50, menu, 24, 0.45);
      if (isValidPtr(labelNode)) {
        state.settingsLabels.push(labelNode);
        labelText = natives.find(labelNode, Memory.allocUtf8String("Text"));
        if (!isValidPtr(labelText)) {
          labelText = natives.find(labelNode, Memory.allocUtf8String("text"));
        }
      }
    }
    slider = createSlider();
    if (!isValidPtr(slider)) {
      continue;
    }
    sliderCount++;
    setSliderRange(slider, 0, 100);
    setSliderValue(slider, 0);
    try {
      slider.add(16).writeFloat(0.6);
      slider.add(28).writeFloat(1 / 0.53);
    } catch (error) {}
    natives.setXY(slider, 0, 0);
    box = natives.getMovieClip(
      Memory.allocUtf8String("sc/ui.sc"),
      Memory.allocUtf8String("textbox_1"),
      0,
    );
    if (!isValidPtr(box)) {
      box = natives.getMovieClipStr(newString("sc/ui.sc"), newString("textbox_1"));
    }
    if (isValidPtr(box)) {
      try {
        natives.setFrame(box, 1);
      } catch (error) {}
      try {
        box.add(16).writeFloat(2 / 3);
        box.add(28).writeFloat(2 / 3);
      } catch (error) {}
      box.add(8).writeU8(1);
      natives.setXY(box, sx, sy);
      natives.addChild(menu, box);
      natives.addChild(box, slider);
      state.sliderNodes.push(box);
    } else {
      natives.setXY(slider, sx, sy);
      natives.addChild(menu, slider);
      state.sliderNodes.push(slider);
    }
    state.sliders.push({
      slider: slider,
      labelClip: labelNode,
      tf: labelText,
      name: sliderName,
      lastValue: null,
    });
  }

  toggleRu = [
    "требовать удержания",
    "постоянно",
    "круговое",
    "всегда уклон",
    "быстрый доступ",
    "включено",
  ];
  for (tr = 0; tr < toggleRu.length; tr++) {
    if ((toggle = createToggle(toggleRu[tr], 20, 123 + tr * 76, false))) {
      if (isValidPtr(toggle.label)) {
        state.settingsLabels.push(toggle.label);
      }
    }
    if (toggle) {
      state.settingsToggles.push(toggle);
    }
  }

  backBtn = createButton("Назад", -142, 640, menu);
  if (isValidPtr(backBtn)) {
    try {
      backBtn.add(16).writeFloat(0.85 / 2.1);
      backBtn.add(28).writeFloat(0.85 / 0.53);
    } catch (error) {}
    state.backButton = {
      button: backBtn,
      clip: state.lastButtonClip,
      label: "Back",
    };
  }
  dodgeTitle = createLabel("Авто уклонение", -325, 12, menu, 24);
  if (isValidPtr(dodgeTitle)) {
    state.settingsLabels.push(dodgeTitle);
  }
  if (state.sliderTimer) {
    cancelInterval(state.sliderTimer);
  }
  state.sliderTimer = scheduleInterval(function () {
    var si: number, entry: any, value: any;
    if (!state.visible || state.page !== 3) {
      return;
    }
    for (si = 0; si < state.sliders.length; si++) {
      entry = state.sliders[si];
      if (!!isValidPtr(entry.slider)) {
        updateSlider(entry.slider, 0.016);
        value = getSliderValue(entry.slider);
        if (entry.lastValue !== value) {
          entry.lastValue = value;
          if (isValidPtr(entry.tf)) {
            try {
              natives.setText(entry.tf, newString(entry.name + ": " + value));
            } catch (error) {}
          }
        }
      }
    }
    return;
  }, 16);
  refreshPage();
  return true;
}

export function setVisible(visible: any): void {
  var index: number;
  if (visible) {
    if (!isValidPtr(state.menuObj)) {
      if (!build()) {
        return;
      }
    }
  }
  if (!!isValidPtr(state.menuObj)) {
    try {
      state.menuObj!.add(8).writeU8(visible ? 1 : 0);
    } catch (error) {}
    try {
      state.menuClip!.add(8).writeU8(visible ? 1 : 0);
    } catch (error) {}
    if (state.menuParts) {
      for (index = 0; index < state.menuParts.length; index++) {
        try {
          state.menuParts[index].add(8).writeU8(visible ? 1 : 0);
        } catch (error) {}
      }
    }
    state.visible = visible;
    refreshPage();
    return;
  }
  return;
}

export function getSliderValue(slider: any): number {
  try {
    return slider.add(232).readS32();
  } catch (error) {
    return 0;
  }
}

export function setSliderRange(slider: any, minimum: any, maximum: any): void {
  try {
    slider.add(236).writeS32(minimum | 0);
    slider.add(240).writeS32(maximum | 0);
    return;
  } catch (error) {
    return;
  }
}

export function setSliderValue(slider: any, value: any): void {
  try {
    slider.add(232).writeS32(value | 0);
    return;
  } catch (error) {
    return;
  }
}

export function updateSlider(slider: any, deltaTime: any): void {
  var updateFunction: any;
  try {
    updateFunction = slider.readPointer().add(424).readPointer();
    if (isValidPtr(updateFunction)) {
      new NativeFunction(updateFunction, "int", ["pointer", "float"])(slider, deltaTime);
    }
    return;
  } catch (error) {
    return;
  }
}

export function createSlider(): any {
  var screen: any, sliderScale: any, background: any, knob: any, slider: any;
  try {
    natives.loadSc(newString("sc/ui.sc"), 0);
    natives.loadSc(newString("sc/ui.sc"), 1);
    screen = natives.getMovieClip(
      Memory.allocUtf8String("sc/ui.sc"),
      Memory.allocUtf8String("edit_controls_ui"),
      0,
    );
    if (!isValidPtr(screen)) {
      screen = natives.getMovieClipStr(newString("sc/ui.sc"), newString("edit_controls_ui"));
    }
    if (!isValidPtr(screen)) {
      return ptr(0);
    }
    sliderScale = natives.getChildByName(screen, Memory.allocUtf8String("slider_scale"));
    if (!isValidPtr(sliderScale)) {
      return ptr(0);
    }
    background = natives.getChildByName(sliderScale, Memory.allocUtf8String("slider_bg"));
    knob = natives.getChildByName(sliderScale, Memory.allocUtf8String("slider_button"));
    if (!isValidPtr(background) || !isValidPtr(knob)) {
      return ptr(0);
    }
    natives.setXY(background, 0, 0);
    natives.setXY(knob, 0, 0);
    slider = natives.calloc(376, 1);
    natives.sliderCtor(slider, background, knob, ptr(0), 1);
    return slider;
  } catch (error) {
    return ptr(0);
  }
}

export function createToggle(text: any, x: any, y: any, hideLabel: any): any {
  var screen: any,
    lockButtonClip: any,
    stateClip: any,
    button: any,
    attached: boolean,
    setClipFunction: any,
    buttonRef: any,
    container: any,
    hasContainer: boolean,
    label: any;
  try {
    screen = natives.getMovieClip(
      Memory.allocUtf8String("sc/ui.sc"),
      Memory.allocUtf8String("edit_controls_ui_screen_hud_top"),
      0,
    );
    if (!isValidPtr(screen)) {
      screen = natives.getMovieClipStr(
        newString("sc/ui.sc"),
        newString("edit_controls_ui_screen_hud_top"),
      );
    }
    if (!isValidPtr(screen)) {
      return null;
    }
    try {
      natives.setFrameRange(screen, 1, 1, 0);
    } catch (error) {}
    lockButtonClip = natives.getChildByName(
      screen,
      Memory.allocUtf8String("locked_movement_controls_button"),
    );
    if (!isValidPtr(lockButtonClip)) {
      return null;
    }
    stateClip = natives.getChildByName(lockButtonClip, Memory.allocUtf8String("state"));
    if (!isValidPtr(stateClip)) {
      return null;
    }
    button = natives.malloc(700);
    natives.buttonCtor(button);
    attached = false;
    try {
      setClipFunction = button.readPointer().add(360).readPointer();
      if (isValidPtr(setClipFunction)) {
        new NativeFunction(setClipFunction, "void", ["pointer", "pointer", "int"])(
          button,
          lockButtonClip,
          1,
        );
        attached = true;
      }
    } catch (error) {}
    if (!attached) {
      try {
        natives.buttonSetClip(button, lockButtonClip, 1);
        attached = true;
      } catch (error) {}
    }
    if (!attached) {
      return null;
    }
    buttonRef = button;
    try {
      button.add(16).writeFloat(1 / 2.1);
      button.add(28).writeFloat(1 / 0.53);
    } catch (error) {}
    container = natives.getMovieClip(
      Memory.allocUtf8String("sc/ui.sc"),
      Memory.allocUtf8String("textbox_1"),
      0,
    );
    if (!isValidPtr(container)) {
      container = natives.getMovieClipStr(newString("sc/ui.sc"), newString("textbox_1"));
    }
    if (isValidPtr(container)) {
      try {
        natives.setFrame(container, 1);
      } catch (error) {}
      try {
        container.add(16).writeFloat(0.85);
        container.add(28).writeFloat(0.85);
      } catch (error) {}
      container.add(8).writeU8(1);
      natives.setXY(container, x, y);
      natives.addChild(state.menuClip, container);
      natives.addChild(container, button);
      natives.setXY(button, 0, 0);
      hasContainer = true;
    } else {
      hasContainer = false;
    }
    try {
      natives.setFrame(lockButtonClip, 1);
    } catch (error) {}
    try {
      natives.setFrame(stateClip, 0);
    } catch (error) {}
    try {
      lockButtonClip.add(16).writeFloat(1);
      lockButtonClip.add(28).writeFloat(1);
    } catch (error) {}
    if (!hasContainer) {
      natives.setXY(button, x, y);
      natives.addChild(state.menuClip, button);
    }
    label = hideLabel ? ptr(0) : createLabel(text, x - 145, y + 145, state.menuClip, 24, 0.45);
    return {
      button: buttonRef,
      container: hasContainer ? container : null,
      clip: lockButtonClip,
      stateClip: stateClip,
      label: label,
      enabled: true,
    };
  } catch (error) {
    return null;
  }
}
