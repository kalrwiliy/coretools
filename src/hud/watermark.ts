import { scheduleInterval } from "../runtime/lifecycle";
import { natives } from "../engine/bindings";
import { setVisible } from "../engine/displayObject";
import { getGameState } from "../engine/gameState";
import { isValidPtr, newScString } from "../engine/memory";
import { setChildText } from "../engine/movieClip";
import { removeFromStage } from "../engine/sceneGraph";
import { STATE_HOME, VersionInfo } from "../runtime/constants";
import { coreState } from "../runtime/coreState";
import { watermarkState } from "./watermarkState";

export function getText(): string {
  return VersionInfo.title + "\n" + VersionInfo.host + "\n" + VersionInfo.scriptVersion;
}

export function noop(): void {}

export function update(): void {
  if (!watermarkState.built || !isValidPtr(watermarkState.container)) return;
  const gameStateManager = natives.getGameStateManager();
  const gameState = isValidPtr(gameStateManager) ? getGameState(gameStateManager) : -1;
  const visible = gameState === STATE_HOME && !coreState.debugMenuOpen;
  setVisible(watermarkState.container, visible);
  if (!visible) return;
  const text = getText();
  if (isValidPtr(watermarkState.textField)) {
    try {
      natives.setText(watermarkState.textField, newScString(text));
      return;
    } catch (error) {
      setChildText(watermarkState.container, "Text", text);
      return;
    }
  }
  setChildText(watermarkState.container, "Text", text);
  setChildText(watermarkState.container, "text", text);
}

export function destroy(): void {
  if (isValidPtr(watermarkState.container)) removeFromStage(watermarkState.container);
  watermarkState.container = null;
  watermarkState.textField = null;
  watermarkState.built = false;
}

export function startTimer(): void {
  if (coreState.watermarkTimer) return;
  coreState.watermarkTimer = scheduleInterval(update, 1500);
}
