import { createMovieClipStr } from "../../engine/assets";
import { natives } from "../../engine/bindings";
import { setPosition, setScale } from "../../engine/displayObject";
import { cstr, isValidPtr, ptrKey } from "../../engine/memory";
import { getMovieClipByName } from "../../engine/movieClip";
import { addChild, addToStage, removeFromStage } from "../../engine/sceneGraph";
import { runtimeState } from "../../runtime/controllers";
import { coreState } from "../../runtime/coreState";
import { setButtonText } from "../../ui/button";
import { setNodeAction } from "../../ui/nodeActions";
import { applyTextStyleRecursive } from "../../ui/textLabel";
import { cameraNavButtons } from "./navigationState";

export function createProfileStyleButton(text: any): any {
  let profileClip: any = ptr(0);
  try {
    profileClip = natives.getMovieClip(cstr("sc/ui.sc"), cstr("popup_player_profile"), 0);
  } catch (error) {}
  if (!isValidPtr(profileClip))
    profileClip = createMovieClipStr("sc/ui.sc", "popup_player_profile");
  if (!isValidPtr(profileClip)) return ptr(0);
  try {
    natives.gotoAndStopFrame(profileClip, 1);
  } catch (error) {}
  const skinsClip = getMovieClipByName(profileClip, "skins_button");
  if (!isValidPtr(skinsClip)) return ptr(0);
  const editIcon = getMovieClipByName(skinsClip, "edit_pic_icon");
  if (isValidPtr(editIcon)) {
    try {
      editIcon.add(8).writeU8(0);
    } catch (error) {}
  }
  try {
    natives.gotoAndStopFrame(skinsClip, 1);
  } catch (error) {}
  const button = natives.malloc(640);
  natives.buttonCtor(button);
  try {
    natives.buttonSetMovieClip(button, skinsClip, 1);
  } catch (error) {
    return ptr(0);
  }
  applyTextStyleRecursive(
    skinsClip,
    text,
    16,
    runtimeState.menuScaleX / runtimeState.menuScaleY,
    -30,
  );
  setButtonText(button, "Text", text);
  setButtonText(button, "txt", text);
  try {
    button.add(78).writeU8(1);
  } catch (error) {}
  return button;
}

export function createPageNavButtons(container: any): void {
  if (cameraNavButtons.built) return;
  cameraNavButtons.items = [];

  cameraNavButtons.built = true;
  const labels = ["next page", "last page"];
  const buttonX = -150;
  const positions = [
    { x: buttonX, y: 30 },
    { x: buttonX, y: 110 },
  ];
  for (let buttonIndex = 0; buttonIndex < labels.length; buttonIndex++) {
    const button = createProfileStyleButton(labels[buttonIndex]);
    if (!isValidPtr(button)) continue;
    setScale(button, 1, 1);
    setPosition(button, positions[buttonIndex].x, positions[buttonIndex].y);
    if (!addChild(container, button)) addToStage(button);
    setNodeAction(button, {
      kind: "camnav",
      label: labels[buttonIndex],
    });
    cameraNavButtons.items.push(button);
  }
}

export function destroyPageNavButtons(): void {
  for (let buttonIndex = 0; buttonIndex < cameraNavButtons.items.length; buttonIndex++) {
    const button = cameraNavButtons.items[buttonIndex];
    try {
      if (isValidPtr(button)) coreState.actionsByPtr[ptrKey(button)] = null;
    } catch (error) {}
    if (isValidPtr(button)) removeFromStage(button);
  }
  cameraNavButtons.items = [];
  cameraNavButtons.built = false;
}
