import Java from "frida-java-bridge";

export function copyToClipboard(text: any): boolean {
  try {
    Java.perform(function () {
      const activityThread: any = Java.use("android.app.ActivityThread");
      const ctx = activityThread.currentApplication().getApplicationContext();
      const ClipboardManager: any = Java.use("android.content.ClipboardManager");
      const ClipData: any = Java.use("android.content.ClipData");
      const clipboard: any = Java.cast(ctx.getSystemService("clipboard"), ClipboardManager);
      clipboard.setPrimaryClip(ClipData.newPlainText("id", String(text)));
    });
    return true;
  } catch (error) {
    return false;
  }
}

export function readPlayerId(): string {
  try {
    const result = { v: "" };
    Java.perform(function () {
      const activityThread: any = Java.use("android.app.ActivityThread");
      const ctx = activityThread.currentApplication().getApplicationContext();
      const prefs = ctx.getSharedPreferences("supercell_id", 0);
      const keys = ["scid", "player_id", "account_id", "tag", "playerTag"];
      for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
        const val = prefs.getString(keys[keyIndex], "");
        if (val && String(val).length > 0) {
          result.v = String(val);
          return;
        }
      }
      return;
    });
    if (result.v) return result.v;
  } catch (error) {}
  return "no-id";
}
