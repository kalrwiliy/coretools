import { attachHook, scheduleInterval, cancelInterval } from "../../runtime/lifecycle";
import { onDispose } from "../../runtime/lifecycle";
import { runtimeState } from "../../runtime/controllers";
import { chooseEscapePoint } from "./DodgePlanner";
import { JoystickController } from "./JoystickController";
import { ProjectileTracker } from "./ProjectileTracker";
import { nowMs, readGameString } from "./memory";
import { offsets as OFFSETS } from "./offsets";
import { lookupProjectileRange } from "./projectileRanges";
let autoDodgeEnabled = false;
let dodgeFlagE = false;
let mapFlipByte = -1;
const dodgeStats = { fromState: 0, toState: 0, statCounter: 0 };
const UNUSED_ZERO = 0;
export function installAutoDodge(): boolean {
  let degreesToRadians: number,
    libgModule: any,
    base: any,
    getDataName: any,
    natives: any,
    projectileTracker: ProjectileTracker,
    ownTeam: any,
    battle: any,
    DIRECTION_SAMPLES: any,
    ARRIVE_RADIUS: any,
    MAP_FLIP_FLAG_OFFSET: any,
    escapeTarget: any,
    joystick: any;
  function readMapFlipped(): boolean {
    try {
      return (mapFlipByte = base.add(MAP_FLIP_FLAG_OFFSET).readU8()) !== 0;
    } catch (error) {
      return false;
    }
  }
  function releaseJoystick(): void {
    if (joystick === null) return;
    try {
      joystick.stop();
      joystick.restore();
    } catch (error) {}
    joystick = null;
    return;
  }
  if (!(libgModule = Process.findModuleByName("libg.so"))) return false;
  base = libgModule.base;
  getDataName = new NativeFunction(base.add(15858888), "pointer", ["pointer"]);
  natives = {
    GAMEOBJ_GET_DATA: new NativeFunction(base.add(OFFSETS.GAMEOBJ_GET_DATA), "pointer", [
      "pointer",
    ]),
    projectileSpeed: new NativeFunction(base.add(OFFSETS.PROJECTILE_DATA_GET_SPEED), "uint32", [
      "pointer",
    ]),
    projectileRadius: new NativeFunction(base.add(OFFSETS.PROJECTILE_DATA_GET_RADIUS), "uint32", [
      "pointer",
    ]),
    GAMEOBJ_GET_X: new NativeFunction(base.add(OFFSETS.GAMEOBJ_GET_X), "uint32", ["pointer"]),
    GAMEOBJ_GET_Y: new NativeFunction(base.add(OFFSETS.GAMEOBJ_GET_Y), "uint32", ["pointer"]),
    GAMEOBJ_GET_GLOBAL_ID: new NativeFunction(base.add(OFFSETS.GAMEOBJ_GET_GLOBAL_ID), "uint32", [
      "pointer",
    ]),
    BATTLE_GET_OWN_CHARACTER: new NativeFunction(
      base.add(OFFSETS.BATTLE_GET_OWN_CHARACTER),
      "pointer",
      ["pointer"],
    ),
    BATTLE_GET_OWN_TEAM: new NativeFunction(base.add(OFFSETS.BATTLE_GET_OWN_TEAM), "uint32", [
      "pointer",
    ]),
  };
  attachHook(base.add(OFFSETS.BATTLE_TICK), {
    onEnter: function (args: any) {
      let player: any;
      try {
        if ((battle = args[0]).isNull()) {
          return undefined;
        }
        if ((player = natives.BATTLE_GET_OWN_CHARACTER(battle)).isNull()) {
          if (projectileTracker.entries.size > 0 || escapeTarget !== null || joystick !== null) {
            projectileTracker.entries.clear();
            escapeTarget = null;
            joystick = null;
          }
          return undefined;
        }
        ownTeam = natives.BATTLE_GET_OWN_TEAM(battle);
        return;
      } catch (error) {
        return;
      }
    },
  });
  attachHook(base.add(16622280), {
    onEnter: function (args: any) {
      let proj: any,
        data: any,
        id: any,
        known: any,
        ownerIdx: any,
        nameStr: any,
        name: any,
        range: any;
      let speed: any,
        radius: any,
        startX: any,
        startY: any,
        rawAng: any,
        ang: any,
        endX: any,
        endY: any,
        now: any,
        lifeMs: any;
      try {
        if ((proj = args[0]).isNull()) {
          return undefined;
        }
        if ((data = natives.GAMEOBJ_GET_DATA(proj)).isNull()) {
          return undefined;
        }
        if (!data.readPointer().equals(base.add(21162640))) {
          return undefined;
        }
        if ((id = Number(natives.GAMEOBJ_GET_GLOBAL_ID(proj))) === 0) {
          return undefined;
        }
        if (projectileTracker.entries.has(id)) {
          known = projectileTracker.entries.get(id);
          if (nowMs() - known.spawnTime >= known.lifetimeMs) {
            projectileTracker.entries.delete(id);
          } else {
            return undefined;
          }
        }
        if ((ownerIdx = proj.add(OFFSETS.GAMEOBJ_TEAM_FIELD).readU32()) === ownTeam) {
          return undefined;
        }
        if ((nameStr = data.add(104).readPointer()).isNull()) {
          return undefined;
        }
        name = readGameString(getDataName(nameStr));
        if ((range = lookupProjectileRange(name)) === 0) {
          return undefined;
        }
        speed = natives.projectileSpeed(data);
        radius = natives.projectileRadius(data);
        startX = natives.GAMEOBJ_GET_X(proj);
        startY = natives.GAMEOBJ_GET_Y(proj);
        if (startX > 2147483000 || startY > 2147483000) {
          return undefined;
        }
        ang = (rawAng = proj.add(OFFSETS.PROJECTILE_ANGLE_FIELD).readS32()) * degreesToRadians;
        endX = startX + Math.cos(ang) * range;
        endY = startY + Math.sin(ang) * range;
        now = nowMs();
        lifeMs = (range / speed) * 1000;
        projectileTracker.entries.set(id, {
          object: proj,
          data: data,
          speed: speed,
          radius: radius,
          spawnTime: now,
          lifetimeMs: lifeMs,
          name: name,
          range: range,
          startX: startX,
          startY: startY,
          endX: endX,
          endY: endY,
        });
        return;
      } catch (error) {
        return;
      }
    },
  });
  attachHook(base.add(OFFSETS.BATTLESCREEN_UPDATE_MOVE_INPUT), {
    onEnter: function (args: any) {
      let screen: any,
        character: any,
        now: any,
        data: any,
        px: any,
        py: any,
        radius: any,
        threatened: any;
      let dx0: any, dy0: any, reached: any, speed: any, threats: any, dx: any, dy: any;
      if (!autoDodgeEnabled) {
        escapeTarget = null;
        releaseJoystick();
        return;
      }
      try {
        screen = args[0];
        character = args[2];
        if (screen.isNull() || character.isNull()) {
          return undefined;
        }
        now = nowMs();
        projectileTracker.entries.forEach(function (projectile: any, id: any) {
          if (now - projectile.spawnTime >= projectile.lifetimeMs) {
            projectileTracker.entries.delete(id);
          }
          return;
        });
        if ((data = natives.GAMEOBJ_GET_DATA(character)).isNull()) {
          return undefined;
        }
        px = natives.GAMEOBJ_GET_X(character);
        py = natives.GAMEOBJ_GET_Y(character);
        radius = data.add(684).readU32();
        if ((threatened = projectileTracker.isPointSafe(px, py, radius))) {
          escapeTarget = null;
          releaseJoystick();
          return undefined;
        }
        if (escapeTarget !== null) {
          dx0 = escapeTarget.x - px;
          dy0 = escapeTarget.y - py;
          if (
            (reached = dx0 * dx0 + dy0 * dy0 < ARRIVE_RADIUS * ARRIVE_RADIUS) ||
            !projectileTracker.isPointSafe(escapeTarget.x, escapeTarget.y, radius)
          ) {
            escapeTarget = null;
          }
        }
        if (escapeTarget === null) {
          speed = data.add(620).readU32();
          threats = projectileTracker.snapshotThreats();
          if (
            (escapeTarget = chooseEscapePoint(
              threats,
              px,
              py,
              radius,
              speed,
              DIRECTION_SAMPLES,
            )) === null
          ) {
            releaseJoystick();
            return undefined;
          }
        }
        dx = escapeTarget.x - px;
        dy = escapeTarget.y - py;
        if (dx * dx + dy * dy < 1) {
          return undefined;
        }
        if (readMapFlipped()) {
          dx = -dx;
          dy = -dy;
        }
        if (joystick === null) {
          joystick = new JoystickController(screen);
        }
        if (!joystick.move(dx, dy)) {
          releaseJoystick();
        }
        return;
      } catch (error) {
        escapeTarget = null;
        releaseJoystick();
      }
      return;
    },
  });
  projectileTracker = new ProjectileTracker(natives, OFFSETS.PROJECTILE_ANGLE_FIELD);
  ownTeam = -1;
  battle = null;
  degreesToRadians = Math.PI / 180;
  DIRECTION_SAMPLES = 21;
  ARRIVE_RADIUS = 10;
  MAP_FLIP_FLAG_OFFSET = 22122160;
  escapeTarget = null;
  joystick = null;
  onDispose(() => {
    autoDodgeEnabled = false;
    escapeTarget = null;
    if (joystick !== null) joystick.dispose();
    joystick = null;
    projectileTracker.entries.clear();
  });
  return true;
}
export function initAutoDodge(): void {
  autoDodgeEnabled = false;
  dodgeFlagE = false;
  mapFlipByte = -1;
  runtimeState.autoDodgeApi = {
    enable: function () {
      autoDodgeEnabled = true;
      dodgeFlagE = false;
    },
    disable: function () {
      autoDodgeEnabled = false;
      dodgeFlagE = false;
    },
    setEnabled: function (enabled: any) {
      if (enabled) {
        this.enable();
        return;
      }
      this.disable();
      return;
    },
    setOption4: function (enabled: any) {},
    getStatus: function () {
      return {
        active: autoDodgeEnabled,
        dodging: dodgeFlagE,
        statZero: Math.round(UNUSED_ZERO),
        transition: dodgeStats.fromState + "->" + dodgeStats.toState,
        statCounter: dodgeStats.statCounter,
        mapFlipByte: mapFlipByte,
      };
    },
  };
  (function retryInstall() {
    let tries: any, timer: any;
    tries = 0;
    timer = scheduleInterval(function () {
      ++tries;
      if (installAutoDodge()) {
        cancelInterval(timer);
        return;
      }
      if (tries > 120) {
        cancelInterval(timer);
      }
      return;
    }, 500);
  })();
}
