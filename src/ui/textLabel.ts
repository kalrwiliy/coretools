import { createMovieClipStr, getMovieClip, loadDebugSc } from "../engine/assets";
import { natives } from "../engine/bindings";
import { setColor, setPosition } from "../engine/displayObject";
import { isValidPtr, newScString } from "../engine/memory";
import {
  getTextFieldByName,
  readChildName,
  setChildColor,
  setChildText,
} from "../engine/movieClip";

export function createTextLabel(text: any, x: any, y: any): any {
  loadDebugSc();
  let clip = getMovieClip("sc/debug.sc", "debug_menu_text");
  if (!isValidPtr(clip)) {
    clip = createMovieClipStr("sc/debug.sc", "debug_menu_text");
  }
  if (!isValidPtr(clip)) return ptr(0);
  try {
    natives.gotoAndStopFrame(clip, 1);
  } catch (error) {}
  setLabelText(clip, text);
  setPosition(clip, x, y);
  return clip;
}

export function setLabelText(clip: any, text: any): any {
  let textField = getTextFieldByName(clip, "Text");
  if (!isValidPtr(textField)) {
    textField = getTextFieldByName(clip, "text");
  }
  if (isValidPtr(textField)) {
    try {
      natives.setText(textField, newScString(text));
    } catch (error) {}
    try {
      let fontSize: any;
      if (!((fontSize = textField.add(176).readS16()) > 0)) {
        textField.add(176).writeS16(16);
      }
    } catch (error) {}
    setColor(textField, 4294967295);
  } else {
    setChildText(clip, "Text", text);
    setChildText(clip, "text", text);
  }
  setChildColor(clip, "Text", 4294967295);
  setChildColor(clip, "text", 4294967295);
  return textField;
}

export function applyTextStyleRecursive(
  clip: any,
  text: any,
  fontSize: any,
  scaleY: any,
  offsetY: any,
): void {
  function visit(node: any, depth: number): void {
    if (!isValidPtr(node) || depth > 3) return;
    let count: number;
    let names: any;
    let children: any;
    try {
      count = node.add(192).readS16();
      if (count < 1 || count > 256) return undefined;
      names = node.add(152).readPointer();
      children = node.add(144).readPointer();
      if (!isValidPtr(names) || !isValidPtr(children)) return undefined;
    } catch (error) {
      return undefined;
    }
    for (let childIndex = 0; childIndex < count; childIndex++) {
      const child = children.add(childIndex * 8).readPointer();
      if (!isValidPtr(child)) continue;
      const childName = readChildName(names, childIndex);
      const textField = getTextFieldByName(node, childName);
      if (isValidPtr(textField)) {
        const pointerKey = textField.toString();
        if (!visited[pointerKey]) {
          visited[pointerKey] = true;
          try {
            natives.setText(textField, newScString(text));
          } catch (error) {}
          setColor(textField, 4294967295);
          if (fontSize && fontSize > 0) {
            try {
              textField.add(176).writeS16(fontSize | 0);
            } catch (error) {}
          }
          if (scaleY && scaleY > 0) {
            try {
              let currentScaleY = textField.add(28).readFloat();
              if (!(currentScaleY > 0.0001)) currentScaleY = 1;
              textField.add(28).writeFloat(currentScaleY * scaleY);
            } catch (error) {}
          }
          if (offsetY) {
            try {
              textField.add(36).writeFloat(textField.add(36).readFloat() + offsetY);
            } catch (error) {}
          }
        }
      }
      visit(child, depth + 1);
    }
  }
  let visited: any;
  if (!isValidPtr(clip)) return;
  visited = {};
  visit(clip, 0);
}
