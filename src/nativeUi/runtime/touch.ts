import { attachHook } from "../../runtime/lifecycle";
import { isValidPtr } from "../../engine/memory";
import { dragState } from "../../menu/settings/dragState";
import { mainMenuState } from "../../menu/settings/state";
import { TOUCH_HANDLER_OFFSET, nativeUiRuntime } from "./state";

export function installTouchDragHook(): void {
  if (dragState.hooked || !nativeUiRuntime.state.libgBase) return;
  dragState.ptrId = -1;
  dragState.lastPtr = -1;
  dragState.touchEventCount = 0;
  try {
    dragState.touchHookListener = attachHook(
      nativeUiRuntime.state.libgBase.add(TOUCH_HANDLER_OFFSET),
      {
        onEnter: function (args) {
          try {
            const kind = args[2].toInt32();
            const x = args[3].toInt32();
            const y = args[4].toInt32();
            const ptr = args[5].toInt32();
            dragState.lastTouchX = x;
            dragState.lastTouchY = y;
            if (kind === 0 || kind === 5) dragState.lastPtr = ptr;
            if (dragState.touchEventCount < 5) ++dragState.touchEventCount;
            if (!dragState.dragging || ptr !== dragState.ptrId) return undefined;
            if (kind === 2 && isValidPtr(mainMenuState.clip)) {
              const newX = dragState.dragStartMenuX + (x - dragState.dragStartTouchX);
              const newY = dragState.dragStartMenuY + (y - dragState.dragStartTouchY);
              mainMenuState.clip.add(32).writeFloat(newX);
              mainMenuState.clip.add(36).writeFloat(newY);
              mainMenuState.savedX = newX;
              mainMenuState.savedY = newY;
            } else if (kind === 1 || kind === 3) {
              dragState.dragging = false;
              dragState.ptrId = -1;
            }
            return;
          } catch (error) {
            return;
          }
        },
      },
    );
    dragState.hooked = true;
  } catch (error) {}
}
