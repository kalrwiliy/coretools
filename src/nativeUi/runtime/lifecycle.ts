import { cancelInterval } from "../../runtime/lifecycle";
import { runtimeState } from "../../runtime/controllers";
import { applyPendingLoginPanelY } from "../hud/login";
import { parkObject } from "../widgets/display";
import { getStageRoot } from "../widgets/layout";
import { nativeUiBindings, nativeUiConfig, nativeUiRuntime } from "./state";
export function releaseMenuWidgets(): void {
  function releaseObject(node: any): void {
    parkObject(node);
  }
  function releaseWidget(widget: any): void {
    if (!widget) return;
    releaseObject(widget.button);
    releaseObject(widget.clip);
  }
  releaseObject(nativeUiRuntime.state.menuLayout.primaryNode);
  releaseObject(nativeUiRuntime.state.menuLayout.secondaryNode);
  releaseWidget(nativeUiRuntime.state.menuLayout.primaryWidget);
  releaseWidget(nativeUiRuntime.state.menuLayout.secondaryWidget);
  for (let index = 0; index < nativeUiRuntime.state.menuLayout.widgets.length; index++) {
    releaseWidget(nativeUiRuntime.state.menuLayout.widgets[index]);
  }
  releaseWidget(nativeUiRuntime.state.menuWidgetMJl);
  releaseWidget(nativeUiRuntime.state.menuWidgetEJZ);
  releaseWidget(nativeUiRuntime.state.menuWidgetBmx);
  releaseWidget(nativeUiRuntime.state.menuWidgetQ8h7);
  releaseWidget(nativeUiRuntime.state.menuWidgetE7l);
  releaseObject(nativeUiRuntime.state.menuObjKj6);
  releaseObject(nativeUiRuntime.state.menuObjX0on);
  releaseObject(nativeUiRuntime.state.menuObjBvh);
  releaseObject(nativeUiRuntime.state.menuObjDgl);
  releaseObject(nativeUiRuntime.state.telegramButton);
  releaseObject(nativeUiRuntime.state.telegramClip);
  nativeUiRuntime.state.menuObjKj6 = null;
  nativeUiRuntime.state.menuWidgetMJl = null;
  nativeUiRuntime.state.menuObjX0on = null;
  nativeUiRuntime.state.menuWidgetEJZ = null;
  nativeUiRuntime.state.menuObjBvh = null;
  nativeUiRuntime.state.menuWidgetBmx = null;
  nativeUiRuntime.state.menuObjDgl = null;
  nativeUiRuntime.state.menuWidgetQ8h7 = null;
  nativeUiRuntime.state.telegramButton = null;
  nativeUiRuntime.state.telegramClip = null;
  nativeUiRuntime.state.menuWidgetE7l = null;
  nativeUiRuntime.state.menuLayout.primaryWidget = null;
  nativeUiRuntime.state.menuLayout.secondaryWidget = null;
  nativeUiRuntime.state.menuLayout.widgets = [];
  if (nativeUiRuntime.state.widgetInterval) {
    cancelInterval(nativeUiRuntime.state.widgetInterval);
    nativeUiRuntime.state.widgetInterval = null;
  }
}
export function clearHideIntervals(): void {
  if (nativeUiRuntime.state.hideInterval !== null) {
    cancelInterval(nativeUiRuntime.state.hideInterval);
    nativeUiRuntime.state.hideInterval = null;
  }
  if (nativeUiRuntime.state.fastHideInterval) {
    cancelInterval(nativeUiRuntime.state.fastHideInterval);
    nativeUiRuntime.state.fastHideInterval = null;
  }
}
export function clearYxkcInterval(): void {
  if (nativeUiRuntime.state.yxkcInterval !== null) {
    cancelInterval(nativeUiRuntime.state.yxkcInterval);
    nativeUiRuntime.state.yxkcInterval = null;
  }
}
export function armAndSwitchState(): void {
  if (nativeUiRuntime.state.menuArmed) return;
  nativeUiRuntime.state.flagTBbx = false;
  nativeUiRuntime.state.flagNnwp = false;
  nativeUiRuntime.state.armDeadline = Date.now() + nativeUiConfig.armDelayMs;
  nativeUiRuntime.state.menuArmed = true;
  nativeUiRuntime.state.armedFlagOed = false;
  clearHideIntervals();
  clearYxkcInterval();
  releaseMenuWidgets();
  applyPendingLoginPanelY();
  try {
    if (!nativeUiRuntime.state.stageRoot || nativeUiRuntime.state.stageRoot.isNull())
      nativeUiRuntime.state.stageRoot = getStageRoot();
  } catch (error) {}
  let targetState: any = nativeUiRuntime.state.targetGameState;
  if (!(targetState >= 0)) targetState = nativeUiConfig.defaultTargetGameState;
  try {
    nativeUiRuntime.state.inStateSwitch = true;
    try {
      nativeUiBindings.changeGameState(nativeUiBindings.getGameStateManager(), targetState >>> 0);
    } finally {
      nativeUiRuntime.state.inStateSwitch = false;
    }
  } catch (error) {
    nativeUiRuntime.state.inStateSwitch = false;
  }
  try {
    // Start the core menu after the native state is armed.
    if (typeof runtimeState.CoretoolsDebugMenu !== "undefined") {
      runtimeState.CoretoolsDebugMenu.startCore(nativeUiRuntime.state.libgBase);
    }
  } catch (error) {}
}
export function armOnFirstMount(lateCatch?: any): void {
  if (nativeUiRuntime.state.menuArmed) return;
  if (!lateCatch) {
    try {
      nativeUiRuntime.state.libgBase.add(19874996).writeU32(3);
    } catch (error) {}
  }
  nativeUiRuntime.state.armDeadline = Date.now() + nativeUiConfig.armDelayMs;
  nativeUiRuntime.state.menuArmed = true;
  nativeUiRuntime.state.armedFlagOed = false;
  try {
    if (!nativeUiRuntime.state.stageRoot || nativeUiRuntime.state.stageRoot.isNull())
      nativeUiRuntime.state.stageRoot = getStageRoot();
  } catch (error) {}
  nativeUiRuntime.state.clearScreenBlack = false;
  nativeUiRuntime.state.flagUatf = false;
  nativeUiRuntime.state.flagNnwp = false;
  clearHideIntervals();
  clearYxkcInterval();
  releaseMenuWidgets();
  applyPendingLoginPanelY();
  try {
    if (typeof runtimeState.CoretoolsDebugMenu !== "undefined") {
      runtimeState.CoretoolsDebugMenu.startCore(nativeUiRuntime.state.libgBase);
    }
  } catch (error) {}
}
