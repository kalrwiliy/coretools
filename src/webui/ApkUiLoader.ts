import Java from "frida-java-bridge";

import { bridgeState, getEnvironmentMethod, htmlBase64, transportState } from "./state";
import { createCtUiStub } from "./WebViewOverlay";

export function initializeJavaUi(): any {
  var javaAvailable: any,
    initialEnvironment: any,
    mapsPath: any,
    artLibraryName: any,
    getCreatedVmsSymbol: any,
    processMaps: any,
    artBase: any,
    artPath: any,
    stubBase: any,
    stubLibraryName: any,
    mapLines: any,
    lineIndex: any,
    mapLine: any,
    rangeSeparator: any,
    mappingStart: any,
    pathSeparator: any,
    mappingPath: any,
    stubVmOffsets: any,
    candidateIndex: any,
    candidateVm: any,
    candidateVtable: any,
    candidateGetEnvironment: any,
    candidateEnvironmentSlot: any,
    candidateResult: any,
    attachCurrentThread: any,
    attachResult: any,
    candidateEnvironment: any,
    getCreatedVmsAddress: any,
    programHeaderOffset: any,
    programHeaderCount: any,
    programHeaderSize: any,
    dynamicTable: any,
    dynamicEntryCount: any,
    headerIndex: any,
    programHeader: any,
    symbolTable: any,
    stringTable: any,
    stringTableSize: any,
    dynamicIndex: any,
    dynamicEntry: any,
    dynamicTag: any,
    dynamicValue: any,
    symbolCount: any,
    symbolIndex: any,
    symbolEntry: any,
    symbolValue: any,
    symbolNameOffset: any,
    symbolName: any,
    getCreatedVms: any,
    vmSlot: any,
    vmCountSlot: any,
    getVmsResult: any,
    javaVm: any,
    vmVtable: any,
    getEnvironment: any,
    environmentSlot: any,
    environmentResult: any,
    environment: any;
  let readProcessFile: any;
  if (bridgeState.initializationAttempted) return;
  bridgeState.initializationAttempted = true;

  javaAvailable = false;
  try {
    javaAvailable = typeof Java !== "undefined" && Java.available;
  } catch (error) {}

  if (javaAvailable) {
    try {
      initialEnvironment = Java.vm.getEnv();
      bridgeState[getEnvironmentMethod] = function () {
        var environment: any;
        environment = Java.vm.getEnv();
        return ptr(String(environment.handle ? environment.handle : environment.$handle));
      };
    } catch (error) {
      return undefined;
    }
    initializeRawJni();
    return;
  }
  try {
    readProcessFile = function (filePath: any, maximumLength: any) {
      var file: any, contents: any, buffer: any, bytesRead: any;
      if (
        !(file = transportState.openFile(
          Memory.allocUtf8String(filePath),
          Memory.allocUtf8String("r"),
        )) ||
        file.isNull()
      ) {
        return null;
      }
      contents = "";
      buffer = Memory.alloc(8192);
      bytesRead = transportState.readFile(buffer, 1, 8192, file);
      while (bytesRead > 0) {
        if (!(contents.length < (maximumLength ? maximumLength : 400000))) break;
        contents = contents + (buffer.readCString(bytesRead) || "");
        bytesRead = transportState.readFile(buffer, 1, 8192, file);
      }
      transportState.closeFile(file);
      return contents;
    };
    mapsPath = "/proc/self/maps";
    artLibraryName = "libart.so";
    getCreatedVmsSymbol = "JNI_GetCreatedJavaVMs";
    if (!(processMaps = readProcessFile(mapsPath, 800000))) {
      return undefined;
    }
    artBase = null;
    artPath = null;
    stubBase = null;
    stubLibraryName = "libblubbercell.so";
    mapLines = processMaps.split("\n");
    for (lineIndex = 0; lineIndex < mapLines.length; lineIndex++) {
      rangeSeparator = (mapLine = mapLines[lineIndex]).indexOf(" ");
      mappingStart = mapLine.substring(0, rangeSeparator).split("-")[0];
      pathSeparator = mapLine.lastIndexOf(" ");
      mappingPath = mapLine.substring(pathSeparator + 1).trim();
      if (
        !artBase &&
        mappingPath.indexOf(artLibraryName) >= 0 &&
        (mapLine.indexOf("r-xp") >= 0 || mapLine.indexOf("r--p") >= 0)
      ) {
        artBase = ptr("0x" + mappingStart);
        artPath = mappingPath;
      }
      if (
        !stubBase &&
        mappingPath.indexOf(stubLibraryName) >= 0 &&
        (mapLine.indexOf("r-xp") >= 0 || mapLine.indexOf("r--p") >= 0)
      ) {
        stubBase = ptr("0x" + mappingStart);
      }
    }

    if (stubBase) {
      stubVmOffsets = [
        33865776, 33940648, 33939880, 34148728, 33894448, 33969320, 33968552, 34177400,
      ];
      for (candidateIndex = 0; candidateIndex < stubVmOffsets.length; candidateIndex++) {
        try {
          if (
            !(candidateVm = stubBase.add(stubVmOffsets[candidateIndex]).readPointer()) ||
            candidateVm.isNull() ||
            candidateVm.compare(ptr(65536)) < 0
          )
            continue;
          if (
            (candidateVtable = candidateVm.readPointer()).isNull() ||
            candidateVtable.compare(ptr(65536)) < 0
          )
            continue;
          // JavaVM vtable: +6*8 GetEnv, +4*8 AttachCurrentThread
          candidateGetEnvironment = new NativeFunction(
            candidateVtable.add(6 * 8).readPointer(),
            "int",
            ["pointer", "pointer", "int"],
          );
          candidateEnvironmentSlot = Memory.alloc(8);
          if (
            (candidateResult = candidateGetEnvironment(
              candidateVm,
              candidateEnvironmentSlot,
              65542,
            )) === -2
          ) {
            attachResult = (attachCurrentThread = new NativeFunction(
              candidateVtable.add(4 * 8).readPointer(),
              "int",
              ["pointer", "pointer", "pointer"],
            ))(candidateVm, candidateEnvironmentSlot, ptr(0));

            candidateResult = attachResult;
          }

          if (
            candidateResult === 0 &&
            !(candidateEnvironment = candidateEnvironmentSlot.readPointer()).isNull()
          ) {
            bridgeState[getEnvironmentMethod] = function () {
              return candidateEnvironment;
            };
            initializeRawJni();
            return undefined;
          }
        } catch (error) {}
      }
    }
    if (!artBase || !artPath) return undefined;
    getCreatedVmsAddress = null;
    try {
      // walk libart's in-memory ELF: PT_DYNAMIC → DT_SYMTAB/DT_STRTAB/DT_STRSZ → find JNI_GetCreatedJavaVMs
      programHeaderOffset = artBase.add(32).readU64();
      programHeaderCount = artBase.add(56).readU16();
      programHeaderSize = artBase.add(54).readU16();
      dynamicTable = null;
      dynamicEntryCount = 0;
      for (headerIndex = 0; headerIndex < programHeaderCount; headerIndex++) {
        if (
          (programHeader = artBase.add(
            Number(programHeaderOffset) + headerIndex * programHeaderSize,
          )).readU32() === 2
        ) {
          dynamicTable = artBase.add(programHeader.add(16).readU64());
          dynamicEntryCount = Math.floor(Number(programHeader.add(32).readU64()) / 16);
          break;
        }
      }

      if (!dynamicTable) return undefined;
      symbolTable = null;
      stringTable = null;
      stringTableSize = 0;
      for (dynamicIndex = 0; dynamicIndex < dynamicEntryCount; dynamicIndex++) {
        dynamicEntry = dynamicTable.add(dynamicIndex * 16);
        dynamicTag = Number(dynamicEntry.readU64());
        dynamicValue = dynamicEntry.add(8).readPointer();
        if (dynamicTag === 0) break;
        if (dynamicTag === 6) symbolTable = dynamicValue;
        if (dynamicTag === 5) stringTable = dynamicValue;
        if (dynamicTag === 10) stringTableSize = Number(dynamicValue);
      }

      if (!symbolTable || !stringTable) return undefined;
      if (symbolTable.compare(artBase) < 0) symbolTable = artBase.add(symbolTable);
      if (stringTable.compare(artBase) < 0) stringTable = artBase.add(stringTable);
      symbolCount = Math.floor(stringTable.sub(symbolTable).toInt32() / 24);

      for (symbolIndex = 0; symbolIndex < symbolCount; symbolIndex++) {
        try {
          if (
            (symbolValue = (symbolEntry = symbolTable.add(symbolIndex * 24)).add(8).readU64()) === 0
          )
            continue;
          symbolNameOffset = symbolEntry.readU32();
          if (stringTableSize) {
            if (symbolNameOffset >= stringTableSize) continue;
          }
          if (
            (symbolName = stringTable.add(symbolNameOffset).readCString(48)) === getCreatedVmsSymbol
          ) {
            getCreatedVmsAddress = artBase.add(symbolValue);
            break;
          }
        } catch (error) {}
      }
    } catch (error) {}

    if (!getCreatedVmsAddress) return undefined;
    getCreatedVms = new NativeFunction(getCreatedVmsAddress, "int", ["pointer", "int", "pointer"]);
    vmSlot = Memory.alloc(8);
    vmCountSlot = Memory.alloc(4);
    getVmsResult = getCreatedVms(vmSlot, 1, vmCountSlot);

    if (getVmsResult !== 0 || vmCountSlot.readU32() < 1) return undefined;
    vmVtable = (javaVm = vmSlot.readPointer()).readPointer();
    getEnvironment = new NativeFunction(vmVtable.add(6 * 8).readPointer(), "int", [
      "pointer",
      "pointer",
      "int",
    ]);
    environmentSlot = Memory.alloc(8);
    environmentResult = getEnvironment(javaVm, environmentSlot, 65542);

    if (environmentResult !== 0) return undefined;
    environment = environmentSlot.readPointer();
    bridgeState[getEnvironmentMethod] = function () {
      return environment;
    };
    initializeRawJni();
    return;
  } catch (error) {
    return;
  }
}

export function initializeRawJni(): any {
  var environment: any,
    jniTable: any,
    findClass: any,
    getStaticMethodId: any,
    callStaticVoid: any,
    callStaticVoidWithArgument: any,
    callStaticObject: any,
    newStringUtf: any,
    getStringUtfChars: any,
    getObjectClass: any,
    getMethodId: any,
    callObject: any,
    callObjectWithArgument: any,
    clearException: any,
    activityThreadClass: any,
    currentApplicationMethod: any,
    application: any,
    applicationClass: any,
    getClassLoaderMethod: any,
    classLoader: any,
    classLoaderClass: any,
    loadClassMethod: any,
    uiClass: any,
    globalUiClass: any,
    createMethod: any,
    pollMethod: any,
    visibilityMethod: any,
    htmlString: any;
  let bindJni: any, cString: any;
  try {
    cString = function (text: any) {
      return Memory.allocUtf8String(text);
    };
    // JNIEnv function-table slot → NativeFunction
    bindJni = function (slotIndex: any, returnType: any, argumentTypes: any): any {
      return new NativeFunction(
        jniTable.add(slotIndex * 8).readPointer(),
        returnType,
        argumentTypes,
      );
    };
    jniTable = (environment = bridgeState[getEnvironmentMethod]()).readPointer();
    findClass = bindJni(6, "pointer", ["pointer", "pointer"]); // FindClass
    getStaticMethodId = bindJni(113, "pointer", ["pointer", "pointer", "pointer", "pointer"]); // GetStaticMethodID
    callStaticVoid = bindJni(141, "void", ["pointer", "pointer", "pointer"]); // CallStaticVoidMethod
    callStaticVoidWithArgument = bindJni(141, "void", ["pointer", "pointer", "pointer", "pointer"]); // CallStaticVoidMethod
    callStaticObject = bindJni(114, "pointer", ["pointer", "pointer", "pointer", "..."]); // CallStaticObjectMethod
    newStringUtf = bindJni(167, "pointer", ["pointer", "pointer"]); // NewStringUTF
    getStringUtfChars = bindJni(169, "pointer", ["pointer", "pointer", "pointer"]); // GetStringUTFChars
    getObjectClass = bindJni(31, "pointer", ["pointer", "pointer"]); // GetObjectClass
    getMethodId = bindJni(33, "pointer", ["pointer", "pointer", "pointer", "pointer"]); // GetMethodID
    callObject = bindJni(34, "pointer", ["pointer", "pointer", "pointer"]); // CallObjectMethod
    callObjectWithArgument = bindJni(34, "pointer", ["pointer", "pointer", "pointer", "pointer"]); // CallObjectMethod
    clearException = bindJni(17, "void", ["pointer"]); // ExceptionClear
    activityThreadClass = findClass(environment, cString("android/app/ActivityThread"));

    currentApplicationMethod = getStaticMethodId(
      environment,
      activityThreadClass,
      cString("currentApplication"),
      cString("()Landroid/app/Application;"),
    );
    application = callStaticObject(environment, activityThreadClass, currentApplicationMethod);

    applicationClass = getObjectClass(environment, application);
    getClassLoaderMethod = getMethodId(
      environment,
      applicationClass,
      cString("getClassLoader"),
      cString("()Ljava/lang/ClassLoader;"),
    );
    classLoader = callObject(environment, application, getClassLoaderMethod);

    classLoaderClass = findClass(environment, cString("java/lang/ClassLoader"));
    loadClassMethod = getMethodId(
      environment,
      classLoaderClass,
      cString("loadClass"),
      cString("(Ljava/lang/String;)Ljava/lang/Class;"),
    );
    uiClass = callObjectWithArgument(
      environment,
      classLoader,
      loadClassMethod,
      newStringUtf(environment, cString("ct/UI")),
    );
    clearException(environment);

    if (uiClass.isNull()) {
      // This APK doesn't ship the mod's Java side: show the page with the built-in WebView stub instead.
      // It speaks the same file protocol (ctq.log / ctcmd.log), so the poll loop below handles it as usual.
      if (createCtUiStub(htmlBase64)) {
        bridgeState.ready = true;
      }
      return undefined;
    }
    globalUiClass = bindJni(21, "pointer", ["pointer", "pointer"])(environment, uiClass); // NewGlobalRef
    createMethod = getStaticMethodId(
      environment,
      globalUiClass,
      cString("create"),
      cString("(Ljava/lang/String;)V"),
    );
    pollMethod = getStaticMethodId(
      environment,
      globalUiClass,
      cString("poll"),
      cString("()Ljava/lang/String;"),
    );
    visibilityMethod = getStaticMethodId(
      environment,
      globalUiClass,
      cString("vis"),
      cString("(I)V"),
    );

    htmlString = newStringUtf(environment, cString(htmlBase64));
    callStaticVoidWithArgument(environment, globalUiClass, createMethod, htmlString);

    bridgeState.uiClass = globalUiClass;
    bridgeState.pollMethod = pollMethod;
    bridgeState.visibilityMethod = visibilityMethod;
    bridgeState.environment = environment;
    bridgeState.callStaticObject = callStaticObject;
    bridgeState.getStringUtf = getStringUtfChars;
    bridgeState.ready = true;
    return;
  } catch (error) {
    return;
  }
}
