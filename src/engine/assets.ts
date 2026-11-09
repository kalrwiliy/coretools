import { mainMenuState } from "../menu/settings/state";
import { runtimeState } from "../runtime/controllers";
import { coreState } from "../runtime/coreState";
import { natives } from "./bindings";
import { cstr, isValidPtr, libgFunction, newScString } from "./memory";
import { LibgOffsets } from "./offsets";

export function loadDebugSc(): any {
  let loadFn: any, clip: any;
  if (coreState.debugScLoaded) return true;
  try {
    loadFn = libgFunction(LibgOffsets.ResourceManager_loadFile, "int", ["pointer", "int"]);
    loadFn(newScString("sc/debug.sc"), 0);
    loadFn(newScString("sc/debug.sc"), 1);
  } catch (error) {}
  clip = getMovieClip("sc/debug.sc", "debug_menu");
  if (isValidPtr(clip)) coreState.debugScLoaded = true;
  return coreState.debugScLoaded;
}

export function loadUiSc(assetPath: any): boolean {
  let loadFn: any;
  if (runtimeState.uiScLoaded && !assetPath) return true;
  if (assetPath) {
    try {
      if (typeof mainMenuState !== "undefined" && mainMenuState) mainMenuState.built = false;
    } catch (error) {}
  }
  try {
    loadFn = libgFunction(LibgOffsets.ResourceManager_loadFile, "int", ["pointer", "int"]);
    loadFn(newScString("sc/ui.sc"), 0);
    loadFn(newScString("sc/ui.sc"), 1);
    runtimeState.uiScLoaded = true;
  } catch (error) {}
  return true;
}

export function createMovieClipStr(assetPath: any, exportName: any): any {
  let clip: NativePointer;
  try {
    clip = libgFunction(LibgOffsets.MovieClipHelper_getMovieClipStr, "pointer", [
      "pointer",
      "pointer",
    ])(newScString(assetPath), newScString(exportName));
    if (isValidPtr(clip)) return clip;
  } catch (error) {}
  return ptr(0);
}

export function getMovieClip(assetPath: any, exportName: any): any {
  let clip: any;
  try {
    clip = natives.getMovieClip(cstr(assetPath), cstr(exportName), 0);
    if (isValidPtr(clip)) return clip;
  } catch (error) {}
  return createMovieClipStr(assetPath, exportName);
}
