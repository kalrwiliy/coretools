import { scheduleTimeout } from "./lifecycle";
import { natives } from "../engine/bindings";
import { getGameState, getHomeMode, getMessageManager, getPlayerAvatar } from "../engine/gameState";
import { isValidPtr } from "../engine/memory";
import { LibgOffsets } from "../engine/offsets";
import { mainMenuState } from "../menu/settings/state";
import { GSM_NEXT_STATE_OFFSET, HOME_TUTORIAL_FLAG_OFFSET, STATE_BATTLE } from "./constants";
import { coreState } from "./coreState";
import { refreshOverlay } from "./gameStateWatcher";

export function onBattleMounted(): void {
  function markBattleMenuPending(): void {
    var gameStateManager: any;
    gameStateManager = natives.getGameStateManager();
    if (!isValidPtr(gameStateManager) || getGameState(gameStateManager) !== STATE_BATTLE) return;
    mainMenuState.built = false;
    if (mainMenuState.isOpen) return;
    if (isValidPtr(mainMenuState.button)) return;
    coreState.battleMountedAt = Date.now();
  }
  var refreshDelays: number[], delayIndex: number;
  refreshDelays = [120, 500, 1200, 2500];
  for (delayIndex = 0; delayIndex < refreshDelays.length; delayIndex++) {
    (function (delayMs: number) {
      scheduleTimeout(function () {
        var gameStateManager: any;
        gameStateManager = natives.getGameStateManager();
        if (!isValidPtr(gameStateManager) || getGameState(gameStateManager) !== STATE_BATTLE)
          return;
        coreState.debugButton = null;
        refreshOverlay();
      }, delayMs);
    })(refreshDelays[delayIndex]);
  }
  scheduleTimeout(markBattleMenuPending, 3000);
  scheduleTimeout(markBattleMenuPending, 8000);
  scheduleBattleAction("mountBattle");
}

export function readBattleActiveFlags(): boolean {
  var slot: any, activeFlag: any;
  try {
    activeFlag = (slot = coreState.base.add(LibgOffsets.battleActivePtrGlobal)).readPointer();
    if (isValidPtr(activeFlag) && activeFlag.readS32() !== 0) {
      return true;
    }
    return coreState.base.add(LibgOffsets.battleActiveFlagGlobal).readS32() !== 0;
  } catch (error) {
    return false;
  }
}

export function getBattle(): NativePointer {
  var battle: any, globalBattle: any;
  try {
    battle = natives.getBattle();
    if (isValidPtr(battle)) {
      return battle;
    }
  } catch (error) {}
  try {
    globalBattle = coreState.base.add(LibgOffsets.BattleMode_instance).readPointer();
    if (isValidPtr(globalBattle)) {
      return globalBattle;
    }
  } catch (error) {}
  return ptr(0);
}

export function getBattleSubObject(): NativePointer {
  var battle: any, subObject: any;
  battle = getBattle();
  if (!isValidPtr(battle)) return ptr(0);
  try {
    subObject = natives.getBattleSubObject(battle);
    if (isValidPtr(subObject)) {
      return subObject;
    }
  } catch (error) {}
  try {
    subObject = battle.add(2528).readPointer();
    if (isValidPtr(subObject)) {
      return subObject;
    }
  } catch (error) {}
  return ptr(0);
}

export function isBattleActionWanted(): any {
  return coreState.battleActionForced || readBattleActiveFlags();
}

export function invokeBattleAction(): boolean {
  var battle: any;
  battle = getBattle();
  if (!isValidPtr(battle)) return false;
  try {
    natives.exitBattleToHome(battle, 1, 0, 0, 0);
    return true;
  } catch (error) {
    return false;
  }
}

export function tryBattleAction(reason: any): boolean {
  var manager: any, battle: any;
  if (coreState.battleActionDone) return true;
  if (!isBattleActionWanted()) return false;
  if (coreState.busy) return false;
  manager = natives.getGameStateManager();
  if (!isValidPtr(manager) || getGameState(manager) !== STATE_BATTLE) return false;
  battle = getBattle();
  if (!isValidPtr(battle)) return false;
  coreState.busy = true;
  try {
    if (!invokeBattleAction()) {
      return false;
    }
    coreState.battleActionDone = true;
    coreState.battleActionForced = false;
    return true;
  } finally {
    coreState.busy = false;
  }
}

export function scheduleBattleAction(reason: any): void {
  var delays: number[], delayIndex: number;
  if (!isBattleActionWanted()) return;
  delays = [0, 30, 80, 200, 500, 1200, 2500];
  for (delayIndex = 0; delayIndex < delays.length; delayIndex++) {
    (function (delayMs: number) {
      scheduleTimeout(function () {
        if (coreState.battleActionDone) return;
        tryBattleAction(reason + "@" + delayMs + "ms");
      }, delayMs);
    })(delays[delayIndex]);
  }
}

export function forceBattleAction(): void {
  coreState.battleActionForced = true;
  coreState.battleActionDone = false;
  scheduleBattleAction("_CaCaCa069");
}

export function startTutorialBattle(gameStateManager: any): void {
  var homeMode: any, messageManager: any, avatar: any;
  homeMode = getHomeMode(gameStateManager);
  if (isValidPtr(homeMode)) {
    homeMode.add(HOME_TUTORIAL_FLAG_OFFSET).writeU8(1);
  }
  gameStateManager.add(GSM_NEXT_STATE_OFFSET).writeS32(STATE_BATTLE);
  messageManager = getMessageManager();
  avatar = getPlayerAvatar(gameStateManager);
  if (!isValidPtr(messageManager)) {
    throw new Error("MessageManager missing");
  }
  if (!isValidPtr(avatar)) {
    throw new Error("player avatar missing");
  }
  forceBattleAction();
  natives.startTutorial(messageManager, avatar, 0);
  onBattleMounted();
}

export function startTutorialBattleWrapper(gameStateManager: any): void {
  startTutorialBattle(gameStateManager);
}
