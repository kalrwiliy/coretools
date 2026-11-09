import { scheduleInterval } from "../../runtime/lifecycle";
import { isValidPtr } from "../../engine/memory";
import { getTextFieldByName } from "../../engine/movieClip";
import { currentStage } from "../../engine/stage";
import { findExport } from "../../platform/exports";
import { createTextLabel } from "../../ui/textLabel";
import { uiOwnership } from "../../webui/ownership";
import { readPrintableFile } from "../platform/files";
import { createScString } from "../platform/memory";
import { nativeUiBindings, nativeUiRuntime } from "../runtime/state";
import { addToStage } from "../widgets/display";
import { computeLayout } from "../widgets/layout";
export function mountLicenseTag(): boolean {
  if (uiOwnership.webViewAttached) return true;
  if (nativeUiRuntime.state.licenseTag) return true;
  try {
    let licenseCode = 0;
    const installGuid = readPrintableFile(
      "/data/data/com.supercell.brawlstars/files/install.guid",
      40,
    );
    if (installGuid.length >= 8) {
      licenseCode = 100000 + (parseInt(installGuid.slice(0, 8), 16) % 900000);
    }
    nativeUiRuntime.state.licenseCode = licenseCode;
    const now = Date.now();
    const licenseState = readPrintableFile(
      "/data/data/com.supercell.brawlstars/files/lic.state",
      40,
    );
    let activatedAt: any;
    if (!((activatedAt = parseInt(licenseState, 10)) > 0)) {
      activatedAt = now;
      try {
        const fopen = new NativeFunction(findExport("libc.so", "fopen")!, "pointer", [
          "pointer",
          "pointer",
        ]);
        const fputs = new NativeFunction(findExport("libc.so", "fputs")!, "int", [
          "pointer",
          "pointer",
        ]);
        const fclose = new NativeFunction(findExport("libc.so", "fclose")!, "int", ["pointer"]);
        const fileHandle: any = fopen(
          Memory.allocUtf8String("/data/data/com.supercell.brawlstars/files/lic.state"),
          Memory.allocUtf8String("w"),
        );
        if (fileHandle && !fileHandle.isNull()) {
          fputs(Memory.allocUtf8String(String(activatedAt)), fileHandle);
          fclose(fileHandle);
        }
      } catch (error) {}
    }
    nativeUiRuntime.licenseExpiresAt = activatedAt + 30 * 86400000;
    const scale = computeLayout().scale;
    const label: any =
      nativeUiRuntime.state.pendingLicenseTag ||
      createTextLabel(
        "Code: " + licenseCode + "\nactivated",
        Math.round(4 * scale),
        Math.round(36 * scale),
      );
    if (!isValidPtr(label)) {
      return false;
    }
    nativeUiRuntime.state.pendingLicenseTag = label;
    try {
      label.add(104).writeU8("È".charCodeAt(0));
    } catch (error) {}
    let textField: any = getTextFieldByName(label, "Text");
    if (!isValidPtr(textField)) {
      textField = getTextFieldByName(label, "text");
    }
    if (isValidPtr(textField)) {
      try {
        textField.add(176).writeS16(20);
      } catch (error) {}
      try {
        textField.add(12).writeU8("È".charCodeAt(0));
      } catch (error) {}
    }
    if (!addToStage(label)) {
      return false;
    }
    nativeUiRuntime.state.licenseTag = label;
    nativeUiRuntime.state.pendingLicenseTag = null;
    nativeUiRuntime.state.licenseTextField = textField;
    if (!nativeUiRuntime.state.licenseRefreshInterval) {
      nativeUiRuntime.state.licenseRefreshInterval = scheduleInterval(function () {
        const tag = nativeUiRuntime.state.licenseTag;
        const textField = nativeUiRuntime.state.licenseTextField;
        if (!tag || !isValidPtr(tag) || !textField || !isValidPtr(textField)) {
          return;
        }
        try {
          const left = nativeUiRuntime.licenseExpiresAt - Date.now();
          const remaining =
            left <= 0
              ? "expired"
              : Math.floor(left / 86400000) + "d " + Math.floor((left % 86400000) / 3600000) + "h";
          nativeUiBindings.textFieldSetText(
            textField,
            createScString(
              "Code: " + (nativeUiRuntime.state.licenseCode | 0) + "\nactivated | " + remaining,
            ),
          );
        } catch (error) {}
      }, 60000);
    }
    return true;
  } catch (error) {
    return false;
  }
}
export function mountBuildTag(): boolean {
  if (uiOwnership.webViewAttached) return true;
  let gameStateManager: any,
    libgStart: any,
    libgEnd: any,
    managerOffset: any,
    candidate: any,
    childCount: any,
    childOffset: any,
    nestedCandidate: any,
    nestedChildCount: any,
    ancestor: any,
    depth: any,
    ancestorVtables: any;
  let parent: any,
    parentVtable: any,
    parentChildCount: any,
    scale: any,
    label: any,
    textField: any,
    alpha: any,
    textColor: any;
  let readVtableInLibg: (r: any) => any, readChildCount: (r: any) => any;
  if (nativeUiRuntime.state.buildTag) return true;
  const liveRoot = currentStage();
  if (!liveRoot.isNull()) nativeUiRuntime.state.gameStage = liveRoot;
  // Wait for a stage before allocating another label on every watchdog tick.
  if (!nativeUiRuntime.state.gameStage && !nativeUiRuntime.state.gameStateManager) {
    try {
      nativeUiRuntime.state.gameStateManager = nativeUiBindings.getGameStateManager();
    } catch (error) {}
  }
  if (!nativeUiRuntime.state.gameStateManager) {
    try {
      if (
        (gameStateManager = nativeUiBindings.getGameStateManager()) &&
        !gameStateManager.isNull()
      ) {
        nativeUiRuntime.state.gameStateManager = gameStateManager;
      }
    } catch (error) {}
  }
  if (
    !nativeUiRuntime.state.gameStage &&
    (nativeUiRuntime.state.stageScanAttempts || 0) < 150 &&
    nativeUiRuntime.state.libgBase &&
    nativeUiRuntime.state.gameStateManager
  ) {
    nativeUiRuntime.state.stageScanAttempts = (nativeUiRuntime.state.stageScanAttempts || 0) + 1;
    try {
      readChildCount = function (node: any): any {
        try {
          return node.add(78).readU16();
        } catch (error) {
          return 65535;
        }
      };
      readVtableInLibg = function (node: any): any {
        let vtable: any;
        try {
          return (vtable = node.readPointer()).compare(libgStart) > 0 && vtable.compare(libgEnd) < 0
            ? vtable
            : null;
        } catch (error) {
          return null;
        }
      };
      libgEnd = (libgStart = nativeUiRuntime.state.libgBase).add(23068672);
      for (
        managerOffset = 0;
        managerOffset <= 608 && !nativeUiRuntime.state.gameStage;
        managerOffset += 8
      ) {
        candidate = null;
        try {
          candidate = nativeUiRuntime.state.gameStateManager.add(managerOffset).readPointer();
        } catch (error) {}
        if (!candidate || candidate.isNull() || !readVtableInLibg(candidate)) continue;
        if ((childCount = readChildCount(candidate)) > 0 && childCount < 300) {
          nativeUiRuntime.state.gameStage = candidate;
          break;
        }
        for (
          childOffset = 16;
          childOffset <= 384 && !nativeUiRuntime.state.gameStage;
          childOffset += 8
        ) {
          nestedCandidate = null;
          try {
            nestedCandidate = candidate.add(childOffset).readPointer();
          } catch (error) {}
          if (!nestedCandidate || nestedCandidate.isNull() || !readVtableInLibg(nestedCandidate))
            continue;
          if ((nestedChildCount = readChildCount(nestedCandidate)) > 0 && nestedChildCount < 300) {
            nativeUiRuntime.state.gameStage = nestedCandidate;
            break;
          }
        }
      }
      if (nativeUiRuntime.state.gameStage) {
        try {
          nativeUiRuntime.state.sceneStage = nativeUiRuntime.state.gameStage;
          ancestor = nativeUiRuntime.state.gameStage;
          depth = 0;
          ancestorVtables = [];
          while (depth < 12) {
            parent = null;
            try {
              parent = ancestor.add(56).readPointer();
            } catch (error) {}
            if (!parent || parent.isNull()) break;
            parentVtable = null;
            try {
              parentVtable = parent.readPointer();
            } catch (error) {}
            if (
              !parentVtable ||
              parentVtable.compare(libgStart) <= 0 ||
              parentVtable.compare(libgEnd) >= 0
            )
              break;
            if ((parentChildCount = readChildCount(parent)) === 0 || parentChildCount >= 300) break;
            ancestorVtables.push(parentVtable.sub(libgStart));
            ancestor = parent;
            depth++;
          }
          if (depth > 0) {
            nativeUiRuntime.state.gameStage = ancestor;
          }
        } catch (error) {}
      }
    } catch (error) {}
  }
  try {
    scale = computeLayout().scale;
    if (!isValidPtr(nativeUiRuntime.state.gameStage)) return false;
    label =
      nativeUiRuntime.state.pendingBuildTag ||
      createTextLabel(
        "@CT-prodbuild-10281728910-2026-9-14.36",
        Math.round(4 * scale),
        Math.round(19 * scale),
      );
    if (isValidPtr(label)) nativeUiRuntime.state.pendingBuildTag = label;
    if (!isValidPtr(label)) {
      return false;
    }
    try {
      textField = getTextFieldByName(label, "Text");
      if (!isValidPtr(textField)) textField = getTextFieldByName(label, "text");
      if (isValidPtr(textField)) {
        textField.add(176).writeS16(20);
        try {
          alpha = parseInt("200", 10);
          textColor = parseInt("C8FFFFFF", 16);
          textField.add(128).writeU32(textColor);
          textField.add(212).writeU32(textColor);
          textField.add(96).writeU32(textColor);
          textField.add(12).writeU8(alpha);
        } catch (error) {}
      }
    } catch (error) {}
    try {
      label.add(104).writeU8("È".charCodeAt(0));
    } catch (error) {}
    if (!addToStage(label)) {
      if (
        nativeUiRuntime.state.sceneStage &&
        nativeUiRuntime.state.gameStage &&
        !nativeUiRuntime.state.gameStage.equals(nativeUiRuntime.state.sceneStage)
      ) {
        nativeUiRuntime.state.gameStage = nativeUiRuntime.state.sceneStage;
        try {
          if (addToStage(label)) {
            nativeUiRuntime.state.rootRejected = 1;
            nativeUiRuntime.state.buildTag = label;
            nativeUiRuntime.state.pendingBuildTag = null;
            nativeUiRuntime.state.buildTagAttachFailed = false;
            return true;
          }
        } catch (error) {}
        nativeUiRuntime.state.gameStage = nativeUiRuntime.state.sceneStage;
      }
      try {
        nativeUiRuntime.state.buildTagAttachFailed = true;
      } catch (error) {}
      return false;
    }
    nativeUiRuntime.state.buildTag = label;
    nativeUiRuntime.state.pendingBuildTag = null;
    nativeUiRuntime.state.buildTagAttachFailed = false;

    return true;
  } catch (error) {
    return false;
  }
}
export function mountFpsTag(): boolean {
  if (uiOwnership.webViewAttached) return true;
  let scale: any, label: any, textField: any, paintGreen: () => void;
  if (nativeUiRuntime.state.fpsTag) return true;
  try {
    scale = computeLayout().scale;
    label =
      nativeUiRuntime.state.pendingFpsTag ||
      createTextLabel("FPS: --", Math.round(4 * scale), Math.round(2 * scale));
    if (!isValidPtr(label)) return false;
    nativeUiRuntime.state.pendingFpsTag = label;
    textField = getTextFieldByName(label, "Text");
    if (!isValidPtr(textField)) textField = getTextFieldByName(label, "text");
    paintGreen = function (): void {
      let alpha: any, green: any;
      try {
        alpha = parseInt("200", 10);
        green = parseInt("C855CC55", 16);
        textField.add(128).writeU32(green);
        textField.add(212).writeU32(green);
        textField.add(96).writeU32(green);
        textField.add(12).writeU8(alpha);
      } catch (error) {}
    };
    if (isValidPtr(textField)) {
      try {
        textField.add(176).writeS16(20);
      } catch (error) {}
      paintGreen();
    }
    if (!addToStage(label)) return false;
    nativeUiRuntime.state.fpsTag = label;
    nativeUiRuntime.state.pendingFpsTag = null;
    nativeUiRuntime.state.fpsTextField = textField;
    if (!nativeUiRuntime.state.fpsRefreshInterval) {
      nativeUiRuntime.state.fpsRefreshInterval = scheduleInterval(function (): void {
        let tag: any, text: any;
        tag = nativeUiRuntime.state.fpsTag;
        text = nativeUiRuntime.state.fpsTextField;
        if (!tag || !isValidPtr(tag) || !text || !isValidPtr(text)) return;
        try {
          nativeUiBindings.textFieldSetText(
            text,
            createScString("FPS: " + (nativeUiRuntime.state.fps | 0)),
          );
        } catch (error) {}
      }, 1000);
    }
    return true;
  } catch (error) {
    return false;
  }
}
export function getFpsText(): string {
  let fps: any;
  if ((fps = nativeUiRuntime.state.fps | 0) > 0) return String(fps);
  return "-";
}
export function getFpsColor(fps: any): number {
  let value: any;
  if ((value = fps | 0) <= 0) return 4294967295;
  if (value >= 100) return 4278235391;
  if (value >= 50) return 4284922730;
  return 4294961979;
}
