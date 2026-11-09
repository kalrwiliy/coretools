export function decodeCharacterCodes(codes: number[]): string {
  let text = "";
  for (let index = 0; index < codes.length; index++) text += String.fromCharCode(codes[index]);
  return text;
}
