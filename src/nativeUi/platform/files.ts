import { findExport } from "../../platform/exports";

export function readPrintableFile(filePath: any, maximumLength: any): string {
  let result = "";
  try {
    const fopen = new NativeFunction(findExport("libc.so", "fopen")!, "pointer", [
      "pointer",
      "pointer",
    ]);
    const fread = new NativeFunction(findExport("libc.so", "fread")!, "int", [
      "pointer",
      "int",
      "int",
      "pointer",
    ]);
    const fclose = new NativeFunction(findExport("libc.so", "fclose")!, "int", ["pointer"]);
    const fileHandle: any = fopen(Memory.allocUtf8String(filePath), Memory.allocUtf8String("rb"));
    if (fileHandle && !fileHandle.isNull()) {
      const buf = Memory.alloc(maximumLength + 8);
      const len: any = fread(buf, 1, maximumLength, fileHandle);
      fclose(fileHandle);
      for (let index = 0; index < len; index++) {
        const ch = buf.add(index).readU8();
        if (ch >= 32 && ch < 127) {
          result = result + String.fromCharCode(ch);
        }
      }
    }
  } catch (error) {}
  return result;
}
