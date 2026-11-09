import { scheduleInterval } from "../../../runtime/lifecycle";
import { menuLayout } from "../selection";

import { createMovieClipStr } from "../../../engine/assets";
import { natives } from "../../../engine/bindings";
import { getWidth } from "../../../engine/displayObject";
import { cstr as allocateCString, libgFunction } from "../../../engine/memory";
import { findInnerClip } from "../../../engine/sceneGraph";
import { getStageRoot } from "../../../engine/screen";
import { coreState } from "../../../runtime/coreState";
import { MENU_SCALE_X, MENU_SCALE_Y, state } from "./state";

export function isValidPtr(pointer: any): boolean {
  try {
    return !!(pointer && !pointer.isNull() && pointer.compare(ptr(65536)) > 0);
  } catch (error) {
    return false;
  }
}

export function isLibgObject(node: any): any {
  if (!isValidPtr(node)) return false;
  try {
    let libg: any;
    if (!(libg = Process.findModuleByName("libg.so"))) {
      return false;
    }
    const vtable: any = node.readPointer();
    return (
      isValidPtr(vtable) &&
      vtable.compare(libg.base) >= 0 &&
      vtable.compare(libg.base.add(libg.size)) < 0
    );
  } catch (error) {
    return false;
  }
}

export function cstr(text: any): any {
  return allocateCString(String(text));
}

export function pooledString(text: any): any {
  if (state.stringPool.length < 8) {
    state.stringPool.push(natives.malloc(128));
  }
  const slot: any = state.stringPool[state.stringPoolIndex];
  state.stringPoolIndex = (state.stringPoolIndex + 1) % state.stringPool.length;
  natives.stringCtor2(slot, Memory.allocUtf8String(String(text)));
  return slot;
}

export function setPosition(node: any, x: any, y: any): void {
  if (!node || node.isNull()) return;
  try {
    node.add(32).writeFloat(x);
    node.add(36).writeFloat(y);
    return;
  } catch (error) {
    return;
  }
}

export function setScale(node: any, scaleX: any, scaleY: any): void {
  if (!node || node.isNull()) return;
  try {
    node.add(16).writeFloat(scaleX);
    node.add(28).writeFloat(scaleY);
    return;
  } catch (error) {
    return;
  }
}

export function bindButtonClip(button: any, clip: any): boolean {
  try {
    let vtable: any;
    let initFn: any;
    if (
      (vtable = button.readPointer()) &&
      !vtable.isNull() &&
      (initFn = vtable.add(360).readPointer()) &&
      !initFn.isNull()
    ) {
      new NativeFunction(initFn, "void", ["pointer", "pointer", "int"])(button, clip, 1);
      return true;
    }
  } catch (error) {}
  try {
    natives.buttonSetMovieClip(button, clip, 1);
    return true;
  } catch (error) {
    return false;
  }
}

export function findTextField(clip: any, childName: any): any {
  try {
    const field: any = natives.getTextFieldByName2(clip, cstr(childName));
    if (isValidPtr(field)) {
      return field;
    }
  } catch (error) {}
  return ptr(0);
}

export function getMovieClip(assetPath: any, clipName: any): any {
  const file: any = cstr(assetPath);
  const exportName: any = cstr(clipName);
  try {
    let clip: any;
    if ((clip = natives.getMovieClip(file, exportName, 0)) && !clip.isNull()) {
      return clip;
    }
  } catch (error) {}
  try {
    let clip2: any;
    if ((clip2 = createMovieClipStr(assetPath, clipName)) && !clip2.isNull()) {
      return clip2;
    }
  } catch (error) {}
  return ptr(0);
}

export function getStage(): any {
  let stage: any;
  stage = getStageRoot();
  if (!isValidPtr(stage)) {
    try {
      stage = coreState.base.add(21288888).readPointer();
    } catch (error) {}
    if (!isValidPtr(stage)) {
      return ptr(0);
    }
  }
  try {
    stage.add(78).readU16();
  } catch (error) {
    return ptr(0);
  }
  return stage;
}

export function getLayoutWidth(): any {
  try {
    if (menuLayout.scale) {
      return Math.round(960 * menuLayout.scale());
    }
  } catch (error) {}
  return 1180;
}

export function createSlider(): any {
  try {
    const ui: any = getMovieClip("sc/ui.sc", "edit_controls_ui");
    if (!isValidPtr(ui)) {
      return ptr(0);
    }
    const sliderScale: any = natives.getMovieClipByName2(ui, cstr("slider_scale"));
    if (!isValidPtr(sliderScale)) {
      return ptr(0);
    }
    const sliderBg: any = natives.getMovieClipByName2(sliderScale, cstr("slider_bg"));
    const sliderButton: any = natives.getMovieClipByName2(sliderScale, cstr("slider_button"));
    if (!isValidPtr(sliderBg) || !isValidPtr(sliderButton)) {
      return ptr(0);
    }
    setPosition(sliderBg, 0, 0);
    setPosition(sliderButton, 0, 0);
    const slider: any = natives.calloc(376, 1);
    try {
      natives.sliderCtor(slider, sliderBg, sliderButton, ptr(0), 1);
    } catch (error) {
      return ptr(0);
    }
    let buttonWidth: any = 100;
    try {
      buttonWidth = getWidth(sliderButton) || 100;
    } catch (error) {}
    const bounds: any = natives.getMovieClipByName2(sliderButton, cstr("bounds"));
    let boundsWidth: any = 0;
    if (isValidPtr(bounds)) {
      try {
        boundsWidth = getWidth(bounds) || 0;
      } catch (error) {}
    }
    if (boundsWidth > 0 && buttonWidth !== boundsWidth) {
      try {
        const offset: any = (buttonWidth - boundsWidth) / 2;
        const knobX: any = slider.add(312).readPointer();
        if (isValidPtr(knobX)) {
          knobX.writeFloat(knobX.readFloat() - offset);
        }
      } catch (error) {}
    }
    return slider;
  } catch (error) {
    return ptr(0);
  }
}

export function startSliderTicker(): void {
  if (state.sliderTimer) {
    return;
  }
  state.sliderTimer = scheduleInterval(function () {
    let index: any, row: any, vtable: any, updateFunction: any, value: any;
    if (!state.open || !state.sliders) {
      return;
    }
    for (index = 0; index < state.sliders.length; index++) {
      row = state.sliders[index];
      if (!isLibgObject(row.slider)) {
        continue;
      }
      try {
        updateFunction = (vtable = row.slider.readPointer()).add(424).readPointer();
        if (isValidPtr(updateFunction)) {
          new NativeFunction(updateFunction, "int", ["pointer", "float"])(row.slider, 0.016);
        }
        value = row.slider.add(232).readS32();
        if (row.lastValue !== value) {
          row.lastValue = value;

          if (isLibgObject(row.tf)) {
            try {
              natives.setText(row.tf, pooledString(row.name + ": " + (value | 0)));
              row.tf.add(28).writeFloat(MENU_SCALE_X / MENU_SCALE_Y);
            } catch (error) {}
          }
        }
      } catch (error) {}
    }
    return;
  }, 16);
  return;
}

export function createButton(text: any, x: any, y: any): any {
  try {
    const clip: any = getMovieClip("sc/ui.sc", "map_editor_big_exit_button");
    if (!isValidPtr(clip)) {
      return null;
    }
    try {
      natives.setWidgetFrame(clip, 1);
    } catch (error) {}
    const button: any = natives.malloc(640);
    natives.buttonCtor(button);
    if (!bindButtonClip(button, clip)) {
      return null;
    }
    setButtonText(button, text);
    try {
      button.add(78).writeU8(1);
    } catch (error) {}
    setScale(button, 1 / MENU_SCALE_X, 1 / MENU_SCALE_Y);
    setPosition(button, x, y);
    return button;
  } catch (error) {
    return null;
  }
}

export function setButtonText(button: any, text: any): void {
  if (!button || button.isNull()) {
    return;
  }
  const names: any = ["txt", "Text"];
  for (let i = 0; i < names.length; i++) {
    try {
      natives.setChildText(button, cstr(names[i]), pooledString(text));
    } catch (error) {}
  }
  try {
    let field: any = findTextField(button, "Text");
    if (!isValidPtr(field)) {
      field = findTextField(button, "text");
    }
    if (isValidPtr(field)) {
      natives.setText(field, pooledString(text));
    }
    return;
  } catch (error) {
    return;
  }
}

export function createLabel(
  text: any,
  x: any,
  y: any,
  requestedFontSize?: any,
  requestedRgb?: any,
): any {
  const rgb: any = requestedRgb ? requestedRgb : [255, 255, 255];
  try {
    const clip: any = getMovieClip("sc/debug.sc", "debug_menu_text");

    if (!isValidPtr(clip)) {
      return null;
    }
    try {
      natives.setWidgetFrame(clip, 1);
    } catch (error) {}

    setPosition(clip, x, y);
    let field: any = natives.getTextFieldByName2(clip, cstr("Text"));
    if (!isValidPtr(field)) {
      field = natives.getTextFieldByName2(clip, cstr("text"));
    }
    if (isValidPtr(field)) {
      natives.setText(field, pooledString(text));
      const color: any = ((255 << 24) | (rgb[0] << 16) | (rgb[1] << 8) | rgb[2]) >>> 0;
      field.add(9).writeU8(rgb[0]);
      field.add(10).writeU8(rgb[1]);
      field.add(11).writeU8(rgb[2]);
      try {
        natives.setColor(field, color);
      } catch (error) {}
      try {
        field.add(128).writeU32(color);
        field.add(212).writeU32(color);
        field.add(96).writeU32(color);
      } catch (error) {}
      const fontSize: any = requestedFontSize > 0 ? requestedFontSize : 16;
      try {
        let curSize: any;
        if (!((curSize = field.add(176).readS16()) > 0)) {
          field.add(176).writeS16(fontSize | 0);
        }
      } catch (error) {}
      try {
        field.add(28).writeFloat(MENU_SCALE_X / MENU_SCALE_Y);
      } catch (error) {}
    }
    return clip;
  } catch (error) {
    return null;
  }
}

export function createToggle(x: any, y: any): any {
  const toggle: any = {
    button: null,
    clip: null,
    stateClip: null,
    enabled: true,
    lastTapAt: 0,
  };
  try {
    const screen: any = getMovieClip("sc/ui.sc", "edit_controls_ui_screen_hud_top");
    if (!isValidPtr(screen)) {
      return toggle;
    }
    const lockBtn: any = natives.getMovieClipByName2(
      screen,
      cstr("locked_movement_controls_button"),
    );
    if (!isValidPtr(lockBtn)) {
      return toggle;
    }
    const stateClip: any = natives.getMovieClipByName2(lockBtn, cstr("state"));
    if (!isValidPtr(stateClip)) {
      return toggle;
    }
    const button: any = natives.malloc(700);
    natives.buttonCtor(button);
    try {
      natives.buttonSetMovieClip(button, lockBtn, 1);
    } catch (error) {
      return toggle;
    }
    setScale(button, 1 / MENU_SCALE_X, 1 / MENU_SCALE_Y);
    try {
      natives.setWidgetFrame(lockBtn, 1);
    } catch (error) {}
    try {
      natives.setWidgetFrame(stateClip, 0);
    } catch (error) {}
    setScale(lockBtn, 1, 1);
    setPosition(button, x, y);
    toggle.button = button;
    toggle.clip = lockBtn;
    toggle.stateClip = stateClip;
    return toggle;
  } catch (error) {
    return toggle;
  }
}

export function isNodeOrParent(node: any, target: any): any {
  try {
    if (!isValidPtr(target)) {
      return false;
    }

    if (node.equals(target)) {
      return true;
    }
    const parent: any = findInnerClip(target);
    return isValidPtr(parent) && node.equals(parent);
  } catch (error) {
    return false;
  }
}

export function resolveNatives(): boolean {
  if (state.natOk) {
    return true;
  }
  try {
    if (!natives.getMovieClipByName2) {
      natives.getMovieClipByName2 = libgFunction(6561580, "pointer", ["pointer", "pointer"]);
    }
    if (!natives.getTextFieldByName2) {
      natives.getTextFieldByName2 = libgFunction(6562188, "pointer", ["pointer", "pointer"]);
    }
    if (!natives.setWidgetFrame) {
      natives.setWidgetFrame = libgFunction(6558136, "void", ["pointer", "int"]);
    }
    if (!natives.stringCtor2) {
      natives.stringCtor2 = libgFunction(7008916, "pointer", ["pointer", "pointer"]);
    }
    state.natOk = !!(
      natives.getMovieClipByName2 &&
      natives.getTextFieldByName2 &&
      natives.setWidgetFrame &&
      natives.stringCtor2
    );
  } catch (error) {
    state.natOk = false;
  }
  return !!state.natOk;
}
