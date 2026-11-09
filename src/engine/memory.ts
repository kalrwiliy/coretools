import { coreState } from "../runtime/coreState";
import { natives } from "./bindings";

// Frida's runtime provides console, but lib "es2020" + @types/frida-gum do not declare it.

export function cstr(text: any): NativePointer {
  return Memory.allocUtf8String(String(text));
}

export function isValidPtr(pointer: any): boolean {
  try {
    return !!(pointer && !pointer.isNull() && pointer.compare(ptr(65536)) > 0);
  } catch (error) {
    return false;
  }
}

export function ptrEquals(left: any, right: any): any {
  try {
    return isValidPtr(left) && isValidPtr(right) && left.equals(right);
  } catch (error) {
    return false;
  }
}

export function ptrKey(pointer: any): string {
  if (!isValidPtr(pointer)) return "";
  try {
    return pointer.toString();
  } catch (error) {
    return "";
  }
}

export function newScString(text: any): any {
  let str: any;
  str = natives.malloc(32);
  natives.stringCtor(str, cstr(text));
  return str;
}

export function libgFunction(offset: any, returnType: any, argumentTypes: any): any {
  return new NativeFunction(coreState.base.add(offset), returnType, argumentTypes);
}

export function isLiveObject(pointer: any): boolean {
  if (!isValidPtr(pointer)) return false;
  try {
    pointer.add(78).readU16();
    return isValidPtr(pointer.readPointer());
  } catch (error) {
    return false;
  }
}

export function readFloatSafe(pointer: any, offset: any): any {
  try {
    return pointer.add(offset).readFloat();
  } catch (error) {
    return 0;
  }
}

export function readS32Safe(pointer: any, offset: any): any {
  try {
    return pointer.add(offset).readS32();
  } catch (error) {
    return 0;
  }
}

export function readLibgU32(offset: any): any {
  try {
    return coreState.base.add(offset).readU32();
  } catch (error) {
    return 0;
  }
}

export function isLibgObject(pointer: any): boolean {
  if (!isValidPtr(pointer) || !coreState.base || !coreState.size) return false;
  try {
    const t = pointer.readPointer();
    return (
      isValidPtr(t) &&
      t.compare(coreState.base) >= 0 &&
      t.compare(coreState.base.add(coreState.size)) < 0
    );
  } catch (error) {
    return false;
  }
}
