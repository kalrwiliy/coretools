import { scheduleTimeout, scheduleInterval } from "./lifecycle";
import { natives } from "../engine/bindings";
import { setVisible } from "../engine/displayObject";
import { getGameState } from "../engine/gameState";
import { isLiveObject, isValidPtr } from "../engine/memory";
import { getStageRoot } from "../engine/screen";
import { noop } from "../hud/watermark";
import { watermarkState } from "../hud/watermarkState";
import { closeDebugMenu } from "../menu/debug/menu";
import { mainMenuState } from "../menu/settings/state";
import { nativeUiServices } from "../nativeUi/runtime/services";
import {
  isBattleActionWanted,
  onBattleMounted,
  scheduleBattleAction,
  tryBattleAction,
} from "./battleController";
import { STATE_BATTLE, STATE_HOME } from "./constants";
import { runtimeState } from "./controllers";
import { coreState } from "./coreState";

export function scheduleRefresh(): void {
  if (coreState.refreshTimer) return;
  coreState.refreshTimer = scheduleTimeout(function () {
    coreState.refreshTimer = null;
    refreshOverlay();
  }, 80);
}

export function onGameStateUpdate(): void {
  var gameStateManager: any,
    gameState: any,
    menuModeFlag: any,
    battleSettingsButton: any,
    homeSettingsButton: any,
    settingsButton: any;
  gameStateManager = natives.getGameStateManager();
  if (!isValidPtr(gameStateManager)) return;
  if ((gameState = getGameState(gameStateManager)) === coreState.lastGameState) return;
  try {
    if ((menuModeFlag = coreState.base.add(19874996)).readU32() !== 3) {
      menuModeFlag.writeU32(3);
    }
  } catch (error) {}
  coreState.lastGameState = gameState;
  if (coreState.debugMenuOpen) {
    closeDebugMenu();
  }
  if (gameState === STATE_BATTLE) {
    onBattleMounted();
    scheduleBattleAction("gsm");
    try {
      if (
        (battleSettingsButton = runtimeState.settingsButtonRef) &&
        isValidPtr(battleSettingsButton.button)
      ) {
        setVisible(battleSettingsButton.button, true);
      }
      if (
        battleSettingsButton &&
        battleSettingsButton.labelClip &&
        isValidPtr(battleSettingsButton.labelClip)
      ) {
        setVisible(battleSettingsButton.labelClip, true);
      }
    } catch (error) {}
    return;
  }
  if (gameState === STATE_HOME) {
    coreState.battleActionForced = false;
    scheduleRefresh();
    scheduleTimeout(noop, 50);
    try {
      if (
        (homeSettingsButton = runtimeState.settingsButtonRef) &&
        isValidPtr(homeSettingsButton.button)
      ) {
        setVisible(homeSettingsButton.button, false);
      }
      if (
        homeSettingsButton &&
        homeSettingsButton.labelClip &&
        isValidPtr(homeSettingsButton.labelClip)
      ) {
        setVisible(homeSettingsButton.labelClip, false);
      }
    } catch (error) {}
    return;
  }
  try {
    if ((settingsButton = runtimeState.settingsButtonRef) && isValidPtr(settingsButton.button)) {
      setVisible(settingsButton.button, false);
    }
    if (settingsButton && settingsButton.labelClip && isValidPtr(settingsButton.labelClip)) {
      setVisible(settingsButton.labelClip, false);
    }
  } catch (error) {}
}

export function startStateWatch(): void {
  if (coreState.stateWatchInterval) return;
  coreState.stateWatchInterval = scheduleInterval(function () {
    var gameStateManager: any, gameState: any;
    gameStateManager = natives.getGameStateManager();
    gameState = isValidPtr(gameStateManager) ? getGameState(gameStateManager) : -1;
    if (
      gameState === STATE_BATTLE &&
      !isValidPtr(coreState.debugButton) &&
      isLiveObject(getStageRoot())
    ) {
      refreshOverlay();
    }
    if (gameState === STATE_BATTLE && isBattleActionWanted()) {
      tryBattleAction("tick");
    }
    if (
      gameState === STATE_HOME &&
      !mainMenuState.isOpen &&
      !mainMenuState.built &&
      nativeUiServices.firstMount
    ) {
      try {
        nativeUiServices.firstMount();
      } catch (error) {}
      return;
    }
  }, 2000);
}

export function refreshOverlay(): void {}

export function onReturnHome(): void {
  var now: number;
  if ((now = Date.now()) - coreState.lastReturnHomeAt < 800) return;
  coreState.lastReturnHomeAt = now;
  coreState.lastGameState = STATE_HOME;
  scheduleTimeout(function () {
    refreshOverlay();
    watermarkState.built = false;
    noop();
    scheduleTimeout(function () {}, 200);
  }, 50);
}

export function onReturnHomeAlt(): void {
  var now: number;
  if ((now = Date.now()) - coreState.lastReturnHomeAt < 800) return;
  coreState.lastReturnHomeAt = now;
  coreState.lastGameState = STATE_HOME;
  scheduleTimeout(function () {
    refreshOverlay();
    watermarkState.built = false;
    noop();
    scheduleTimeout(function () {}, 200);
  }, 50);
}
