export { default as htmlBase64 } from "./page/ui.html";

export const appendMode = "a";

export const libcName = "libc.so";
export const bridgeState: any = {
  initializationAttempted: false,
  legacyUiClass: null,
  legacyPollMethod: null,
  legacyVisibilityMethod: null,
};

export const messageTypeKey = "t";

export const toggleIdKey = "id";

export const toggleEnabledKey = "on";

export const sliderNameKey = "name";

export const sliderValueKey = "v";

export const getEnvironmentMethod = "getEnvFn";

/** Mutable file-transport state. */
export const transportState: {
  openFile: any;

  writeFile: any;

  closeFile: any;

  libc: any;

  tellFile: any;

  seekFile: any;

  readFile: any;

  queueLibc: any;

  queuePath: any;

  commandPath: any;

  queueOffset: any;

  guidFile: any;

  guidBuffer: any;

  guidBytesRead: any;

  installationGuid: any;

  installationId: any;

  installationCode: any;

  commandFile: any;

  commandBuffer: any;

  gateTicks: any;
} = {
  openFile: undefined,
  writeFile: undefined,
  closeFile: undefined,
  libc: undefined,
  tellFile: undefined,
  seekFile: undefined,
  readFile: undefined,
  queueLibc: undefined,
  queuePath: undefined,
  commandPath: undefined,
  queueOffset: undefined,
  guidFile: undefined,
  guidBuffer: undefined,
  guidBytesRead: undefined,
  installationGuid: undefined,
  installationId: undefined,
  installationCode: undefined,
  commandFile: undefined,
  commandBuffer: undefined,
  gateTicks: undefined,
};
