/** Owns the temporary movement override and restores the saved game input. */
export class JoystickController {
  private readonly currentX: NativePointer;
  private readonly currentY: NativePointer;
  private readonly centerX: NativePointer;
  private readonly centerY: NativePointer;
  private readonly originalX: number;
  private readonly originalY: number;
  private readonly originalFlagA: number;
  private readonly originalFlagB: number;
  constructor(private readonly screen: NativePointer) {
    this.currentX = screen.add(2664);
    this.currentY = screen.add(2668);
    this.centerX = screen.add(2672);
    this.centerY = screen.add(2676);
    this.originalX = this.currentX.readFloat();
    this.originalY = this.currentY.readFloat();
    this.originalFlagA = screen.add(4264).readU8();
    this.originalFlagB = screen.add(4302).readU8();
    screen.add(4264).writeU8(1);
    screen.add(4302).writeU8(1);
  }
  dispose(): void {
    // Attempt every saved field independently if the battle screen is going away.
    const restoreWrites = [
      () => this.currentX.writeFloat(this.originalX),
      () => this.currentY.writeFloat(this.originalY),
      () => this.screen.add(4264).writeU8(this.originalFlagA),
      () => this.screen.add(4302).writeU8(this.originalFlagB),
    ];
    for (const write of restoreWrites) {
      try {
        write();
      } catch (_) {}
    }
  }
  move(deltaX: number, deltaY: number): boolean {
    const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (length <= 0) return false;
    deltaX /= length;
    deltaY /= length;
    this.currentX.writeFloat(this.centerX.readFloat() + deltaX * 100);
    this.currentY.writeFloat(this.centerY.readFloat() + deltaY * 100);
    return true;
  }
  stop(): void {
    this.currentX.writeFloat(this.centerX.readFloat());
    this.currentY.writeFloat(this.centerY.readFloat());
  }
  restore(): void {
    this.currentX.writeFloat(this.originalX);
    this.currentY.writeFloat(this.originalY);
    this.screen.add(4264).writeU8(this.originalFlagA);
    this.screen.add(4302).writeU8(this.originalFlagB);
  }
}
