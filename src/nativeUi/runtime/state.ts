export interface OutlineSlider {
  slider: NativePointer;
  channel: number;
}
export interface OutlinePopupState {
  popup: NativePointer;
  sliders: OutlineSlider[];
  values: number[];
  hexLabel: NativePointer;
}
export interface OutlineState {
  outlineColor: number[];
  outlineHookInstalled: boolean;
  outlineEnabled: boolean;
  outlinePopupOpen: boolean;
  reopenOutlineOnHome: boolean;
  sliderPollInterval: ReturnType<typeof setInterval> | null;
  outlinePopupState: OutlinePopupState | null;
  sliderChannelMap: number[];
  sliderLabels: { text: string; y: number; color: number }[];
}

export interface NativeUiBindings {
  malloc: NativeFunction<NativePointer, [number]>;
  calloc: NativeFunction<NativePointer, [number, number]>;
  stringCtor: NativeFunction<NativePointer, [NativePointerValue, NativePointerValue]>;
  gsmSetNextState: NativeFunction<void, [NativePointerValue, number]>;
  gsmApplyState: NativeFunction<void, [NativePointerValue]>;
  changeGameState: (manager: NativePointer, state: number) => void;
  getGameStateManager: NativeFunction<NativePointer, []>;
  getGameMain: NativeFunction<NativePointer, []>;
  gameButtonSetText: NativeFunction<
    void,
    [NativePointerValue, NativePointerValue, NativePointerValue]
  >;
  gameButtonCtor: NativeFunction<NativePointer, [NativePointerValue]>;
  setButtonMovieClip: (button: NativePointer, clip: NativePointer, flag: number) => void;
  movieClipGotoFrame: NativeFunction<void, [NativePointerValue, number]>;
  getMovieClipByStringsEx: NativeFunction<
    NativePointer,
    [NativePointerValue, NativePointerValue, number]
  >;
  getMovieClip: NativeFunction<NativePointer, [NativePointerValue, NativePointerValue, number]>;
  spriteAddChild: NativeFunction<number, [NativePointerValue, NativePointerValue]>;
  spriteRemoveChild: NativeFunction<number, [NativePointerValue, NativePointerValue]>;
  getMovieClipByName: NativeFunction<NativePointer, [NativePointerValue, NativePointerValue]>;
  getTextFieldByName: NativeFunction<NativePointer, [NativePointerValue, NativePointerValue]>;
  textFieldSetText: NativeFunction<void, [NativePointerValue, NativePointerValue]>;
  textFieldSetColor: NativeFunction<void, [NativePointerValue, number]>;
  setXY: NativeFunction<void, [NativePointerValue, number, number]>;
  getGUI: NativeFunction<NativePointer, []>;
  showFloaterText: NativeFunction<
    void,
    [NativePointerValue, NativePointerValue, number, number, number]
  >;
  getMovieClipByStrings: NativeFunction<NativePointer, [NativePointerValue, NativePointerValue]>;
  showPopup: NativeFunction<
    NativePointer,
    [NativePointerValue, NativePointerValue, number, number, number]
  >;
  popupBaseCtor: NativeFunction<NativePointer, [NativePointerValue]>;
  popupSetTitle: NativeFunction<void, [NativePointerValue, NativePointerValue]>;
  sliderCtor: NativeFunction<
    NativePointer,
    [NativePointerValue, NativePointerValue, NativePointerValue, NativePointerValue, number]
  >;
  loginStringHandler: NativeFunction<void, [NativePointerValue, NativePointerValue]>;
  friendsNotify: NativeFunction<void, [NativePointerValue, NativePointerValue]>;
}

export const nativeUiConfig = {
  defaultTargetGameState: 2,
  armDelayMs: 2000,
  defaultMenuScale: 1.1,
  uiScFile: "sc/ui.sc",
  fallbackStageWidth: 960,
  referenceShortSide: 720,
  baseLayoutWidth: 960,
  minPanelX: 1105,
  panelWidth: 150,
};

export const nativeUiOffsets = {
  GSM_SET_NEXT_STATE: 0xe09fd0,
  GSM_APPLY_STATE: 0xe09ef0,
  LOGIN_STATE_ENTER: 0xe17bdc,
  GSM_GET_INSTANCE: 0xe091c0,
  DTOR_7DDCDC: 0x7ddcdc,
  LOGIN_STRING_HANDLER: 0x7df018,
  FRIENDS_NOTIFY: 0xde0540,
  GLOBAL_151B6D0: 0x151b6d0,
  BUTTON_SET_STATE: 0x7dd638,
  GAME_BUTTON_SET_TEXT: 0x920f6c,
  GAME_BUTTON_CTOR: 0x92072c,
  MOVIECLIP_GOTO_FRAME: 0x6411b8,
  STRING_CTOR: 0x6af294,
  GET_MOVIECLIP_STRINGS: 0xe23d28,
  GET_MOVIECLIP: 0xe23db4,
  BUTTON_SET_MOVIECLIP_FALLBACK: 0x7dd74c,
  SPRITE_ADD_CHILD: 0x5f8904,
  GET_MOVIECLIP_BY_NAME: 0x641f2c,
  GET_TEXTFIELD_BY_NAME: 0x64218c,
  TEXTFIELD_SET_TEXT: 0x5f6974,
  TEXTFIELD_SET_COLOR: 0x5f6a24,
  DISPLAY_SET_XY: 0x5f9ae8,
  GUI_GET_INSTANCE: 0x916728,
  GUI_SHOW_FLOATER_TEXT: 0x917240,
  GET_MOVIECLIP_STRINGS_2: 0xe23d28,
  HOME_SCREEN_ENTER: 0xc60fdc,
  GUI_SHOW_POPUP: 0x917e44,
  COUNTRY_POPUP_CTOR: 0xdf1fb0,
  POPUP_SET_TITLE: 0xa73100,
  SLIDER_CTOR: 0x921da0,
  GAMEMAIN_GET_INSTANCE: 0x7c0468,
  GAMEMAIN_FIELD_128: 0x80,
  GSM_INSTANCE_PTR: 0x151d400,
};

export const loginFields = {
  LOGIN_SCID_PANEL: 0x28,
  LOGIN_SCID_BUTTON: 0x30,
  LOGIN_GUEST_BUTTON: 0x38,
};

export const nativeUiBindings: NativeUiBindings = {} as NativeUiBindings;

export const outlineState: OutlineState = {
  outlineColor: [100, 0, 0, 0],
  outlineHookInstalled: false,
  outlineEnabled: false,
  outlinePopupOpen: false,
  reopenOutlineOnHome: false,
  sliderPollInterval: null,
  outlinePopupState: null,
  sliderChannelMap: [3, 0, 1, 2],
  sliderLabels: [
    {
      text: "Alpha",
      y: 180,
      color: 0,
    },
    {
      text: "Red",
      y: 280,
      color: 4294901760,
    },
    {
      text: "Green",
      y: 380,
      color: 4278255360,
    },
    {
      text: "Blue",
      y: 480,
      color: 4278190335,
    },
  ],
};

export const TOUCH_HANDLER_OFFSET = 0xec6474;

export const nativeUiRuntime: {
  state: any;

  licenseExpiresAt: any;

  libgPollInterval: any;
} = {
  state: undefined,
  licenseExpiresAt: undefined,
  libgPollInterval: undefined,
};
