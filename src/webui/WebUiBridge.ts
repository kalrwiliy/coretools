import { nativeUiServices } from "../nativeUi/runtime/services";
import { toggleStates } from "../menu/settings/toggleState";
import { scheduleInterval } from "../runtime/lifecycle";
// Java UI bridge: obtains a JNIEnv (frida Java bridge, or a raw fallback that
// parses /proc/self/maps, probes stub JavaVM slots and resolves
// JNI_GetCreatedJavaVMs from libart.so's in-memory ELF), loads class ct/UI from
// ctq.log command file (UI toggles drive core dodge/killaura/aimbot objects)
// and writes gate/code files under the app's files dir.
import { runtimeState } from "../runtime/controllers";
import { initializeJavaUi } from "./ApkUiLoader";

import { decodeCharacterCodes } from "./encoding";
import { handleMenuAction } from "./MenuActions";
import {
  appendMode,
  bridgeState,
  htmlBase64,
  libcName,
  messageTypeKey,
  sliderNameKey,
  sliderValueKey,
  toggleEnabledKey,
  toggleIdKey,
  transportState,
} from "./state";

export function writeCommand(command: any): void {
  var file: any, buffer: any;
  try {
    if (
      (file = transportState.openFile(
        Memory.allocUtf8String(transportState.commandPath),
        Memory.allocUtf8String(appendMode),
      )) &&
      !file.isNull()
    ) {
      buffer = Memory.allocUtf8String(command + "\n");
      transportState.writeFile(buffer, 1, command.length + 1, file);
      transportState.closeFile(file);
    }
    return;
  } catch (error) {
    return;
  }
}

export function initializeWebUi(): any {
  transportState.openFile = null;
  transportState.writeFile = null;
  transportState.closeFile = null;
  try {
    transportState.libc = Process.findModuleByName(libcName) || Process.getModuleByName(libcName);
    transportState.openFile = new NativeFunction(
      transportState.libc.getExportByName("fopen"),
      "pointer",
      ["pointer", "pointer"],
    );

    transportState.writeFile = new NativeFunction(
      transportState.libc.getExportByName("fwrite"),
      "int",
      ["pointer", "int", "int", "pointer"],
    );
    transportState.closeFile = new NativeFunction(
      transportState.libc.getExportByName("fclose"),
      "int",
      ["pointer"],
    );
  } catch (error) {}

  transportState.tellFile = null;
  transportState.seekFile = null;
  transportState.readFile = null;
  try {
    transportState.queueLibc =
      Process.findModuleByName(libcName) || Process.getModuleByName(libcName);
    transportState.tellFile = new NativeFunction(
      transportState.queueLibc.getExportByName("ftell"),
      "int",
      ["pointer"],
    );
    transportState.seekFile = new NativeFunction(
      transportState.queueLibc.getExportByName("fseek"),
      "int",
      ["pointer", "int", "int"],
    );
    transportState.readFile = new NativeFunction(
      transportState.queueLibc.getExportByName("fread"),
      "int",
      ["pointer", "int", "int", "pointer"],
    );
  } catch (error) {}
  transportState.queuePath = decodeCharacterCodes([
    47, 100, 97, 116, 97, 47, 100, 97, 116, 97, 47, 99, 111, 109, 46, 115, 117, 112, 101, 114, 99,
    101, 108, 108, 46, 98, 114, 97, 119, 108, 115, 116, 97, 114, 115, 47, 102, 105, 108, 101, 115,
    47, 99, 116, 113, 46, 108, 111, 103,
  ]); // "/data/data/com.supercell.brawlstars/files/ctq.log"
  transportState.commandPath = decodeCharacterCodes([
    47, 100, 97, 116, 97, 47, 100, 97, 116, 97, 47, 99, 111, 109, 46, 115, 117, 112, 101, 114, 99,
    101, 108, 108, 46, 98, 114, 97, 119, 108, 115, 116, 97, 114, 115, 47, 102, 105, 108, 101, 115,
    47, 99, 116, 99, 109, 100, 46, 108, 111, 103,
  ]); // "/data/data/com.supercell.brawlstars/files/ctcmd.log"
  transportState.queueOffset = 0;

  scheduleInterval(function () {
    var queueFile: any,
      fileLength: any,
      readLength: any,
      readBuffer: any,
      contents: any,
      appendedText: any,
      lines: any,
      lineIndex: any,
      line: any,
      loadedMarkerFile: any,
      message: any,
      dodgeEnabled: any,
      killauraEnabled: any,
      killauraWasEnabled: any,
      aimbotEnabled: any;
    try {
      if (
        !(queueFile = transportState.openFile(
          Memory.allocUtf8String(transportState.queuePath),
          Memory.allocUtf8String("r"),
        )) ||
        queueFile.isNull()
      ) {
        return undefined;
      }
      fileLength = 0;
      try {
        if (transportState.seekFile && transportState.tellFile) {
          transportState.seekFile(queueFile, 0, 2);
          fileLength = transportState.tellFile(queueFile);
        }
      } catch (error) {}

      if (fileLength <= transportState.queueOffset) {
        transportState.closeFile(queueFile);
        return undefined;
      }
      try {
        transportState.seekFile(queueFile, 0, 0);
        readLength = fileLength;
        readBuffer = Memory.alloc(readLength + 1);
        transportState.readFile(readBuffer, 1, readLength, queueFile);
        transportState.closeFile(queueFile);
        if (!(contents = readBuffer.readCString(readLength))) {
          return undefined;
        }
        appendedText = contents.substring(transportState.queueOffset);
        transportState.queueOffset = contents.length;
        lines = appendedText.split("\n");
        for (lineIndex = 0; lineIndex < lines.length; lineIndex++) {
          if (!(line = lines[lineIndex].trim()).length) continue;
          if (!bridgeState.ready) {
            bridgeState.ready = true;
            writeCommand("loaded"); // Tell the UI that the agent is loaded.
            if (
              (loadedMarkerFile = transportState.openFile(
                Memory.allocUtf8String(
                  decodeCharacterCodes([
                    47, 100, 97, 116, 97, 47, 100, 97, 116, 97, 47, 99, 111, 109, 46, 115, 117, 112,
                    101, 114, 99, 101, 108, 108, 46, 98, 114, 97, 119, 108, 115, 116, 97, 114, 115,
                    47, 102, 105, 108, 101, 115, 47, 99, 116, 95, 108, 111, 97, 100, 101, 100,
                  ]),
                ),
                Memory.allocUtf8String("w"),
              )) &&
              !loadedMarkerFile.isNull()
            ) {
              // "/data/data/com.supercell.brawlstars/files/ct_loaded"
              transportState.writeFile(Memory.allocUtf8String("ok"), 1, 2, loadedMarkerFile);
              transportState.closeFile(loadedMarkerFile);
            }
          }
          if (line === "hide") {
            writeCommand("hide");
            continue;
          }
          if (line === "show") {
            writeCommand("show");
            continue;
          }
          try {
            message = JSON.parse(line);
            if (handleMenuAction(message, writeCommand)) continue;
            if (message[messageTypeKey] === "toggle") {
              if (message[toggleIdKey] === 1 && typeof message[toggleEnabledKey] === "boolean") {
                const requested = message[toggleEnabledKey];
                toggleStates[1] = nativeUiServices.setOutlineEnabled?.(requested) ?? false;
              }

              // {"t":"toggle","id":0,"on":b} → dodge (core t; act t.nNPza9bM == free t.thB = set enabled)
              if (message[toggleIdKey] === 0) {
                dodgeEnabled = message[toggleEnabledKey];
                if (runtimeState.autoDodgeApi) {
                  runtimeState.autoDodgeApi.setEnabled(dodgeEnabled);
                }
              }
              // id 2 → killaura (core a; act a.vtIhpfNL == free a.zbEUkWOC = toggle).
              // Read the controller snapshot, not a property of the getter function.
              if (message[toggleIdKey] === 2) {
                killauraEnabled = message[toggleEnabledKey];
                if (runtimeState.killauraApi) {
                  killauraWasEnabled = !!(
                    runtimeState.killauraApi.getStatus &&
                    runtimeState.killauraApi.getStatus().enabled
                  );
                  if (killauraEnabled !== killauraWasEnabled) {
                    runtimeState.killauraApi.toggle();
                  }
                }
              }
              // id 6 → aimbot (core r; act r.thB/r.e3In == free r.cG3DfZhz (on) / r.v3F13Dj (off))
              if (message[toggleIdKey] === 6) {
                aimbotEnabled = message[toggleEnabledKey];
                if (runtimeState.aimbotApi) {
                  if (aimbotEnabled) {
                    runtimeState.aimbotApi.enable();
                  } else {
                    runtimeState.aimbotApi.disable();
                  }
                }
              }
            }
            if (message[messageTypeKey] === "slider") {
            }
          } catch (error) {}
        }
      } catch (error) {
        try {
          transportState.closeFile(queueFile);
        } catch (error) {}
      }
      return;
    } catch (error) {
      return;
    }
  }, 300);
  try {
    if (
      (transportState.guidFile = transportState.openFile(
        Memory.allocUtf8String(
          decodeCharacterCodes([
            47, 100, 97, 116, 97, 47, 100, 97, 116, 97, 47, 99, 111, 109, 46, 115, 117, 112, 101,
            114, 99, 101, 108, 108, 46, 98, 114, 97, 119, 108, 115, 116, 97, 114, 115, 47, 102, 105,
            108, 101, 115, 47, 105, 110, 115, 116, 97, 108, 108, 46, 103, 117, 105, 100,
          ]),
        ),
        Memory.allocUtf8String("r"),
      )) &&
      !transportState.guidFile.isNull()
    ) {
      // "/data/data/com.supercell.brawlstars/files/install.guid"
      transportState.guidBuffer = Memory.alloc(72);
      transportState.guidBytesRead = transportState.readFile(
        transportState.guidBuffer,
        1,
        64,
        transportState.guidFile,
      );
      transportState.closeFile(transportState.guidFile);
      if (transportState.guidBytesRead > 8) {
        transportState.installationGuid = transportState.guidBuffer.readCString(64);
        transportState.installationId = parseInt(
          String(transportState.installationGuid).substring(0, 8),
          16,
        );
        transportState.installationCode = 100000 + (transportState.installationId % 900000);

        if (
          (transportState.commandFile = transportState.openFile(
            Memory.allocUtf8String(transportState.commandPath),
            Memory.allocUtf8String(appendMode),
          )) &&
          !transportState.commandFile.isNull()
        ) {
          transportState.commandBuffer = Memory.allocUtf8String(
            "code:" + String(transportState.installationCode) + "\n",
          );
          transportState.writeFile(
            transportState.commandBuffer,
            1,
            6 + String(transportState.installationCode).length,
            transportState.commandFile,
          );
          transportState.closeFile(transportState.commandFile);
        }
      }
    }
  } catch (error) {}
  transportState.gateTicks = 0;

  scheduleInterval(function () {
    if (++transportState.gateTicks > 0 && !bridgeState.initializationAttempted) {
      initializeJavaUi();
    }
    if (
      bridgeState.initializationAttempted &&
      !bridgeState.ready &&
      transportState.gateTicks < 40 &&
      transportState.gateTicks % 3 === 0
    ) {
      bridgeState.initializationAttempted = false;

      initializeJavaUi();
    }
    return;
  }, 1500);
  return;
}
