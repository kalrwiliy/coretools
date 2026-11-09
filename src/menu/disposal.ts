import { isValidPtr } from "../engine/memory";
import { removeFromStage } from "../engine/sceneGraph";
import { cameraOffsetState } from "../features/camera/offsetState";
import { coreState } from "../runtime/coreState";
import { runOnRenderThread } from "../runtime/renderCleanup";
import { onDispose } from "../runtime/lifecycle";
import { destroyDebugMenu } from "./debug/menu";
import { dragState } from "./settings/dragState";
import { destroySettingsMenu } from "./settings/lifecycle";
import { xyzSliderGroup } from "./settings/cameraState";
import { cameraNavButtons } from "./settings/navigationState";
import { toggleGroup } from "./settings/toggleState";
import { mainMenuState } from "./settings/state";
import { state as bsreState } from "./styles/bsre/state";
import { modulesPageState } from "./settings/modulesState";
import { bsreMenu } from "./styles/bsre";
import { teardown } from "./styles/bsre/lifecycle";
import { switchgearMenu } from "./styles/switchgear";
import { state as switchgearState } from "./styles/switchgear/state";

let disposed = false;
onDispose(() => {
  if (disposed) return;
  disposed = true;
  bsreMenu?.cancelPendingOpen();
  coreState.debugMenuOpen = false;
  mainMenuState.isOpen = false;
  bsreState.active = false;
  bsreState.visible = false;
  switchgearState.open = false;
  dragState.dragging = false;
  cameraOffsetState.offsetX = cameraOffsetState.offsetY = cameraOffsetState.offsetZ = 0;
  cameraOffsetState.frozen = false;
  cameraOffsetState.frozenPos = null;
  const errors: string[] = [];
  const remove = (node: NativePointer | null | undefined) => {
    try {
      if (isValidPtr(node)) removeFromStage(node);
    } catch (error) {
      errors.push(String(error));
    }
  };
  // Capture references before normal menu teardown clears its state.
  const extraNodes = [
    coreState.menuStylesCategory,
    dragState.handleButton,
    modulesPageState.aimbotLabel,
    switchgearState.wrapper,
    switchgearState.clip,
    switchgearState.container,
    switchgearState.cameraButton,
    switchgearState.resetButton,
    switchgearState.gamemodeButton,
  ];
  for (const slider of switchgearState.sliders) extraNodes.push(slider.slider, slider.labelClip);
  for (const toggle of switchgearState.toggles)
    extraNodes.push(toggle.button, toggle.clip, toggle.label);
  const ownedChildren: (NativePointer | null | undefined)[] = [
    ...(coreState.tabButtons || []),
    ...(mainMenuState.menuButtons || []),
    ...(modulesPageState.bigButtons || []),
    ...(modulesPageState.sliders || []),
    ...(modulesPageState.sliderLabels || []),
    ...cameraNavButtons.items,
    ...bsreState.quickButtons,
    ...(bsreState.menuParts || []),
  ];
  for (const item of coreState.debugMenuItems || []) ownedChildren.push(item.button);
  for (const item of bsreState.infoLabels) ownedChildren.push(item.clip);
  for (const item of xyzSliderGroup.items) ownedChildren.push(item.slider, item.label);
  for (const item of toggleGroup.items) ownedChildren.push(item.button, item.label);
  const ownedRoots = [
    coreState.debugMenu,
    mainMenuState.menu,
    bsreState.clip,
    bsreState.menuObj,
    bsreState.menuButton,
    bsreState.quickButton,
    ...extraNodes,
    ...ownedChildren,
  ];
  if (!ownedRoots.some(isValidPtr)) return;
  return runOnRenderThread(() => {
    for (const cleanup of [
      () => bsreMenu?.destroy(),
      teardown,
      () => switchgearMenu?.reset(),
      destroyDebugMenu,
      destroySettingsMenu,
    ]) {
      try {
        cleanup();
      } catch (error) {
        errors.push(String(error));
      }
    }
    for (const node of new Set(extraNodes)) remove(node);
    coreState.menuStylesCategory = null;
    dragState.handleButton = null;
    if (errors.length) throw new Error("Menu cleanup failed: " + errors.join("; "));
  });
});
