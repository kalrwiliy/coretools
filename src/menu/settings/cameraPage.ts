import { cancelInterval, scheduleInterval } from "../../runtime/lifecycle";
import { natives } from "../../engine/bindings";
import { setPosition, setScale, setScaleY, setVisible } from "../../engine/displayObject";
import { isValidPtr, newScString } from "../../engine/memory";
import { setChildScaleY } from "../../engine/movieClip";
import { addChild, addToStage, removeFromStage } from "../../engine/sceneGraph";
import { installCameraHook } from "../../features/camera/offsetHook";
import { cameraOffsetState } from "../../features/camera/offsetState";
import { SLIDER_RANGE, SLIDER_VALUE_SCALE } from "../../runtime/constants";
import { runtimeState } from "../../runtime/controllers";
import { createSlider, setSliderRange, setSliderValue, updateSlider } from "../../ui/slider";
import { setLabelText } from "../../ui/textLabel";
import { xyzSliderGroup, type CameraOffsetKey } from "./cameraState";
import { mainMenuState } from "./state";

export function createCameraSliders(container: any): void {
  if (!isValidPtr(container)) return;
  installCameraHook();
  xyzSliderGroup.items = [];

  const defs: { axisLabel: string; offsetKey: CameraOffsetKey }[] = [
    {
      axisLabel: "X",
      offsetKey: "offsetX",
    },
    {
      axisLabel: "Y",
      offsetKey: "offsetY",
    },
    {
      axisLabel: "Z",
      offsetKey: "offsetZ",
    },
  ];
  const baseY = 180;
  const stepY = 70;
  const posX = -175;
  const labelX = -45;
  const labelOffsetY = -15;
  const scaleY = 1 / runtimeState.menuScaleY;
  const labelScale = runtimeState.menuScaleX / runtimeState.menuScaleY / 1.1;
  for (let axisIndex = 0; axisIndex < defs.length; axisIndex++) {
    const def = defs[axisIndex];
    const slider = createSlider();
    if (!isValidPtr(slider)) continue;
    setSliderRange(slider, -SLIDER_RANGE, SLIDER_RANGE);
    setSliderValue(slider, 0);
    setScale(slider, 1 / 1.1, scaleY);
    setPosition(slider, posX, baseY + axisIndex * stepY);
    if (!addChild(container, slider)) {
      addToStage(slider);
    }
    const lbl = ptr(0);
    const lblText = ptr(0);
    xyzSliderGroup.items.push({
      slider: slider,
      offsetKey: def.offsetKey,
      label: lbl,
      labelClip: lbl,
      textField: lblText,
      axisLabel: def.axisLabel,
      lastValue: null,
      labelScaleY: labelScale,
    });
  }
  if (xyzSliderGroup.interval) {
    cancelInterval(xyzSliderGroup.interval);
  }
  xyzSliderGroup.interval = scheduleInterval(function () {
    if (!mainMenuState.isOpen) return;
    for (let sliderIndex = 0; sliderIndex < xyzSliderGroup.items.length; sliderIndex++) {
      const item = xyzSliderGroup.items[sliderIndex];
      if (!isValidPtr(item.slider)) continue;
      const value = updateSlider(item.slider, 0.016);
      cameraOffsetState[item.offsetKey] = value * SLIDER_VALUE_SCALE;
      if (item.lastValue !== value) {
        item.lastValue = value;
        const labelText = item.axisLabel + ": " + (value | 0);
        if (isValidPtr(item.textField)) {
          try {
            natives.setText(item.textField, newScString(labelText));
          } catch (error) {}
          setScaleY(item.textField, item.labelScaleY);
        } else if (isValidPtr(item.labelClip)) {
          setLabelText(item.labelClip, labelText);
          setChildScaleY(item.labelClip, "Text", item.labelScaleY);
          setChildScaleY(item.labelClip, "text", item.labelScaleY);
        }
      }
    }
    return;
  }, 16);
  return;
}

export function destroyCameraSliders(): void {
  if (xyzSliderGroup.interval) {
    cancelInterval(xyzSliderGroup.interval);
    xyzSliderGroup.interval = null;
  }
  for (let sliderIndex = 0; sliderIndex < xyzSliderGroup.items.length; sliderIndex++) {
    const item = xyzSliderGroup.items[sliderIndex];
    if (isValidPtr(item.slider)) {
      removeFromStage(item.slider);
    }
    if (isValidPtr(item.label)) {
      removeFromStage(item.label);
    }
  }
  xyzSliderGroup.items = [];
  return;
}

export function setCameraSlidersHidden(hidden: any): void {
  for (let sliderIndex = 0; sliderIndex < xyzSliderGroup.items.length; sliderIndex++) {
    const item = xyzSliderGroup.items[sliderIndex];
    if (isValidPtr(item.slider)) setVisible(item.slider, !hidden);
    if (isValidPtr(item.label)) setVisible(item.label, !hidden);
  }
}
