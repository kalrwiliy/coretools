import type { MenuStyleId } from "./contracts";
export const menuStyleState: { current: MenuStyleId; autoDodgeEnabled: boolean } = {
  current: "coretools",
  autoDodgeEnabled: false,
};
/** Assigned by the composition root after layout initialization. */
export const menuLayout: { scale?: () => number } = {};
