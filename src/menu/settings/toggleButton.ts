import { cancelInterval } from "../../runtime/lifecycle";
import { natives } from "../../engine/bindings";
import { setScale, setVisible } from "../../engine/displayObject";
import { isValidPtr, ptrKey } from "../../engine/memory";
import { getMovieClipByName } from "../../engine/movieClip";
import { getContainerClip, removeFromStage } from "../../engine/sceneGraph";
import { runtimeState } from "../../runtime/controllers";
import { coreState } from "../../runtime/coreState";
import { resetMenuOffsetY } from "./menu";
import { mainMenuState } from "./state";
import { toggleGroup, toggleStates } from "./toggleState";

export function cloneToggleButton(sourceClip: any): any {
  if (!isValidPtr(sourceClip)) return null;
  const buttonClip = getMovieClipByName(sourceClip, "locked_movement_controls_button");
  if (!isValidPtr(buttonClip)) return null;
  const stateClip = getMovieClipByName(buttonClip, "state");
  if (!isValidPtr(stateClip)) return null;
  const button = natives.malloc(700);
  natives.buttonCtor(button);
  try {
    natives.buttonSetMovieClip(button, buttonClip, 1);
  } catch (error) {
    return null;
  }
  setScale(button, 1 / runtimeState.menuScaleX, 1 / runtimeState.menuScaleY);
  try {
    natives.gotoAndStopFrame(buttonClip, 1);
  } catch (error) {}
  try {
    natives.gotoAndStopFrame(stateClip, 0);
  } catch (error) {}
  setScale(buttonClip, 1, 1);
  return { button: button, clip: buttonClip, stateClip: stateClip };
}

export function flipToggle(toggle: any): void {
  if (!toggle || !isValidPtr(toggle.button)) return;
  toggle.enabled = !toggle.enabled;
  if (toggle.id !== undefined) toggleStates[toggle.id] = toggle.enabled;
  if (isValidPtr(toggle.stateClip)) {
    try {
      natives.gotoAndStopFrame(toggle.stateClip, toggle.enabled ? 0 : 1);
    } catch (error) {}
    return;
  }
  return;
}

export function destroyToggles(): void {
  if (toggleGroup.rearmInterval) {
    cancelInterval(toggleGroup.rearmInterval);
    toggleGroup.rearmInterval = null;
  }
  if (toggleGroup.probeInterval) {
    cancelInterval(toggleGroup.probeInterval);
    toggleGroup.probeInterval = null;
  }
  for (let toggleIndex = 0; toggleIndex < toggleGroup.items.length; toggleIndex++) {
    const toggle = toggleGroup.items[toggleIndex];
    try {
      if (isValidPtr(toggle.button)) coreState.actionsByPtr[ptrKey(toggle.button)] = null;
    } catch (error) {}
    if (isValidPtr(toggle.button)) removeFromStage(toggle.button);
    if (isValidPtr(toggle.label)) removeFromStage(toggle.label);
  }
  toggleGroup.items = [];
  toggleGroup.built = false;
}

export function setTogglesVisible(visible: any): void {
  if (visible) {
    const container = getContainerClip(mainMenuState.menu);
    resetMenuOffsetY(container);
    for (let toggleIndex = 0; toggleIndex < toggleGroup.items.length; toggleIndex++) {
      if (isValidPtr(toggleGroup.items[toggleIndex].button))
        setVisible(toggleGroup.items[toggleIndex].button, true);
      if (isValidPtr(toggleGroup.items[toggleIndex].label))
        setVisible(toggleGroup.items[toggleIndex].label, true);
    }
    return;
  }
  for (let toggleIndex = 0; toggleIndex < toggleGroup.items.length; toggleIndex++) {
    if (isValidPtr(toggleGroup.items[toggleIndex].button))
      setVisible(toggleGroup.items[toggleIndex].button, false);
    if (isValidPtr(toggleGroup.items[toggleIndex].label))
      setVisible(toggleGroup.items[toggleIndex].label, false);
  }
}
