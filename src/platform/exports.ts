// Frida 17 replacements for Frida 16 static APIs the original agent used.

/** Frida 16 `Module.findExportByName(moduleName, name)`: null module = global lookup; null if missing. */
export function findExport(moduleName: string | null, name: string): NativePointer | null {
  if (moduleName === null) return Module.findGlobalExportByName(name);
  const mod = Process.findModuleByName(moduleName);
  return mod ? mod.findExportByName(name) : null;
}
