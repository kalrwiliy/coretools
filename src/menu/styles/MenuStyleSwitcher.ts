import { closeSettingsMenu } from "../settings/lifecycle";
import { mainMenuState } from "../settings/state";
import { bsreMenu } from "./bsre/index";
import { menuStyleState } from "./selection";
import { switchgearMenu } from "./switchgear/index";

export let selectMenuStyle: (style: unknown) => boolean;

export function init(): void {
  menuStyleState.current = "coretools";

  selectMenuStyle = function (r: unknown): boolean {
    if (r !== "coretools" && r !== "switchgear" && r !== "bsre1") {
      return false;
    }
    if (r === menuStyleState.current) {
      return false;
    }
    try {
      if (mainMenuState.isOpen) {
        closeSettingsMenu();
      }
    } catch (error) {}
    try {
      if (switchgearMenu && switchgearMenu.isOpen()) {
        switchgearMenu.close();
      }
    } catch (error) {}
    if (r !== "switchgear") {
      try {
        switchgearMenu.reset();
      } catch (error) {}
    }
    try {
      if (bsreMenu && bsreMenu.isOpen()) {
        bsreMenu.close();
      }
    } catch (error) {}
    if (r !== "bsre1") {
      try {
        bsreMenu.destroy();
      } catch (error) {}
    }
    menuStyleState.current = r;
    if (r === "bsre1") {
      try {
        bsreMenu.activate();
      } catch (error) {}
    }
    return true;
  };
}
