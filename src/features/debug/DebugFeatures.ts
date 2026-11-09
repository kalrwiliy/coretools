import { scheduleInterval, cancelInterval } from "../../runtime/lifecycle";
import { onDispose } from "../../runtime/lifecycle";
import { runtimeState as core } from "../../runtime/controllers";
import { Camera } from "../camera/Camera";
import { ChatSpam } from "../chatSpam/ChatSpam";
import { FpsUnlock } from "../fpsUnlock/FpsUnlock";
import { Spectators } from "../spectators/Spectators";
import { getFeatureLibgBase, resetFeatureLibgBase } from "./libg";
export function initDebugFeatures(): void {
  const fps = new FpsUnlock();
  const spectators = new Spectators();
  const camera = new Camera(spectators);
  const chat = new ChatSpam();
  onDispose(async () => {
    chat.dispose();
    camera.dispose();
    spectators.dispose();
    await fps.dispose();
  });
  resetFeatureLibgBase();
  let tries = 0;
  const timer = scheduleInterval(() => {
    ++tries;
    if (getFeatureLibgBase()) {
      cancelInterval(timer);
      fps.install();
      camera.install();
      chat.install();
      return;
    }
    if (tries > 120) {
      cancelInterval(timer);
    }
  }, 500);
  core.debugFeaturesApi = {
    isFpsUnlockOn: () => fps.enabled,
    toggleFpsUnlock: () => fps.toggle(),
    isCameraModeOn: () => camera.enabled,
    toggleCameraMode: () => camera.toggle(),
    isSpectatorsOn: () => spectators.enabled,
    toggleSpectators: () => spectators.toggle(),
    isChatSpamOn: () => chat.enabled,
    toggleChatSpam: () => chat.toggle(),
    getChatSpamEnabled: () => chat.enabled,
    setSpectatorRoot: (root: NativePointer) => {
      spectators.root = root;
    },
  };
}
