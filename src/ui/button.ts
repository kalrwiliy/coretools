import { getMovieClip, loadDebugSc } from "../engine/assets";
import { natives } from "../engine/bindings";
import { cstr, isValidPtr, newScString } from "../engine/memory";
import { getContainerClip } from "../engine/sceneGraph";

export function setButtonText(button: any, childName: any, text: any): void {
  try {
    natives.setChildText(button, cstr(childName), newScString(text));
  } catch (error) {}
}

export function createButton(clip: any, text: any, enabled: any): any {
  if (!isValidPtr(clip)) return ptr(0);
  try {
    natives.gotoAndStopFrame(clip, 1);
  } catch (error) {}
  const button = natives.malloc(640);
  natives.buttonCtor(button);
  try {
    natives.buttonSetMovieClip(button, clip, enabled ? 1 : 0);
  } catch (error) {
    return ptr(0);
  }
  if (text != null) {
    setButtonText(button, "Text", text);
    setButtonText(button, "txt", text);
  }
  try {
    button.add(78).writeU8(1);
  } catch (error) {}
  return button;
}

export function createDebugButton(exportName: any, text: any, frameIndex: any): any {
  loadDebugSc();
  const clip = getMovieClip("sc/debug.sc", exportName);
  if (!isValidPtr(clip)) return ptr(0);
  return createButton(clip, text, frameIndex !== 0);
}

export function createDebugContainer(exportName: any): any {
  loadDebugSc();
  const clip = getMovieClip("sc/debug.sc", exportName);
  if (!isValidPtr(clip)) return ptr(0);
  try {
    natives.gotoAndStopFrame(clip, 1);
  } catch (error) {}
  const container = natives.malloc(256);
  for (let byteOffset = 0; byteOffset < 256; byteOffset += 8) {
    try {
      container.add(byteOffset).writeU64(0);
    } catch (error) {
      try {
        container.add(byteOffset).writeU32(0);
        container.add(byteOffset + 4).writeU32(0);
      } catch (error) {}
    }
  }
  try {
    natives.menuWrapperCtor(container, clip);
  } catch (error) {
    return ptr(0);
  }
  if (!isValidPtr(getContainerClip(container))) return ptr(0);
  return container;
}
