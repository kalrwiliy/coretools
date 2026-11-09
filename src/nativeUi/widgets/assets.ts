import { cstr } from "../platform/memory";
import { nativeUiBindings, nativeUiConfig } from "../runtime/state";

export function getUiMovieClip(exportName: any): any {
  return getMovieClipFrom(nativeUiConfig.uiScFile, exportName);
}

export function getMovieClipFrom(assetPath: any, exportName: any): any {
  const file = cstr(assetPath);
  const name = cstr(exportName);
  try {
    const clip = nativeUiBindings.getMovieClip(file, name, 0);
    if (clip && !clip.isNull()) return clip;
  } catch (error) {}
  try {
    const fallbackClip = nativeUiBindings.getMovieClipByStringsEx(file, name, 0);
    if (fallbackClip && !fallbackClip.isNull()) return fallbackClip;
  } catch (error) {}

  return ptr(0);
}
