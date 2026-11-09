import { natives } from "../../engine/bindings";
import { getGameState, getNextGameState } from "../../engine/gameState";
import { isValidPtr } from "../../engine/memory";
import { startTutorialBattleWrapper } from "../../runtime/battleController";
import { coreState } from "../../runtime/coreState";
import { showFloater } from "../../ui/visibility";
import { closeDebugMenu } from "./menu";

export function goTutorial(onDebugClose?: () => void): boolean {
  var r: any, t: any, a: any;
  if (coreState.busy) {
    showFloater("Busy");
    return false;
  }
  r = natives.getGameStateManager();
  if (!isValidPtr(r)) {
    showFloater("GSM missing");
    return false;
  }
  t = getGameState(r);
  a = getNextGameState(r);
  showFloater("Go Tutorial " + t + "/" + a);
  closeDebugMenu();
  if (onDebugClose) onDebugClose();
  coreState.busy = true;
  try {
    startTutorialBattleWrapper(r);
    showFloater("Tutorial started");
  } catch (error) {
    showFloater("Tutorial failed");
  } finally {
    coreState.busy = false;
  }
  return true;
}
