import { scheduleInterval, cancelInterval } from "../../runtime/lifecycle";
import { createMovieClipStr, getMovieClip, loadDebugSc } from "../../engine/assets";
import { natives } from "../../engine/bindings";
import { getHeight, getWidth, setPosition, setScale, setVisible } from "../../engine/displayObject";
import { cstr, isLiveObject, isValidPtr } from "../../engine/memory";
import {
  getTextFieldByName,
  setChildColor,
  setChildScaleY,
  setChildText,
} from "../../engine/movieClip";
import { addChild, addToStage, getContainerClip } from "../../engine/sceneGraph";
import { getScreenSize, getStageRoot } from "../../engine/screen";
import { cameraOffsetState } from "../../features/camera/offsetState";
import { runtimeState } from "../../runtime/controllers";
import { setButtonText } from "../../ui/button";
import { setNodeAction } from "../../ui/nodeActions";
import { createCameraSliders, setCameraSlidersHidden } from "./cameraPage";
import { createDragHandle } from "./dragHandle";
import { destroySettingsMenu, setSettingsMenuVisible } from "./lifecycle";
import { buildModulesPage } from "./modulesPage";
import { modulesPageState } from "./modulesState";
import { mainMenuState } from "./state";
import { setTogglesVisible } from "./toggleButton";

export function createMenuButtons(container: any): void {
  mainMenuState.menuButtons = [];
  if (!isValidPtr(container)) return;
  const columnX = -65;
  const centerY = 350;
  const spacing = 30;
  const buttons: any[] = [];
  for (let buttonIndex = 0; buttonIndex < 2; buttonIndex++) {
    const clip = getMovieClip("sc/ui.sc", "map_editor_big_exit_button");
    if (!isValidPtr(clip)) continue;
    try {
      natives.gotoAndStopFrame(clip, 1);
      const button = natives.malloc(640);
      natives.buttonCtor(button);
      natives.buttonSetMovieClip(button, clip, 1);
      const lbl = "";
      setButtonText(button, "Text", lbl);
      setButtonText(button, "txt", lbl);
      try {
        button.add(78).writeU8(1);
      } catch (error) {}
      setScale(button, 1 / runtimeState.menuScaleX, 1 / runtimeState.menuScaleY);
      setPosition(button, 0, 0);
      if (!addChild(container, button)) addToStage(button);
      buttons.push(button);
    } catch (error) {}
  }
  let buttonHeight = buttons.length ? getHeight(buttons[0]) : 0;
  if (!(buttonHeight > 1)) buttonHeight = 70;
  const rowHeight = buttonHeight + spacing;
  for (let buttonIndex = 0; buttonIndex < buttons.length; buttonIndex++) {
    const offsetY = (buttonIndex - (buttons.length - 1) / 2) * rowHeight;
    setPosition(buttons[buttonIndex], columnX, centerY + offsetY);
    mainMenuState.menuButtons.push(buttons[buttonIndex]);
  }
  if (isValidPtr(mainMenuState.menuButtons[0])) {
    setNodeAction(mainMenuState.menuButtons[0], {
      kind: "fpstoggle",
    });
  }
  if (isValidPtr(mainMenuState.menuButtons[1])) {
    setNodeAction(mainMenuState.menuButtons[1], { kind: "quit" });
  }
}

export function resetMenuOffsetY(offsetY: any): void {
  let baseY: any;
  runtimeState.togglesBaseY = baseY = 60 - 30 - 32 - 25 - 18 + 20 + 40 + 40 + 20 + 20 + 15 + 5 - 20;
}

export function setMenuButtonsVisible(visible: any): void {
  if (!mainMenuState.menuButtons) return;
  for (let buttonIndex = 0; buttonIndex < mainMenuState.menuButtons.length; buttonIndex++) {
    if (isValidPtr(mainMenuState.menuButtons[buttonIndex]))
      setVisible(mainMenuState.menuButtons[buttonIndex], visible);
  }
}

export function showPage(page: any): void {
  mainMenuState.page = page;
  setCameraSlidersHidden(page !== 2);
  setTogglesVisible(page === 1);
  setMenuButtonsVisible(page === 1);
  for (
    let buttonIndex = 0;
    buttonIndex < (modulesPageState.bigButtons || []).length;
    buttonIndex++
  ) {
    setVisible(modulesPageState.bigButtons[buttonIndex], page === 1);
  }
  for (let sliderIndex = 0; sliderIndex < (modulesPageState.sliders || []).length; sliderIndex++) {
    setVisible(modulesPageState.sliders[sliderIndex], page === 1);
  }
  for (
    let labelIndex = 0;
    labelIndex < (modulesPageState.sliderLabels || []).length;
    labelIndex++
  ) {
    setVisible(modulesPageState.sliderLabels[labelIndex], page === 1);
  }
  setVisible(modulesPageState.dodgebotLabel, page === 1);
  setVisible(modulesPageState.killauraLabel, page === 1);
  setVisible(modulesPageState.modulesLabel, page === 1);
  setVisible(modulesPageState.editButton, true);
  if (page !== 2) {
    cameraOffsetState.offsetX = 0;
    cameraOffsetState.offsetY = 0;

    cameraOffsetState.offsetZ = 0;
  }
}

export function openMenu(): void {
  if (mainMenuState.isOpen) return;
  if (
    mainMenuState.built &&
    isValidPtr(mainMenuState.menu) &&
    getStageRoot().equals(mainMenuState.stageBuilt)
  ) {
    try {
      setSettingsMenuVisible(true);
    } catch (error) {}
    mainMenuState.isOpen = true;
    try {
      showPage(1);
    } catch (error) {}
    if (
      mainMenuState.savedX != null &&
      mainMenuState.savedY != null &&
      isValidPtr(mainMenuState.clip)
    ) {
      try {
        mainMenuState.clip.add(32).writeFloat(mainMenuState.savedX);
        mainMenuState.clip.add(36).writeFloat(mainMenuState.savedY);
      } catch (error) {}
      return;
    }
    return;
  }
  if (isValidPtr(mainMenuState.menu)) destroySettingsMenu();
  const stage = getStageRoot();
  if (!isLiveObject(stage)) return;
  loadDebugSc();
  let menuClip: any = ptr(0);
  try {
    menuClip = natives.getMovieClip(cstr("sc/debug.sc"), cstr("debug_menu"), 0);
  } catch (error) {}
  if (!isValidPtr(menuClip)) menuClip = createMovieClipStr("sc/debug.sc", "debug_menu");
  if (!isValidPtr(menuClip)) {
    let attempts = 0;
    const retryTimer: any = scheduleInterval(function () {
      loadDebugSc();
      let candidateClip: any = ptr(0);
      try {
        candidateClip = natives.getMovieClip(cstr("sc/debug.sc"), cstr("debug_menu"), 0);
      } catch (error) {}
      if (!isValidPtr(candidateClip))
        candidateClip = createMovieClipStr("sc/debug.sc", "debug_menu");
      if (isValidPtr(candidateClip) || ++attempts > 6) {
        cancelInterval(retryTimer);
        if (isValidPtr(candidateClip)) buildMenu(candidateClip);
      }
    }, 150);
    return;
  }
  buildMenu(menuClip);
}

export function buildMenu(clip: any): void {
  try {
    natives.gotoAndStopFrame(clip, 1);
    const hiddenChildren = ["debug_menu_input_button", "close_button", "clear_button"];
    for (let childIndex = 0; childIndex < hiddenChildren.length; childIndex++) {
      try {
        const child = natives.getChildByName(clip, cstr(hiddenChildren[childIndex]));
        if (isValidPtr(child)) {
          try {
            child.add(8).writeU8(0);
          } catch (error) {}
          try {
            child.add(32).writeFloat(-99999);
          } catch (error) {}
        }
      } catch (error) {}
    }
    mainMenuState.menu = natives.malloc(544);
    for (let byteOffset = 0; byteOffset < 544; byteOffset += 8) {
      try {
        mainMenuState.menu.add(byteOffset).writeU64(0);
      } catch (error) {}
    }
    natives.menuWrapperCtor(mainMenuState.menu, clip);
    mainMenuState.clip = clip;
    if (!isValidPtr(getContainerClip(mainMenuState.menu))) {
      mainMenuState.menu = null;
      return undefined;
    }
    runtimeState.menuScaleX = 1.32;
    runtimeState.menuScaleY = 0.57;
    try {
      let width = getWidth(clip);
      if (!(width > 1)) width = 700;
      let height = getHeight(clip);
      if (!(height > 1)) height = 400;
      runtimeState.menuScaleX = (1.32 + (70 + 80) / width) * 0.837 * 1.1;
      runtimeState.menuScaleY = (0.57 - 20 / height) * 0.837 * 1.1;
    } catch (error) {}
    const screen = getScreenSize();
    const posX = Math.floor(screen.w * 0.3) + 25 + 35 + 10 - 20 + 20 - 15 - 15 + 40 + 80 + 60 + 120;
    const posY = 55 + 35 + 10 - 5 - 5 + 20 + 10 - 30 - 35 + 25;
    try {
      clip.add(16).writeFloat(runtimeState.menuScaleX);
      clip.add(28).writeFloat(runtimeState.menuScaleY);
      clip.add(32).writeFloat(posX);
      clip.add(36).writeFloat(posY);
    } catch (error) {}
    if (mainMenuState.savedX != null && mainMenuState.savedY != null) {
      try {
        clip.add(32).writeFloat(mainMenuState.savedX);
        clip.add(36).writeFloat(mainMenuState.savedY);
      } catch (error) {}
    }
    try {
      clip.add(9).writeU8(255);
      clip.add(10).writeU8(255);
      clip.add(11).writeU8(255);
    } catch (error) {}

    if (!addToStage(mainMenuState.menu)) {
      mainMenuState.menu = null;
      return undefined;
    }
    const container = getContainerClip(mainMenuState.menu);
    setChildText(container, "title", "");
    setChildScaleY(container, "title", runtimeState.menuScaleX / runtimeState.menuScaleY / 1.1);
    setChildColor(container, "title", 4294967295);
    (function () {
      const titleField = getTextFieldByName(container, "title");
      if (isValidPtr(titleField)) {
        try {
          titleField.add(36).writeFloat(titleField.add(36).readFloat() + 12);
        } catch (error) {}
        return;
      }
      return;
    })();
    setChildText(container, "version", "");
    setButtonText(mainMenuState.menu, "title", "");
    setButtonText(mainMenuState.menu, "version", "");
    mainMenuState.isOpen = true;
    mainMenuState.built = true;
    mainMenuState.stageBuilt = getStageRoot();
    mainMenuState.page = 1;
    createCameraSliders(container);
    setCameraSlidersHidden(true);
    setTogglesVisible(true);
    buildModulesPage(container);
    createDragHandle(container);
    return;
  } catch (error) {
    mainMenuState.menu = null;
    return;
  }
}
