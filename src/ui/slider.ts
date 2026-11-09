import { createMovieClipStr } from "../engine/assets";
import { natives } from "../engine/bindings";
import { getWidth, setPosition } from "../engine/displayObject";
import { cstr, isValidPtr } from "../engine/memory";
import { getMovieClipByName } from "../engine/movieClip";

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
  } catch (error) {}
}

export function setSliderValue(slider: any, value: any): void {
  try {
    slider.add(232).writeS32(value | 0);
  } catch (error) {}
}

export function updateSlider(slider: any, deltaTime: any): number {
  try {
    const vtable = slider.readPointer();
    if (!!isValidPtr(vtable)) {
      const fn = vtable.add(424).readPointer();
      if (!!isValidPtr(fn)) {
        new NativeFunction(fn, "int", ["pointer", "float"])(slider, deltaTime);
      } else {
        return getSliderValue(slider);
      }
    } else {
      return getSliderValue(slider);
    }
  } catch (error) {}
  return getSliderValue(slider);
}

export function createSlider(): any {
  let root: any = ptr(0);
  try {
    root = natives.getMovieClip(cstr("sc/ui.sc"), cstr("edit_controls_ui"), 0);
  } catch (error) {}
  if (!isValidPtr(root)) {
    root = createMovieClipStr("sc/ui.sc", "edit_controls_ui");
  }
  if (!isValidPtr(root)) return ptr(0);

  const scale = getMovieClipByName(root, "slider_scale");
  if (!isValidPtr(scale)) return ptr(0);
  const bg = getMovieClipByName(scale, "slider_bg");
  const button = getMovieClipByName(scale, "slider_button");
  if (!isValidPtr(bg) || !isValidPtr(button)) return ptr(0);
  setPosition(bg, 0, 0);
  setPosition(button, 0, 0);
  let n: any;
  if (!((n = getWidth(button)) > 1)) {
    n = 100;
  }
  const bounds = getMovieClipByName(button, "bounds");
  let i: any = 0;
  if (isValidPtr(bounds)) {
    if (!((i = getWidth(bounds)) > 1)) {
      i = 0;
    }
  }
  const slider = natives.calloc(376, 1);
  try {
    natives.sliderCtor(slider, bg, button, ptr(0), 1);
  } catch (error) {
    return ptr(0);
  }
  if (i > 0 && n !== i) {
    try {
      const shift = (n - i) / 2;
      const f = slider.add(312).readPointer();
      if (isValidPtr(f)) {
        f.writeFloat(f.readFloat() - shift);
      }
    } catch (error) {}
  }
  return slider;
}
