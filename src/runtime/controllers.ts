import type { Aimbot } from "../features/combat/Aimbot";
import type { Killaura } from "../features/combat/Killaura";

export interface AutoDodgeController {
  enable(): void;
  disable(): void;
  setEnabled(enabled: boolean): void;
  setOption4(enabled: boolean): void;
  getStatus(): {
    active: boolean;
    dodging: boolean;
    statZero: number;
    transition: string;
    statCounter: number;
    mapFlipByte: number;
  };
}

export interface DebugFeatureController {
  isFpsUnlockOn(): boolean;
  toggleFpsUnlock(): boolean;
  isCameraModeOn(): boolean;
  toggleCameraMode(): boolean;
  isSpectatorsOn(): boolean;
  toggleSpectators(): boolean;
  isChatSpamOn(): boolean;
  toggleChatSpam(): string;
  getChatSpamEnabled(): boolean;
  setSpectatorRoot(root: NativePointer): void;
}

export interface ButtonReference {
  button: NativePointer;
  clip: NativePointer;
}

export interface CoreMenuController {
  startCore(base: NativePointer): void;
  handleButtonPress(args: InvocationArguments): void;
  isInitialized(): boolean;
}

export const runtimeState: {
  pointerSizeProbe: any;

  aimbotApi: Pick<Aimbot, "enable" | "disable" | "getStatus"> | null | undefined;

  autoDodgeApi: AutoDodgeController | null | undefined;

  killauraApi: Pick<Killaura, "toggle" | "getStatus"> | null | undefined;

  debugFeaturesApi: DebugFeatureController | null | undefined;

  settingsButtonRef: ButtonReference | null | undefined;

  debugButtonRef: ButtonReference | null | undefined;

  menuScaleX: any;

  menuScaleY: any;

  togglesBaseY: any;

  uiScLoaded: any;

  CoretoolsDebugMenu: CoreMenuController | undefined;

  javaUiExports: any;
} = {
  pointerSizeProbe: undefined,
  aimbotApi: undefined,
  autoDodgeApi: undefined,
  killauraApi: undefined,
  debugFeaturesApi: undefined,
  settingsButtonRef: undefined,
  debugButtonRef: undefined,
  menuScaleX: undefined,
  menuScaleY: undefined,
  togglesBaseY: undefined,
  uiScLoaded: undefined,
  CoretoolsDebugMenu: undefined,
  javaUiExports: undefined,
};
