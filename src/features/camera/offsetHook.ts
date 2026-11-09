import { attachHook } from "../../runtime/lifecycle";
import { CameraFieldOffsets } from "../../engine/layouts";
import { isValidPtr } from "../../engine/memory";
import { CAMERA_HOOK_OFFSET } from "../../runtime/constants";
import { coreState } from "../../runtime/coreState";
import { cameraOffsetState } from "./offsetState";

export function installCameraHook(): void {
  if (cameraOffsetState.hookInstalled || !coreState.base) return;
  try {
    cameraOffsetState.listener = attachHook(coreState.base.add(CAMERA_HOOK_OFFSET), {
      onEnter: function (r) {
        this.cam = r[0];
      },
      onLeave: function () {
        const r = this.cam;
        if (!isValidPtr(r)) return;
        if (cameraOffsetState.frozen) {
          try {
            if (!cameraOffsetState.frozenPos) {
              cameraOffsetState.frozenPos = {
                x: r.add(CameraFieldOffsets.offsetX).readFloat(),
                y: r.add(CameraFieldOffsets.offsetY).readFloat(),
                z: r.add(CameraFieldOffsets.offsetZ).readFloat(),
              };
            } else {
              r.add(CameraFieldOffsets.offsetX).writeFloat(cameraOffsetState.frozenPos.x);
              r.add(CameraFieldOffsets.offsetY).writeFloat(cameraOffsetState.frozenPos.y);
              r.add(CameraFieldOffsets.offsetZ).writeFloat(cameraOffsetState.frozenPos.z);
            }
          } catch (_e) {}
          return;
        }
        const t = cameraOffsetState.offsetX;
        const a = cameraOffsetState.offsetY;
        const e = cameraOffsetState.offsetZ;
        if (t === 0 && a === 0 && e === 0) return;
        try {
          if (t !== 0) {
            const n = r.add(CameraFieldOffsets.offsetX).readFloat();
            r.add(CameraFieldOffsets.offsetX).writeFloat(n + t);
          }
          if (a !== 0) {
            const o = r.add(CameraFieldOffsets.offsetY).readFloat();
            r.add(CameraFieldOffsets.offsetY).writeFloat(o + a);
          }
          if (e !== 0) {
            const i = r.add(CameraFieldOffsets.offsetZ).readFloat();
            r.add(CameraFieldOffsets.offsetZ).writeFloat(i + e);
          }
        } catch (_e) {}
        return;
      },
    });
    cameraOffsetState.hookInstalled = true;
    return;
  } catch (_e) {
    return;
  }
}
