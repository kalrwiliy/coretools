import type { SwitchgearMenu } from "../contracts";
export let switchgearMenu: SwitchgearMenu;

import { state } from "./state";
import { setVisible, flip, installTouchHook } from "./menu";

export function initializeSwitchgear(): void {
  switchgearMenu = {
    toggle: function () {
      installTouchHook();
      flip();
    },

    open: function () {
      installTouchHook();
      if (!!state.open) {
        return;
      }
      flip();
    },

    close: function () {
      if (state.open) {
        flip();
      }
    },

    isOpen: function () {
      return !!state.open;
    },

    reset: function () {
      try {
        if (state.open) {
          state.open = false;
          setVisible(false);
        }
      } catch (error) {}
      state.clip = null;
      state.wrapper = null;
      state.container = null;
      state.cameraButton = null;
      state.resetButton = null;
      state.gamemodeButton = null;
      state.sliders = [];
      state.toggles = [];
      return;
    },
  };
}
