export type CameraOffsetKey = "offsetX" | "offsetY" | "offsetZ";
export interface CameraOffsetState {
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  hookInstalled: boolean;
  listener: InvocationListener | null;
  frozen: boolean;
  frozenPos: { x: number; y: number; z: number } | null;
}
export const cameraOffsetState: CameraOffsetState = {
  offsetX: 0,
  offsetY: 0,
  offsetZ: 0,
  hookInstalled: false,
  listener: null,
  frozen: false,
  frozenPos: null,
};
