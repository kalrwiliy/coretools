import { attachHook, scheduleInterval, cancelInterval } from "../../runtime/lifecycle";
import { onDispose } from "../../runtime/lifecycle";
import { runtimeState } from "../../runtime/controllers";
import { Aimbot } from "./Aimbot";
import { EnemyTracker } from "./EnemyTracker";
import { Killaura } from "./Killaura";
import { offsets as OFFSETS } from "./offsets";
let libgModule: Module | null = null;
let pollTries = 0;
let pollTimer: ReturnType<typeof setInterval>;
export function installCombat(): void {
  const enemyTracker = new EnemyTracker();
  let base: any, nativeAt: any, aimbot: Aimbot;
  let killaura: Killaura;
  base = libgModule!.base;
  nativeAt = function (offset: any, returnType: any, argumentTypes: any): any {
    return new NativeFunction(base.add(offset), returnType, argumentTypes);
  };
  enemyTracker.natives = {
    GAMEOBJ_GET_X: nativeAt(OFFSETS.GAMEOBJ_GET_X, "uint32", ["pointer"]),
    GAMEOBJ_GET_Y: nativeAt(OFFSETS.GAMEOBJ_GET_Y, "uint32", ["pointer"]),
    GAMEOBJ_GET_DATA: nativeAt(OFFSETS.GAMEOBJ_GET_DATA, "pointer", ["pointer"]),
    GAMEOBJ_GET_GLOBAL_ID: nativeAt(OFFSETS.GAMEOBJ_GET_GLOBAL_ID, "uint32", ["pointer"]),
    BATTLE_GET_OWN_CHARACTER: nativeAt(OFFSETS.BATTLE_GET_OWN_CHARACTER, "pointer", ["pointer"]),
    BATTLE_GET_OWN_TEAM: nativeAt(OFFSETS.BATTLE_GET_OWN_TEAM, "uint32", ["pointer"]),
    PROJECTILE_DATA_GET_SPEED: nativeAt(OFFSETS.PROJECTILE_DATA_GET_SPEED, "uint32", ["pointer"]),
    PROJECTILE_DATA_GET_RADIUS: nativeAt(OFFSETS.PROJECTILE_DATA_GET_RADIUS, "uint32", ["pointer"]),
    PROJECTILE_DATA_GET_FLAG_1E9: nativeAt(OFFSETS.PROJECTILE_DATA_GET_FLAG_1E9, "bool", [
      "pointer",
    ]),
    CHARACTER_DATA_GET_SPEED: nativeAt(OFFSETS.CHARACTER_DATA_GET_SPEED, "int", ["pointer"]),
    CHARACTER_GET_WEAPON_SKILL: nativeAt(OFFSETS.CHARACTER_GET_WEAPON_SKILL, "pointer", [
      "pointer",
    ]),
    SKILL_GET_PROJECTILE_AT: nativeAt(OFFSETS.SKILL_GET_PROJECTILE_AT, "pointer", [
      "pointer",
      "int",
    ]),
    SKILL_GET_CASTING_RANGE: (skill: NativePointer) => skill.add(0x27c).readS32(),
    PROJECTILE_DATA_GET_120: nativeAt(OFFSETS.PROJECTILE_DATA_GET_120, "uint32", ["pointer"]),
    PROJECTILE_DATA_GET_224: nativeAt(OFFSETS.PROJECTILE_DATA_GET_224, "int", ["pointer"]),
    CHARACTER_DATA_GET_RADIUS: nativeAt(OFFSETS.CHARACTER_DATA_GET_RADIUS, "uint32", ["pointer"]),
    STRUCT_CLEAR_1068F44: nativeAt(OFFSETS.STRUCT_CLEAR_1068F44, "pointer", ["pointer", "int"]),
    UNUSED_FN_B7BF68: nativeAt(OFFSETS.UNUSED_FN_B7BF68, "void", ["pointer", "pointer"]),
    GET_CLIENT_BATTLE: nativeAt(OFFSETS.GET_CLIENT_BATTLE, "pointer", []),
    OPERATOR_NEW: nativeAt(OFFSETS.OPERATOR_NEW, "pointer", ["ulong"]),
    battleSetPendingInput: nativeAt(OFFSETS.BATTLE_SET_PENDING_INPUT, "void", [
      "pointer",
      "int",
      "int",
      "int",
    ]),
    BATTLE_GET_F8: nativeAt(OFFSETS.BATTLE_GET_F8, "pointer", ["pointer"]),
    UNUSED_FN_EB0488: nativeAt(OFFSETS.UNUSED_FN_EB0488, "pointer", ["pointer", "int", "int"]),
  };
  enemyTracker.projectileDataVtable = base.add(OFFSETS.PROJECTILE_DATA_VTABLE);
  enemyTracker.player = {
    x: 0,
    y: 0,
    moveSpeed: 720,
    radius: 60,
    battle: null,
    lastTickTime: 0,
  };
  aimbot = new Aimbot(enemyTracker);
  enemyTracker.TUNING = {
    maxLeadTime: 1.15,
    speedClampFactor: 1.35,
    weaponRefreshMs: 250,
  };
  enemyTracker.trackers = new Map();
  enemyTracker.weapon = { projectileSpeed: 4000, radius: 300, attackRange: 0 };
  enemyTracker.targetObject = null;
  enemyTracker.targetId = null;
  enemyTracker.lastWeaponRefresh = 0;
  attachHook(base.add(OFFSETS.BATTLESCREEN_USE_SKILL_AT), {
    onEnter: function (args: any) {
      let target: any;
      if (args[0]) {
        if (!args[0].isNull()) {
          killaura.battleScreen = args[0];
        }
      }
      if (!aimbot.active) {
        return;
      }
      try {
        // Preserve the argument read and its failure boundary before rewriting aim.
        args[6].toInt32();
        if (
          !(target = enemyTracker.pickAimbotTarget(enemyTracker.player.x, enemyTracker.player.y))
        ) {
          return undefined;
        }
        enemyTracker.targetObject = target.object;
        enemyTracker.targetId = target.id;
        args[1] = ptr(target.x);
        args[2] = ptr(target.y);
        return;
      } catch (error) {
        return;
      }
    },
  });
  attachHook(base.add(OFFSETS.BATTLESCREEN_FIND_AUTOAIM_TARGET), {
    onLeave: function (result: any) {
      if (!aimbot.active) {
        return;
      }
      if (!enemyTracker.targetObject || enemyTracker.targetObject.isNull()) {
        return;
      }
      try {
        result.replace(enemyTracker.targetObject);
      } catch (error) {}
      return;
    },
  });
  runtimeState.aimbotApi = {
    enable: () => aimbot.enable(),
    disable: () => aimbot.disable(),
    getStatus: () => aimbot.getStatus(),
  };
  killaura = new Killaura(enemyTracker);
  onDispose(() => {
    aimbot.disable();
    killaura.enabled = false;
    killaura.battleScreen = null;
    enemyTracker.trackers.clear();
    enemyTracker.targetObject = null;
    enemyTracker.targetId = null;
  });
  killaura.autoAttack = null;
  try {
    killaura.autoAttack = nativeAt(12798588, "int", ["pointer", "pointer"]);
  } catch (error) {}
  attachHook(base.add(12791616), {
    onEnter: function (args: any) {
      killaura.battleScreen = args[0];
    },
  });
  attachHook(base.add(12798812), {
    onEnter: function (args: any) {
      if (args[0]) {
        if (!args[0].isNull()) {
          killaura.battleScreen = args[0];
        }
      }
    },
  });
  runtimeState.killauraApi = {
    toggle: () => killaura.toggle(),
    getStatus: () => killaura.getStatus(),
  };
  attachHook(base.add(OFFSETS.BATTLE_TICK), {
    onEnter: function (args: any) {
      let battle: any, now: any, character: any, team: any, x: any, y: any, characterData: any;
      try {
        if (!(battle = args[0]) || battle.isNull()) {
          return undefined;
        }
        now = Date.now();
        if (
          !(character = enemyTracker.natives.BATTLE_GET_OWN_CHARACTER(battle)) ||
          character.isNull()
        ) {
          return undefined;
        }
        team = enemyTracker.natives.BATTLE_GET_OWN_TEAM(battle);
        enemyTracker.player.battle = battle;
        x = enemyTracker.natives.GAMEOBJ_GET_X(character);
        y = enemyTracker.natives.GAMEOBJ_GET_Y(character);
        enemyTracker.player.x = x;
        enemyTracker.player.y = y;
        try {
          if (
            (characterData = enemyTracker.natives.GAMEOBJ_GET_DATA(character)) &&
            !characterData.isNull()
          ) {
            enemyTracker.player.moveSpeed =
              enemyTracker.natives.CHARACTER_DATA_GET_SPEED(characterData) || 720;
            enemyTracker.player.radius =
              enemyTracker.natives.CHARACTER_DATA_GET_RADIUS(characterData) || 60;
          }
        } catch (error) {}
        enemyTracker.player.lastTickTime = now;
        if (!enemyTracker.lastScanTime) {
          enemyTracker.lastScanTime = 0;
        }
        if (now - enemyTracker.lastScanTime >= 30) {
          enemyTracker.lastScanTime = now;
          enemyTracker.scanEnemies(battle, team, now);
        }
        if (killaura.enabled) {
          killaura.tick(now, character);
        }
        return;
      } catch (error) {
        return;
      }
    },
  });
  return;
}
export function forwardAutoDodgeState(enabled: any): void {
  try {
    if (runtimeState.autoDodgeApi) {
      runtimeState.autoDodgeApi.setEnabled(enabled);
    }
    return;
  } catch (error) {
    return;
  }
}
export function initCombat(): void {
  libgModule = null;
  pollTries = 0;
  pollTimer = scheduleInterval(function () {
    ++pollTries;
    if ((libgModule = Process.findModuleByName("libg.so"))) {
      cancelInterval(pollTimer);
      installCombat();
      return;
    }
    if (pollTries > 120) {
      cancelInterval(pollTimer);
    }
    return;
  }, 500);
}
