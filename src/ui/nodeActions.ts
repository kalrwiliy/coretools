import { ptrKey } from "../engine/memory";
import { coreState } from "../runtime/coreState";

export function setNodeAction(node: any, action: any): void {
  let key: any;
  if (!(key = ptrKey(node)) || !action) return;
  coreState.actionsByPtr[key] = action;
}

export function clearNodeActions(): void {
  coreState.actionsByPtr = {};
}

export function getNodeAction(node: any): any {
  let key: any;
  if ((key = ptrKey(node)) && coreState.actionsByPtr[key]) return coreState.actionsByPtr[key];
  return null;
}
