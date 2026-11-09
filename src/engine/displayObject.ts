import { natives } from "./bindings";
import { isValidPtr } from "./memory";

export function isInTree(target: NativePointer | null, ancestor: NativePointer | null): boolean {
  let found: boolean;
  if (!target || !ancestor || !isValidPtr(target) || !isValidPtr(ancestor)) return false;
  try {
    if (target.equals(ancestor)) return true;
  } catch (error) {
    return false;
  }
  found = false;

  (function walk(node: any, depth: number): void {
    let count: any, children: any, idx: number, child: any;
    if (found || depth > 6) return;
    try {
      if ((count = node.add(192).readS16()) < 1 || count > 256) return undefined;
      if (!(children = node.add(144).readPointer()) || children.isNull()) return undefined;
      for (idx = 0; idx < count; idx++) {
        if (!(child = children.add(idx * 8).readPointer()) || child.isNull()) continue;
        if (child.equals(target)) {
          found = true;
          return undefined;
        }
        walk(child, depth + 1);
      }
      return;
    } catch (error) {
      return;
    }
  })(ancestor, 0);
  return found;
}

export function getHeight(node: any): any {
  let fnPtr: NativePointer, val: number;
  if (!isValidPtr(node)) return 0;
  try {
    fnPtr = node
      .readPointer()
      .add(13 * Process.pointerSize)
      .readPointer();
    if ((val = new NativeFunction(fnPtr, "float", ["pointer"])(node)) > 1 && val < 5000) return val;
  } catch (error) {}
  return 0;
}

export function getWidth(node: any): any {
  let fnPtr: NativePointer, val: number;
  if (!isValidPtr(node)) return 0;
  try {
    fnPtr = node
      .readPointer()
      .add(12 * Process.pointerSize)
      .readPointer();
    if ((val = new NativeFunction(fnPtr, "float", ["pointer"])(node)) > 1 && val < 5000) return val;
  } catch (error) {}
  return 0;
}

export function setScale(node: any, scaleX: any, scaleY: any): void {
  if (!isValidPtr(node)) return;
  try {
    node.add(16).writeFloat(scaleX);
    node.add(28).writeFloat(scaleY);
  } catch (error) {}
}

export function setPosition(node: any, x: any, y: any): void {
  if (!isValidPtr(node)) return;
  try {
    natives.setXY(node, x, y);
  } catch (error) {
    try {
      node.add(32).writeFloat(x);
      node.add(36).writeFloat(y);
    } catch (error) {}
  }
  return;
}

export function setColor(node: any, color: any): void {
  if (!isValidPtr(node)) return;
  const a = color >>> 0;
  const e = (a >>> 16) & 255;
  const n = (a >>> 8) & 255;
  const o = a & 255;
  try {
    node.add(9).add(0).writeU8(e);
    node.add(9).add(1).writeU8(n);
    node.add(9).add(2).writeU8(o);
  } catch (error) {}
  try {
    natives.setColor(node, a);
  } catch (error) {}
  try {
    node.add(128).writeU32(a);
  } catch (error) {}
  try {
    node.add(212).writeU32(a);
  } catch (error) {}
  try {
    node.add(96).writeU32(a);
  } catch (error) {}
}

export function setScaleY(node: any, scaleY: any): void {
  if (!isValidPtr(node)) return;
  try {
    node.add(28).writeFloat(scaleY);
  } catch (error) {}
}

export function setVisible(node: any, visible: any): void {
  if (!isValidPtr(node)) return;
  try {
    node.add(8).writeU8(visible ? 1 : 0);
  } catch (error) {}
}
