/** Services become available during native UI initialization. */
export const nativeUiServices: {
  openOutline?: () => void;
  setOutlineEnabled?: (enabled: boolean) => boolean;
  openCredits?: () => unknown;
  firstMount?: () => void;
} = {};
