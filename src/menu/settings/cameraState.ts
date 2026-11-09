import type { CameraOffsetKey } from "../../features/camera/offsetState";
export type { CameraOffsetKey } from "../../features/camera/offsetState";

export interface CameraSlider {
  slider: NativePointer;
  offsetKey: CameraOffsetKey;
  label: NativePointer;
  labelClip: NativePointer;
  textField: NativePointer;
  axisLabel: string;
  lastValue: number | null;
  labelScaleY: number;
}

export interface XyzSliderGroupState {
  interval: ReturnType<typeof setInterval> | null;
  items: CameraSlider[];
}

export const xyzSliderGroup: XyzSliderGroupState = { interval: null, items: [] };
