import { cstr, isValidPtr } from "../platform/memory";
import { nativeUiBindings } from "../runtime/state";
import { getUiMovieClip } from "./assets";

export function setSliderValue(slider: any, value: any): void {
  slider.add(232).writeS32(value | 0);
}

export function getSliderValue(slider: any): number {
  return slider.add(232).readS32();
}

export function setSliderRange(slider: any, minimum: any, maximum: any): void {
  slider.add(236).writeS32(minimum | 0);
  slider.add(240).writeS32(maximum | 0);
}

export function tickSlider(slider: any, deltaTime: any): any {
  const vtable = slider.readPointer();
  if (!vtable || vtable.isNull()) return 0;
  const fn = vtable.add(424).readPointer();
  if (!fn || fn.isNull()) return 0;
  return new NativeFunction(fn, "int", ["pointer", "float"])(slider, deltaTime);
}

export function createSlider(): any {
  const dialog = getUiMovieClip("age_gate_dialog");
  if (!isValidPtr(dialog)) return ptr(0);
  const sliderBg = nativeUiBindings.getMovieClipByName(dialog, cstr("slider_bg"));

  const sliderKnob = nativeUiBindings.getMovieClipByName(dialog, cstr("slider"));
  if (!isValidPtr(sliderBg) || !isValidPtr(sliderKnob)) return ptr(0);
  const slider = nativeUiBindings.calloc(376, 1);
  nativeUiBindings.sliderCtor(slider, sliderBg, sliderKnob, ptr(0), 0);
  return slider;
}
