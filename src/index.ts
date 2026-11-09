import { initializeDisposal } from "./runtime/lifecycle";
import "./menu/disposal";
import { initializeCore } from "./runtime/initialize";
import { runtimeState } from "./runtime/controllers";
import { initNativesUnit } from "./nativeUi/runtime/bootstrap";
import { initDebugFeatures } from "./features/debug/DebugFeatures";
import { initCombat } from "./features/combat/CombatHooks";
import { initAutoDodge } from "./features/autoDodge/AutoDodge";
import { initializeSwitchgear } from "./menu/styles/switchgear";
import { init as initializeMenuStyle } from "./menu/styles/MenuStyleSwitcher";
import { initializeBsre } from "./menu/styles/bsre";
import { initializeWebUi } from "./webui/WebUiBridge";
initializeDisposal();

// Controllers and UI hooks rely on this initialization order.
initializeCore();
initNativesUnit();
initDebugFeatures();
initCombat();
initAutoDodge();
initializeSwitchgear();
initializeMenuStyle();
initializeBsre();
runtimeState.javaUiExports = initializeWebUi();
