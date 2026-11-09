import { loginFields, nativeUiRuntime } from "../runtime/state";

export function getLoginButtons(loginState: any): any {
  let buttons: any, scidButton: any, guestButton: any;
  buttons = { scidButton: ptr(0), guestButton: ptr(0) };
  if (!loginState || loginState.isNull()) return buttons;
  try {
    scidButton = loginState.add(loginFields.LOGIN_SCID_BUTTON).readPointer();
    guestButton = loginState.add(loginFields.LOGIN_GUEST_BUTTON).readPointer();
    if (scidButton && !scidButton.isNull()) {
      buttons.scidButton = scidButton;
    }
    if (guestButton && !guestButton.isNull()) {
      buttons.guestButton = guestButton;
    }
  } catch (error) {}
  return buttons;
}

export function applyPendingLoginPanelY(): void {
  let panel: any;
  if (
    !nativeUiRuntime.state.loginPanelYDirty ||
    !nativeUiRuntime.state.loginState ||
    nativeUiRuntime.state.loginState.isNull()
  )
    return;
  try {
    if (
      (panel = nativeUiRuntime.state.loginState.add(loginFields.LOGIN_SCID_PANEL).readPointer()) &&
      !panel.isNull()
    ) {
      panel.add(36).writeFloat(nativeUiRuntime.state.pendingLoginPanelY);
    }
    nativeUiRuntime.state.loginPanelYDirty = false;
  } catch (error) {}
}
