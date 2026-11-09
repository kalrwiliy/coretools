import {
  GSM_AVATAR_OFFSET,
  GSM_CURRENT_STATE_OFFSET,
  GSM_NEXT_STATE_OFFSET,
  GSM_STATE_OBJ_OFFSET,
  STATE_HOME,
} from "../runtime/constants";
import { coreState } from "../runtime/coreState";
import { natives } from "./bindings";
import { isValidPtr } from "./memory";
import { LibgOffsets } from "./offsets";

export function getGameState(manager: any): number {
  if (!isValidPtr(manager)) return -1;
  try {
    return manager.add(GSM_CURRENT_STATE_OFFSET).readS32();
  } catch (error) {
    return -1;
  }
}

export function getNextGameState(manager: any): number {
  if (!isValidPtr(manager)) return -1;
  try {
    return manager.add(GSM_NEXT_STATE_OFFSET).readS32();
  } catch (error) {
    return -1;
  }
}

export function changeGameState(manager: any, nextState: any): void {
  natives.gsmSetState(manager, nextState >>> 0);
  natives.gsmUpdate(manager);
}

export function getGsmField72(manager: any): NativePointer {
  if (!isValidPtr(manager)) return ptr(0);
  try {
    return manager.add(GSM_STATE_OBJ_OFFSET).readPointer();
  } catch (error) {
    return ptr(0);
  }
}

export function getMessageManager(): any {
  var manager: any;
  try {
    manager = coreState.base.add(LibgOffsets.MessageManager_instance).readPointer();
    if (isValidPtr(manager)) {
      return manager;
    }
  } catch (error) {}
  return natives.getMessageManager();
}

export function getHomeMode(manager: any): NativePointer {
  if (!isValidPtr(manager)) return ptr(0);
  if (getGameState(manager) !== STATE_HOME) return ptr(0);
  try {
    return manager.add(GSM_STATE_OBJ_OFFSET).readPointer();
  } catch (error) {
    return ptr(0);
  }
}

export function getPlayerAvatar(manager: any): NativePointer {
  var avatar: any;
  if (!isValidPtr(manager)) return ptr(0);
  try {
    avatar = manager.add(GSM_AVATAR_OFFSET).readPointer();
    if (isValidPtr(avatar)) {
      return avatar;
    }
  } catch (error) {}
  try {
    return natives.getPlayerAvatar();
  } catch (error) {
    return ptr(0);
  }
}
