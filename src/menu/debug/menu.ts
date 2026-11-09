import { cancelInterval, scheduleInterval } from "../../runtime/lifecycle";
import { getMovieClip, loadDebugSc } from "../../engine/assets";
import { natives } from "../../engine/bindings";
import {
  getHeight,
  getWidth,
  isInTree,
  setPosition,
  setScale,
  setVisible,
} from "../../engine/displayObject";
import { isLiveObject, isValidPtr, newScString, readFloatSafe } from "../../engine/memory";
import {
  getMovieClipByName,
  getTextFieldByName,
  setChildText,
  setChildVisible,
} from "../../engine/movieClip";
import {
  addChild,
  addToStage,
  findInnerClip,
  getContainerClip,
  removeChild,
  removeFromStage,
} from "../../engine/sceneGraph";
import { getScreenSize, getStageRoot } from "../../engine/screen";
import { update } from "../../hud/watermark";
import { runtimeState } from "../../runtime/controllers";
import { coreState } from "../../runtime/coreState";
import {
  createButton,
  createDebugButton,
  createDebugContainer,
  setButtonText,
} from "../../ui/button";
import { clearNodeActions, setNodeAction } from "../../ui/nodeActions";
import { closeSettingsMenu } from "../settings/lifecycle";
import { mainMenuState } from "../settings/state";
import { menuLayout } from "../styles/selection";

export function isInDebugShell(node: any): boolean {
  return isInTree(
    node,
    (runtimeState.debugButtonRef && runtimeState.debugButtonRef.clip) || coreState._dbgShell,
  );
}

export function destroyDebugMenu(): void {
  try {
    let container = getContainerClip(coreState.debugMenu);
    if (!isValidPtr(container)) container = findInnerClip(coreState.debugMenu);
    if (isValidPtr(container)) {
      if (coreState.debugMenuItems) {
        for (let itemIndex = 0; itemIndex < coreState.debugMenuItems.length; itemIndex++)
          removeChild(container, coreState.debugMenuItems[itemIndex].button);
      }
      removeChild(container, coreState.miscCategory);
      removeChild(container, coreState.battleCategory);
      if (coreState.tabButtons) {
        for (let tabIndex = 0; tabIndex < coreState.tabButtons.length; tabIndex++)
          removeChild(container, coreState.tabButtons[tabIndex]);
      }
    }
  } catch (error) {}
  if (coreState.debugMenuItems) {
    for (let itemIndex = 0; itemIndex < coreState.debugMenuItems.length; itemIndex++)
      removeFromStage(coreState.debugMenuItems[itemIndex].button);
  }
  if (coreState.tabButtons) {
    for (let tabIndex = 0; tabIndex < coreState.tabButtons.length; tabIndex++)
      removeFromStage(coreState.tabButtons[tabIndex]);
  }
  removeFromStage(coreState.miscCategory);
  removeFromStage(coreState.battleCategory);
  removeFromStage(coreState.debugMenuCloseButton);
  removeFromStage(coreState.debugMenu);
  coreState.debugMenuItems = null;
  coreState.tabButtons = null;
  coreState.miscCategory = null;
  coreState.battleCategory = null;
  coreState.debugMenuCloseButton = null;
  coreState.debugMenu = null;
  coreState.debugMenuOpen = false;
}

export function createDebugToggleButton(): boolean {
  if (isValidPtr(coreState.debugButton)) return true;
  try {
    if (coreState._dbgOwn && coreState._dbgOwn.button) removeFromStage(coreState._dbgOwn.button);
  } catch (error) {}
  try {
    coreState._dbgOwn = null;
    loadDebugSc();
    const stage = getStageRoot();
    if (!isLiveObject(stage)) return false;
    const clip = getMovieClip("sc/debug.sc", "debug_button");
    if (!isValidPtr(clip)) return false;
    try {
      natives.gotoAndStopFrame(clip, 1);
    } catch (error) {}
    const button = natives.malloc(640);
    natives.buttonCtor(button);
    let attached = false;
    try {
      const vtable = button.readPointer();
      if (vtable && !vtable.isNull()) {
        const attachClip = vtable.add(360).readPointer();
        if (attachClip && !attachClip.isNull()) {
          new NativeFunction(attachClip, "void", ["pointer", "pointer", "int"])(button, clip, 1);
          attached = true;
        }
      }
    } catch (error) {}
    if (!attached) {
      try {
        natives.buttonSetMovieClip(button, clip, 1);
        attached = true;
      } catch (error) {}
    }
    if (!attached) return false;
    setButtonText(button, "Text", "D");
    setButtonText(button, "txt", "D");
    try {
      button.add(78).writeU8(1);
    } catch (error) {}
    setScale(button, 0.95, 0.95);
    setPosition(button, 24 + 50, 600 - 40 - 35);
    if (addToStage(button)) {
      coreState.debugButton = button;
      coreState._dbgShell = clip;
      coreState._dbgOwn = { button: button, clip: clip };
      try {
        setNodeAction(button, {
          kind: "dbgmenu",
        });
      } catch (error) {}
      try {
        setNodeAction(clip, {
          kind: "dbgmenu",
        });
      } catch (error) {}
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

export function startDebugButtonDropLoop(maximumAttempts: any): void {
  if (coreState._dIv) {
    cancelInterval(coreState._dIv);
    coreState._dIv = null;
  }
  let attempts = 0;
  const limit = maximumAttempts || 5;
  coreState._dIv = scheduleInterval(function () {
    if (++attempts > limit) {
      cancelInterval(coreState._dIv);
      coreState._dIv = null;
      return;
    }
    try {
      if (isValidPtr(coreState.debugButton)) setVisible(coreState.debugButton, false);
    } catch (error) {}
    coreState.debugButton = null;
    if (isValidPtr(coreState.debugButton)) {
      cancelInterval(coreState._dIv);
      coreState._dIv = null;
    }
  }, 1200);
}

export function startSettingsButtonDropLoop(maximumAttempts: any): void {
  if (coreState._setIv) {
    cancelInterval(coreState._setIv);
    coreState._setIv = null;
  }
  let attempts = 0;
  const limit = maximumAttempts || 15;
  coreState._setIv = scheduleInterval(function () {
    if (++attempts > limit) {
      cancelInterval(coreState._setIv);
      coreState._setIv = null;
      return;
    }
    try {
      if (isValidPtr(mainMenuState.button)) setVisible(mainMenuState.button, false);
    } catch (error) {}
    mainMenuState.button = null;
    if (isValidPtr(mainMenuState.button)) {
      cancelInterval(coreState._setIv);
      coreState._setIv = null;
    }
  }, 1200);
}

export function closeAll(): void {
  destroyDebugMenu();
  if (mainMenuState.isOpen) closeSettingsMenu();
  removeFromStage(mainMenuState.button);
  mainMenuState.button = null;
  removeFromStage(coreState.debugButton);
  coreState.debugButton = null;
}

export function openDebugMenu(): void {
  var screen: any,
    isContainer: any,
    menuHeight: any,
    menuWidth: any,
    scale: any,
    layoutScale: any,
    rightMargin: any,
    menuClip: any,
    closeButtonClip: any,
    itemAreaX: any,
    itemAreaY: any,
    itemArea: any,
    tabAreaX: any,
    tabAreaY: any,
    tabArea: any,
    tabLabels: any,
    tabIndex: any,
    tabButton: any,
    cursorY: any,
    DEFAULT_CATEGORY_HEIGHT: any,
    DEFAULT_CATEGORY_WIDTH: any,
    DEFAULT_ITEM_HEIGHT: any;

  function placeMenuNode(node: any, x: any, y: any): void {
    var menuLeft: any;
    setScale(node, 1, 1);
    setPosition(node, x, y);
    if (!addChild(menuClip, node)) {
      menuLeft = screen.w - menuWidth * scale;
      setPosition(
        node,
        menuLeft + (x - itemAreaX) * scale,
        (itemAreaY + 5 + (y - (itemAreaY + 5))) * scale,
      );
      setScale(node, scale, scale);
      addToStage(node);
    }
  }

  function createCategory(exportName: any, title: any, expanded: any, labels: any): any {
    var category: any,
      categoryWidth: any,
      categoryHeight: any,
      itemIndex: any,
      item: any,
      itemWidth: any,
      itemHeight: any;
    category = createDebugButton("debug_menu_category", (expanded ? "- " : "+ ") + title, 1);
    if (!isValidPtr(category)) return null;
    categoryWidth = getWidth(category);
    categoryHeight = getHeight(category);
    if (!(categoryWidth > 10)) categoryWidth = DEFAULT_CATEGORY_WIDTH;
    if (!(categoryHeight > 10)) categoryHeight = DEFAULT_CATEGORY_HEIGHT;
    placeMenuNode(
      category,
      itemAreaX + categoryWidth * 0.5,
      itemAreaY + 5 + cursorY + categoryHeight * 0.5,
    );
    cursorY = cursorY + (8 + categoryHeight);
    if (expanded && labels) {
      for (itemIndex = 0; itemIndex < labels.length; itemIndex++) {
        item = createDebugButton("debug_menu_item", labels[itemIndex], 1);
        if (!isValidPtr(item)) continue;
        itemWidth = getWidth(item);
        itemHeight = getHeight(item);
        if (!(itemWidth > 10)) itemWidth = categoryWidth;
        if (!(itemHeight > 10)) itemHeight = DEFAULT_ITEM_HEIGHT;
        placeMenuNode(
          item,
          itemAreaX + itemWidth * 0.5,
          itemAreaY + 5 + cursorY + itemHeight * 0.5,
        );
        cursorY = cursorY + (8 + itemHeight);
        coreState.debugMenuItems.push({ button: item, label: labels[itemIndex] });
        setNodeAction(item, {
          kind: "item",
          label: labels[itemIndex],
        });
      }
    }
    if (isValidPtr(category)) {
      setNodeAction(category, {
        kind: "category",
        title: title,
      });
    }
    return category;
  }

  try {
    destroyDebugMenu();
    clearNodeActions();
    screen = getScreenSize();
    isContainer = true;
    coreState.debugMenu = createDebugContainer("debug_menu");
    if (!isValidPtr(coreState.debugMenu)) {
      isContainer = false;

      coreState.debugMenu = createDebugButton("debug_menu", null, 0);
    }
    if (!isValidPtr(coreState.debugMenu)) {
      return undefined;
    }
    if (!((menuHeight = getHeight(coreState.debugMenu)) > 50 && menuHeight < 5000)) {
      menuHeight = 720;
    }
    if (!((menuWidth = getWidth(coreState.debugMenu)) > 50 && menuWidth < 5000)) {
      menuWidth = 400;
    }
    if ((scale = screen.h / menuHeight) < 0.55) {
      scale = 0.55;
    }
    if (scale > 1.35) {
      scale = 1.35;
    }
    setScale(coreState.debugMenu, scale, scale);
    layoutScale = menuLayout.scale ? menuLayout.scale() : 1.229;
    rightMargin = Math.round(170 * layoutScale);
    if (isContainer) {
      setPosition(coreState.debugMenu, Math.floor(screen.w) - rightMargin, 0);
    } else {
      setPosition(coreState.debugMenu, Math.floor(screen.w - menuWidth * scale) - rightMargin, 0);
    }
    menuClip = getContainerClip(coreState.debugMenu);
    if (!isValidPtr(menuClip)) {
      menuClip = findInnerClip(coreState.debugMenu);
    }
    setChildText(menuClip, "title", "Debug Menu");
    setChildText(menuClip, "version", "<cFF0000>not Ios v15.0.0</c>");
    setButtonText(coreState.debugMenu, "title", "Debug Menu");
    setButtonText(coreState.debugMenu, "version", "<cFF0000>not Ios v15.0.0</c>");
    setChildVisible(menuClip, "clear_button", false);
    setChildVisible(menuClip, "debug_menu_input_button", true);
    if (!addToStage(coreState.debugMenu)) {
      return undefined;
    }
    coreState.debugMenuCloseButton = ptr(0);
    if (isValidPtr(menuClip)) {
      try {
        coreState.debugMenuCloseButton = natives.getButtonByName(
          menuClip,
          newScString("close_button"),
        );
      } catch (error) {}
    }
    if (!isValidPtr(coreState.debugMenuCloseButton)) {
      closeButtonClip = getMovieClipByName(menuClip, "close_button");
      if (isValidPtr(closeButtonClip)) {
        coreState.debugMenuCloseButton = createButton(closeButtonClip, null, 1);
        if (isValidPtr(coreState.debugMenuCloseButton)) {
          addChild(menuClip, coreState.debugMenuCloseButton);
        }
      }
    }
    itemAreaX = 0;
    itemAreaY = 0;
    itemArea = getTextFieldByName(menuClip, "item_area");
    if (isValidPtr(itemArea)) {
      itemAreaX = readFloatSafe(itemArea, 32);

      itemAreaY = readFloatSafe(itemArea, 36);
    } else {
      itemAreaX = -menuWidth + 20;
      itemAreaY = 90;
    }
    tabAreaX = itemAreaX;
    tabAreaY = itemAreaY - 55;
    tabArea = getTextFieldByName(menuClip, "tab_area");
    if (isValidPtr(tabArea)) {
      tabAreaX = readFloatSafe(tabArea, 32);

      tabAreaY = readFloatSafe(tabArea, 36);
    }
    tabLabels = ["Mis", "Acc", "Bat", "Fun", "Gfx", "Srv"];
    coreState.tabButtons = [];
    for (tabIndex = 0; tabIndex < tabLabels.length; tabIndex++) {
      tabButton = createDebugButton("debug_menu_category_mini", tabLabels[tabIndex], 1);
      if (!isValidPtr(tabButton)) continue;
      setScale(tabButton, 1, 1);
      setPosition(tabButton, tabAreaX + tabIndex * 45 + 20, tabAreaY + 25);
      if (!addChild(menuClip, tabButton)) {
        addToStage(tabButton);
      }
      coreState.tabButtons.push(tabButton);
      setNodeAction(tabButton, {
        kind: "mini",
        id: tabIndex,
      });
    }
    coreState.debugMenuItems = [];
    cursorY = 0;
    DEFAULT_CATEGORY_HEIGHT = 50;
    DEFAULT_CATEGORY_WIDTH = 300;
    DEFAULT_ITEM_HEIGHT = 48;

    coreState.miscCategory = createCategory("debug_menu_category", "Misc", coreState.miscExpanded, [
      "Go Tutorial",
      "Brawler Outline",
      "Floater",
      "Test Misc",
      "Main menu",
      "Stage Probe",
    ]);
    coreState.battleCategory = createCategory(
      "debug_menu_category",
      "Battle",
      coreState.battleExpanded,
      ["FPS Unlock", "Camera Mode", "Spectators 69", "Chat Spam", "Killaura", "Aimbot"],
    );
    coreState.menuStylesCategory = createCategory(
      "debug_menu_category",
      "Menu Styles",
      coreState.menuStylesExpanded,
      ["coretools (default)", "Bsre1 (old)", "Switchgear+ (new)"],
    );
    if (isValidPtr(coreState.debugMenuCloseButton)) {
      setNodeAction(coreState.debugMenuCloseButton, { kind: "close" });
    }
    coreState.debugMenuOpen = true;
    update();
    return;
  } catch (error) {
    return;
  }
}

export function closeDebugMenu(): void {
  destroyDebugMenu();
  update();
}
