import { getMovieClip } from "../engine/assets";
import { natives } from "../engine/bindings";
import { setPosition, setScale } from "../engine/displayObject";
import { isValidPtr } from "../engine/memory";
import { getTextFieldByName, hideNonTextChildren, setChildColor } from "../engine/movieClip";
import { addToStage, removeFromStage } from "../engine/sceneGraph";
import { mainMenuState } from "../menu/settings/state";
import { COLOR_WHITE, DEFAULT_FONT_SIZE, PING_COLOR_DEFAULT } from "../runtime/constants";
import { setButtonText } from "../ui/button";

export function createPingButton(): void {
  if (isValidPtr(mainMenuState.pingButton)) {
    try {
      removeFromStage(mainMenuState.pingButton);
    } catch (error) {}
  }
  mainMenuState.pingButton = null;
  mainMenuState.pingClip = null;
  try {
    const clip = getMovieClip("sc/ui.sc", "map_editor_big_exit_button");
    if (!isValidPtr(clip)) return undefined;
    natives.gotoAndStopFrame(clip, 1);
    mainMenuState.pingButton = natives.malloc(640);
    natives.buttonCtor(mainMenuState.pingButton);
    natives.buttonSetMovieClip(mainMenuState.pingButton, clip, 1);
    setButtonText(mainMenuState.pingButton, "Text", "ping: --");
    setButtonText(mainMenuState.pingButton, "txt", "ping: --");
    try {
      mainMenuState.pingButton.add(78).writeU8(1);
    } catch (error) {}
    hideNonTextChildren(clip);
    setScale(mainMenuState.pingButton, 1, 1);
    setPosition(mainMenuState.pingButton, 75, 25);
    mainMenuState.pingClip = clip;
    setChildColor(clip, "Text", PING_COLOR_DEFAULT);
    setChildColor(clip, "txt", PING_COLOR_DEFAULT);
    if (!addToStage(mainMenuState.pingButton)) {
      mainMenuState.pingButton = null;
      mainMenuState.pingClip = null;
      return;
    }
    try {
      mainMenuState.pingButton.add(72).writeU8(mainMenuState.pingVisible ? 1 : 0);
    } catch (error) {}
    return;
  } catch (error) {
    return;
  }
}

export function createCreditsButton(): void {
  if (isValidPtr(mainMenuState.creditsButton)) {
    try {
      removeFromStage(mainMenuState.creditsButton);
    } catch (error) {}
  }
  mainMenuState.creditsButton = null;
  try {
    const clip = getMovieClip("sc/ui.sc", "map_editor_big_exit_button");
    if (!isValidPtr(clip)) return undefined;
    natives.gotoAndStopFrame(clip, 1);
    mainMenuState.creditsButton = natives.malloc(640);
    natives.buttonCtor(mainMenuState.creditsButton);
    natives.buttonSetMovieClip(mainMenuState.creditsButton, clip, 1);
    setButtonText(mainMenuState.creditsButton, "Text", "by m2l0_ <3");
    setButtonText(mainMenuState.creditsButton, "txt", "by m2l0_ <3");
    try {
      mainMenuState.creditsButton.add(78).writeU8(1);
    } catch (error) {}
    hideNonTextChildren(clip);
    setScale(mainMenuState.creditsButton, 1, 1);
    setPosition(mainMenuState.creditsButton, 200, 25);
    setChildColor(clip, "Text", 4294928042);
    setChildColor(clip, "txt", 4294928042);
    if (!addToStage(mainMenuState.creditsButton)) {
      mainMenuState.creditsButton = null;
    }
    return;
  } catch (error) {
    return;
  }
}

export function createTelegramButton(): void {
  if (isValidPtr(mainMenuState.telegramButton)) {
    try {
      removeFromStage(mainMenuState.telegramButton);
    } catch (error) {}
  }
  mainMenuState.telegramButton = null;
  mainMenuState.telegramClip = null;
  try {
    const clip = getMovieClip("sc/ui.sc", "map_editor_big_exit_button");
    if (!isValidPtr(clip)) return undefined;
    natives.gotoAndStopFrame(clip, 1);
    mainMenuState.telegramButton = natives.malloc(640);
    natives.buttonCtor(mainMenuState.telegramButton);
    natives.buttonSetMovieClip(mainMenuState.telegramButton, clip, 1);
    setButtonText(mainMenuState.telegramButton, "Text", "t.me/coretoolsv1");
    setButtonText(mainMenuState.telegramButton, "txt", "t.me/coretoolsv1");
    try {
      mainMenuState.telegramButton.add(78).writeU8(1);
    } catch (error) {}
    hideNonTextChildren(clip);
    let textField: any = getTextFieldByName(clip, "Text");
    if (!isValidPtr(textField)) {
      textField = getTextFieldByName(clip, "txt");
    }
    let fontSize: any = 0;
    if (isValidPtr(textField)) {
      try {
        fontSize = textField.add(176).readS16();
      } catch (error) {}
      if (!(fontSize > 0)) {
        fontSize = DEFAULT_FONT_SIZE;
      }
      try {
        textField.add(176).writeS16(fontSize);
      } catch (error) {}
    }
    setScale(mainMenuState.telegramButton, 1.35, 1.35);
    setPosition(mainMenuState.telegramButton, 590, 20);
    mainMenuState.telegramClip = clip;
    setChildColor(clip, "Text", COLOR_WHITE);
    setChildColor(clip, "txt", COLOR_WHITE);
    if (!addToStage(mainMenuState.telegramButton)) {
      mainMenuState.telegramButton = null;
      mainMenuState.telegramClip = null;
    }
    return;
  } catch (error) {
    return;
  }
}

export function afterUnhideStub(): void {}
