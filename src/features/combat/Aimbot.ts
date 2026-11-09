import { EnemyTracker } from "./EnemyTracker";
export class Aimbot {
  active = false;
  constructor(private readonly tracker: EnemyTracker) {}
  enable(): void {
    this.active = true;
  }
  disable(): void {
    this.active = false;
    this.tracker.targetObject = null;
  }
  getStatus() {
    return {
      active: this.active,
      trackedCount: this.tracker.trackers.size,
      projectileSpeed: this.tracker.weapon.projectileSpeed,
      attackRange: this.tracker.weapon.attackRange,
      targetId: this.tracker.targetId,
    };
  }
}
