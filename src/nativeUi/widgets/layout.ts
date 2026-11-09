import Java from "frida-java-bridge";
import { isLiveObject } from "../../engine/memory";
import { currentStage } from "../../engine/stage";
import { isValidPtr } from "../platform/memory";
import {
  nativeUiBindings,
  nativeUiConfig,
  nativeUiOffsets,
  nativeUiRuntime,
} from "../runtime/state";

export function getGameMainField128(): any {
  try {
    const inst = nativeUiBindings.getGameMain();
    if (!inst || inst.isNull()) return null;
    const stageCandidate = inst.add(nativeUiOffsets.GAMEMAIN_FIELD_128).readPointer();
    if (stageCandidate && !stageCandidate.isNull()) return stageCandidate;
  } catch (error) {}
  return null;
}

export function getMetricsStageWidth(): any {
  let width: any = 0;
  try {
    const activityThread: any = Java.use("android.app.ActivityThread");
    const app = activityThread.currentApplication();
    if (!app) return 0;
    const metrics = app.getApplicationContext().getResources().getDisplayMetrics();
    const screenWidth = metrics.widthPixels.value;
    const screenHeight = metrics.heightPixels.value;
    const longSide = screenWidth > screenHeight ? screenWidth : screenHeight;
    const shortSide = screenWidth > screenHeight ? screenHeight : screenWidth;
    if (shortSide > 0) width = (nativeUiConfig.referenceShortSide * longSide) / shortSide;
  } catch (error) {
    try {
      Java.perform(function () {
        const activityThread: any = Java.use("android.app.ActivityThread");
        const app = activityThread.currentApplication();
        if (!app) return;
        const metrics = app.getApplicationContext().getResources().getDisplayMetrics();
        const screenWidth = metrics.widthPixels.value;
        const screenHeight = metrics.heightPixels.value;
        const longSide = screenWidth > screenHeight ? screenWidth : screenHeight;
        const shortSide = screenWidth > screenHeight ? screenHeight : screenWidth;
        if (shortSide > 0) {
          width = (nativeUiConfig.referenceShortSide * longSide) / shortSide;
        }
        return;
      });
    } catch (error) {}
  }
  return width;
}

export function guessStageWidth(): any {
  const obj = getGameMainField128();
  let best: any = 0;
  if (isValidPtr(obj)) {
    try {
      const integerWidth = obj.add(3836).readS32();
      if (integerWidth >= 400 && integerWidth <= 5000) best = integerWidth;
    } catch (error) {}
    try {
      const offsets = [64, 68, 72, 76, 80, 84, 88, 92, 96, 100, 104, 108];
      for (let index = 0; index < offsets.length; index++) {
        const candidateWidth = obj.add(offsets[index]).readFloat();
        if (candidateWidth >= 400 && candidateWidth <= 5000 && candidateWidth > best)
          best = candidateWidth;
      }
    } catch (error) {}
  }
  if (!(best >= 400)) {
    const metricsWidth = getMetricsStageWidth();
    if (metricsWidth >= 400 && metricsWidth <= 5000) best = metricsWidth;
  }
  if (!(best >= 400)) best = nativeUiConfig.fallbackStageWidth;
  return best;
}

export function computeLayout(): any {
  const baseW = nativeUiConfig.baseLayoutWidth > 0 ? nativeUiConfig.baseLayoutWidth : 960;
  const guessedWidth = guessStageWidth();
  const metricsWidth = getMetricsStageWidth();
  let stageWidth = guessedWidth;
  if (metricsWidth >= 400 && metricsWidth <= 5000 && metricsWidth > stageWidth)
    stageWidth = metricsWidth;
  if (stageWidth <= baseW * 1.05) {
    const panelX = nativeUiConfig.minPanelX > 0 ? nativeUiConfig.minPanelX : baseW - 90;
    const panelWidth = nativeUiConfig.panelWidth > 0 ? nativeUiConfig.panelWidth : 100;

    const rightEdge = panelX + panelWidth * 0.5;
    if (rightEdge > stageWidth) stageWidth = rightEdge;
  }
  let scale = stageWidth / baseW;
  if (scale < 0.85) scale = 0.85;
  if (scale > 1.35) scale = 1.35;
  return { stageWidth, scale, baseWidth: baseW };
}

export function getScaledPanelWidth(): any {
  const layout = computeLayout();
  const panelWidth = nativeUiConfig.panelWidth > 0 ? nativeUiConfig.panelWidth : 100;
  const scaledWidth = panelWidth * layout.scale;
  return scaledWidth;
}

export function getPanelX(): any {
  const layout = computeLayout();
  const panelWidth = nativeUiConfig.panelWidth > 0 ? nativeUiConfig.panelWidth : 100;
  let panelX = layout.stageWidth - panelWidth * layout.scale;
  const minimumX = nativeUiConfig.minPanelX > 0 ? nativeUiConfig.minPanelX : layout.baseWidth - 90;
  if (panelX < minimumX) panelX = minimumX;
  return panelX;
}

export function getLoadingScreenClip(): any {
  try {
    if (!nativeUiRuntime.state.loginState || nativeUiRuntime.state.loginState.isNull()) return null;
    const clip = nativeUiRuntime.state.loginState.add(32).readPointer();
    if (clip && !clip.isNull()) return clip;
  } catch (error) {}
  return null;
}

export function getStageRoot(): any {
  const liveRoot = currentStage();
  if (!liveRoot.isNull()) return liveRoot;
  if (nativeUiRuntime.state.gameStage && isLiveObject(nativeUiRuntime.state.gameStage)) {
    return nativeUiRuntime.state.gameStage;
  }
  try {
    const loadingClip = getLoadingScreenClip();
    if (loadingClip && !loadingClip.isNull() && isLiveObject(loadingClip)) return loadingClip;
  } catch (error) {}
  return getGameMainField128();
}
