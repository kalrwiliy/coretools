import { isLiveObject } from "../../engine/memory";
import { attachCleanupHook } from "../../runtime/lifecycle";
import { detachOwnedNode } from "../widgets/display";

interface OwnedPopup {
  popup: NativePointer;
  release(): void;
}

const popups = new Map<string, OwnedPopup>();
const pendingReleaseErrors: string[] = [];

/** Both country-popup destructor slots are independent in this game build. */
export function trackOwnedPopup(popup: NativePointer, beforeRelease: () => void = () => {}): void {
  const key = popup.toString();
  if (popups.has(key)) return;
  const hooks: InvocationListener[] = [];
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    popups.delete(key);
    const errors: string[] = [];
    try {
      beforeRelease();
    } catch (error) {
      errors.push(String(error));
    }
    for (const hook of hooks) {
      try {
        hook.detach();
      } catch (error) {
        errors.push(String(error));
      }
    }
    if (errors.length) throw new Error("Popup release failed: " + errors.join("; "));
  };
  popups.set(key, { popup, release });
  const vtable = popup.readPointer();
  const seen = new Set<string>();
  for (const offset of [0, Process.pointerSize]) {
    const destructor = vtable.add(offset).readPointer();
    if (destructor.isNull() || seen.has(destructor.toString())) continue;
    seen.add(destructor.toString());
    hooks.push(
      attachCleanupHook(destructor, {
        onEnter(args) {
          if (!args[0].equals(popup)) return;
          try {
            release();
          } catch (error) {
            // Never throw through the game's destructor. Report deferred failures
            // during explicit script disposal instead.
            pendingReleaseErrors.push(String(error));
          }
        },
      }),
    );
  }
}

export function hasOwnedPopups(): boolean {
  return popups.size > 0;
}

export function disposeOwnedPopups(): void {
  const errors = pendingReleaseErrors.splice(0);
  for (const entry of Array.from(popups.values())) {
    // Release script callbacks while the popup's children are still alive.
    try {
      entry.release();
    } catch (error) {
      errors.push(String(error));
    }
    try {
      if (isLiveObject(entry.popup)) detachOwnedNode(entry.popup);
    } catch (error) {
      errors.push(String(error));
    }
  }
  if (errors.length) throw new Error("Owned popup cleanup failed: " + errors.join("; "));
}
