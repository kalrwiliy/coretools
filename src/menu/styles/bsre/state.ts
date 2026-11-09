import type { StyleSlider, StyleTab, StyleToggle } from "../records";
export interface BsreState {
  base: NativePointer | null;
  initialized: boolean;
  lastScreenState: number;
  active: boolean;
  clip: NativePointer | null;
  tf: NativePointer | null;
  menuButton: NativePointer | null;
  quickButton: NativePointer | null;
  lastButton: NativePointer | null;
  menuButtonClip: NativePointer | null;
  menuObj: NativePointer | null;
  menuClip: NativePointer | null;
  visible: boolean;
  lastTapTime: number;
  missedTaps: number;
  infoLabels: any[];
  quickButtons: any[];
  quickButtonClip: NativePointer | null;
  quickBarVisible: boolean;
  lastButtonClip: NativePointer | null;
  page: number;
  mainTabs: StyleTab[];
  combatTabs: StyleTab[];
  sliderNodes: any[];
  settingsLabels: any[];
  settingsToggles: StyleToggle[];
  backButton: { button: NativePointer; clip: NativePointer | null; label: string } | null;
  sliderTimer: ReturnType<typeof setInterval> | null;
  quickButtonClips: any[];
  quickFlags: any[];
  sliders: StyleSlider[];
  titleLabel: NativePointer | null;
  localized: any[];
  lang: string;
  menuParts?: NativePointer[];
}

export const OFFSETS = {
  getMovieClipStr: 0xe23d28,
  getMovieClip: 0xe23db4,
  stringCtor: 0x6af294,
  debugMenuCtor: 0x922770,
  setXY: 0x5f9ae8,
  addChild: 0x5f8904,
  find: 0x64218c,
  setText: 0x5f6974,
  setFrame: 0x6411b8,
  loadSc: 0x7c7568,
  getStageOwner: 0x916728,
  getScreenStateHolder: 0xe091c0,
  screenUpdateFn: 0xe09ef0,
  stageGlobal: 0x144d7b8,
  buttonCtor: 0x92072c,
  buttonSetClip: 0x7dd74c,
  setChildText: 0x920f6c,
  buttonPressFn: 0x7dd638,
  removeChild: 0x5f8be8,
  getChildByName: 0x641f2c,
  sliderCtor: 0x921da0,
  setFrameRange: 0x640fdc,
};

export const TITLE_TEXT = "BSRE1";

export const TITLE_SCALE = 1.5;

export const TITLE_X = -520;

export const TITLE_Y = 4;

export const natives: any = {};

export const state: BsreState = {
  base: null,
  initialized: false,
  lastScreenState: -99,
  active: false,
  clip: null,
  tf: null,
  menuButton: null,
  quickButton: null,
  lastButton: null,
  menuButtonClip: null,
  menuObj: null,
  menuClip: null,
  visible: false,
  lastTapTime: 0,
  missedTaps: 0,
  infoLabels: [],
  quickButtons: [],
  quickButtonClip: null,
  quickBarVisible: false,
  lastButtonClip: null,
  page: 1,
  mainTabs: [],
  combatTabs: [],
  sliderNodes: [],
  settingsLabels: [],
  settingsToggles: [],
  backButton: null,
  sliderTimer: null,
  quickButtonClips: [],
  quickFlags: [],
  sliders: [],
  titleLabel: null,
  localized: [],
  lang: "ru",
};

export const STRINGS: any = {
  menu: ["menu", "Меню"],
  quick: ["Quick", "Быстро"],
  combat: ["Combat", "Бой"],
  utility: ["Utility", "Утилиты"],
  visual: ["Visual", "Визуал"],
  langSwitch: ["RUS", "ENG"],
  autoDodge: ["Auto Dodge", "Авто уклонение"],
  killaura: ["Killaura", "Киллаура"],
  zoom: ["Zoom", "Зум"],
  back: ["Back", "Назад"],
  autoDodgeTitle: ["Auto Dodge", "Авто уклонение"],
  link: ["t.me/coretools7", "t.me/coretools7"],
  requireHold: ["require hold", "требовать удержания"],
  continuous: ["continuos", "постоянно"],
  circular: ["circular", "круговое"],
  alwaysDodge: ["always dodge", "всегда уклон"],
  quickAccess: ["quik access", "быстрый доступ"],
  enabledLabel: ["enabled", "включено"],
  info0: ["Hide names", "Скрывать имена"],
  info1: ["Hide Mask", "Скрывать маску"],
  info2: ["Auto Dodge", "Авто уклонение"],
  info3: ["Aimbot", "Аимбот"],
  qcolAutoDodge: ["Auto dodge", "Авто уклон"],
  qcolKillAura: ["Kill Aura", "Киллаура"],
  qcolZoom: ["Zoom", "Зум"],
  slider: ["Slider", "Слайдер"],
  acceleration: ["Acceleration", "Ускорение"],
  deceleration: ["Deccelleration", "Замедление"],
  reaction: ["reaction", "Реакция"],
  shift: ["Shift", "Сдвиг"],
  shiftDelay: ["shift delay", "Задержка сдвига"],
  vision: ["Vision", "Обзор"],
  delay: ["delay", "Задержка"],
  maxAngle: ["Max angle", "Макс. угол"],
  cooldown: ["cooldown", "Перезарядка"],
  damage: ["Damage", "Урон"],
  changeDelay: ["change delay", "Задержка смены"],
  chance: ["chance", "Шанс"],
};

export const memoryState: { heapFloor: NativePointer | undefined } = { heapFloor: undefined };
