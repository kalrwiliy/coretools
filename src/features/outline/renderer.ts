import { attachCleanupHook, isDisposing, onDispose } from "../../runtime/lifecycle";
import { runOnRenderThread } from "../../runtime/renderCleanup";
import { outlineState } from "../../nativeUi/runtime/state";

const GL = {
  currentProgram: 0x8b8d,
  activeUniforms: 0x8b86,
  floatVec4: 0x8b52,
  uniformBlockIndex: 0x8a3a,
  uniformOffset: 0x8a3b,
  blockBinding: 0x8a3f,
  blockSize: 0x8a40,
  uniformBuffer: 0x8a11,
  bufferBinding: 0x8a28,
  bufferStart: 0x8a29,
  bufferSize: 0x8a2a,
  dynamicDraw: 0x88e8,
  activeBlocks: 0x8a36,
  allocatedBufferSize: 0x8764,
} as const;

type GlCall = (...args: any[]) => any;
type Uniform = { location: number } | { block: number };
interface ContextState {
  programs: Map<number, Uniform | null>;
  buffer: number;
  destroyRequested?: boolean;
}
let installed = false;

/** Override only the reflected outline vec4, for the duration of each GLES draw. */
export function installOutlineRenderer(): boolean {
  if (installed) return true;
  if (isDisposing()) return false;
  const listeners: InvocationListener[] = [];
  try {
    const gles =
      Process.findModuleByName("libGLESv3.so") || Process.findModuleByName("libGLESv2.so");
    const egl = Process.findModuleByName("libEGL.so");
    if (!gles || !egl) return false;
    const bind = (
      name: string,
      result: NativeFunctionReturnType,
      args: NativeFunctionArgumentType[],
    ): GlCall => {
      const address = (name.startsWith("egl") ? egl : gles).findExportByName(name);
      if (!address) throw new Error(`Missing ${name}`);
      return new NativeFunction(address, result, args) as GlCall;
    };
    const getProcAddress = bind("eglGetProcAddress", "pointer", ["pointer"]);
    const getBufferParameter = bind("glGetBufferParameteriv", "void", ["uint", "uint", "pointer"]);
    const getContext = bind("eglGetCurrentContext", "pointer", []);
    const getInteger = bind("glGetIntegerv", "void", ["uint", "pointer"]);
    const getProgram = bind("glGetProgramiv", "void", ["uint", "uint", "pointer"]);
    const getUniform = bind("glGetActiveUniform", "void", [
      "uint",
      "uint",
      "int",
      "pointer",
      "pointer",
      "pointer",
      "pointer",
    ]);
    const getLocation = bind("glGetUniformLocation", "int", ["uint", "pointer"]);
    const getValue = bind("glGetUniformfv", "void", ["uint", "int", "pointer"]);
    const setValue = bind("glUniform4fv", "void", ["int", "int", "pointer"]);
    const getMetadata = bind("glGetActiveUniformsiv", "void", [
      "uint",
      "int",
      "pointer",
      "uint",
      "pointer",
    ]);
    const getBlock = bind("glGetActiveUniformBlockiv", "void", ["uint", "uint", "uint", "pointer"]);
    const getIndexed = bind("glGetIntegeri_v", "void", ["uint", "uint", "pointer"]);
    const getIndexed64 = bind("glGetInteger64i_v", "void", ["uint", "uint", "pointer"]);
    const generateBuffers = bind("glGenBuffers", "void", ["int", "pointer"]);
    const deleteBuffers = bind("glDeleteBuffers", "void", ["int", "pointer"]);
    const bindBuffer = bind("glBindBuffer", "void", ["uint", "uint"]);
    const bufferData = bind("glBufferData", "void", ["uint", "long", "pointer", "uint"]);
    const bindBase = bind("glBindBufferBase", "void", ["uint", "uint", "uint"]);
    const bindRange = bind("glBindBufferRange", "void", ["uint", "uint", "uint", "long", "long"]);
    const contexts = new Map<string, ContextState>();
    const activeThreads = new Set<number>();
    const failures = new Set<string>();
    const idleWaiters = new Set<() => void>();
    const releaseBuffer = (state: ContextState) => {
      if (!state.buffer) return;
      deleteBuffers(1, Memory.alloc(4).writeU32(state.buffer));
      state.buffer = 0;
    };
    const integer = (call: GlCall, ...args: any[]) => {
      const output = Memory.alloc(8);
      call(...args, output);
      return output.readS32();
    };
    const indexed64 = (parameter: number, index: number) => {
      const output = Memory.alloc(8);
      getIndexed64(parameter, index, output);
      return output.readS64();
    };
    const reflect = (program: number): Uniform | null => {
      const count = integer(getProgram, program, GL.activeUniforms);
      if (count < 0 || count > 1024) return null;
      const name = Memory.alloc(512);
      const length = Memory.alloc(4);
      const size = Memory.alloc(4);
      const type = Memory.alloc(4);
      const index = Memory.alloc(4);
      for (let uniformIndex = 0; uniformIndex < count; uniformIndex++) {
        getUniform(program, uniformIndex, 512, length, size, type, name);
        const uniformName = name.readUtf8String(Math.max(0, Math.min(511, length.readS32())));
        if (uniformName !== "u_outlineColor" && !uniformName?.endsWith(".u_outlineColor")) continue;
        if (size.readS32() !== 1 || type.readU32() !== GL.floatVec4) return null;
        const location = getLocation(program, name);
        if (location >= 0) return { location };
        index.writeU32(uniformIndex);
        const block = integer(getMetadata, program, 1, index, GL.uniformBlockIndex);
        const offset = integer(getMetadata, program, 1, index, GL.uniformOffset);
        if (block < 0 || offset !== 0 || integer(getBlock, program, block, GL.blockSize) !== 16)
          return null;
        return { block };
      }
      return null;
    };
    const prepareDraw = (): (() => void) | undefined => {
      if (isDisposing() || !outlineState.outlineEnabled) return;
      const context = getContext() as NativePointer;
      if (context.isNull()) return;
      const contextKey = context.toString();
      let state = contexts.get(contextKey);
      if (!state) {
        state = { programs: new Map(), buffer: 0 };
        contexts.set(contextKey, state);
      }
      const program = integer(getInteger, GL.currentProgram);
      if (!program) return;
      if (!state.programs.has(program)) state.programs.set(program, reflect(program));
      const uniform = state.programs.get(program);
      if (!uniform) return;
      const color = Memory.alloc(16);
      for (let channel = 0; channel < 4; channel++)
        color.add(channel * 4).writeFloat(outlineState.outlineColor[channel] / 100);
      if ("location" in uniform) {
        const original = Memory.alloc(16);
        getValue(program, uniform.location, original);
        const restore = () => setValue(uniform.location, 1, original);
        try {
          setValue(uniform.location, 1, color);
        } catch (error) {
          restore();
          throw error;
        }
        return restore;
      }
      const binding = integer(getBlock, program, uniform.block, GL.blockBinding);
      const blockCount = integer(getProgram, program, GL.activeBlocks);
      if (blockCount < 1 || blockCount > 64) return;
      for (let block = 0; block < blockCount; block++) {
        if (
          block !== uniform.block &&
          integer(getBlock, program, block, GL.blockBinding) === binding
        )
          return;
      }
      const originalBuffer = integer(getIndexed, GL.bufferBinding, binding);
      const originalStart = indexed64(GL.bufferStart, binding);
      const originalSize = indexed64(GL.bufferSize, binding);
      const genericBuffer = integer(getInteger, GL.bufferBinding);
      const restore = () => {
        try {
          if (originalBuffer && originalSize.compare(0) > 0)
            bindRange(GL.uniformBuffer, binding, originalBuffer, originalStart, originalSize);
          else bindBase(GL.uniformBuffer, binding, originalBuffer);
        } finally {
          bindBuffer(GL.uniformBuffer, genericBuffer);
        }
      };
      try {
        if (!state.buffer) {
          const output = Memory.alloc(4);
          generateBuffers(1, output);
          state.buffer = output.readU32();
          if (!state.buffer) return;
        }
        bindBuffer(GL.uniformBuffer, state.buffer);
        bufferData(GL.uniformBuffer, 16, color, GL.dynamicDraw);
        if (integer(getBufferParameter, GL.uniformBuffer, GL.allocatedBufferSize) !== 16) {
          restore();
          return;
        }
        bindBase(GL.uniformBuffer, binding, state.buffer);
        bindBuffer(GL.uniformBuffer, genericBuffer);
      } catch (error) {
        restore();
        throw error;
      }
      return restore;
    };
    const drawAddresses = new Set<string>();
    for (const name of [
      "glDrawArrays",
      "glDrawElements",
      "glDrawRangeElements",
      "glDrawArraysInstanced",
      "glDrawElementsInstanced",
      "glDrawArraysIndirect",
      "glDrawElementsIndirect",
      "glDrawElementsBaseVertex",
      "glDrawRangeElementsBaseVertex",
      "glDrawElementsInstancedBaseVertex",
    ]) {
      const resolved = getProcAddress(Memory.allocUtf8String(name)) as NativePointer;
      for (const address of [gles.findExportByName(name), resolved.isNull() ? null : resolved]) {
        if (!address || drawAddresses.has(address.toString())) continue;
        drawAddresses.add(address.toString());
        listeners.push(
          attachCleanupHook(address, {
            onEnter() {
              const thread = this.threadId;
              if (activeThreads.has(thread) || isDisposing() || !outlineState.outlineEnabled)
                return;
              activeThreads.add(thread);
              this.outlineThread = thread;
              try {
                this.restoreOutline = prepareDraw();
              } catch (_) {
                failures.add("Outline draw override failed");
                outlineState.outlineEnabled = false;
              }
            },
            onLeave() {
              if (this.outlineThread === undefined) return;
              try {
                this.restoreOutline?.();
              } catch (_) {
                failures.add("Outline draw state restoration failed");
                outlineState.outlineEnabled = false;
              } finally {
                activeThreads.delete(this.outlineThread);
                if (!activeThreads.size) for (const resolve of idleWaiters) resolve();
              }
            },
          }),
        );
      }
    }
    if (!drawAddresses.size) throw new Error("No GLES draw entry points");
    for (const name of ["glDeleteProgram", "glLinkProgram"]) {
      const address = gles.findExportByName(name);
      if (!address) throw new Error(`Missing ${name}`);
      listeners.push(
        attachCleanupHook(address, {
          onEnter(args) {
            for (const state of contexts.values()) state.programs.delete(args[0].toUInt32());
          },
        }),
      );
    }
    const makeCurrent = egl.findExportByName("eglMakeCurrent");
    const destroyContext = egl.findExportByName("eglDestroyContext");
    if (!makeCurrent || !destroyContext) throw new Error("Missing EGL context lifecycle exports");
    listeners.push(
      attachCleanupHook(makeCurrent, {
        onEnter(args) {
          const currentKey = (getContext() as NativePointer).toString();
          if (currentKey === args[3].toString()) return;
          const state = contexts.get(currentKey);
          if (!state) return;
          try {
            // Retire our buffer while its owning context is still current.
            releaseBuffer(state);
            if (state.destroyRequested) contexts.delete(currentKey);
          } catch (_) {
            failures.add("Outline buffer retirement failed");
          }
        },
      }),
    );
    listeners.push(
      attachCleanupHook(destroyContext, {
        onEnter(args) {
          this.outlineContext = args[1].toString();
        },
        onLeave(result) {
          if (!result.toInt32()) return;
          const state = contexts.get(this.outlineContext);
          if (!state) return;
          // Destruction may be deferred until another thread unbinds this context.
          if (state.buffer) state.destroyRequested = true;
          else contexts.delete(this.outlineContext);
        },
      }),
    );
    onDispose(async () => {
      if (activeThreads.size)
        await new Promise<void>((resolve, reject) => {
          const ready = () => {
            globalThis.clearTimeout(timeout);
            idleWaiters.delete(ready);
            resolve();
          };
          const timeout = globalThis.setTimeout(() => {
            idleWaiters.delete(ready);
            reject(new Error("Outline draw did not finish during cleanup"));
          }, 500);
          idleWaiters.add(ready);
        });
      if ([...contexts.values()].some((state) => state.buffer)) {
        await runOnRenderThread(() => {
          if (activeThreads.size) throw new Error("Outline draw still in progress during cleanup");
          const state = contexts.get((getContext() as NativePointer).toString());
          if (state) releaseBuffer(state);
        });
      }
      const remaining = [...contexts.values()].filter((state) => state.buffer).length;
      if (remaining)
        failures.add(`Outline buffers remain in ${remaining} non-current EGL context(s)`);
      if (failures.size) throw new Error([...failures].join("; "));
      contexts.clear();
    });
    installed = true;
    return true;
  } catch (_) {
    for (const listener of listeners) {
      try {
        listener.detach();
      } catch (_) {
        /* Continue rolling back the other hooks. */
      }
    }
    return false;
  }
}
