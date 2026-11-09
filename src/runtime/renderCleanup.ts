/** Run scene mutations on the rendering thread, even while ordinary hooks are disabled. */
export function runOnRenderThread(cleanup: () => void, timeoutMs = 500): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let listener: InvocationListener | undefined;
    let timeout: TimeoutId | undefined;
    let settled = false;
    let executing = false;
    const finish = (error?: unknown) => {
      if (settled) return;
      settled = true;
      if (timeout !== undefined) globalThis.clearTimeout(timeout);
      try {
        listener?.detach();
      } catch (detachError) {
        error ??= detachError;
      }
      if (error !== undefined) reject(error);
      else resolve();
    };
    try {
      const egl = Process.findModuleByName("libEGL.so") || Process.findModuleByName("libegl.so");
      const swap = egl?.findExportByName("eglSwapBuffers");
      if (!swap || swap.isNull()) {
        finish(new Error("Native UI cleanup requires eglSwapBuffers, which is unavailable"));
        return;
      }
      // Deliberately raw: the normal lifecycle wrappers stop accepting work during disposal.
      listener = Interceptor.attach(swap, {
        onEnter() {
          if (settled || executing) return;
          executing = true;
          try {
            cleanup();
            finish();
          } catch (error) {
            finish(error);
          }
        },
      });
      if (settled) {
        listener.detach();
        return;
      }
      timeout = globalThis.setTimeout(() => {
        finish(
          new Error(`Native UI cleanup timed out waiting for a render frame (${timeoutMs} ms)`),
        );
      }, timeoutMs);
    } catch (error) {
      finish(error);
    }
  });
}
