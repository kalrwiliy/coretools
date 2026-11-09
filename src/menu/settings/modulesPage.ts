import { outlineState } from "../../nativeUi/runtime/state";
import { cancelInterval, scheduleInterval } from "../../runtime/lifecycle";
import { createMovieClipStr, getMovieClip } from "../../engine/assets";
import { natives } from "../../engine/bindings";
import { getWidth, setPosition, setScale } from "../../engine/displayObject";
import { cstr, isValidPtr } from "../../engine/memory";
import {
  getMovieClipByName,
  getTextFieldByName,
  gotoFrame,
  setChildScaleY,
} from "../../engine/movieClip";
import { addChild, addToStage, removeFromStage } from "../../engine/sceneGraph";
import { runtimeState } from "../../runtime/controllers";
import { setButtonText } from "../../ui/button";
import { setNodeAction } from "../../ui/nodeActions";
import { createSlider, setSliderRange, setSliderValue, updateSlider } from "../../ui/slider";
import { createTextLabel } from "../../ui/textLabel";
import { modulesPageState } from "./modulesState";
import { mainMenuState } from "./state";
import { cloneToggleButton } from "./toggleButton";
import { toggleGroup, toggleStates } from "./toggleState";

export function buildModulesPage(container: any): void {
  if (modulesPageState.built) return;
  if (!isValidPtr(container)) return;
  const baseY = runtimeState.togglesBaseY - 60 / 2 - 40 / 2 - 30 + 40 + 50 + 55 + 30 - 30 + 20 - 17;
  const baseX = -178 - 10 - 10;
  modulesPageState.built = true;
  const categoryY = baseY - 177;
  const categoryX = -148;
  const categories = [
    {
      offsetX: -160 + 40 + 15 - 5 + 5,
      offsetY: 45 + 50 + 35 + 15,
      label: "Visual",
    },
    {
      offsetX: 160 - 40 - 15 + 5 - 5,
      offsetY: 45 + 50 + 35 + 15,
      label: "Exper.",
    },
  ];
  modulesPageState.bigButtons = [];

  // big "Visual" / "Exper." buttons
  for (let categoryIndex = 0; categoryIndex < categories.length; categoryIndex++) {
    const categoryClip = getMovieClip("sc/ui.sc", "map_editor_big_exit_button");
    if (!isValidPtr(categoryClip)) continue;
    try {
      natives.gotoAndStopFrame(categoryClip, 1);
    } catch (error) {}
    const categoryButton = natives.malloc(640);
    natives.buttonCtor(categoryButton);
    let built = false;
    try {
      let vt: any;
      let fn: any;
      if (
        (vt = categoryButton.readPointer()) &&
        !vt.isNull() &&
        (fn = vt.add(360).readPointer()) &&
        !fn.isNull()
      ) {
        new NativeFunction(fn, "void", ["pointer", "pointer", "int"])(
          categoryButton,
          categoryClip,
          1,
        );
        built = true;
      }
    } catch (error) {}
    if (!built) {
      try {
        natives.buttonSetMovieClip(categoryButton, categoryClip, 1);
        built = true;
      } catch (error) {}
    }
    if (!built) continue;
    try {
      categoryButton.add(78).writeU8(1);
    } catch (error) {}
    setButtonText(categoryButton, "Text", categories[categoryIndex].label);
    setButtonText(categoryButton, "txt", categories[categoryIndex].label);
    setScale(categoryButton, 1.15 / runtimeState.menuScaleX, 1.15 / runtimeState.menuScaleY);
    setPosition(
      categoryButton,
      categoryX + categories[categoryIndex].offsetX,
      categoryY + categories[categoryIndex].offsetY,
    );
    if (!addChild(container, categoryButton)) {
      addToStage(categoryButton);
    }
    modulesPageState.bigButtons.push(categoryButton);
  }

  // three sliders
  const sliderY = categoryY + 120 + 70 + 70 + 35 + 20;
  modulesPageState.sliders = [];
  for (let sliderIndex = 0; sliderIndex < 3; sliderIndex++) {
    const slider = createSlider();
    if (!isValidPtr(slider)) continue;
    setSliderRange(slider, -10, 10);
    setSliderValue(slider, 0);
    setScale(slider, 1 / runtimeState.menuScaleX, 1 / runtimeState.menuScaleY);
    setPosition(slider, -190, sliderY + (sliderIndex - 1) * 70);
    if (!addChild(container, slider)) {
      addToStage(slider);
    }
    modulesPageState.sliders.push(slider);
  }

  // slider labels
  const sliderNames = ["angle", "aim lead", "dodge dirs"];
  modulesPageState.sliderLabels = [];
  for (let labelIndex = 0; labelIndex < sliderNames.length; labelIndex++) {
    const sliderLabel = createTextLabel(
      sliderNames[labelIndex],
      -45 - 18 - 7 - 10 - 12 - 8,
      sliderY - 15 - 5 - 5 + (labelIndex - 1) * 70,
    );
    if (isValidPtr(sliderLabel)) {
      setChildScaleY(sliderLabel, "Text", runtimeState.menuScaleX / runtimeState.menuScaleY);
      setChildScaleY(sliderLabel, "text", runtimeState.menuScaleX / runtimeState.menuScaleY);
      try {
        let labelTextField = getTextFieldByName(sliderLabel, "Text");
        if (!isValidPtr(labelTextField)) {
          labelTextField = getTextFieldByName(sliderLabel, "text");
        }
        if (isValidPtr(labelTextField)) {
          labelTextField.add(176).writeS16(13);
        }
      } catch (error) {}
      if (!addChild(container, sliderLabel)) {
        addToStage(sliderLabel);
      }
    }
    modulesPageState.sliderLabels.push(sliderLabel);
  }

  if (modulesPageState.sliderInterval) {
    cancelInterval(modulesPageState.sliderInterval);
  }
  modulesPageState.sliderInterval = scheduleInterval(function () {
    if (!mainMenuState.isOpen) return;
    for (let sliderIndex = 0; sliderIndex < modulesPageState.sliders.length; sliderIndex++) {
      if (isValidPtr(modulesPageState.sliders[sliderIndex])) {
        updateSlider(modulesPageState.sliders[sliderIndex], 0.016);
      }
    }
    return;
  }, 16);

  // first toggle (index 0): "dodgebot --ignore"
  const dodgeSourceClip = getMovieClip("sc/ui.sc", "edit_controls_ui_screen_hud_top");
  if (!isValidPtr(dodgeSourceClip)) return;
  gotoFrame(dodgeSourceClip, 1);
  const dodgeToggle = cloneToggleButton(dodgeSourceClip);
  if (!dodgeToggle) return;
  if (!isValidPtr(dodgeToggle.button)) return;
  let toggleHalfWidth: any;
  if (!((toggleHalfWidth = getWidth(dodgeToggle.button) / 2) > 1)) {
    toggleHalfWidth = 45;
  }
  const colX = baseX + 65 + 15 + toggleHalfWidth + 3 + 45 + 25 + 10 + 10 - 7;
  const rowY = baseY - 40 - 35 - 22 - 20 - 30 - 20 - 20 + 10 + 5;
  const toggleX = colX - 150 + 30 - 15;
  const toggleY = rowY + 350 - 7;
  setPosition(dodgeToggle.button, toggleX, toggleY);
  const labelScaleY = runtimeState.menuScaleX / runtimeState.menuScaleY / 1.1;
  const dodgeLabel = createTextLabel(
    "<cFF0000>dodgebot --ignore</c>",
    toggleX + toggleHalfWidth + 10 - 50 - 15 - 7 + 7,
    toggleY + 60 + 40 + 40 + 10 - 3 + 10 + 10 + 5,
  );
  if (isValidPtr(dodgeLabel)) {
    setChildScaleY(dodgeLabel, "Text", labelScaleY);
    setChildScaleY(dodgeLabel, "text", labelScaleY);
    try {
      let dodgeTextField = getTextFieldByName(dodgeLabel, "Text");
      if (!isValidPtr(dodgeTextField)) {
        dodgeTextField = getTextFieldByName(dodgeLabel, "text");
      }
      let dodgeFontSize: any;
      if (isValidPtr(dodgeTextField) && (dodgeFontSize = dodgeTextField.add(176).readS16()) > 0) {
        dodgeTextField.add(176).writeS16(12);
      }
    } catch (error) {}
    if (!addChild(container, dodgeLabel)) {
      addToStage(dodgeLabel);
    }
  }

  // second toggle (index 2): "Killaura", third toggle (index 6): "aimbot"
  hudTop: {
    const killauraSourceClip = getMovieClip("sc/ui.sc", "edit_controls_ui_screen_hud_top");
    if (!isValidPtr(killauraSourceClip)) break hudTop;
    gotoFrame(killauraSourceClip, 1);
    const killauraToggle = cloneToggleButton(killauraSourceClip);
    if (!killauraToggle) break hudTop;
    if (!isValidPtr(killauraToggle.button)) break hudTop;
    const killauraY = toggleY + 90;
    setPosition(killauraToggle.button, toggleX, killauraY);
    if (!addChild(container, killauraToggle.button)) {
      addToStage(killauraToggle.button);
    }
    const killauraEnabled = 2 in toggleStates ? !!toggleStates[2] : false;
    const killauraItem = {
      button: killauraToggle.button,
      clip: killauraToggle.clip,
      stateClip: killauraToggle.stateClip,
      label: null,
      enabled: killauraEnabled,
      id: 2,
    };
    if (!killauraEnabled && isValidPtr(killauraToggle.stateClip)) {
      try {
        natives.gotoAndStopFrame(killauraToggle.stateClip, 1);
      } catch (error) {}
    }
    toggleGroup.items.push(killauraItem);
    setNodeAction(killauraToggle.button, {
      kind: "toggle2",
      id: 2,
    });
    modulesPageState.killauraToggleButton = killauraToggle.button;
    const killauraLabel = createTextLabel(
      "<cFF0000>Killaura</c>",
      toggleX + toggleHalfWidth + 10 - 50 - 15 - 7 + 7,
      killauraY + 60 + 40 + 40 + 10 - 3 + 10 + 10 + 5,
    );
    if (isValidPtr(killauraLabel)) {
      setChildScaleY(killauraLabel, "Text", labelScaleY);
      setChildScaleY(killauraLabel, "text", labelScaleY);
      try {
        let killauraTextField = getTextFieldByName(killauraLabel, "Text");
        if (!isValidPtr(killauraTextField)) {
          killauraTextField = getTextFieldByName(killauraLabel, "text");
        }
        let killauraFontSize: any;
        if (
          isValidPtr(killauraTextField) &&
          (killauraFontSize = killauraTextField.add(176).readS16()) > 0
        ) {
          killauraTextField.add(176).writeS16(12);
        }
      } catch (error) {}
      if (!!addChild(container, killauraLabel)) {
        // already attached
      } else {
        addToStage(killauraLabel);
      }
    }
    modulesPageState.killauraLabel = killauraLabel;

    const aimbotSourceClip = getMovieClip("sc/ui.sc", "edit_controls_ui_screen_hud_top");
    if (!isValidPtr(aimbotSourceClip)) break hudTop;
    gotoFrame(aimbotSourceClip, 1);
    const aimbotToggle = cloneToggleButton(aimbotSourceClip);
    if (!aimbotToggle) break hudTop;
    if (!isValidPtr(aimbotToggle.button)) break hudTop;
    const aimbotY = killauraY + 90;
    setPosition(aimbotToggle.button, toggleX, aimbotY);
    if (!addChild(container, aimbotToggle.button)) {
      addToStage(aimbotToggle.button);
    }
    const aimbotEnabled = 6 in toggleStates ? !!toggleStates[6] : false;
    const aimbotItem = {
      button: aimbotToggle.button,
      clip: aimbotToggle.clip,
      stateClip: aimbotToggle.stateClip,
      label: null,
      enabled: aimbotEnabled,
      id: 6,
    };
    if (!aimbotEnabled && isValidPtr(aimbotToggle.stateClip)) {
      try {
        natives.gotoAndStopFrame(aimbotToggle.stateClip, 1);
      } catch (error) {}
    }
    toggleGroup.items.push(aimbotItem);
    setNodeAction(aimbotToggle.button, {
      kind: "toggle2",
      id: 6,
    });
    modulesPageState.aimbotToggleButton = aimbotToggle.button;
    const aimbotLabel = createTextLabel(
      "<cFF0000>aimbot</c>",
      toggleX + toggleHalfWidth + 10 - 50 - 15 - 7 + 7,
      aimbotY + 60 + 40 + 40 + 10 - 3 + 10 + 10 + 5,
    );
    if (isValidPtr(aimbotLabel)) {
      setChildScaleY(aimbotLabel, "Text", labelScaleY);
      setChildScaleY(aimbotLabel, "text", labelScaleY);
      try {
        let aimbotTextField = getTextFieldByName(aimbotLabel, "Text");
        if (!isValidPtr(aimbotTextField)) {
          aimbotTextField = getTextFieldByName(aimbotLabel, "text");
        }
        let aimbotFontSize: any;
        if (!isValidPtr(aimbotTextField)) {
          // no text field
        } else if ((aimbotFontSize = aimbotTextField.add(176).readS16()) > 0) {
          aimbotTextField.add(176).writeS16(12);
        }
      } catch (error) {}
      if (!addChild(container, aimbotLabel)) {
        addToStage(aimbotLabel);
      }
    }
    modulesPageState.aimbotLabel = aimbotLabel;
    if (aimbotEnabled && runtimeState.aimbotApi) {
      runtimeState.aimbotApi.enable();
    }
  }

  // Outline has an independent enable flag; opening/saving its colour popup does not enable it.
  const outlineSource = getMovieClip("sc/ui.sc", "edit_controls_ui_screen_hud_top");
  if (isValidPtr(outlineSource)) {
    gotoFrame(outlineSource, 1);
    const outlineToggle = cloneToggleButton(outlineSource);
    if (outlineToggle && isValidPtr(outlineToggle.button)) {
      const outlineY = toggleY + 270;
      setPosition(outlineToggle.button, toggleX, outlineY);
      if (!addChild(container, outlineToggle.button)) addToStage(outlineToggle.button);
      const enabled = outlineState.outlineEnabled;
      toggleStates[1] = enabled;
      if (isValidPtr(outlineToggle.stateClip))
        natives.gotoAndStopFrame(outlineToggle.stateClip, enabled ? 0 : 1);
      const label = createTextLabel(
        "<cFF0000>Outline</c>",
        toggleX + toggleHalfWidth - 55,
        outlineY + 172,
      );
      if (isValidPtr(label)) {
        setChildScaleY(label, "Text", labelScaleY);
        setChildScaleY(label, "text", labelScaleY);
        const text = getTextFieldByName(label, "Text");
        if (isValidPtr(text)) text.add(176).writeS16(12);
        if (!addChild(container, label)) addToStage(label);
      }
      toggleGroup.items.push({ ...outlineToggle, enabled, id: 1, label });
      setNodeAction(outlineToggle.button, { kind: "toggle2", id: 1 });
    }
  }

  // "Modules" label
  const modulesLabel = createTextLabel(
    "Modules",
    toggleX - 20 - 20 + 10 - 5,
    toggleY - 55 + 25 + 45 + 20 + 13 + 12 + 15 + 5 + 5,
  );
  if (isValidPtr(modulesLabel)) {
    setChildScaleY(modulesLabel, "Text", labelScaleY);
    setChildScaleY(modulesLabel, "text", labelScaleY);
    let modulesTextField = getTextFieldByName(modulesLabel, "Text");
    if (!isValidPtr(modulesTextField)) {
      modulesTextField = getTextFieldByName(modulesLabel, "text");
    }
    if (isValidPtr(modulesTextField)) {
      try {
        modulesTextField.add(176).writeS16(15);
      } catch (error) {}
    }
    if (!!addChild(container, modulesLabel)) {
      // already attached
    } else {
      addToStage(modulesLabel);
    }
  }
  modulesPageState.dodgebotLabel = dodgeLabel;
  modulesPageState.modulesLabel = modulesLabel;

  // edit button cloned from popup_profile/profile_stats/clan_container/edit_button
  let editButton: any = ptr(0);
  let profileClip: any = ptr(0);
  try {
    profileClip = natives.getMovieClip(cstr("sc/ui.sc"), cstr("popup_profile"), 0);
  } catch (error) {}
  if (!isValidPtr(profileClip)) {
    profileClip = createMovieClipStr("sc/ui.sc", "popup_profile");
  }
  if (isValidPtr(profileClip)) {
    const stats = getMovieClipByName(profileClip, "profile_stats");
    const clanContainer = isValidPtr(stats) ? getMovieClipByName(stats, "clan_container") : ptr(0);
    const editClip = isValidPtr(clanContainer)
      ? getMovieClipByName(clanContainer, "edit_button")
      : ptr(0);
    if (isValidPtr(editClip)) {
      try {
        natives.gotoAndStopFrame(editClip, 1);
      } catch (error) {}
      editButton = natives.malloc(640);
      natives.buttonCtor(editButton);
      try {
        natives.buttonSetMovieClip(editButton, editClip, 1);
      } catch (error) {}

      try {
        editButton.add(78).writeU8(1);
      } catch (error) {}
      setScale(editButton, 1 / runtimeState.menuScaleX, 1 / runtimeState.menuScaleY);
      setPosition(editButton, colX - 30 - 7 + 10, rowY + 150 + 220 + 230 + 35 + 25 + 15 + 90);
      if (!addChild(container, editButton)) {
        addToStage(editButton);
      }
      modulesPageState.editButton = editButton;
      setNodeAction(editButton, {
        kind: "editpage",
      });
    }
  }

  if (!addChild(container, dodgeToggle.button)) {
    addToStage(dodgeToggle.button);
  }
  const dodgeEnabled = 0 in toggleStates ? !!toggleStates[0] : false;
  const dodgeItem = {
    button: dodgeToggle.button,
    clip: dodgeToggle.clip,
    stateClip: dodgeToggle.stateClip,
    label: null,
    enabled: dodgeEnabled,
    id: 0,
  };
  if (!dodgeEnabled && isValidPtr(dodgeToggle.stateClip)) {
    try {
      natives.gotoAndStopFrame(dodgeToggle.stateClip, 1);
    } catch (error) {}
  }
  toggleGroup.items.push(dodgeItem);
  toggleGroup.built = true;
  setNodeAction(dodgeToggle.button, {
    kind: "toggle2",
    id: 0,
  });
  modulesPageState.dodgebotToggleButton = dodgeToggle.button;
  if (runtimeState.autoDodgeApi) {
    runtimeState.autoDodgeApi.setEnabled(dodgeEnabled);
  }
  return;
}

export function destroyModulesPage(): void {
  if (modulesPageState.interval) {
    cancelInterval(modulesPageState.interval);
    modulesPageState.interval = null;
  }
  if (modulesPageState.sliderInterval) {
    cancelInterval(modulesPageState.sliderInterval);
    modulesPageState.sliderInterval = null;
  }
  for (
    let buttonIndex = 0;
    buttonIndex < (modulesPageState.bigButtons || []).length;
    buttonIndex++
  ) {
    if (isValidPtr(modulesPageState.bigButtons[buttonIndex]))
      removeFromStage(modulesPageState.bigButtons[buttonIndex]);
  }
  for (let sliderIndex = 0; sliderIndex < (modulesPageState.sliders || []).length; sliderIndex++) {
    if (isValidPtr(modulesPageState.sliders[sliderIndex]))
      removeFromStage(modulesPageState.sliders[sliderIndex]);
  }
  for (
    let labelIndex = 0;
    labelIndex < (modulesPageState.sliderLabels || []).length;
    labelIndex++
  ) {
    if (isValidPtr(modulesPageState.sliderLabels[labelIndex]))
      removeFromStage(modulesPageState.sliderLabels[labelIndex]);
  }
  if (isValidPtr(modulesPageState.editButton)) removeFromStage(modulesPageState.editButton);
  if (isValidPtr(modulesPageState.dodgebotLabel)) removeFromStage(modulesPageState.dodgebotLabel);
  if (isValidPtr(modulesPageState.killauraLabel)) removeFromStage(modulesPageState.killauraLabel);
  if (isValidPtr(modulesPageState.modulesLabel)) removeFromStage(modulesPageState.modulesLabel);
  modulesPageState.bigButtons = [];
  modulesPageState.sliders = [];
  modulesPageState.editButton = null;
  modulesPageState.dodgebotLabel = null;
  modulesPageState.killauraLabel = null;
  modulesPageState.modulesLabel = null;
  modulesPageState.dodgebotToggleButton = null;
  modulesPageState.built = false;
}
