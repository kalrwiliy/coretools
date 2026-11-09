import { attachHook } from "../../runtime/lifecycle";
import { getFeatureLibgBase } from "../debug/libg";
import { Spectators } from "../spectators/Spectators";
import { cameraOffsetState as cameraOffsets } from "./offsetState";
export class Camera {
  enabled = false;
  private byThread = new Map<number, NativePointer>();
  constructor(private readonly spectators: Spectators) {}
  dispose(): void {
    this.enabled = false;
    this.byThread.clear();
    cameraOffsets.offsetX = 0;
    cameraOffsets.offsetY = 0;
    cameraOffsets.offsetZ = 0;
    // The game recomputes its camera eye; never write a possibly stale camera pointer.
  }
  toggle(): boolean {
    this.enabled = !this.enabled;
    return this.enabled;
  }
  install(): void {
    const base = getFeatureLibgBase();
    const controller = this;
    if (!base) return;
    attachHook(base.add(0xc2e65c), {
      onEnter(args: any) {
        this.camera = args[0];
        controller.byThread.set(this.threadId, args[0]);
      },
      onLeave() {
        controller.byThread.delete(this.threadId);
        try {
          const root = this.camera.add(2608).readPointer();
          if (root.isNull()) return;
          controller.spectators.capture(root);
        } catch (error) {}
      },
    });
    attachHook(base.add(0x6b5694), {
      onEnter(args: any) {
        const camera = controller.byThread.get(this.threadId);
        if (!camera || !args[0].equals(camera.add(2184))) return;
        // ht/Mt camera settings share R; apply them at the verified eye update.
        // The eye is recomputed by C2E65C every frame, so this does not accumulate.
        const offsets = [
          cameraOffsets.offsetX,
          cameraOffsets.offsetY,
          cameraOffsets.offsetZ + (controller.enabled ? 300 : 0),
        ];
        for (let axis = 0; axis < offsets.length; axis++) {
          if (offsets[axis] === 0) continue;
          const coordinate = args[0].add(axis * 4);
          coordinate.writeFloat(coordinate.readFloat() + offsets[axis]);
        }
      },
    });
  }
}
