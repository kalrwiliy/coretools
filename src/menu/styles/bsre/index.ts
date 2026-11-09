import { isDisposing } from "../../../runtime/lifecycle";
import { menuStyleState } from "../selection";
import type { BsreMenu } from "../contracts";
export let bsreMenu: BsreMenu;
import { memoryState, state } from "./state";
import { setActive } from "./widgets";
import { setVisible } from "./menu";
import { waitForLibg, teardown } from "./lifecycle";

export function initializeBsre(): void {
  // Keep the original delayed bootstrap, but retain a click made before it completes.
  let pendingOpen: boolean | null = null;
  memoryState.heapFloor = ptr("0xb00000000000");
  bsreMenu = {
    started: false,
    cancelPendingOpen() {
      pendingOpen = null;
    },

    start: function () {
      if (isDisposing()) return;
      if (bsreMenu.started) return;
      bsreMenu.started = true;
      try {
        waitForLibg(function () {
          if (!isDisposing() && pendingOpen !== null && menuStyleState.current === "bsre1") {
            setVisible(pendingOpen);
          }
          pendingOpen = null;
        });
      } catch (error) {}
    },

    toggle: function () {
      if (isDisposing()) return;
      bsreMenu.start();
      if (!state.initialized) {
        pendingOpen = !(pendingOpen ?? state.visible);
        return;
      }
      try {
        if (!state.active) setActive();
      } catch (error) {}
      try {
        setVisible(!state.visible);
      } catch (error) {}
    },

    open: function () {
      if (isDisposing()) return;
      bsreMenu.start();
      if (!state.initialized) {
        pendingOpen = true;
        return;
      }
      try {
        if (!state.active) setActive();
      } catch (error) {}
      try {
        if (!state.visible) setVisible(true);
      } catch (error) {}
    },

    close: function () {
      pendingOpen = null;
      try {
        if (state.visible) setVisible(false);
      } catch (error) {}
    },

    isOpen: function () {
      return !!state.visible;
    },

    destroy: function () {
      pendingOpen = null;
      try {
        setVisible(false);
      } catch (error) {}
      try {
        teardown();
      } catch (error) {}
    },

    activate: function () {
      if (isDisposing()) return;
      bsreMenu.start();
      try {
        setActive();
      } catch (error) {}
    },
  };
}
