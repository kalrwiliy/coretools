import { coreState } from "../runtime/coreState";
import { natives } from "./bindings";
import { StageOffsets } from "./layouts";
import { isLiveObject, isValidPtr, readFloatSafe, readLibgU32, readS32Safe } from "./memory";
import { LibgOffsets } from "./offsets";
import { currentStage } from "./stage";

export function getStageRoot(): any {
  const liveRoot = currentStage();
  if (!liveRoot.isNull()) return liveRoot;
  let idx: number, inst: any, cand: any, offsets: number[];
  try {
    inst = natives.getStage();
    if (isValidPtr(inst)) {
      cand = inst.add(192).readPointer();
      if (isLiveObject(cand)) return cand;
    }
  } catch (error) {}
  try {
    inst = natives.getStage();
    if (isValidPtr(inst)) {
      offsets = [128, 184, 336, 232];
      for (idx = 0; idx < offsets.length; idx++) {
        cand = inst.add(offsets[idx]).readPointer();
        if (isLiveObject(cand)) return cand;
      }
    }
  } catch (error) {}
  cand = getStage();
  if (isLiveObject(cand)) return cand;
  return ptr(0);
}

export function getStage(): any {
  let p: any;
  try {
    p = coreState.base.add(LibgOffsets.Stage_instance).readPointer();
    if (isValidPtr(p)) return p;
  } catch (error) {}
  return ptr(0);
}

export function getScreenSize(): any {
  var stage: any,
    scale: any,
    left: any,
    right: any,
    top: any,
    bottom: any,
    width: any,
    height: any,
    rawScale: any,
    gLeft: any,
    gRight: any,
    gTop: any,
    gBottom: any,
    hInset: any,
    vInset: any,
    outH: any,
    outW: any;
  stage = getStage();
  if (!isValidPtr(stage)) stage = getStageRoot();
  scale = 0;
  left = 0;
  right = 0;
  top = 0;
  bottom = 0;
  width = 0;
  height = 0;
  if (isValidPtr(stage)) {
    if ((rawScale = readFloatSafe(stage, StageOffsets.contentScale)) !== 0 && isFinite(rawScale))
      scale = rawScale;
    left = readFloatSafe(stage, StageOffsets.safeInsetLeft);
    right = readFloatSafe(stage, StageOffsets.safeInsetRight);
    top = readFloatSafe(stage, StageOffsets.safeInsetTop);
    bottom = readFloatSafe(stage, StageOffsets.safeInsetBottom);
    width = readS32Safe(stage, StageOffsets.screenWidth);
    height = readS32Safe(stage, StageOffsets.screenHeight);
    if (!(width >= 500 && width <= 5000)) width = readS32Safe(stage, 7376);
    if (!(height >= 300 && height <= 5000)) height = readS32Safe(stage, 7380);
  }
  if (!(left > 0 || right > 0 || top > 0 || bottom > 0)) {
    gLeft = readLibgU32(LibgOffsets.safeInsetLeftGlobal);
    gRight = readLibgU32(LibgOffsets.safeInsetRightGlobal);
    gTop = readLibgU32(LibgOffsets.safeInsetTopGlobal);
    gBottom = readLibgU32(LibgOffsets.safeInsetBottomGlobal);
    if (gLeft > 0 || gRight > 0 || gTop > 0 || gBottom > 0) {
      left = gLeft;
      right = gRight;
      top = gTop;
      bottom = gBottom;
    }
  }
  if (!(width >= 500 && width <= 5000)) width = 1280;
  if (!(height >= 300 && height <= 5000)) height = 720;
  if (!(scale > 0.0001 && isFinite(scale))) scale = 1;
  if (!(left >= 0 && left < 800)) left = 0;
  if (!(right >= 0 && right < 800)) right = 0;
  if (!(top >= 0 && top < 800)) top = 0;
  if (!(bottom >= 0 && bottom < 800)) bottom = 0;
  hInset = (right + left) / scale;
  vInset = (bottom + top) / scale;
  if (hInset < 1) hInset = 48;
  outH = height - vInset;
  outW = width - hInset;
  if (!(outH >= 300 && outH <= 5000)) outH = height;
  if (!(outW >= 500 && outW <= 5000)) outW = width - 48;
  return { w: outW, h: outH };
}
