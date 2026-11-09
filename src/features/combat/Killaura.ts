import { EnemyTracker } from "./EnemyTracker";
export class Killaura {
  enabled = false;
  battleScreen: NativePointer | null = null;
  lastFireTime = 0;
  readonly fireIntervalMs = 380;
  fireCount = 0;
  autoAttack: any = null;
  constructor(private readonly tracker: EnemyTracker) {}
  toggle(): boolean {
    return (this.enabled = !this.enabled);
  }
  getStatus() {
    return {
      enabled: this.enabled,
      fireCount: this.fireCount,
      trackedCount: this.tracker.trackers.size,
      attackRange: this.tracker.weapon.attackRange,
      battleScreen: !!this.battleScreen,
    };
  }
  tick(now: any, character: any): void {
    let target: any, fired: any;
    if (!this.enabled || !this.battleScreen || !this.autoAttack) {
      return;
    }
    if (now - this.lastFireTime < this.fireIntervalMs) {
      return;
    }
    if (!character || character.isNull()) {
      return;
    }
    if (!(target = this.tracker.pickKillauraTarget(now))) {
      return;
    }
    try {
      this.battleScreen.add(4160).writeS32(target.x);
      this.battleScreen.add(4164).writeS32(target.y);
      this.battleScreen.add(4148).writeS32(target.id);
      fired = this.autoAttack(this.battleScreen, character);
      this.lastFireTime = now;
      if (fired) {
        ++this.fireCount;
      }
      return;
    } catch (error) {
      return;
    }
  }
}
