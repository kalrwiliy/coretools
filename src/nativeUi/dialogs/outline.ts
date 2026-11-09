import { installOutlineRenderer } from "../../features/outline/renderer";
import { cancelInterval, scheduleInterval } from "../../runtime/lifecycle";
import { isDisposing } from "../../runtime/lifecycle";
import { trackOwnedPopup } from "../runtime/popupOwnership";
import { createScString, cstr, isValidPtr, releaseButtonListener } from "../platform/memory";
import type { OutlineSlider } from "../runtime/state";
import { nativeUiBindings, nativeUiRuntime, outlineState } from "../runtime/state";
import { getUiMovieClip } from "../widgets/assets";
import { createLabelButton } from "../widgets/buttons";
import { rgbaPercentToHex } from "../widgets/colors";
import { addChild } from "../widgets/display";
import {
  createSlider,
  getSliderValue,
  setSliderRange,
  setSliderValue,
  tickSlider,
} from "../widgets/sliders";
import { addTextLine, getPopupContent, showToast } from "./popupWidgets";

export function installOutlineColorHook(): boolean {
  outlineState.outlineHookInstalled = installOutlineRenderer();
  return outlineState.outlineHookInstalled;
}

export function setHexColorLabel(textField: any, rgba: any): void {
  if (!isValidPtr(textField)) return;
  const hex = rgbaPercentToHex(rgba);
  // Keep the readout legible even when the selected alpha is zero.
  nativeUiBindings.textFieldSetColor(textField, 0xffffffff);
  nativeUiBindings.textFieldSetText(textField, createScString("#" + hex.substring(0, 6)));
}

export function stopSliderPoll(): void {
  if (outlineState.sliderPollInterval) {
    cancelInterval(outlineState.sliderPollInterval);
    outlineState.sliderPollInterval = null;
  }
}

export function openOutlinePopup(): boolean {
  if (isDisposing()) return false;
  if (!nativeUiRuntime.state.libgBase) {
    showToast("libg not ready");

    return false;
  }
  if (outlineState.outlinePopupOpen) return true;
  // Shared by the controls and polling callback until popup disposal.
  let draftColor: number[];
  let sliders: OutlineSlider[];
  let hexLabel: NativePointer;
  const ownedButtons: NativePointer[] = [];
  let disposed = false;
  try {
    installOutlineColorHook();
    const stage = nativeUiBindings.getGUI();
    if (!isValidPtr(stage)) {
      showToast("Outline: GUI not ready");
      return false;
    }
    const popup = nativeUiBindings.calloc(472, 1);
    nativeUiBindings.popupBaseCtor(popup);
    trackOwnedPopup(popup, () => {
      disposed = true;
      if (outlineState.outlinePopupState?.popup.equals(popup)) {
        stopSliderPoll();
        outlineState.outlinePopupOpen = false;
        outlineState.outlinePopupState = null;
      }
      for (const button of ownedButtons) releaseButtonListener(button);
    });
    nativeUiBindings.popupSetTitle(popup, createScString("Brawler Outline"));
    const container = getPopupContent(popup);
    if (!isValidPtr(container)) {
      showToast("popup build failed");
      return false;
    }
    // DF1FB0 creates a country-list controller at +440; its scroll view is +16
    // (9AB834). Detach only that view, preserving the popup chrome/navigation.
    const countryList = popup.add(440).readPointer();
    if (isValidPtr(countryList)) {
      const scrollView = countryList.add(16).readPointer();
      if (isValidPtr(scrollView)) {
        scrollView.add(8).writeU8(0);
        const parent = scrollView.add(56).readPointer();
        if (isValidPtr(parent)) nativeUiBindings.spriteRemoveChild(parent, scrollView);
      }
    }
    draftColor = outlineState.outlineColor.slice();
    sliders = [];
    const layout = [
      { channel: 3, y: 150 },
      { channel: 0, y: 250 },
      { channel: 1, y: 350 },
      { channel: 2, y: 450 },
    ];
    for (let index = 0; index < layout.length; index++) {
      const entry = layout[index];
      const slider = createSlider();
      if (!isValidPtr(slider)) {
        showToast("slider assets failed");
        return false;
      }
      nativeUiBindings.setXY(slider, -150, entry.y);
      setSliderValue(slider, draftColor[entry.channel]);
      setSliderRange(slider, 0, 100);
      addChild(container, slider);
      sliders.push({ slider: slider, channel: entry.channel });
    }
    const textClip = getUiMovieClip("popover_text_left");
    hexLabel = isValidPtr(textClip)
      ? nativeUiBindings.getTextFieldByName(textClip, cstr("text"))
      : ptr(0);
    if (isValidPtr(hexLabel)) {
      nativeUiBindings.setXY(hexLabel, 140, 130);
      setHexColorLabel(hexLabel, draftColor);
      addChild(container, hexLabel);
    }
    for (let index = 0; index < outlineState.sliderLabels.length; index++) {
      const row = outlineState.sliderLabels[index];
      addTextLine(container, row.text, row.y, row.text === "Alpha" ? 0xffffffff : row.color);
    }
    const saveBtn = createLabelButton("Save", 250, 350, function () {
      outlineState.outlineColor = draftColor.slice();
    });
    if (isValidPtr(saveBtn)) ownedButtons.push(saveBtn);
    const resetBtn = createLabelButton("Reset", 250, 450, function () {
      // Mutate the shared draft: the polling state keeps this same array.
      draftColor.splice(0, 4, 100, 0, 0, 0);
      outlineState.outlineColor = draftColor.slice();
      for (let index = 0; index < sliders.length; index++) {
        setSliderValue(sliders[index].slider, draftColor[sliders[index].channel]);
      }
      setHexColorLabel(hexLabel, draftColor);
    });
    if (isValidPtr(resetBtn)) ownedButtons.push(resetBtn);
    if (isValidPtr(saveBtn)) addChild(container, saveBtn);
    if (isValidPtr(resetBtn)) addChild(container, resetBtn);
    const popupHolder = nativeUiBindings.malloc(Process.pointerSize);
    popupHolder.writePointer(popup);
    nativeUiBindings.showPopup(stage, popupHolder, 1, 1, 0);
    outlineState.outlinePopupOpen = true;
    outlineState.outlinePopupState = {
      popup: popup,
      sliders: sliders,
      values: draftColor,
      hexLabel: hexLabel,
    };
    stopSliderPoll();
    outlineState.sliderPollInterval = scheduleInterval(function () {
      if (disposed || !outlineState.outlinePopupOpen || !outlineState.outlinePopupState) return;
      const state = outlineState.outlinePopupState;
      let changed = false;
      for (let index = 0; index < state.sliders.length; index++) {
        const entry = state.sliders[index];
        const channel = entry.channel;
        tickSlider(entry.slider, 0.016);
        if (disposed || outlineState.outlinePopupState !== state) return;
        const after = getSliderValue(entry.slider);
        if (state.values[channel] !== after) {
          state.values[channel] = after;
          draftColor[channel] = after;
          outlineState.outlineColor = state.values.slice();
          changed = true;
        }
      }
      if (changed) {
        setHexColorLabel(state.hexLabel, state.values);
      }
    }, 16);
    showToast("Outline menu open");
    return true;
  } catch (error) {
    outlineState.outlinePopupOpen = false;
    stopSliderPoll();
    showToast("outline failed: " + error);
    return false;
  }
}
