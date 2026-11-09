import { isDisposing, onDispose } from "../../runtime/lifecycle";
import Java from "frida-java-bridge";
import { getMovieClip } from "../../engine/assets";
import { natives } from "../../engine/bindings";
import { setPosition, setScale } from "../../engine/displayObject";
import { isValidPtr } from "../../engine/memory";
import { getTextFieldByName, hideNonTextChildren, setChildText } from "../../engine/movieClip";
import { addChild, addToStage, removeFromStage } from "../../engine/sceneGraph";
import { getScreenSize } from "../../engine/screen";
import { runtimeState } from "../../runtime/controllers";
import { setButtonText } from "../../ui/button";
import { setNodeAction } from "../../ui/nodeActions";
import { dragState } from "./dragState";
import { mainMenuState } from "./state";

let touchOverload: any = null;
let previousTouchImplementation: any = null;
let ownedTouchImplementation: any = null;
onDispose(() => {
  if (touchOverload) {
    try {
      if (touchOverload.implementation === ownedTouchImplementation)
        touchOverload.implementation = previousTouchImplementation;
    } catch (_) {}
    touchOverload = null;
  }
  dragState.javaHookInstalled = false;
  dragState.dragging = false;
});

export function installJavaTouchHook(): void {
  if (isDisposing()) return;
  if (dragState.javaHookInstalled) return;
  try {
    Java.perform(function () {
      if (isDisposing()) return;
      const ActivityThread = Java.use("android.app.ActivityThread");
      const context = ActivityThread.currentApplication().getApplicationContext();
      const metrics = context.getResources().getDisplayMetrics();
      dragState.screenWidth = metrics.widthPixels.value;

      dragState.screenHeight = metrics.heightPixels.value;
      const screen = getScreenSize();
      dragState.touchScaleX =
        screen.w > 1 && dragState.screenWidth > 1 ? screen.w / dragState.screenWidth : 1;
      dragState.touchScaleY =
        screen.h > 1 && dragState.screenHeight > 1 ? screen.h / dragState.screenHeight : 1;
      const Activity = Java.use("android.app.Activity");
      touchOverload = Activity.dispatchTouchEvent.overload("android.view.MotionEvent");
      const installedOverload = touchOverload;
      previousTouchImplementation = touchOverload.implementation;
      ownedTouchImplementation = function (this: any, event: any) {
        if (isDisposing()) return installedOverload.call(this, event);
        try {
          const action = event.getActionMasked();
          const touchX = event.getX();
          const touchY = event.getY();
          dragState.lastTouchX = touchX;
          dragState.lastTouchY = touchY;
          if (dragState.touchEventCount < 5) {
            let eventCount = dragState.touchEventCount;
            ++eventCount;
            dragState.touchEventCount = eventCount;
          }
          if (dragState.dragging) {
            if (action === 2 && isValidPtr(mainMenuState.clip)) {
              mainMenuState.clip
                .add(32)
                .writeFloat(
                  dragState.dragStartMenuX +
                    (touchX - dragState.dragStartTouchX) * dragState.touchScaleX,
                );
              mainMenuState.clip
                .add(36)
                .writeFloat(
                  dragState.dragStartMenuY +
                    (touchY - dragState.dragStartTouchY) * dragState.touchScaleY,
                );
            } else if (action === 1 || action === 3) {
              dragState.dragging = false;
            }
          }
        } catch (error) {}
        return installedOverload.call(this, event);
      };
      touchOverload.implementation = ownedTouchImplementation;
      dragState.javaHookInstalled = true;
    });
  } catch (error) {}
}

export function createDragHandle(container: any): void {
  if (!isValidPtr(container)) return;
  if (isValidPtr(dragState.handleButton)) {
    try {
      removeFromStage(dragState.handleButton);
    } catch (error) {}
  }
  dragState.handleButton = null;
  let handleX = 0;
  let handleY = -150;
  let titleFontSize = 0;
  const titleField = getTextFieldByName(container, "title");
  if (isValidPtr(titleField)) {
    try {
      handleX = titleField.add(32).readFloat();

      handleY = titleField.add(36).readFloat();
    } catch (error) {}
    try {
      titleFontSize = titleField.add(176).readS16();
    } catch (error) {}
  }
  handleX += 145;
  try {
    setChildText(container, "title", "");
  } catch (error) {}
  const handleClip = getMovieClip("sc/ui.sc", "map_editor_big_exit_button");
  if (!isValidPtr(handleClip)) return;
  natives.gotoAndStopFrame(handleClip, 1);
  const handleButton = natives.malloc(640);
  natives.buttonCtor(handleButton);
  natives.buttonSetMovieClip(handleButton, handleClip, 1);
  setButtonText(handleButton, "Text", "");
  setButtonText(handleButton, "txt", "");
  let textField = getTextFieldByName(handleClip, "Text");
  if (!isValidPtr(textField)) textField = getTextFieldByName(handleClip, "txt");
  if (isValidPtr(textField)) {
    try {
      textField.add(176).writeS16(64);
    } catch (error) {}
  }
  try {
    handleButton.add(78).writeU8(1);
  } catch (error) {}
  hideNonTextChildren(handleClip);
  setScale(handleButton, 1.95 / runtimeState.menuScaleX, 1.95 / runtimeState.menuScaleY);
  setPosition(handleButton, handleX, handleY);
  if (!addChild(container, handleButton)) addToStage(handleButton);
  dragState.handleButton = handleButton;
  setNodeAction(handleButton, {
    kind: "draghdl",
  });
}
