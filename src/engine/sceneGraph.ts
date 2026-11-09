import { natives } from "./bindings";
import { isLiveObject, isValidPtr } from "./memory";
import { getStageRoot } from "./screen";

export function addToStage(node: any): boolean {
  let root: any;
  root = getStageRoot();
  if (!isLiveObject(root) || !isValidPtr(node)) return false;
  try {
    natives.addChild(root, node);
    return true;
  } catch (error) {
    return false;
  }
}

export function removeFromStage(node: any): void {
  let root: any;
  root = getStageRoot();
  if (!isLiveObject(root) || !isValidPtr(node)) return;
  try {
    natives.removeChild(root, node);
  } catch (error) {}
}

export function findInnerClip(node: any): any {
  let offsets: number[], offsetIndex: number, candidateClip: any;
  if (!isValidPtr(node)) return ptr(0);
  offsets = [128, 136, 176, 96];
  for (offsetIndex = 0; offsetIndex < offsets.length; offsetIndex++) {
    try {
      candidateClip = node.add(offsets[offsetIndex]).readPointer();
      if (isValidPtr(candidateClip)) return candidateClip;
    } catch (error) {}
  }
  return ptr(0);
}

export function getContainerClip(container: any): any {
  let clip: any;
  if (!isValidPtr(container)) return ptr(0);
  try {
    clip = container.add(144).readPointer();
    if (isValidPtr(clip)) return clip;
  } catch (error) {}
  return ptr(0);
}

export function addChild(parent: any, child: any): boolean {
  if (!isValidPtr(parent) || !isValidPtr(child)) return false;
  try {
    natives.addChild(parent, child);
    return true;
  } catch (error) {
    return false;
  }
}

export function removeChild(parent: any, child: any): void {
  if (!isValidPtr(parent) || !isValidPtr(child)) return;
  try {
    natives.removeChild(parent, child);
  } catch (error) {}
}
