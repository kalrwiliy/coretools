import { isValidPtr } from "../platform/memory";
import { nativeUiBindings, nativeUiOffsets, nativeUiRuntime } from "./state";

export function bindNatives(libgBase: NativePointer): void {
  const libc = Process.getModuleByName("libc.so");
  nativeUiBindings.malloc = new NativeFunction(libc.findExportByName("malloc")!, "pointer", [
    "uint",
  ]);
  nativeUiBindings.calloc = new NativeFunction(libc.findExportByName("calloc")!, "pointer", [
    "uint",
    "uint",
  ]);
  nativeUiBindings.stringCtor = new NativeFunction(
    libgBase.add(nativeUiOffsets.STRING_CTOR),
    "pointer",
    ["pointer", "pointer"],
  );
  nativeUiBindings.gsmSetNextState = new NativeFunction(
    libgBase.add(nativeUiOffsets.GSM_SET_NEXT_STATE),
    "void",
    ["pointer", "uint"],
  );
  nativeUiBindings.gsmApplyState = new NativeFunction(
    libgBase.add(nativeUiOffsets.GSM_APPLY_STATE),
    "void",
    ["pointer"],
  );
  nativeUiBindings.changeGameState = function (manager: any, state: any) {
    nativeUiBindings.gsmSetNextState(manager, state >>> 0);
    nativeUiBindings.gsmApplyState(manager);
  };
  nativeUiBindings.getGameStateManager = new NativeFunction(
    libgBase.add(nativeUiOffsets.GSM_GET_INSTANCE),
    "pointer",
    [],
  );
  nativeUiBindings.getGameMain = new NativeFunction(
    libgBase.add(nativeUiOffsets.GAMEMAIN_GET_INSTANCE),
    "pointer",
    [],
  );
  nativeUiBindings.gameButtonSetText = new NativeFunction(
    libgBase.add(nativeUiOffsets.GAME_BUTTON_SET_TEXT),
    "void",
    ["pointer", "pointer", "pointer"],
  );
  nativeUiBindings.gameButtonCtor = new NativeFunction(
    libgBase.add(nativeUiOffsets.GAME_BUTTON_CTOR),
    "pointer",
    ["pointer"],
  );
  const setMovieClipFallback = new NativeFunction(
    libgBase.add(nativeUiOffsets.BUTTON_SET_MOVIECLIP_FALLBACK),
    "void",
    ["pointer", "pointer", "int"],
  );
  // Prefer the vtable slot at +360 of the object; fall back to the static libg function.
  nativeUiBindings.setButtonMovieClip = function (self: any, arg: any, flag: any) {
    try {
      const vtable = self.readPointer();
      if (vtable && !vtable.isNull()) {
        const fn = vtable.add(360).readPointer();
        if (fn && !fn.isNull()) {
          return new NativeFunction(fn, "void", ["pointer", "pointer", "int"])(self, arg, flag);
        }
      }
    } catch (error) {}
    return setMovieClipFallback(self, arg, flag);
  };
  nativeUiBindings.movieClipGotoFrame = new NativeFunction(
    libgBase.add(nativeUiOffsets.MOVIECLIP_GOTO_FRAME),
    "void",
    ["pointer", "int"],
  );
  nativeUiBindings.getMovieClipByStringsEx = new NativeFunction(
    libgBase.add(nativeUiOffsets.GET_MOVIECLIP_STRINGS),
    "pointer",
    ["pointer", "pointer", "int"],
  );
  nativeUiBindings.getMovieClip = new NativeFunction(
    libgBase.add(nativeUiOffsets.GET_MOVIECLIP),
    "pointer",
    ["pointer", "pointer", "int"],
  );
  nativeUiBindings.spriteAddChild = new NativeFunction(
    libgBase.add(nativeUiOffsets.SPRITE_ADD_CHILD),
    "int",
    ["pointer", "pointer"],
  );
  nativeUiBindings.spriteRemoveChild = new NativeFunction(libgBase.add(6261736), "int", [
    "pointer",
    "pointer",
  ]);
  nativeUiBindings.getMovieClipByName = new NativeFunction(
    libgBase.add(nativeUiOffsets.GET_MOVIECLIP_BY_NAME),
    "pointer",
    ["pointer", "pointer"],
  );
  nativeUiBindings.getTextFieldByName = new NativeFunction(
    libgBase.add(nativeUiOffsets.GET_TEXTFIELD_BY_NAME),
    "pointer",
    ["pointer", "pointer"],
  );
  nativeUiBindings.textFieldSetText = new NativeFunction(
    libgBase.add(nativeUiOffsets.TEXTFIELD_SET_TEXT),
    "void",
    ["pointer", "pointer"],
  );
  // TextField color setter uses an unsigned ARGB word.
  nativeUiBindings.textFieldSetColor = new NativeFunction(
    libgBase.add(nativeUiOffsets.TEXTFIELD_SET_COLOR),
    "void",
    ["pointer", "uint"],
  );
  nativeUiBindings.setXY = new NativeFunction(
    libgBase.add(nativeUiOffsets.DISPLAY_SET_XY),
    "void",
    ["pointer", "float", "float"],
  );
  nativeUiBindings.getGUI = new NativeFunction(
    libgBase.add(nativeUiOffsets.GUI_GET_INSTANCE),
    "pointer",
    [],
  );

  nativeUiBindings.showFloaterText = new NativeFunction(
    libgBase.add(nativeUiOffsets.GUI_SHOW_FLOATER_TEXT),
    "void",
    ["pointer", "pointer", "float", "int", "int"],
  );
  nativeUiBindings.getMovieClipByStrings = new NativeFunction(
    libgBase.add(nativeUiOffsets.GET_MOVIECLIP_STRINGS_2),
    "pointer",
    ["pointer", "pointer"],
  );
  nativeUiBindings.showPopup = new NativeFunction(
    libgBase.add(nativeUiOffsets.GUI_SHOW_POPUP),
    "pointer",
    ["pointer", "pointer", "int", "int", "int"],
  );
  nativeUiBindings.popupBaseCtor = new NativeFunction(
    libgBase.add(nativeUiOffsets.COUNTRY_POPUP_CTOR),
    "pointer",
    ["pointer"],
  );
  nativeUiBindings.popupSetTitle = new NativeFunction(
    libgBase.add(nativeUiOffsets.POPUP_SET_TITLE),
    "void",
    ["pointer", "pointer"],
  );
  nativeUiBindings.sliderCtor = new NativeFunction(
    libgBase.add(nativeUiOffsets.SLIDER_CTOR),
    "pointer",
    ["pointer", "pointer", "pointer", "pointer", "int"],
  );
  nativeUiBindings.loginStringHandler = new NativeFunction(
    libgBase.add(nativeUiOffsets.LOGIN_STRING_HANDLER),
    "void",
    ["pointer", "pointer"],
  );
  nativeUiBindings.friendsNotify = new NativeFunction(
    libgBase.add(nativeUiOffsets.FRIENDS_NOTIFY),
    "void",
    ["pointer", "pointer"],
  );
}

export function getGlobalInstance(): any {
  try {
    const primaryInstance = nativeUiRuntime.state.libgBase
      .add(nativeUiOffsets.GLOBAL_151B6D0)
      .readPointer();
    if (isValidPtr(primaryInstance)) return primaryInstance;
  } catch (error) {}
  try {
    const managerSlot = nativeUiRuntime.state.libgBase
      .add(nativeUiOffsets.GSM_INSTANCE_PTR)
      .readPointer();
    const secondaryInstance = managerSlot.readPointer();
    if (isValidPtr(secondaryInstance)) return secondaryInstance;
  } catch (error) {}
  return ptr(0);
}
