import { outlineState } from "../nativeUi/runtime/state";
import { scheduleInterval } from "../runtime/lifecycle";
import { isDisposing, onDispose } from "../runtime/lifecycle";
import { menuStyleState } from "../menu/styles/selection";
import { uiOwnership } from "./ownership";
// Built-in stand-in for the Java class `ct/UI` (the HTML WebView overlay) for APKs that don't ship the
// mod's Java side. It speaks the same protocol as the real class:
//   agent -> UI : create(base64 html); commands appended to ctcmd.log ("code:N", "loaded", "show", "hide")
//   UI -> agent : page messages (CTBridge.post) appended to ctq.log, one per line
// The page calls `CTBridge.post(msg)`. Classes registered at runtime can't carry @JavascriptInterface, so
// a tiny JS shim maps CTBridge.post to prompt(), which a registered WebChromeClient intercepts.
import Java from "frida-java-bridge";
import { setVisible } from "../engine/displayObject";
import { nativeUiRuntime } from "../nativeUi/runtime/state";
import { runtimeState } from "../runtime/controllers";

const QUEUE_PATH = "/data/data/com.supercell.brawlstars/files/ctq.log";
const COMMAND_PATH = "/data/data/com.supercell.brawlstars/files/ctcmd.log";
const BRIDGE_PROMPT = "ct:bridge";
const BRIDGE_SHIM =
  '<script>window.CTBridge={post:function(m){prompt("' +
  BRIDGE_PROMPT +
  '",String(m));}};</script>';

let webView: any = null;
let hitRects: number[][] = [];
let created = false;
let attachmentPending = false;
let disposed = false;
let touchOverload: any = null;
let previousTouchImplementation: any = null;
let ownedTouchImplementation: any = null;
const cleanupTimeout = globalThis.setTimeout.bind(globalThis);
const cleanupClearTimeout = globalThis.clearTimeout.bind(globalThis);
let commandOffset = 0;
/** Java objects that must stay referenced for as long as the overlay lives. */
const retained: any[] = [];

/** Shows the overlay page from `htmlBase64`. Returns false if the UI could not be set up. */
export function createCtUiStub(htmlBase64: string): boolean {
  if (disposed || isDisposing() || !Java.available) return false;
  if (created || attachmentPending) return true;
  attachmentPending = true;
  try {
    commandOffset = File.readAllText(COMMAND_PATH).length;
  } catch (_) {
    commandOffset = 0;
  }
  try {
    Java.perform(function () {
      if (disposed || isDisposing()) {
        attachmentPending = false;
        return;
      }
      try {
        const activity = findForegroundActivity();
        if (!activity) {
          attachmentPending = false;
          return;
        }
        const html = preparePage(decodeBase64(htmlBase64));
        Java.scheduleOnMainThread(function () {
          if (disposed || isDisposing()) {
            attachmentPending = false;
            return;
          }
          try {
            attachWebView(activity, html);
            created = true;
            startCommandPump();
          } catch (_) {
            created = false;
          } finally {
            attachmentPending = false;
          }
        });
      } catch (_) {
        attachmentPending = false;
      }
    });
    return created || attachmentPending;
  } catch (_) {
    attachmentPending = false;
    return false;
  }
}

/** Restore the Java override immediately; remove Android views only on their UI thread. */
onDispose(() => {
  if (disposed) return;
  disposed = true;
  const errors: string[] = [];
  attachmentPending = false;
  created = false;
  hitRects = [];
  uiOwnership.webViewAttached = false;
  if (touchOverload) {
    try {
      if (touchOverload.implementation === ownedTouchImplementation)
        touchOverload.implementation = previousTouchImplementation;
    } catch (error) {
      errors.push(String(error));
    }
    touchOverload = null;
  }
  if (!Java.available) {
    if (webView !== null) errors.push("Java unavailable while WebView remains attached");
    if (errors.length) return Promise.reject(new Error(errors.join("; ")));
    return;
  }
  return new Promise<void>((resolve, reject) => {
    let expired = false;
    const deadline = cleanupTimeout(() => {
      expired = true;
      reject(new Error("WebView cleanup timed out waiting for the Android main thread"));
    }, 500);
    const finish = (error?: unknown) => {
      cleanupClearTimeout(deadline);
      if (error !== undefined) errors.push(String(error));
      if (errors.length) reject(new Error("WebView cleanup failed: " + errors.join("; ")));
      else resolve();
    };
    try {
      Java.perform(function () {
        if (expired) return;
        try {
          Java.scheduleOnMainThread(function () {
            if (expired) return;
            try {
              if (webView !== null) {
                const parent = webView.getParent();
                if (parent)
                  Java.cast(parent, Java.use("android.view.ViewGroup")).removeView(webView);
                for (const action of [
                  () => webView.stopLoading(),
                  () => webView.setWebChromeClient(null),
                  () => webView.destroy(),
                ]) {
                  try {
                    action();
                  } catch (error) {
                    errors.push(String(error));
                  }
                }
              }
              const objects = new Set<any>([webView, ...retained, chromeClientClass]);
              for (const object of objects) {
                try {
                  if (object && typeof object.$dispose === "function") object.$dispose();
                } catch (error) {
                  errors.push(String(error));
                }
              }
              webView = null;
              retained.length = 0;
              chromeClientClass = null;
            } catch (error) {
              // Retain wrappers if detachment failed; never release an attached view.
              finish(error);
              return;
            }
            finish();
          });
        } catch (error) {
          finish(error);
        }
      });
    } catch (error) {
      finish(error);
    }
  });
});

function decodeBase64(data: string): string {
  const Base64 = Java.use("android.util.Base64");
  const JString = Java.use("java.lang.String");
  return JString.$new(Base64.decode(data, 0), "UTF-8").toString();
}

/** Production mode (no preview background) and the CTBridge shim, injected before the page's scripts run. */
function preparePage(html: string): string {
  return html
    .replace('<html lang="en" class="preview">', '<html lang="en">')
    .replace("<head>", "<head>" + BRIDGE_SHIM);
}

function findForegroundActivity(): any {
  let found: any = null;
  Java.choose("android.app.Activity", {
    onMatch(activity: any) {
      try {
        if (!activity.isFinishing() && activity.hasWindowFocus()) found = activity;
        else if (!found && !activity.isFinishing()) found = activity;
      } catch (error) {}
    },
    onComplete() {},
  });
  return found;
}

function attachWebView(activity: any, html: string): void {
  if (disposed || isDisposing()) return;
  const WebView = Java.use("android.webkit.WebView");
  const LayoutParams = Java.use("android.view.ViewGroup$LayoutParams");
  const view = WebView.$new(activity);
  const settings = view.getSettings();
  settings.setJavaScriptEnabled(true);
  settings.setDomStorageEnabled(true);
  view.setBackgroundColor(0);
  const chromeClient = bridgeChromeClient().$new();
  retained.push(chromeClient);
  view.setWebChromeClient(chromeClient);
  view.loadDataWithBaseURL("file:///android_asset/", html, "text/html", "utf-8", null);
  activity.addContentView(view, LayoutParams.$new(-1, -1));
  webView = Java.retain(view);
  try {
    installTouchPassThrough();
  } catch (_) {}
  // This overlay owns the launchers; leave the native menu engines available for themes.
  uiOwnership.webViewAttached = true;
  for (const key of ["buildTag", "fpsTag", "licenseTag"]) {
    if (nativeUiRuntime.state && nativeUiRuntime.state[key])
      setVisible(nativeUiRuntime.state[key], false);
  }
  for (const owner of [runtimeState.debugButtonRef, runtimeState.settingsButtonRef]) {
    if (owner) {
      setVisible(owner.button, false);
      setVisible(owner.clip, false);
    }
  }
}

let chromeClientClass: any = null;
function bridgeChromeClient(): any {
  if (chromeClientClass) return chromeClientClass;
  chromeClientClass = Java.registerClass({
    name: "ct.stub.BridgeChromeClient",
    superClass: Java.use("android.webkit.WebChromeClient"),
    methods: {
      onJsPrompt: {
        returnType: "boolean",
        argumentTypes: [
          "android.webkit.WebView",
          "java.lang.String",
          "java.lang.String",
          "java.lang.String",
          "android.webkit.JsPromptResult",
        ],
        implementation(_view: any, _url: any, message: any, value: any, result: any): boolean {
          if (String(message) !== BRIDGE_PROMPT) return false;
          try {
            onBridgePost(String(value));
          } catch (error) {}
          result.confirm("");
          return true;
        },
      },
    },
  });
  return chromeClientClass;
}

/** `HIT:` lists the screen rects the page wants touches for; everything else goes to the agent queue. */
function onBridgePost(message: string): void {
  if (disposed || isDisposing()) return;
  if (message.indexOf("HIT:") === 0) {
    try {
      hitRects = JSON.parse(message.substring(4));
    } catch (error) {}
    return;
  }
  appendLine(QUEUE_PATH, message);
}

/** Touches that start outside every hit rect are not consumed, so they fall through to the game view. */
function installTouchPassThrough(): void {
  if (touchOverload || disposed || isDisposing()) return;
  const WebView = Java.use("android.webkit.WebView");
  const onTouchEvent = WebView.onTouchEvent.overload("android.view.MotionEvent");
  touchOverload = onTouchEvent;
  previousTouchImplementation = onTouchEvent.implementation;
  ownedTouchImplementation = function (this: any, event: any): boolean {
    if (
      !disposed &&
      !isDisposing() &&
      webView !== null &&
      this.equals(webView) &&
      event.getActionMasked() === 0 &&
      !isOverUi(event.getX(), event.getY())
    ) {
      return false;
    }
    return onTouchEvent.call(this, event);
  };
  onTouchEvent.implementation = ownedTouchImplementation;
}

function isOverUi(x: number, y: number): boolean {
  for (const rect of hitRects) {
    if (x >= rect[0] && y >= rect[1] && x <= rect[2] && y <= rect[3]) return true;
  }
  return false;
}

/** Forwards agent commands (ctcmd.log) to the page and keeps its FPS readout live. */
function startCommandPump(): void {
  scheduleInterval(function () {
    for (const line of readNewLines(COMMAND_PATH)) {
      if (line.indexOf("code:") === 0) sync({ code: line.substring(5) });
      else if (line.indexOf("style:") === 0) {
        const parts = line.split(":");
        sync({ style: parts[1], styleTs: Number(parts[2]) });
      } else if (line === "loaded") sync({ lic: "activated" });
      else if (line === "show") sync({ showMain: menuStyleState.current === "coretools" });
      else if (line === "hide") sync({ showMain: false });
      else if (line === "close_debug") sync({ showDbg: false });
    }
  }, 500);
  scheduleInterval(function () {
    const fps = nativeUiRuntime.state ? nativeUiRuntime.state.fps | 0 : 0;
    sync({ fps: fps, toggles: { 1: outlineState.outlineEnabled } });
  }, 1000);
}

function sync(state: object): void {
  evaluate("window.CTMenu&&CTMenu.sync(" + JSON.stringify(state) + ")");
}

function evaluate(script: string): void {
  if (webView === null || disposed || isDisposing()) return;
  Java.perform(function () {
    Java.scheduleOnMainThread(function () {
      if (webView === null || disposed || isDisposing()) return;
      try {
        webView.evaluateJavascript(script, null);
      } catch (error) {}
    });
  });
}

function readNewLines(path: string): string[] {
  let text: string;
  try {
    text = File.readAllText(path);
  } catch (error) {
    return [];
  }
  if (text.length < commandOffset) commandOffset = 0;
  const fresh = text.substring(commandOffset);
  commandOffset = text.length;
  return fresh
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function appendLine(path: string, line: string): void {
  try {
    const file = new File(path, "a");
    file.write(line + "\n");
    file.close();
  } catch (error) {}
}
