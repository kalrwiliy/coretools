import { attachHook, cancelInterval, scheduleInterval } from "../../runtime/lifecycle";
import { getFeatureLibgBase } from "../debug/libg";
export class ChatSpam {
  enabled = false;
  private managerSlot: NativePointer | null = null;
  private sendMessage: any = null;
  private captured: {
    text: string;
    manager: string;
  } | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private constructMessage: any = null;
  private constructString: any = null;
  private allocate: any = null;
  private replaying = false;
  private hook: InvocationListener | null = null;
  dispose(): void {
    this.enabled = false;
    this.stop();
    this.captured = null;
    this.managerSlot = null;
    this.replaying = false;
  }
  hasCapturedText(): boolean {
    return !!this.captured;
  }
  toggle(): string {
    if (!this.enabled) {
      const result = this.start();
      this.enabled = result.indexOf("ON") >= 0;
      return result;
    }
    this.enabled = false;
    return this.stop();
  }
  install(): void {
    try {
      const base = getFeatureLibgBase();
      if (!base) return;
      this.managerSlot = base.add(0x151a748);
      this.sendMessage = new NativeFunction(base.add(0xb9d3d4), "void", ["pointer", "pointer"]);
      this.constructMessage = new NativeFunction(base.add(0x1054f08), "void", ["pointer"]);
      this.constructString = new NativeFunction(base.add(0x6af294), "void", ["pointer", "pointer"]);
      this.allocate = new NativeFunction(
        Process.getModuleByName("libc.so").getExportByName("malloc"),
        "pointer",
        ["uint"],
      );
      if (this.hook) return;
      this.hook = attachHook(base.add(0xb9d3d4), {
        onEnter: (args: any) => {
          if (this.replaying) return;
          try {
            const message = args[1];
            if (!message.readPointer().equals(base.add(0x1435c20))) return;
            const text = message.add(144);
            const length = text.add(4).readS32();
            if (length < 1 || length > 4096) return;
            const bytes = length < 8 ? text.add(8) : text.add(8).readPointer();
            const value = bytes.readUtf8String(length);
            if (value !== null) this.captured = { text: value, manager: args[0].toString() };
          } catch (_) {}
        },
      });
    } catch (error) {
      this.sendMessage = null;
    }
  }
  start(): string {
    if (!this.sendMessage || !this.managerSlot) this.install();
    if (!this.sendMessage || !this.managerSlot) return "Chat Spam: sender not ready";
    if (!this.captured || typeof this.captured.text !== "string")
      return "Chat Spam: send a team/club text first";
    if (this.timer) cancelInterval(this.timer);
    this.timer = scheduleInterval(() => {
      try {
        const manager = this.managerSlot!.readPointer();
        if (manager.isNull() || manager.toString() !== this.captured!.manager) {
          this.stop();
          this.enabled = false;
          this.captured = null;
          return;
        }
        const message = this.allocate(160);
        if (message.isNull()) return;
        this.constructMessage(message);
        this.constructString(message.add(144), Memory.allocUtf8String(this.captured!.text));
        this.replaying = true;
        try {
          this.sendMessage(manager, message);
        } finally {
          this.replaying = false;
        }
      } catch (error) {
        this.stop();
        this.enabled = false;
      }
    }, 800);
    return "Chat Spam: ON (800ms, last outgoing text)";
  }
  stop(): string {
    if (this.timer) {
      cancelInterval(this.timer);
      this.timer = null;
    }
    return "Chat Spam: OFF";
  }
}
