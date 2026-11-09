import { attachHook, scheduleInterval, cancelInterval } from "../runtime/lifecycle";
export function whenLibgLoaded(onLoaded: any): void {
  function fire(mod: any): void {
    if (fired || !mod) return;
    fired = true;
    onLoaded(mod);
  }
  var fired: boolean, mod: any, names: string[], idx: number, fn: any, ticks: number, timer: any;
  fired = false;
  if ((mod = Process.findModuleByName("libg.so"))) return fire(mod);
  names = ["android_dlopen_ext", "dlopen"];
  for (idx = 0; idx < names.length; idx++) {
    try {
      if (!(fn = Module.findGlobalExportByName(names[idx]))) continue;
      attachHook(fn, {
        onLeave: function () {
          if (!fired) fire(Process.findModuleByName("libg.so"));
        },
      });
    } catch (error) {}
  }
  ticks = 0;
  timer = scheduleInterval(function () {
    let found: any;
    ++ticks;
    if ((found = Process.findModuleByName("libg.so"))) {
      cancelInterval(timer);
      fire(found);
      return;
    }
    if (ticks > 2000) cancelInterval(timer);
  }, 10);
  return;
}
