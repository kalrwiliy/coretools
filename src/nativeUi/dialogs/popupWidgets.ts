import { createScString, cstr, isValidPtr } from "../platform/memory";
import { nativeUiBindings } from "../runtime/state";
import { getUiMovieClip } from "../widgets/assets";
import { addChild } from "../widgets/display";

export function showToast(message: any): void {
  const text = String(message);
  try {
    const stage = nativeUiBindings.getGUI();
    if (isValidPtr(stage)) {
      nativeUiBindings.showFloaterText(stage, createScString(text), 0, -1, 0);
    }
  } catch (error) {}
}

export function getPopupContent(popup: any): any {
  if (!isValidPtr(popup)) return ptr(0);
  try {
    const content = popup.add(144).readPointer();
    if (isValidPtr(content)) return content;
  } catch (error) {}
  return ptr(0);
}

export function addTextLine(container: any, text: any, y: any, color: any): void {
  const clip = getUiMovieClip("popover_text_left");
  if (!isValidPtr(clip)) return;
  const textField = nativeUiBindings.getTextFieldByName(clip, cstr("text"));
  if (!isValidPtr(textField)) return;
  nativeUiBindings.setXY(textField, -260, y);
  nativeUiBindings.textFieldSetColor(textField, color >>> 0);
  nativeUiBindings.textFieldSetText(textField, createScString(text));
  addChild(container, textField);
}
