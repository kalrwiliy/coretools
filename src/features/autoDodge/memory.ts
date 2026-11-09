export function readGameString(string: any): any {
  if (!string || string.isNull()) return "Unknown";
  try {
    let length: any, characters: any;
    if (
      (length = string.add(4).readU32()) > 0 &&
      length < 128 &&
      !(characters = string.add(8).readPointer()).isNull()
    ) {
      return characters.readUtf8String(length) || "Unknown";
    }
  } catch (error) {}
  return "Unknown";
}
export function nowMs(): number {
  return Date.now();
}
