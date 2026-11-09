import {
  attachButtonListener,
  createNativeListener,
  createScString,
  cstr,
  isValidPtr,
} from "../platform/memory";
import { nativeUiBindings } from "../runtime/state";
import { getUiMovieClip } from "./assets";

export function setButtonListener(button: any, onPress: any): void {
  if (!isValidPtr(button)) return;
  attachButtonListener(button, createNativeListener(onPress));
}

export function createLabelButton(text: any, x: any, y: any, onPress: any): any {
  const clip = getUiMovieClip("player_name_color_entry");
  if (!isValidPtr(clip)) return ptr(0);
  nativeUiBindings.movieClipGotoFrame(clip, 1);
  const button = nativeUiBindings.malloc(640);
  nativeUiBindings.gameButtonCtor(button);
  initButtonWithClip(button, clip);
  const label = nativeUiBindings.getTextFieldByName(clip, cstr("label_txt"));
  if (isValidPtr(label)) {
    nativeUiBindings.textFieldSetText(label, createScString(text));
    nativeUiBindings.textFieldSetColor(label, 4294967295);
  }
  setButtonListener(button, onPress);
  nativeUiBindings.setXY(button, x, y);
  return button;
}

export function initButtonWithClip(button: any, clip: any): boolean {
  try {
    const vtable = button.readPointer();
    if (vtable && !vtable.isNull()) {
      const fn = vtable.add(360).readPointer();
      if (fn && !fn.isNull()) {
        new NativeFunction(fn, "void", ["pointer", "pointer", "int"])(button, clip, 1);
        return true;
      }
    }
  } catch (error) {}
  try {
    nativeUiBindings.setButtonMovieClip(button, clip, 1);
    return true;
  } catch (error) {
    return false;
  }
}

export function setButtonText(button: any, text: any): void {
  if (!button || button.isNull()) return;
  const names = ["txt", "Text"];
  for (let idx = 0; idx < names.length; idx++) {
    try {
      nativeUiBindings.gameButtonSetText(button, cstr(names[idx]), createScString(text));
    } catch (error) {}
  }
}
