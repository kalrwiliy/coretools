/** Native nodes owned by a menu-style instance. */
export interface StyleSlider {
  slider: NativePointer;
  labelClip: NativePointer | null;
  tf: NativePointer | null;
  name: string;
  lastValue: number | null;
}

export interface StyleToggle {
  button: NativePointer | null;
  clip: NativePointer | null;
  stateClip: NativePointer | null;
  enabled: boolean;
  name?: string;
  lastTapAt?: number;
  container?: NativePointer | null;
  label?: NativePointer | null;
}

export interface StyleTab {
  button: NativePointer;
  clip: NativePointer | null;
  label: string;
  id: string;
}
