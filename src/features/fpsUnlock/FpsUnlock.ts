import { attachHook } from "../../runtime/lifecycle";
// Cleanup must still run on the render thread after managed callbacks are stopped.
const rawCleanupAttach = Interceptor.attach.bind(Interceptor);
const rawCleanupTimeout = setTimeout;
const rawCleanupClearTimeout = clearTimeout;
export class FpsUnlock {
  enabled = false;
  private restoreOnRenderThread: (() => Promise<void>) | null = null;
  private disposal: Promise<void> | null = null;
  dispose(): Promise<void> {
    this.enabled = false;
    if (!this.disposal) this.disposal = this.restoreOnRenderThread?.() ?? Promise.resolve();
    return this.disposal;
  }
  toggle(): boolean {
    return (this.enabled = !this.enabled);
  }
  install(): void {
    var egl: any, swapIntervalAddress: any;
    try {
      egl = Process.findModuleByName("libEGL.so") || Process.findModuleByName("libegl.so");
      if (!egl) return undefined;
      if (!(swapIntervalAddress = egl.findExportByName("eglSwapInterval"))) return undefined;
      const setSwapInterval = new NativeFunction(swapIntervalAddress, "uint", ["pointer", "int"]);
      let restoringInterval = 1; // EGL's initial interval, until a game request is observed.
      let applying = false;
      let applied: boolean | null = null;
      let display = "";
      attachHook(swapIntervalAddress, {
        onEnter: (args: any) => {
          if (applying) return;
          restoringInterval = args[1].toInt32();
          if (this.enabled) {
            args[1] = ptr(0);
          }
        },
      });
      // The game sets its interval at startup, before injection. Apply toggles on its
      // render thread rather than waiting for another eglSwapInterval call that never comes.
      const swap = egl.findExportByName("eglSwapBuffers");
      this.restoreOnRenderThread = () => {
        if (!swap || applied !== true) return Promise.resolve();
        return new Promise<void>((resolve, reject) => {
          let listener: InvocationListener | null = null;
          let timer: ReturnType<typeof setTimeout> | null = null;
          let finished = false;
          const finish = (error?: Error) => {
            if (finished) return;
            finished = true;
            if (timer !== null) rawCleanupClearTimeout(timer);
            try {
              listener?.detach();
            } catch (detachError) {
              error ??= new Error("FPS cleanup hook detach failed: " + String(detachError));
            }
            if (error) reject(error);
            else resolve();
          };
          try {
            listener = rawCleanupAttach(swap, {
              onEnter: (args: InvocationArguments) => {
                if (finished) return;
                try {
                  applying = true;
                  if (!setSwapInterval(args[0], restoringInterval)) {
                    throw new Error("eglSwapInterval rejected the saved interval");
                  }
                  applied = false;
                  finish();
                } catch (error) {
                  finish(new Error("FPS interval restoration failed: " + String(error)));
                } finally {
                  applying = false;
                }
              },
            });
            timer = rawCleanupTimeout(
              () =>
                finish(
                  new Error("FPS interval restoration timed out waiting for the render thread"),
                ),
              250,
            );
          } catch (error) {
            finish(new Error("FPS restoration hook setup failed: " + String(error)));
          }
        });
      };
      if (swap)
        attachHook(swap, {
          onEnter: (args: any) => {
            const enabled = !!this.enabled;
            if (applied === null && !enabled) return;
            if (applied === enabled && display === String(args[0])) return;
            try {
              applying = true;
              setSwapInterval(args[0], enabled ? 0 : restoringInterval);
              applied = enabled;
              display = String(args[0]);
            } finally {
              applying = false;
            }
          },
        });
      return;
    } catch (_) {
      return;
    }
  }
}
