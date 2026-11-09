import { isDisposing } from "../../runtime/lifecycle";
import { trackOwnedPopup } from "../runtime/popupOwnership";
import { createScString, isValidPtr } from "../platform/memory";
import { nativeUiBindings, nativeUiRuntime } from "../runtime/state";
import { addTextLine, getPopupContent, showToast } from "./popupWidgets";

export function openCreditsPopup(): boolean {
  if (isDisposing()) return false;
  if (!nativeUiRuntime.state.libgBase) {
    showToast("libg not ready");
    return false;
  }
  try {
    const stage = nativeUiBindings.getGUI();
    if (!isValidPtr(stage)) return false;
    const popup = nativeUiBindings.calloc(472, 1);
    nativeUiBindings.popupBaseCtor(popup);
    trackOwnedPopup(popup);
    nativeUiBindings.popupSetTitle(popup, createScString("Credits"));
    const container = getPopupContent(popup);
    if (!isValidPtr(container)) return false;
    const lines = [
      "Coretools Credits",
      "made by malo",
      "for the arm64 architecture",
      "big thanks to:",
      "yeah lwk, I did everything myself....",
    ];
    let y = 160;
    for (let idx = 0; idx < lines.length; idx++) {
      addTextLine(container, lines[idx], y, 4294967295);
      y += 70;
    }
    const popupHolder = nativeUiBindings.malloc(Process.pointerSize);
    popupHolder.writePointer(popup);
    nativeUiBindings.showPopup(stage, popupHolder, 1, 1, 0);
    return true;
  } catch (error) {
    showToast("credits failed: " + error);
    return false;
  }
}
