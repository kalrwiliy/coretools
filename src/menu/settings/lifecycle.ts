import { natives } from "../../engine/bindings";
import { setVisible } from "../../engine/displayObject";
import { getGameState } from "../../engine/gameState";
import { isValidPtr } from "../../engine/memory";
import { removeFromStage } from "../../engine/sceneGraph";
import { getScreenSize } from "../../engine/screen";
import { STATE_HOME } from "../../runtime/constants";
import { destroyCameraSliders } from "./cameraPage";
import { xyzSliderGroup } from "./cameraState";
import { dragState } from "./dragState";
import { destroyModulesPage } from "./modulesPage";
import { modulesPageState } from "./modulesState";
import { destroyPageNavButtons } from "./navigation";
import { cameraNavButtons } from "./navigationState";
import { mainMenuState } from "./state";
import { destroyToggles } from "./toggleButton";
import { toggleGroup } from "./toggleState";

export function setSettingsMenuVisible(visible: any): void {
  var t: number, a: number, e: number, n: number, o: number, i: number;
  setVisible(mainMenuState.menu, visible);
  setVisible(mainMenuState.clip, visible);
  for (t = 0; t < toggleGroup.items.length; t++) {
    setVisible(toggleGroup.items[t].button, visible);
    setVisible(toggleGroup.items[t].label, visible);
  }
  for (a = 0; a < xyzSliderGroup.items.length; a++) {
    setVisible(xyzSliderGroup.items[a].slider, visible);
    setVisible(xyzSliderGroup.items[a].label, visible);
  }
  for (e = 0; e < cameraNavButtons.items.length; e++) {
    setVisible(cameraNavButtons.items[e], visible);
  }
  if (mainMenuState.menuButtons) {
    for (n = 0; n < mainMenuState.menuButtons.length; n++) {
      setVisible(mainMenuState.menuButtons[n], visible);
    }
  }
  for (o = 0; o < (modulesPageState.bigButtons ? modulesPageState.bigButtons : []).length; o++) {
    setVisible(modulesPageState.bigButtons[o], visible);
  }
  for (i = 0; i < (modulesPageState.sliders ? modulesPageState.sliders : []).length; i++) {
    setVisible(modulesPageState.sliders[i], visible);
  }
  setVisible(modulesPageState.dodgebotToggleButton, visible);
  setVisible(dragState.handleButton, visible);
}

export function destroySettingsMenu(): void {
  destroyCameraSliders();
  destroyPageNavButtons();
  destroyModulesPage();
  destroyToggles();
  mainMenuState.page = 1;
  try {
    if (isValidPtr(mainMenuState.menu)) {
      removeFromStage(mainMenuState.menu);
    }
  } catch (error) {}
  mainMenuState.menu = null;
  mainMenuState.clip = null;
  mainMenuState.built = false;

  mainMenuState.isOpen = false;
}

export function closeSettingsMenu(): void {
  if (!mainMenuState.isOpen) return;
  mainMenuState.isOpen = false;
  mainMenuState.page = 1;
  try {
    setSettingsMenuVisible(false);
  } catch (error) {}
}

export function getMenuButtonAnchor(): { x: number; y: number } {
  var r: any, t: any, a: any;
  r = natives.getGameStateManager();
  t = isValidPtr(r) ? getGameState(r) : STATE_HOME;
  if (t === STATE_HOME) {
    return { x: 20, y: 520 };
  }
  a = getScreenSize();
  return { x: 24, y: Math.max(80, a.h - 120) };
}

export function destroySettingsButton(): void {
  if (isValidPtr(mainMenuState.button)) {
    try {
      removeFromStage(mainMenuState.button);
    } catch (error) {}
  }
  mainMenuState.button = null;
}
