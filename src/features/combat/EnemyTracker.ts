// Signed teams include neutral training opponents (-1). Keep the current 30 ms scan and velocity smoothing.
/** Shared tracking and prediction state for aim and automatic attacks. */
export class EnemyTracker {
  natives: any;
  projectileDataVtable: NativePointer = NULL;
  player: any;
  TUNING: any;
  trackers: Map<number, any> = new Map();
  weapon: any;
  targetObject: NativePointer | null = null;
  targetId: number | null = null;
  lastWeaponRefresh = 0;
  lastScanTime = 0;
  updateVelocity(tracker: any, x: any, y: any, now: any): void {
    let elapsedMs: any,
      deltaX: any,
      deltaY: any,
      distance: any,
      velocityX: any,
      velocityY: any,
      measuredSpeed: any,
      speedLimit: any,
      velocityScale: any,
      smoothedSpeed: any;
    if (!tracker.lastSampleTime) {
      tracker.lastSampleTime = now;
      tracker.lastX = x;
      tracker.lastY = y;
      tracker.speed = 0;
      tracker.vx = 0;
      tracker.vy = 0;
      return;
    }
    if ((elapsedMs = now - tracker.lastSampleTime) < 50) {
      return;
    }
    deltaX = x - tracker.lastX;
    deltaY = y - tracker.lastY;
    distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    velocityX = 0;
    velocityY = 0;
    if (distance >= 25) {
      measuredSpeed = distance / (elapsedMs / 1000);
      if (tracker.maxSpeed > 0) {
        speedLimit = tracker.maxSpeed * this.TUNING.speedClampFactor;
        if (measuredSpeed > speedLimit) {
          measuredSpeed = speedLimit;
        }
        velocityScale = distance > 0 ? measuredSpeed / distance : 0;
        velocityX = deltaX * velocityScale;
        velocityY = deltaY * velocityScale;
      }
    }
    tracker.vx = (tracker.vx || 0) * 0.35 + velocityX * 0.65;
    tracker.vy = (tracker.vy || 0) * 0.35 + velocityY * 0.65;
    smoothedSpeed = Math.sqrt(tracker.vx * tracker.vx + tracker.vy * tracker.vy);
    if (distance < 25) {
      if (smoothedSpeed < tracker.maxSpeed * 0.25) {
        tracker.vx = 0;
        tracker.vy = 0;
        smoothedSpeed = 0;
      }
    }
    tracker.speed = smoothedSpeed;
    tracker.lastSampleTime = now;
    tracker.lastX = x;
    tracker.lastY = y;
  }
  scanEnemies(battle: any, ownTeam: any, now: any): void {
    let objectManager: any,
      objects: any,
      count: any,
      seen: any,
      index: any,
      object: any,
      data: any,
      dataVtable: any,
      team: any,
      field208: any,
      radius: any;
    let id: any, enemyX: any, y: any, tracker: any, nearestDistance: any, nearest: any;
    let ownCharacter: any,
      weaponSkill: any,
      projectileData: any,
      projectileSpeed: any,
      projectileRadius: any,
      castingRange: any;
    if (!(objectManager = battle.add(40).readPointer()) || objectManager.isNull()) {
      return;
    }
    objects = objectManager.add(0).readPointer();
    count = objectManager.add(12).readU32();
    if (!objects || objects.isNull() || count === 0 || count > 512) {
      return;
    }
    seen = {};
    for (index = 0; index < count; index++) {
      try {
        object = objects.add(index * 8).readPointer();
      } catch (error) {
        break;
      }
      if (!object || object.isNull()) continue;
      try {
        data = this.natives.GAMEOBJ_GET_DATA(object);
      } catch (error) {
        continue;
      }
      if (!data || data.isNull()) continue;
      try {
        dataVtable = data.readPointer();
      } catch (error) {
        continue;
      }
      if (!dataVtable || dataVtable.equals(this.projectileDataVtable)) continue;
      team = 0;
      field208 = 0;
      try {
        team = object.add(64).readS32();
        field208 = object.add(208).readU32();
      } catch (error) {
        continue;
      }
      radius = 0;
      try {
        radius = this.natives.CHARACTER_DATA_GET_RADIUS(data) | 0;
      } catch (error) {
        continue;
      }
      if (radius < 10 || radius > 400) continue;
      if (team === ownTeam) continue;
      if (team < -1 || team > 7) continue;
      try {
        id = this.natives.GAMEOBJ_GET_GLOBAL_ID(object);
      } catch (error) {
        continue;
      }
      if (!id) continue;
      seen[id] = 1;
      enemyX = this.natives.GAMEOBJ_GET_X(object);
      y = this.natives.GAMEOBJ_GET_Y(object);
      if (!(tracker = this.trackers.get(id))) {
        tracker = {
          id: id,
          object: object,
          x: enemyX,
          y: y,
          radius: 60,
          maxSpeed: 0,
          speed: 0,
          lastSampleTime: 0,
          lastX: enemyX,
          lastY: y,
        };
        this.trackers.set(id, tracker);
      }
      tracker.object = object;
      tracker.x = enemyX;
      tracker.y = y;
      try {
        tracker.radius = this.natives.CHARACTER_DATA_GET_RADIUS(data) || tracker.radius;
        tracker.maxSpeed = this.natives.CHARACTER_DATA_GET_SPEED(data) || tracker.maxSpeed;
      } catch (error) {}
      this.updateVelocity(tracker, enemyX, y, now);
    }
    this.trackers.forEach((tracker: any, id: any) => {
      if (!seen[id]) {
        this.trackers.delete(id);
      }
    });
    if (this.targetId && this.trackers.has(this.targetId)) {
      this.targetObject = this.trackers.get(this.targetId).object;
    } else {
      nearestDistance = Infinity;
      nearest = null;
      this.trackers.forEach((tracker: any) => {
        let deltaX: any;
        if (
          (deltaX =
            (tracker.x - this.player.x) * (tracker.x - this.player.x) +
            (tracker.y - this.player.y) * (tracker.y - this.player.y)) < nearestDistance
        ) {
          nearestDistance = deltaX;
          nearest = tracker;
        }
      });
      this.targetId = nearest ? nearest.id : null;
      this.targetObject = nearest ? nearest.object : null;
    }
    if (!(now - this.lastWeaponRefresh > this.TUNING.weaponRefreshMs)) {
      return;
    }
    this.lastWeaponRefresh = now;
    try {
      if (
        (ownCharacter = this.natives.BATTLE_GET_OWN_CHARACTER(battle)) &&
        !ownCharacter.isNull()
      ) {
        if (
          (weaponSkill = this.natives.CHARACTER_GET_WEAPON_SKILL(ownCharacter)) &&
          !weaponSkill.isNull()
        ) {
          if (
            (projectileData = this.natives.SKILL_GET_PROJECTILE_AT(weaponSkill, 0)) &&
            !projectileData.isNull()
          ) {
            if ((enemyX = this.natives.PROJECTILE_DATA_GET_SPEED(projectileData) | 0) > 0) {
              this.weapon.projectileSpeed = enemyX;
            }
            if (
              (projectileRadius = this.natives.PROJECTILE_DATA_GET_RADIUS(projectileData) | 0) > 0
            ) {
              this.weapon.radius = projectileRadius;
            }
          }
        }
        castingRange = this.natives.SKILL_GET_CASTING_RANGE(weaponSkill) | 0;
        this.weapon.attackRange = castingRange > 0 ? castingRange * 100 : 0;
      }
      return;
    } catch (error) {
      return;
    }
  }
  predictAimPoint(playerX: any, playerY: any, target: any): any {
    let aimX: any,
      aimY: any,
      initialFlightTime: any,
      combinedRadius: any,
      iteration: any,
      flightTime: any,
      deltaX: any,
      deltaY: any,
      distance: any,
      maximumRange: any;
    aimX = target.x;
    aimY = target.y;
    if (target.speed > 0) {
      if (target.maxSpeed > 0) {
        if (
          (initialFlightTime =
            Math.sqrt(
              (target.x - playerX) * (target.x - playerX) +
                (target.y - playerY) * (target.y - playerY),
            ) / this.weapon.projectileSpeed) > this.TUNING.maxLeadTime
        ) {
          initialFlightTime = this.TUNING.maxLeadTime;
        }
        combinedRadius = (target.radius || 60) + (this.weapon.radius || 100);
        if (target.speed * initialFlightTime > combinedRadius) {
          for (iteration = 0; iteration < 3; iteration++) {
            if (
              (flightTime =
                Math.sqrt(
                  (aimX - playerX) * (aimX - playerX) + (aimY - playerY) * (aimY - playerY),
                ) / this.weapon.projectileSpeed) > this.TUNING.maxLeadTime
            ) {
              flightTime = this.TUNING.maxLeadTime;
            }
            aimX = target.x + target.vx * flightTime;
            aimY = target.y + target.vy * flightTime;
          }
          if (!isFinite(aimX) || !isFinite(aimY)) {
            aimX = target.x;
            aimY = target.y;
          }
        }
      }
    }
    if (this.weapon.attackRange > 0) {
      deltaX = aimX - playerX;
      deltaY = aimY - playerY;
      distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      maximumRange = this.weapon.attackRange + target.radius;
      if (distance > maximumRange) {
        if (distance > 1) {
          aimX = playerX + (deltaX * maximumRange) / distance;
          aimY = playerY + (deltaY * maximumRange) / distance;
        }
      }
    }
    return { x: Math.round(aimX), y: Math.round(aimY) };
  }
  pickAimbotTarget(x: any, y: any): any {
    let nearest: any, nearestDistance: any, aim: any;
    nearest = null;
    nearestDistance = Infinity;
    this.trackers.forEach((tracker: any) => {
      let distanceSquared: any;
      if (
        (distanceSquared = (tracker.x - x) * (tracker.x - x) + (tracker.y - y) * (tracker.y - y)) <
        nearestDistance
      ) {
        nearestDistance = distanceSquared;
        nearest = tracker;
      }
    });
    if (!nearest) {
      return null;
    }
    aim = this.predictAimPoint(x, y, nearest);
    return { id: nearest.id, object: nearest.object, x: aim.x, y: aim.y };
  }
  pickKillauraTarget(now: any): any {
    let attackRange: any,
      searchRange: any,
      maximumDistance: any,
      nearest: any,
      nearestDistance: any,
      aim: any;
    attackRange = this.weapon.attackRange > 0 ? this.weapon.attackRange : 700;
    maximumDistance = (searchRange = attackRange + 150) * searchRange;
    nearest = null;
    nearestDistance = Infinity;
    this.trackers.forEach((tracker: any) => {
      let deltaX: any, deltaY: any, distanceSquared: any;
      deltaX = tracker.x - this.player.x;
      deltaY = tracker.y - this.player.y;
      if (
        (distanceSquared = deltaX * deltaX + deltaY * deltaY) < maximumDistance &&
        distanceSquared < nearestDistance
      ) {
        nearestDistance = distanceSquared;
        nearest = tracker;
      }
    });
    if (!nearest) {
      return null;
    }
    aim = this.predictAimPoint(this.player.x, this.player.y, nearest);
    return { id: nearest.id, x: aim.x, y: aim.y };
  }
}
