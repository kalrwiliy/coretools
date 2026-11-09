import { menuStyleState } from "../selection";
// "BSRE1" RU/EN menu style: localisation, helpers, UI node builders.
import { currentStage } from "../../../engine/stage";
import {
  OFFSETS,
  STRINGS,
  TITLE_SCALE,
  TITLE_TEXT,
  TITLE_X,
  TITLE_Y,
  memoryState,
  natives,
  state,
} from "./state";
export function localize(key: any): any {
  const translations = STRINGS[key];
  if (translations) {
    if (state.lang === "ru") return translations[1];
    return translations[0];
  }
  return key;
}
export function register(entry: any): void {
  for (let index = 0; index < state.localized.length; index++) {
    if (state.localized[index].id === entry.id) {
      state.localized[index] = entry;
      return;
    }
  }
  state.localized.push(entry);
}
export function applyAll(): void {
  for (let idx = 0; idx < state.localized.length; idx++) {
    const entry = state.localized[idx];
    try {
      if (entry.type === "btn" && isValidPtr(entry.button)) {
        natives.setChildText(
          entry.button,
          Memory.allocUtf8String("Text"),
          newString(localize(entry.id)),
        );
        natives.setChildText(
          entry.button,
          Memory.allocUtf8String("txt"),
          newString(localize(entry.id)),
        );
        if (entry.id.indexOf("qcol") === 0) {
          const slot = parseInt(entry.id.charAt(4), 10);
          const colour = state.quickFlags[slot] ? 5631573 : 16733525;
          let textNode = natives.find(state.quickButtonClips[slot], Memory.allocUtf8String("Text"));
          if (!isValidPtr(textNode)) {
            textNode = natives.find(state.quickButtonClips[slot], Memory.allocUtf8String("txt"));
          }
          if (isValidPtr(textNode)) {
            textNode.add(9).writeU8((colour >>> 16) & 255);
            textNode.add(10).writeU8((colour >>> 8) & 255);
            textNode.add(11).writeU8(colour & 255);
          }
        }
      } else if (entry.type === "clip" && isValidPtr(entry.clip) && isValidPtr(entry.tf)) {
        natives.setText(entry.tf, newString(localize(entry.id)));
        entry.tf.add(9).writeU8(255);
        entry.tf.add(10).writeU8(255);
        entry.tf.add(11).writeU8(255);
      }
    } catch (error) {}
  }
}
export function toggleLanguage(): void {
  state.lang = state.lang === "ru" ? "en" : "ru";
  applyAll();
}
export function isValidPtr(pointer: any): boolean {
  try {
    return !!(pointer && !pointer.isNull() && pointer.compare(ptr(65536)) > 0);
  } catch (error) {
    return false;
  }
}
export function libgFn(offset: any, returnType: any, argumentTypes: any): any {
  return new NativeFunction(state.base!.add(offset), returnType, argumentTypes);
}
export function newString(text: any): any {
  const string = natives.malloc(32);
  natives.stringCtor(string, Memory.allocUtf8String(String(text)));
  return string;
}
export function isDisplayObject(node: any): boolean {
  if (!isValidPtr(node)) return false;
  try {
    node.add(78).readU16();
    return isValidPtr(node.readPointer());
  } catch (error) {
    return false;
  }
}
export function isHeapPtr(pointer: any): any {
  const ok = isValidPtr(pointer);
  if (!ok) return ok;
  return pointer.compare(memoryState.heapFloor) >= 0;
}
export function findStage(): any {
  const liveRoot = currentStage();
  if (!liveRoot.isNull()) return liveRoot;
  try {
    const owner = natives.getStageOwner();
    if (isValidPtr(owner)) {
      const offsets = [192, 128, 184, 336, 232];
      for (let k = 0; k < offsets.length; k++) {
        const cand = owner.add(offsets[k]).readPointer();
        if (isHeapPtr(cand) && isDisplayObject(cand)) return cand;
      }
    }
  } catch (error) {}
  try {
    const glob = state.base!.add(OFFSETS.stageGlobal).readPointer();
    if (isHeapPtr(glob) && isDisplayObject(glob)) return glob;
  } catch (error) {}
  return ptr(0);
}
export function readChildName(names: any, index: any): string {
  try {
    const strPtr = names.add(index * 8).readPointer();
    if (!isValidPtr(strPtr)) return "";
    try {
      const cstr = strPtr.readCString();
      if (cstr) return String(cstr);
    } catch (error) {}
    try {
      const flags = strPtr.add(0).readU8();
      if ((flags & 1) === 0) {
        let shortStr = strPtr.add(1).readUtf8String(22);
        if (!shortStr) return "";
        const nul = shortStr.indexOf("\u0000");
        if (nul >= 0) {
          shortStr = shortStr.substring(0, nul);
        }
        return shortStr;
      }
      const heapPtr = strPtr.add(8).readPointer();
      if (isValidPtr(heapPtr)) {
        const heapStr = heapPtr.readCString();
        if (heapStr) return String(heapStr);
      }
    } catch (error) {}
  } catch (error) {}
  return "";
}
export function hideNonTextChildren(clip: any): void {
  try {
    const count = clip.add(192).readS16();
    const names = clip.add(152).readPointer();
    const children = clip.add(144).readPointer();
    if (count < 1 || count > 256 || !isValidPtr(names) || !isValidPtr(children)) {
      return undefined;
    }
    let hidden = 0;
    for (let idx = 0; idx < count; idx++) {
      const name = readChildName(names, idx).toLowerCase();
      if (
        name === "text" ||
        name === "txt" ||
        name.indexOf("txt") >= 0 ||
        name.indexOf("text") >= 0
      ) {
        continue;
      }
      const child = children.add(idx * 8).readPointer();
      if (!isValidPtr(child)) continue;
      try {
        child.add(72).writeU8(0);
      } catch (error) {}
      try {
        child.add(16).writeFloat(0);
        child.add(28).writeFloat(0);
      } catch (error) {}
      hidden++;
    }
  } catch (error) {}
}
export function getScreenState(): number {
  try {
    const inst = natives.getScreenStateHolder();
    if (isValidPtr(inst)) return inst.add(80).readS32();
  } catch (error) {}
  return -1;
}
export function ensureTitle(): boolean {
  if (state.active && isValidPtr(state.clip)) return true;
  const clip = createStageLabel(TITLE_TEXT, TITLE_X, TITLE_Y, TITLE_SCALE);
  if (!isValidPtr(clip)) return false;
  state.clip = clip;
  state.tf = natives.find(clip, Memory.allocUtf8String("Text"));
  if (!isValidPtr(state.tf)) {
    state.tf = natives.find(clip, Memory.allocUtf8String("text"));
  }
  state.active = true;
  return true;
}
export function createButton(text: any, x: any, y: any, parent: any, color?: any): any {
  const root = findStage();
  if (!isDisplayObject(root)) return false;
  let clip = natives.getMovieClip(
    Memory.allocUtf8String("sc/ui.sc"),
    Memory.allocUtf8String("map_editor_big_exit_button"),
    0,
  );
  if (!isValidPtr(clip)) {
    clip = natives.getMovieClipStr(newString("sc/ui.sc"), newString("map_editor_big_exit_button"));
  }
  if (!isValidPtr(clip)) return false;
  try {
    natives.setFrame(clip, 1);
  } catch (error) {}
  const btn = natives.malloc(640);
  if (!isValidPtr(btn)) return false;
  natives.buttonCtor(btn);
  let attached = false;
  try {
    const vtbl = btn.readPointer();
    if (isValidPtr(vtbl)) {
      const setClip = vtbl.add(360).readPointer();
      if (isValidPtr(setClip)) {
        new NativeFunction(setClip, "void", ["pointer", "pointer", "int"])(btn, clip, 1);
        attached = true;
      }
    }
  } catch (error) {}
  if (!attached) {
    try {
      natives.buttonSetClip(btn, clip, 1);
      attached = true;
    } catch (error) {}
  }
  if (!attached) return false;
  try {
    natives.setChildText(btn, Memory.allocUtf8String("Text"), newString(text));
  } catch (error) {}
  try {
    natives.setChildText(btn, Memory.allocUtf8String("txt"), newString(text));
  } catch (error) {}
  if (color != null) {
    let textNode = natives.find(clip, Memory.allocUtf8String("Text"));
    if (!isValidPtr(textNode)) {
      textNode = natives.find(clip, Memory.allocUtf8String("txt"));
    }
    if (isValidPtr(textNode)) {
      try {
        textNode.add(9).writeU8((color >>> 16) & 255);
        textNode.add(10).writeU8((color >>> 8) & 255);
        textNode.add(11).writeU8(color & 255);
      } catch (error) {}
    }
  }
  try {
    btn.add(78).writeU8(1);
  } catch (error) {}
  natives.setXY(btn, x, y);
  if (parent) {
    try {
      btn.add(16).writeFloat(1.15 / 2.1);
      btn.add(28).writeFloat(1.15 / 0.53);
    } catch (error) {}
  } else {
    try {
      btn.add(16).writeFloat(1);
      btn.add(28).writeFloat(1);
    } catch (error) {}
  }
  const addResult = natives.addChild(parent ? parent : root, btn);
  state.lastButton = btn;
  state.lastButtonClip = clip;
  if (text === "menu") {
    state.menuButtonClip = clip;
  }
  if (text === "Quick") {
    state.quickButtonClip = clip;
  }
  return btn;
}
export function showTitle(): void {
  try {
    if (isValidPtr(state.clip)) {
      state.clip!.add(8).writeU8(1);
    }
    if (isValidPtr(state.tf)) {
      natives.setText(state.tf, newString(TITLE_TEXT));
      state.tf!.add(9).writeU8(255);
      state.tf!.add(10).writeU8(255);
      state.tf!.add(11).writeU8(255);
      state.tf!.add(176).writeS16(Math.round(24 * TITLE_SCALE));
    }
    return;
  } catch (error) {
    return;
  }
}
export function setActive(): void {
  const style = menuStyleState.current || "coretools";
  if (style !== "bsre1") return;
  state.active = true;
}
export function createLabel(
  text: any,
  x: any,
  y: any,
  parent: any,
  fontSize?: any,
  requestedScale?: any,
): any {
  try {
    let clip = natives.getMovieClip(
      Memory.allocUtf8String("sc/ui.sc"),
      Memory.allocUtf8String("textbox_1"),
      0,
    );
    if (!isValidPtr(clip)) {
      clip = natives.getMovieClipStr(newString("sc/ui.sc"), newString("textbox_1"));
    }
    if (!isValidPtr(clip)) return null;
    try {
      natives.setFrame(clip, 1);
    } catch (error) {}
    natives.setXY(clip, x, y);
    const scale = requestedScale > 0 ? requestedScale : 1;
    try {
      clip.add(16).writeFloat(scale / 2.1);
      clip.add(28).writeFloat(scale / 0.53);
    } catch (error) {}
    clip.add(8).writeU8(1);
    natives.addChild(parent, clip);
    let textNode = natives.find(clip, Memory.allocUtf8String("Text"));
    if (!isValidPtr(textNode)) {
      textNode = natives.find(clip, Memory.allocUtf8String("text"));
    }
    if (!isValidPtr(textNode)) {
      textNode = natives.find(clip, Memory.allocUtf8String("txt"));
    }
    if (isValidPtr(textNode)) {
      natives.setText(textNode, newString(text));
      try {
        textNode.add(9).writeU8(255);
        textNode.add(10).writeU8(255);
        textNode.add(11).writeU8(255);
      } catch (error) {}
      try {
        textNode.add(176).writeS16(fontSize > 0 ? fontSize : 24);
      } catch (error) {}
    }
    return clip;
  } catch (error) {
    return null;
  }
}
export function createStageLabel(text: any, x: any, y: any, scale: any, fontSize?: any): any {
  const root = findStage();
  if (!isDisplayObject(root)) return null;
  try {
    natives.loadSc(newString("sc/ui.sc"), 0);
    natives.loadSc(newString("sc/ui.sc"), 1);
  } catch (error) {}
  let clip = natives.getMovieClip(
    Memory.allocUtf8String("sc/ui.sc"),
    Memory.allocUtf8String("textbox_1"),
    0,
  );
  if (!isValidPtr(clip)) {
    clip = natives.getMovieClipStr(newString("sc/ui.sc"), newString("textbox_1"));
  }
  if (!isValidPtr(clip)) return null;
  try {
    natives.setFrame(clip, 1);
  } catch (error) {}
  natives.setXY(clip, x, y);
  try {
    clip.add(16).writeFloat(scale);
    clip.add(28).writeFloat(scale);
  } catch (error) {}
  clip.add(8).writeU8(1);
  natives.addChild(root, clip);
  let textNode = natives.find(clip, Memory.allocUtf8String("Text"));
  if (!isValidPtr(textNode)) {
    textNode = natives.find(clip, Memory.allocUtf8String("text"));
  }
  if (!isValidPtr(textNode)) {
    textNode = natives.find(clip, Memory.allocUtf8String("txt"));
  }
  if (isValidPtr(textNode)) {
    natives.setText(textNode, newString(text));
    try {
      textNode.add(9).writeU8(255);
      textNode.add(10).writeU8(255);
      textNode.add(11).writeU8(255);
    } catch (error) {}
    try {
      textNode.add(176).writeS16(fontSize > 0 ? fontSize : Math.round(24 * scale));
    } catch (error) {}
  }
  return clip;
}
export function createInfoLabels(): void {
  const ids = ["info0", "info1", "info2", "info3"];
  const xAdjust: any = { info0: -3, info1: -2, info2: -3, info3: 0 };
  for (let idx = 0; idx < ids.length; idx++) {
    const posY = 59 + idx * 17;
    const posX =
      -540 + 5 * (localize(ids[idx]).length - 10) + (xAdjust[ids[idx]] ? xAdjust[ids[idx]] : 0);
    const clip = createStageLabel(localize(ids[idx]), posX, posY, 1.5, 13);
    if (isValidPtr(clip)) {
      let textNode = natives.find(clip, Memory.allocUtf8String("Text"));
      if (!isValidPtr(textNode)) {
        textNode = natives.find(clip, Memory.allocUtf8String("text"));
      }
      state.infoLabels.push({ clip: clip, tf: textNode, id: ids[idx] });
      register({
        type: "clip",
        id: ids[idx],
        clip: clip,
        tf: textNode,
      });
    }
  }
}
export function setQuickBarVisible(visible: any): void {
  state.quickBarVisible = visible;
  for (let t = 0; t < state.quickButtons.length; t++) {
    try {
      state.quickButtons[t].add(8).writeU8(visible ? 1 : 0);
    } catch (error) {}
    try {
      state.quickButtons[t].add(72).writeU8(visible ? 1 : 0);
    } catch (error) {}
  }
}
export function createQuickBar(): void {
  const labels = ["Авто уклон", "Киллаура", "Зум"];
  const colours: any = {};
  colours["Auto dodge"] = 16733525;
  colours["Kill Aura"] = 5631573;
  colours["Zoom"] = 16733525;
  for (let idx = 0; idx < labels.length; idx++) {
    const btn = createButton(
      labels[idx],
      1136,
      147 + idx * 47,
      null,
      colours[labels[idx]] ? colours[labels[idx]] : 16733525,
    );
    if (isValidPtr(btn)) {
      state.quickButtons.push(btn);
      state.quickButtonClips.push(state.lastButtonClip);
      state.quickFlags.push(false);
    }
  }
  setQuickBarVisible(false);
}
