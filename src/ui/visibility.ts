import { scheduleTimeout } from "../runtime/lifecycle";
import { natives } from "../engine/bindings";
import { setVisible } from "../engine/displayObject";
import { isValidPtr, newScString } from "../engine/memory";
import { removeFromStage } from "../engine/sceneGraph";
import { afterUnhideStub } from "../hud/buttons";
import { closeDebugMenu } from "../menu/debug/menu";
import { closeSettingsMenu } from "../menu/settings/lifecycle";
import { mainMenuState } from "../menu/settings/state";
import { coreState } from "../runtime/coreState";
export function showFloater(message: any): void {
  try {
    natives.showFloaterText(natives.getStage(), newScString(String(message)), 0, -1, 0);
  } catch (error) {}
}
export function hideUi(): void {
  if (coreState.uiHidden) return;
  coreState.uiHidden = true;
  if (mainMenuState.isOpen) {
    closeSettingsMenu();
  }
  if (isValidPtr(mainMenuState.button)) {
    removeFromStage(mainMenuState.button);
    mainMenuState.button = null;
  }
  if (isValidPtr(coreState.debugButton)) {
    setVisible(coreState.debugButton, true);
  }
}
export function showUi(onDebugClose?: () => void): void {
  if (!coreState.uiHidden) return;
  coreState.uiHidden = false;
  if (coreState.debugMenuOpen) {
    closeDebugMenu();
  }
  if (onDebugClose) onDebugClose();
  if (isValidPtr(coreState.debugButton)) {
    setVisible(coreState.debugButton, false);
  }
  scheduleTimeout(afterUnhideStub, 50);
}
