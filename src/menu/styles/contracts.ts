export type MenuStyleId = "coretools" | "switchgear" | "bsre1";
export interface MenuStyle {
  toggle(): void;
  open(): void;
  close(): void;
  isOpen(): boolean;
}
export interface SwitchgearMenu extends MenuStyle {
  reset(): void;
}
export interface BsreMenu extends MenuStyle {
  started: boolean;
  cancelPendingOpen(): void;
  start(): void;
  destroy(): void;
  activate(): void;
}
