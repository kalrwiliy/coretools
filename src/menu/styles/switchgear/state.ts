import type { StyleSlider, StyleToggle } from "../records";
export interface SwitchgearState {
  open: boolean;
  clip: NativePointer | null;
  wrapper: NativePointer | null;
  container: NativePointer | null;
  sliders: StyleSlider[];
  toggles: StyleToggle[];
  cameraButton: NativePointer | null;
  resetButton: NativePointer | null;
  gamemodeButton: NativePointer | null;
  touchHook: InvocationListener | null;
  sliderTimer: ReturnType<typeof setInterval> | null;
  stringPool: NativePointer[];
  stringPoolIndex: number;
  lastResetTap: number;
  lastGamemodeTap: number;
  lastCameraTap: number;
  natOk?: boolean;
}

export const state: SwitchgearState = {
  open: false,
  clip: null,
  wrapper: null,
  container: null,
  sliders: [],
  toggles: [],
  cameraButton: null,
  resetButton: null,
  gamemodeButton: null,
  touchHook: null,
  sliderTimer: null,
  stringPool: [],
  stringPoolIndex: 0,
  lastResetTap: 0,
  lastGamemodeTap: 0,
  lastCameraTap: 0,
};

export const MENU_SCALE_X = 1.32;

export const MENU_SCALE_Y = 0.57;

export const MENU_OFFSET_X = 35;

export const MENU_OFFSET_Y = 0;

export const ROW_OFFSET_Y = 15;
