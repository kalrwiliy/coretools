import { isLiveObject } from "../../engine/memory";
import { isValidPtr } from "../platform/memory";
import { nativeUiBindings, nativeUiRuntime } from "../runtime/state";
import { getStageRoot } from "./layout";

export function addChild(parent: any, child: any): boolean {
  if (!isValidPtr(parent) || !isValidPtr(child)) return false;
  try {
    nativeUiBindings.spriteAddChild(parent, child);
    return true;
  } catch (error) {
    return false;
  }
}

export function setPositionRaw(node: any, x: any, y: any): void {
  if (!node || node.isNull()) return;
  try {
    node.add(32).writeFloat(x);
    node.add(36).writeFloat(y);
  } catch (error) {}
}

export function setScaleRaw(node: any, scaleX: any, scaleY: any): void {
  if (!node || node.isNull()) return;
  try {
    node.add(16).writeFloat(scaleX);
    node.add(28).writeFloat(scaleY);
  } catch (error) {}
}

export function addToStage(node: any): boolean {
  if (!node || node.isNull()) return false;
  let stage: any;
  try {
    stage = getStageRoot();
    if (!stage || stage.isNull() || !isLiveObject(stage)) return false;
    nativeUiBindings.spriteAddChild(stage, node);
    nativeUiRuntime.state.stageRoot = stage;
    return true;
  } catch (error) {
    return false;
  }
}

export function gotoFrame(clip: any, frameIndex: any): void {
  if (!clip || clip.isNull() || !nativeUiBindings.movieClipGotoFrame) return;
  try {
    nativeUiBindings.movieClipGotoFrame(clip, frameIndex | 0);
  } catch (error) {}
  try {
    clip.add(186).writeS16(frameIndex | 0);
    clip.add(188).writeS16(-1);
    clip.add(194).writeU8(0);
    clip.add(77).writeU8(2);
    clip.add(136).writeU32(0);
  } catch (error) {}
}

export function showRaw(node: any): void {
  if (!node || node.isNull()) return;
  try {
    node.add(72).writeU8(1);
  } catch (error) {}
  try {
    setScaleRaw(node, 1, 1);
  } catch (error) {}
}

export function hideRaw(node: any): void {
  if (!node || node.isNull()) return;
  try {
    setScaleRaw(node, 0, 0);
  } catch (error) {}
  try {
    node.add(72).writeU8(0);
  } catch (error) {}
  try {
    node.add(32).writeFloat(-99999);
    node.add(36).writeFloat(-99999);
  } catch (error) {}
}

export function readChildName(names: any, index: any): string {
  try {
    const entry = names.add(index * 8).readPointer();
    if (!entry || entry.isNull()) return "";
    try {
      const cstr = entry.readCString();
      if (cstr) {
        return String(cstr);
      }
    } catch (error) {}
    try {
      const flag = entry.add(0).readU8();
      if ((flag & 1) === 0) {
        const inline = entry.add(1).readUtf8String(22);
        if (inline) {
          return String(inline).replace(/\0.*$/, "");
        }
      } else {
        const heap = entry.add(8).readPointer();
        if (heap && !heap.isNull()) {
          const heapStr = heap.readCString();
          if (heapStr) {
            return String(heapStr);
          }
        }
      }
    } catch (error) {}
  } catch (error) {}
  return "";
}

export function parkObject(node: any): void {
  if (!node || node.isNull()) return;
  try {
    setScaleRaw(node, 0, 0);
  } catch (error) {}
  try {
    node.add(72).writeU8(0);
  } catch (error) {}
  try {
    node.add(77).writeU8(0);
  } catch (error) {}
  try {
    node.add(194).writeU8(0);
  } catch (error) {}
  try {
    node.add(32).writeFloat(-99999);
    node.add(36).writeFloat(-99999);
  } catch (error) {}
}

/** Remove only this mod-owned node from its actual parent; never free game memory. */
export function detachOwnedNode(node: NativePointer | null | undefined): void {
  if (!isLiveObject(node)) return;
  const errors: string[] = [];
  // Try every visibility/position write and removal even if one address is stale.
  const parkWrites = [
    () => node!.add(16).writeFloat(0),
    () => node!.add(28).writeFloat(0),
    () => node!.add(72).writeU8(0),
    () => node!.add(77).writeU8(0),
    () => node!.add(194).writeU8(0),
    () => node!.add(32).writeFloat(-99999),
    () => node!.add(36).writeFloat(-99999),
  ];
  for (const write of parkWrites) {
    try {
      write();
    } catch (error) {
      errors.push(String(error));
    }
  }
  try {
    const parent = node!.add(56).readPointer();
    if (isLiveObject(parent)) nativeUiBindings.spriteRemoveChild(parent, node!);
  } catch (error) {
    errors.push(String(error));
  }
  if (errors.length) throw new Error("Native node removal failed: " + errors.join("; "));
}
