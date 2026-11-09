/** Current libg GUI root. Read afresh: lobby/battle transitions replace UI owners.
 * 916728 returns GUI singleton 1518F10; DisplayObject parent is +56 (5F890C).
 */
export function currentStage(): NativePointer {
  try {
    const module = Process.findModuleByName("libg.so");
    if (!module) return ptr(0);
    const end = module.base.add(module.size);
    let node = module.base.add(0x1518f10).readPointer();
    const seen = new Set<string>();
    for (let depth = 0; depth < 16; depth++) {
      if (node.isNull() || seen.has(node.toString())) return ptr(0);
      seen.add(node.toString());
      const vtable = node.readPointer();
      if (vtable.compare(module.base) < 0 || vtable.compare(end) >= 0) return ptr(0);
      // Both GUI and its parents are DisplayObjectContainers in this build.
      if (node.add(78).readU16() > node.add(74).readU16()) return ptr(0);
      const parent = node.add(56).readPointer();
      if (parent.isNull()) return node;
      node = parent;
    }
  } catch (error) {}
  return ptr(0);
}
