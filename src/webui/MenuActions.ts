import { cameraOffsetState, type CameraOffsetKey } from "../features/camera/offsetState";
import { dispatchMenuAction } from "../menu/debug/dispatcher";
import { mainMenuState } from "../menu/settings/state";
import { menuStyleState } from "../menu/styles/selection";
import { SLIDER_RANGE, SLIDER_VALUE_SCALE } from "../runtime/constants";
import { coreState } from "../runtime/coreState";

const styles: Record<string, string> = {
  "coretools (default)": "coretools",
  "Switchgear+ (new)": "switchgear",
  "Bsre1 (old)": "bsre1",
};

const items = [
  "Go Tutorial",
  "Brawler Outline",
  "Floater",
  "Test Misc",
  "Main menu",
  "Stage Probe",
  "FPS Unlock",
  "Camera Mode",
  "Spectators 69",
  "Chat Spam",
  "Killaura",
  "Aimbot",
];
const sessionStartedAt = Date.now();

/** Translate HTML messages into the same actions used by the native menu. */
export function handleMenuAction(message: any, command: (line: string) => void): boolean {
  if (!message || typeof message !== "object") return false;
  // ctq.log survives reinjection: never replay old tutorial/menu clicks on startup.
  if (
    ["item", "style", "action", "slider"].includes(message.t) &&
    typeof message.ts === "number" &&
    message.ts < sessionStartedAt
  )
    return true;
  // WebView equivalent of va(editpage) -> Mt: switch pages, reset offsets on return.
  // Do not manipulate native widgets when the WebView owns the panel.
  if (message.t === "action" && message.name === "editpage") {
    if (typeof message.open !== "boolean") return true;
    mainMenuState.page = message.open ? 2 : 1;
    if (!message.open)
      cameraOffsetState.offsetX = cameraOffsetState.offsetY = cameraOffsetState.offsetZ = 0;

    return true;
  }
  const cameraKeys: Record<string, CameraOffsetKey> = {
    "camera X": "offsetX",
    "camera Y": "offsetY",
    "camera Z": "offsetZ",
  };
  if (message.t === "slider" && Object.prototype.hasOwnProperty.call(cameraKeys, message.name)) {
    if (mainMenuState.page === 2 && typeof message.v === "number" && Number.isFinite(message.v)) {
      cameraOffsetState[cameraKeys[message.name]] =
        Math.max(-SLIDER_RANGE, Math.min(SLIDER_RANGE, message.v)) * SLIDER_VALUE_SCALE;
    }
    return true;
  }
  if (message.t === "item" && items.includes(message.name)) {
    if (!coreState.initialized) {
      return true;
    }
    dispatchMenuAction({ kind: "item", label: message.name }, () => command("close_debug"));

    return true;
  }
  if (message.t === "style") {
    if (!Object.prototype.hasOwnProperty.call(styles, message.name)) return false;
    const style = styles[message.name];
    // Dispatch through the item handler, including its already-selected message.
    if (!coreState.initialized) {
      command(
        "style:" + (menuStyleState.current || "coretools") + ":" + (message.ts || Date.now()),
      );

      return true;
    }
    dispatchMenuAction({ kind: "item", label: message.name });
    mainMenuState.page = 1;
    cameraOffsetState.offsetX = cameraOffsetState.offsetY = cameraOffsetState.offsetZ = 0;
    command("style:" + (menuStyleState.current || "coretools") + ":" + (message.ts || Date.now()));

    return true;
  }
  if (message.t !== "action" || message.name !== "einstellungen") return false;
  const style = menuStyleState.current || "coretools";
  // The HTML click handler already toggles its own Coretools panel.
  if (style !== "coretools") {
    if (!coreState.initialized) {
      return true;
    }
    dispatchMenuAction({ kind: "_CaCaCa209" });
  }

  return true;
}
