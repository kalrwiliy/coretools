import { natives } from "./bindings";
import { setColor, setScale, setScaleY } from "./displayObject";
import { cstr, isValidPtr, newScString } from "./memory";

export function getMovieClipByName(clip: any, childName: any): any {
  let child: any;
  if (!isValidPtr(clip)) return ptr(0);
  try {
    child = natives.getChildByName(clip, cstr(childName));
    if (isValidPtr(child)) return child;
  } catch (error) {}
  return ptr(0);
}

export function getTextFieldByName(clip: any, childName: any): any {
  let child: any;
  if (!isValidPtr(clip)) return ptr(0);
  try {
    child = natives.getTextFieldByName(clip, cstr(childName));
    if (isValidPtr(child)) return child;
  } catch (error) {}
  return ptr(0);
}

export function setChildVisible(clip: any, childName: any, visible: any): void {
  if (!isValidPtr(clip)) return;
  try {
    natives.setChildVisible.call(natives, clip, cstr(childName), visible ? 1 : 0);
  } catch (error) {}
}

export function setChildText(clip: any, childName: any, text: any): boolean {
  const textField = getTextFieldByName(clip, childName);
  if (!isValidPtr(textField)) return false;
  try {
    natives.setText(textField, newScString(text));
    return true;
  } catch (error) {
    return false;
  }
}

export function setChildColor(clip: any, childName: any, color: any): void {
  const textField = getTextFieldByName(clip, childName);
  if (!isValidPtr(textField)) return;
  setColor(textField, color);
}

export function readChildName(clip: any, index: any): string {
  try {
    const entry = clip.add(index * 8).readPointer();
    if (!isValidPtr(entry)) return "";
    try {
      const cString = entry.readCString();
      if (cString) return String(cString);
    } catch (error) {}
    try {
      const flags = entry.add(0).readU8();
      if ((flags & 1) === 0) {
        const inlineText = entry.add(1).readUtf8String(22);
        if (inlineText) return String(inlineText).replace(/\0.*$/, "");
      } else {
        const heapPointer = entry.add(8).readPointer();
        if (isValidPtr(heapPointer)) {
          const heapText = heapPointer.readCString();
          if (heapText) return String(heapText);
        }
      }
    } catch (error) {}
  } catch (error) {}
  return "";
}

export function isTextChildName(name: any): boolean {
  name = String(name || "").toLowerCase();
  return (
    name === "text" ||
    name === "txt" ||
    name === "label" ||
    name === "title" ||
    name === "caption" ||
    name === "version" ||
    name === "tf" ||
    name === "buttontext" ||
    name.indexOf("txt") >= 0 ||
    name.indexOf("text") >= 0
  );
}

export function hasTextChild(clip: any, depth: any): boolean {
  if (!isValidPtr(clip) || depth > 4) return false;
  try {
    const count = clip.add(192).readS16();
    if (count < 1 || count > 256) return false;
    const names = clip.add(152).readPointer();
    const children = clip.add(144).readPointer();
    if (!isValidPtr(names) || !isValidPtr(children)) return false;
    for (let index = 0; index < count; index++) {
      if (isTextChildName(readChildName(names, index))) return true;
      const child = children.add(index * 8).readPointer();
      if (isValidPtr(child) && hasTextChild(child, depth + 1)) return true;
    }
  } catch (error) {}
  return false;
}

export function gotoFrame(clip: any, frameIndex: any): void {
  if (!isValidPtr(clip)) return;
  const frame = frameIndex | 0;
  try {
    natives.gotoAndPlayFrameRange(clip, frame, frame, 0);
  } catch (error) {}
}

export function tintNonTextChildren(clip: any, red: any, green: any, blue: any): void {
  if (!isValidPtr(clip)) return;
  try {
    const count = clip.add(192).readS16();
    if (count < 1 || count > 256) return;
    const names = clip.add(152).readPointer();
    const children = clip.add(144).readPointer();
    if (!isValidPtr(names) || !isValidPtr(children)) return;
    let tintedCount = 0;
    for (let idx = 0; idx < count; idx++) {
      const child = children.add(idx * 8).readPointer();
      if (!isValidPtr(child)) continue;
      const name = readChildName(names, idx);
      if (isTextChildName(name) || hasTextChild(child, 0)) continue;
      try {
        child.add(9).add(0).writeU8(red);
        child.add(9).add(1).writeU8(green);
        child.add(9).add(2).writeU8(blue);
        tintedCount++;
      } catch (error) {}
    }
  } catch (error) {}
}

export function setChildScaleY(clip: any, childName: any, scaleY: any): void {
  const textField = getTextFieldByName(clip, childName);
  if (!isValidPtr(textField)) return;
  setScaleY(textField, scaleY);
}

export function readChildNameRaw(clip: any, index: any): string {
  try {
    const entry = clip.add(index * 8).readPointer();
    if (!entry || entry.isNull()) return "";
    try {
      const cString = entry.readCString();
      if (cString) return String(cString);
    } catch (error) {}
    try {
      const flags = entry.add(0).readU8();
      if ((flags & 1) === 0) {
        const inlineText = entry.add(1).readUtf8String(22);
        if (inlineText) return String(inlineText).replace(/\0.*$/, "");
      } else {
        const heapPointer = entry.add(8).readPointer();
        if (heapPointer && !heapPointer.isNull()) {
          const heapText = heapPointer.readCString();
          if (heapText) return String(heapText);
        }
      }
    } catch (error) {}
  } catch (error) {}
  return "";
}

export function hideNonTextChildren(clip: any): void {
  if (!isValidPtr(clip)) return;
  try {
    const count = clip.add(192).readS16();
    if (count < 1 || count > 256) return;
    const names = clip.add(152).readPointer();
    const children = clip.add(144).readPointer();
    if (!names || names.isNull() || !children || children.isNull()) return;
    for (let index = 0; index < count; index++) {
      const name = readChildNameRaw(names, index).toLowerCase();
      if (
        name === "text" ||
        name === "txt" ||
        name.indexOf("txt") >= 0 ||
        name.indexOf("text") >= 0
      )
        continue;
      const child = children.add(index * 8).readPointer();
      if (!child || child.isNull()) continue;
      try {
        child.add(72).writeU8(0);
      } catch (error) {}
      try {
        setScale(child, 0, 0);
      } catch (error) {}
    }
  } catch (error) {}
}
