import { getFeatureLibgBase } from "../debug/libg";
export class Spectators {
  enabled = false;
  root: NativePointer | null = null;
  clip: NativePointer | null = null;
  textField: NativePointer | null = null;
  private originalVisibility: number | null = null;
  private label: NativePointer | null = null;
  private setText: any = null;
  dispose(): void {
    this.enabled = false;
    try {
      if (this.clip && !this.clip.isNull() && this.originalVisibility !== null) {
        this.clip.add(8).writeU8(this.originalVisibility);
      }
    } catch (_) {
      /* The battle HUD may already have been destroyed. */
    }
    this.root = null;
    this.clip = null;
    this.textField = null;
    this.originalVisibility = null;
    // Previous text is unknown; do not invent it or free game-owned native strings.
  }
  capture(root: NativePointer): void {
    if (root.isNull()) return;
    if (!this.root || !this.root.equals(root)) {
      this.root = root;
      this.clip = root.add(0x3a0).readPointer();
      this.textField = root.add(0x3b0).readPointer();
      this.originalVisibility = this.clip.isNull() ? null : this.clip.add(8).readU8();
    }
    if (this.enabled) this.apply();
  }
  toggle(): boolean {
    if ((this.enabled = !this.enabled) && this.root) this.apply();
    if (!this.enabled && this.clip && !this.clip.isNull() && this.originalVisibility !== null)
      this.clip.add(8).writeU8(this.originalVisibility);
    return this.enabled;
  }
  apply(): void {
    if (!this.clip || this.clip.isNull() || !this.textField || this.textField.isNull()) return;
    if (!this.label) {
      const malloc = new NativeFunction(
        Process.getModuleByName("libc.so").getExportByName("malloc"),
        "pointer",
        ["int"],
      );
      this.label = malloc(32);
      const makeString = new NativeFunction(getFeatureLibgBase()!.add(7008916), "pointer", [
        "pointer",
        "pointer",
      ]);
      makeString(this.label, Memory.allocUtf8String("69"));
      this.setText = new NativeFunction(getFeatureLibgBase()!.add(6252916), "void", [
        "pointer",
        "pointer",
      ]);
    }
    this.clip.add(8).writeU8(1);
    this.setText(this.textField, this.label);
  }
}
