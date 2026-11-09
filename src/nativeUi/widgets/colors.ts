import { nativeUiBindings } from "../runtime/state";

export function rgbaPercentToHex(rgba: any): string {
  const red = Math.round((rgba[0] / 100) * 255);
  const green = Math.round((rgba[1] / 100) * 255);
  const blue = Math.round((rgba[2] / 100) * 255);
  const alpha = Math.round((rgba[3] / 100) * 255);
  const packed = ((red << 24) | (green << 16) | (blue << 8) | alpha) >>> 0;
  return ("00000000" + packed.toString(16)).slice(-8);
}

export function setTextColor(textField: any, argb: any): void {
  let color: any;
  if (!textField || textField.isNull()) return;
  color = argb >>> 0;
  try {
    nativeUiBindings.textFieldSetColor(textField, color);
  } catch (error) {}
  try {
    textField.add(128).writeU32(color);
  } catch (error) {}
  try {
    textField.add(212).writeU32(color);
  } catch (error) {}
  try {
    textField.add(96).writeU32(color);
  } catch (error) {}
}

export function writeTextFieldArgb(textField: any, argb: any): void {
  if (!textField || textField.isNull()) return;
  const color = argb >>> 0;
  const red = (color >>> 16) & 255;
  const green = (color >>> 8) & 255;
  const blue = color & 255;
  try {
    textField.add(9).add(0).writeU8(red);
    textField.add(9).add(1).writeU8(green);
    textField.add(9).add(2).writeU8(blue);
  } catch (error) {}
  try {
    nativeUiBindings.textFieldSetColor(textField, color);
  } catch (error) {}
  try {
    textField.add(128).writeU32(color);
  } catch (error) {}
  try {
    textField.add(212).writeU32(color);
  } catch (error) {}
  try {
    textField.add(96).writeU32(color);
  } catch (error) {}
}
