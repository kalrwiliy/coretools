let libgBase: NativePointer | null = null;
export function resetFeatureLibgBase(): void {
  libgBase = null;
}
export function getFeatureLibgBase(): NativePointer | null {
  if (libgBase) return libgBase;
  try {
    const module = Process.findModuleByName("libg.so");
    if (module) libgBase = module.base;
  } catch (_) {}
  return libgBase;
}
