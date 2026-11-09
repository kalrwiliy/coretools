import { cstr, isValidPtr } from "../platform/memory";
import { nativeUiBindings } from "../runtime/state";
import { setButtonText } from "./buttons";
import { setTextColor, writeTextFieldArgb } from "./colors";
import { hideRaw, readChildName, showRaw } from "./display";

export function findTextField(clip: any): any {
  if (!clip || clip.isNull()) return null;
  const names = ["Text", "txt", "text", "label", "title", "caption", "tf"];
  for (let nameIndex = 0; nameIndex < names.length; nameIndex++) {
    try {
      const found = nativeUiBindings.getMovieClipByName(clip, cstr(names[nameIndex]));
      if (found && !found.isNull()) return found;
    } catch (error) {}
  }
  const offsets = [72, 80, 88, 96, 104, 112, 120, 128, 136, 176];
  for (let offsetIndex = 0; offsetIndex < offsets.length; offsetIndex++) {
    try {
      const child = clip.add(offsets[offsetIndex]).readPointer();
      if (!(!child || child.isNull())) {
        for (let childNameIndex = 0; childNameIndex < names.length; childNameIndex++) {
          try {
            const found = nativeUiBindings.getMovieClipByName(child, cstr(names[childNameIndex]));
            if (found && !found.isNull()) {
              return found;
            }
          } catch (error) {}
        }
      }
    } catch (error) {}
  }
  return null;
}

export function isTextChildName(name: any): boolean {
  name = String(name ? name : "").toLowerCase();
  return (
    name === "text" ||
    name === "txt" ||
    name === "label" ||
    name === "title" ||
    name === "caption" ||
    name === "tf" ||
    name === "buttontext" ||
    name.indexOf("txt") >= 0 ||
    name.indexOf("text") >= 0
  );
}

export function hasTextDescendant(clip: any, depth: any): boolean {
  if (!clip || clip.isNull() || depth > 4) return false;
  try {
    const count = clip.add(192).readS16();
    if (count < 1 || count > 256) return false;
    const names = clip.add(152).readPointer();
    const children = clip.add(144).readPointer();
    if (!names || names.isNull() || !children || children.isNull()) return false;
    for (let childIndex = 0; childIndex < count; childIndex++) {
      const name = readChildName(names, childIndex);
      if (isTextChildName(name)) {
        return true;
      }
      const child = children.add(childIndex * 8).readPointer();
      if (child && !child.isNull() && hasTextDescendant(child, depth + 1)) {
        return true;
      }
    }
  } catch (error) {}
  return false;
}

export function showOnlyTextChildren(clip: any, depth: any): void {
  if (!clip || clip.isNull() || depth > 5) return;
  try {
    const count = clip.add(192).readS16();
    if (count < 1 || count > 256) return;
    const names = clip.add(152).readPointer();
    const children = clip.add(144).readPointer();
    if (!names || names.isNull() || !children || children.isNull()) {
      return;
    }
    for (let childIndex = 0; childIndex < count; childIndex++) {
      const child = children.add(childIndex * 8).readPointer();
      if (!child || child.isNull()) continue;
      const name = readChildName(names, childIndex);
      if (isTextChildName(name)) {
        showRaw(child);
      } else if (hasTextDescendant(child, 0)) {
        showOnlyTextChildren(child, depth + 1);
      } else {
        hideRaw(child);
      }
    }
  } catch (error) {}
}

export function stripButtonToLabel(button: any, clip: any): void {
  if (clip && !clip.isNull()) showOnlyTextChildren(clip, 0);
  if (!button || button.isNull()) return;
  const offsets = [128, 136, 176, 72, 80, 88];
  for (let offsetIndex = 0; offsetIndex < offsets.length; offsetIndex++) {
    try {
      const child = button.add(offsets[offsetIndex]).readPointer();
      if (child && !child.isNull() && !child.equals(clip)) {
        showOnlyTextChildren(child, 0);
      }
    } catch (error) {}
  }
  const decorationNames = [
    "bg",
    "background",
    "panel",
    "shape",
    "fill",
    "rect",
    "bkg",
    "shadow",
    "_CaCaCa149",
    "border",
    "plate",
    "bar",
    "Background",
    "BG",
    "Bg",
    "chrome",
    "base",
    "button",
    "_CaCaCa090",
    "icon",
    "flag",
    "arrow",
    "glow",
    "hit",
    "country",
    "Item",
    "item_bg",
    "btn_bg",
    "select",
    "selected",
    "hover",
    "checkmark",
    "sprite",
    "image",
    "img",
  ];
  if (clip && !clip.isNull()) {
    for (let nameIndex = 0; nameIndex < decorationNames.length; nameIndex++) {
      try {
        const decoration = nativeUiBindings.getMovieClipByName(
          clip,
          cstr(decorationNames[nameIndex]),
        );
        if (decoration && !decoration.isNull() && !hasTextDescendant(decoration, 0)) {
          hideRaw(decoration);
        }
      } catch (error) {}
    }
  }
  const textField = clip ? findTextField(clip) : null;
  if (textField && !textField.isNull()) showRaw(textField);
}

export function setWidgetLabel(widget: any, label: any): void {
  if (!widget || !isValidPtr(widget.button)) return;
  widget.label = String(label);
  setButtonText(widget.button, label);
  if (widget.stripToLabel) {
    stripButtonToLabel(widget.button, widget.clip);
  }
  if (typeof widget.color === "number") {
    applyWidgetClipColor(widget, widget.color);
  }
}

export function collectWidgetTextFields(widget: any): any[] {
  function pushUnique(pointer: any): void {
    if (!pointer || pointer.isNull()) return;
    for (let idx = 0; idx < list.length; idx++) {
      if (list[idx].equals(pointer)) return;
    }
    list.push(pointer);
  }
  const list: any[] = [];
  if (!widget || !isValidPtr(widget.button)) return list;
  pushUnique(findTextField(widget.clip));
  pushUnique(findTextField(widget.button));
  try {
    pushUnique(nativeUiBindings.getMovieClipByName(widget.button, cstr("txt")));
  } catch (error) {}
  try {
    pushUnique(nativeUiBindings.getMovieClipByName(widget.button, cstr("Text")));
  } catch (error) {}
  if (widget.clip) {
    try {
      pushUnique(nativeUiBindings.getMovieClipByName(widget.clip, cstr("txt")));
    } catch (error) {}
    try {
      pushUnique(nativeUiBindings.getMovieClipByName(widget.clip, cstr("Text")));
    } catch (error) {}
  }
  return list;
}

export function setWidgetColor(widget: any, color: any): void {
  if (!widget || !isValidPtr(widget.button)) return;
  widget.color = color >>> 0;
  const textFields = collectWidgetTextFields(widget);
  for (let index = 0; index < textFields.length; index++) {
    setTextColor(textFields[index], widget.color);
  }
}

export function applyWidgetClipColor(widget: any, color: any): void {
  if (!widget || !isValidPtr(widget.button)) return;
  try {
    const textField = findTextField(widget.clip);
    if (textField && !textField.isNull()) writeTextFieldArgb(textField, color);
  } catch (error) {}
}
