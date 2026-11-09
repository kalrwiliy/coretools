import { nowMs } from "./memory";
export class ProjectileTracker {
  readonly entries = new Map<number, any>();
  private readonly degreesToRadians = Math.PI / 180;
  constructor(
    private readonly natives: any,
    private readonly angleField: number,
  ) {}
  isPointSafe(x: any, y: any, radius: any): boolean {
    let entry: any,
      key: any,
      proj: any,
      elapsed: any,
      travelled: any,
      remaining: any,
      ang: any,
      cs: any,
      sn: any;
    let curX: any,
      curY: any,
      relX: any,
      relY: any,
      along: any,
      clamped: any,
      nearX: any,
      nearY: any,
      dx: any,
      dy: any,
      reach: any;
    const now = nowMs();
    for (entry of this.entries.entries()) {
      key = entry[0];
      proj = entry[1];
      try {
        if ((travelled = (elapsed = (now - proj.spawnTime) / 1000) * proj.speed) >= proj.range) {
          this.entries.delete(key);
          continue;
        }
        remaining = proj.range - travelled;
        ang = proj.object.add(this.angleField).readS32() * this.degreesToRadians;
        cs = Math.cos(ang);
        sn = Math.sin(ang);
        curX = proj.startX + cs * travelled;
        curY = proj.startY + sn * travelled;
        relX = x - curX;
        relY = y - curY;
        if ((along = relX * cs + relY * sn) < 0) {
          clamped = 0;
        } else if (along > remaining) {
          clamped = remaining;
        } else {
          clamped = along;
        }
        nearX = curX + cs * clamped;
        nearY = curY + sn * clamped;
        dx = x - nearX;
        dy = y - nearY;
        reach = proj.radius + radius + 80;
        if (dx * dx + dy * dy <= reach * reach) {
          return false;
        }
      } catch (error) {
        this.entries.delete(key);
      }
    }
    return true;
  }
  snapshotThreats(): any {
    let threats: any;
    threats = [];
    this.entries.forEach((projectile: any) => {
      let px: any, py: any, rawAng: any, ang: any, dx: any, dy: any, dist: any;
      try {
        px = this.natives.GAMEOBJ_GET_X(projectile.object);
        py = this.natives.GAMEOBJ_GET_Y(projectile.object);
        if (!isFinite(px) || !isFinite(py)) {
          return undefined;
        }
        ang = (rawAng = projectile.object.add(this.angleField).readS32()) * this.degreesToRadians;
        dx = px - projectile.startX;
        dy = py - projectile.startY;
        dist = Math.sqrt(dx * dx + dy * dy);
        threats.push({
          x: px,
          y: py,
          speed: projectile.speed,
          radius: projectile.radius,
          heading: ang,
          range: projectile.range,
          travelled: dist,
        });
        return;
      } catch (error) {
        return;
      }
    });
    return threats;
  }
}
