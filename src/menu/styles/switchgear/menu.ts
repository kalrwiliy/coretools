import { attachHook, scheduleTimeout } from "../../../runtime/lifecycle";
import { menuStyleState } from "../selection";
// Switchgear menu construction, visibility and touch routing.

import { loadDebugSc } from "../../../engine/assets";
import { natives } from "../../../engine/bindings";
import { LibgOffsets } from "../../../engine/offsets";
import { runtimeState } from "../../../runtime/controllers";
import { coreState } from "../../../runtime/coreState";
import {
  MENU_OFFSET_X,
  MENU_OFFSET_Y,
  MENU_SCALE_X,
  MENU_SCALE_Y,
  ROW_OFFSET_Y,
  state,
} from "./state";
import {
  createButton,
  createLabel,
  createSlider,
  createToggle,
  cstr,
  getLayoutWidth,
  getMovieClip,
  getStage,
  isLibgObject,
  isNodeOrParent,
  isValidPtr,
  pooledString,
  resolveNatives,
  setPosition,
  setScale,
  startSliderTicker,
} from "./widgets";

export function build(): boolean {
  if (isLibgObject(state.clip)) {
    state.open = true;
    return true;
  }
  try {
    if (!coreState.base || !resolveNatives()) {
      return false;
    }

    const stage: any = getStage();
    if (!isValidPtr(stage)) {
      return false;
    }

    loadDebugSc();
    const menu: any = getMovieClip("sc/debug.sc", "debug_menu");
    if (!isValidPtr(menu)) {
      return false;
    }
    try {
      natives.setWidgetFrame(menu, 1);
    } catch (error) {}

    // hide the stock debug-menu buttons
    const hiddenNames: any = ["debug_menu_input_button", "close_button", "clear_button"];
    for (let childIndex = 0; childIndex < hiddenNames.length; childIndex++) {
      try {
        const child: any = natives.getMovieClipByName2(menu, cstr(hiddenNames[childIndex]));
        if (isValidPtr(child)) {
          try {
            child.add(8).writeU8(0);
          } catch (error) {}
          try {
            child.add(32).writeFloat(-99999);
          } catch (error) {}
        }
      } catch (error) {}
    }

    const cfg: any = natives.malloc(544);
    for (let off = 0; off < 544; off += 8) {
      try {
        cfg.add(off).writeU64(0);
      } catch (error) {}
    }
    natives.menuWrapperCtor(cfg, menu);
    if (!isValidPtr(cfg.add(144).readPointer())) {
      return false;
    }

    const screenW: any = getLayoutWidth();
    const menuX: any = Math.floor(screenW * 0.3) + 25 + 35 + MENU_OFFSET_X;
    const menuY: any = 55 + 35 + MENU_OFFSET_Y;
    menu.add(16).writeFloat(MENU_SCALE_X);
    menu.add(28).writeFloat(MENU_SCALE_Y);
    menu.add(32).writeFloat(menuX);
    menu.add(36).writeFloat(menuY);
    try {
      menu.add(9).writeU8(255);
      menu.add(10).writeU8(255);
      menu.add(11).writeU8(255);
    } catch (error) {}
    try {
      natives.addChild(stage, cfg);
    } catch (error) {
      return false;
    }

    const container: any = cfg.add(144).readPointer();
    let baseX: any = 0;
    let baseY: any = 12;
    let titleSize: any = 0;

    try {
      // title / version fields of the cloned debug menu
      let titleField: any = natives.getTextFieldByName2(container, cstr("title"));
      if (!isValidPtr(titleField)) {
        titleField = natives.getMovieClipByName2(container, cstr("title"));
      }
      if (isValidPtr(titleField)) {
        try {
          baseX = titleField.add(32).readFloat() + 112;
          baseY = titleField.add(36).readFloat();
        } catch (error) {}
        try {
          titleSize = titleField.add(176).readS16();
        } catch (error) {}
        natives.setText(titleField, pooledString(""));
      }
      try {
        natives.setChildText(cfg, cstr("title"), pooledString(""));
      } catch (error) {}

      let versionField: any = natives.getTextFieldByName2(container, cstr("version"));
      if (!isValidPtr(versionField)) {
        versionField = natives.getMovieClipByName2(container, cstr("version"));
      }
      if (isValidPtr(versionField)) {
        natives.setText(versionField, pooledString(""));
      }
      try {
        natives.setChildText(cfg, cstr("version"), pooledString(""));
      } catch (error) {}

      const headerClip: any = getMovieClip("sc/debug.sc", "debug_menu_text");
      if (isValidPtr(headerClip)) {
        // header label
        try {
          natives.setWidgetFrame(headerClip, 1);
        } catch (error) {}
        setPosition(headerClip, baseX, baseY);
        let headerText: any = natives.getTextFieldByName2(headerClip, cstr("Text"));
        if (!isValidPtr(headerText)) {
          headerText = natives.getTextFieldByName2(headerClip, cstr("text"));
        }
        if (!isValidPtr(headerText)) {
          headerText = natives.getTextFieldByName2(headerClip, cstr("txt"));
        }
        if (isValidPtr(headerText)) {
          natives.setText(headerText, pooledString("Switchgear (style)"));
          headerText.add(9).writeU8(255);
          headerText.add(10).writeU8(255);
          headerText.add(11).writeU8(255);
          try {
            natives.setColor(headerText, 4294967295);
          } catch (error) {}
          const headerSize: any = titleSize > 0 ? Math.round(titleSize * 0.85) : 20;
          try {
            headerText.add(176).writeS16(headerSize | 0);
          } catch (error) {}
          const scaleRatio: any = MENU_SCALE_X / MENU_SCALE_Y;
          try {
            headerText.add(28).writeFloat(headerText.add(28).readFloat() * scaleRatio);
          } catch (error) {}
        }
        try {
          natives.addChild(container, headerClip);
        } catch (error) {
          try {
            natives.addChild(stage, headerClip);
          } catch (error) {}
        }

        // page label "1/2"
        const pageClip: any = getMovieClip("sc/debug.sc", "debug_menu_text");
        if (isValidPtr(pageClip)) {
          try {
            natives.setWidgetFrame(pageClip, 1);
          } catch (error) {}
          setPosition(pageClip, baseX + 113, baseY);
          let pageText: any = natives.getTextFieldByName2(pageClip, cstr("Text"));
          if (!isValidPtr(pageText)) {
            pageText = natives.getTextFieldByName2(pageClip, cstr("text"));
          }
          if (!isValidPtr(pageText)) {
            pageText = natives.getTextFieldByName2(pageClip, cstr("txt"));
          }
          if (isValidPtr(pageText)) {
            natives.setText(pageText, pooledString("1/2"));
            pageText.add(9).writeU8(255);
            pageText.add(10).writeU8(255);
            pageText.add(11).writeU8(255);
            const pageSize: any = titleSize > 0 ? Math.round(titleSize * 0.85) : 20;
            try {
              pageText.add(176).writeS16(pageSize);
            } catch (error) {}
            try {
              pageText
                .add(28)
                .writeFloat(pageText.add(28).readFloat() * (MENU_SCALE_X / MENU_SCALE_Y));
            } catch (error) {}
          }
          try {
            natives.addChild(container, pageClip);
          } catch (error) {
            try {
              natives.addChild(stage, pageClip);
            } catch (error) {}
          }
        }
      } else {
        if (isValidPtr(titleField)) {
          natives.setText(titleField, pooledString("Switchgear (style)"));
        }
      }
    } catch (error) {}

    // X / Y / Z sliders
    state.sliders = [];
    const axes: any = ["X", "Y", "Z"];
    for (let ai = 0; ai < axes.length; ai++) {
      const slider: any = createSlider();
      if (!isValidPtr(slider)) {
        continue;
      }
      try {
        slider.add(236).writeS32(-10);
        slider.add(240).writeS32(10);
        slider.add(232).writeS32(0);
      } catch (error) {}
      setScale(slider, 1 / MENU_SCALE_X, 1 / MENU_SCALE_Y);
      setPosition(slider, -190, 180 + ai * 70 + ROW_OFFSET_Y);
      try {
        natives.addChild(container, slider);
      } catch (error) {
        try {
          natives.addChild(stage, slider);
        } catch (error) {}
      }

      const axisClip: any = getMovieClip("sc/debug.sc", "debug_menu_text");
      let axisText: any = null;
      if (isValidPtr(axisClip)) {
        try {
          natives.setWidgetFrame(axisClip, 1);
        } catch (error) {}
        setPosition(axisClip, -80, 180 + ai * 70 - 15 + ROW_OFFSET_Y);
        axisText = natives.getTextFieldByName2(axisClip, cstr("Text"));
        if (!isValidPtr(axisText)) {
          axisText = natives.getTextFieldByName2(axisClip, cstr("text"));
        }
        if (isValidPtr(axisText)) {
          natives.setText(axisText, pooledString(axes[ai] + ": 0"));
          axisText.add(9).writeU8(255);
          axisText.add(10).writeU8(255);
          axisText.add(11).writeU8(255);
          try {
            let curSize: any;
            if (!((curSize = axisText.add(176).readS16()) > 0)) {
              axisText.add(176).writeS16(16);
            }
          } catch (error) {}
          try {
            axisText.add(28).writeFloat(MENU_SCALE_X / MENU_SCALE_Y);
          } catch (error) {}
        }
        try {
          natives.addChild(container, axisClip);
        } catch (error) {
          try {
            natives.addChild(stage, axisClip);
          } catch (error) {}
        }
      }
      state.sliders.push({
        slider: slider,
        labelClip: axisClip,
        tf: axisText,
        name: axes[ai],
        lastValue: null,
      });
    }

    // camera button, preset label, reset button
    const camX: any = baseX + 35;
    const camY: any = baseY + 95 + ROW_OFFSET_Y;
    state.cameraButton = createButton("Камера", camX, camY);
    if (isValidPtr(state.cameraButton)) {
      try {
        natives.addChild(container, state.cameraButton);
      } catch (error) {}
    }
    const presetLabel: any = createLabel("Пресет:", camX - 132, camY - 15);
    if (isValidPtr(presetLabel)) {
      try {
        natives.addChild(container, presetLabel);
      } catch (error) {}
    }
    const resetY: any = 180 + 2 * 70 - 15 + ROW_OFFSET_Y + 75;
    state.resetButton = createButton("Сброс", -60, resetY);
    if (isValidPtr(state.resetButton)) {
      try {
        natives.addChild(container, state.resetButton);
      } catch (error) {}
    }

    // toggle buttons: two columns of 3
    state.toggles = [];
    const slots: any = [];
    for (let er = 0; er < 3; er++) {
      slots.push({ x: -202, y: 256 + er * 81 });
    }
    for (let nr = 0; nr < 3; nr++) {
      slots.push({ x: -36, y: resetY - 50 + nr * 81 });
    }
    const names: any = ["Disable camera shake", "Killaura", "Bot", "Hitbox", "Dodge", "Aimbot"];
    for (let si = 0; si < slots.length; si++) {
      const btn: any = createToggle(slots[si].x, slots[si].y - (si < 3 ? 7 : 0));
      if (isValidPtr(btn.button)) {
        try {
          natives.addChild(container, btn.button);
        } catch (error) {
          try {
            natives.addChild(stage, btn.button);
          } catch (error) {}
        }
        btn.name = names[si] ? names[si] : "";
        btn.enabled = false;
        try {
          if (isValidPtr(btn.stateClip)) {
            natives.setWidgetFrame(btn.stateClip, 1);
          }
        } catch (error) {}
        if (btn.name === "Dodge") {
          btn.enabled = false;
          try {
            if (isValidPtr(btn.stateClip)) {
              natives.setWidgetFrame(btn.stateClip, 1);
            }
          } catch (error) {}
        }
        state.toggles.push(btn);
      }
      const label: any = createLabel(
        "<cC5E4FB>" + (names[si] ? names[si] : "") + "</c>",
        slots[si].x - (si < 3 ? 26 : 33),
        slots[si].y + 142,
        0,
        [197, 228, 251],
      );
      if (isValidPtr(label)) {
        try {
          natives.addChild(container, label);
        } catch (error) {}
      }
    }

    // gamemode_left_button from popup_playermap_create
    try {
      const popup: any = getMovieClip("sc/ui.sc", "popup_playermap_create");
      if (isValidPtr(popup)) {
        let gmBtn: any = natives.getTextFieldByName2(popup, cstr("gamemode_left_button"));
        if (!isValidPtr(gmBtn)) {
          gmBtn = natives.getMovieClipByName2(popup, cstr("gamemode_left_button"));
        }
        if (isValidPtr(gmBtn)) {
          try {
            gmBtn.add(8).writeU8(1);
          } catch (error) {}
          try {
            gmBtn.add(16).writeFloat(1 / MENU_SCALE_X);
            gmBtn.add(28).writeFloat(1 / MENU_SCALE_Y);
          } catch (error) {}
          const gmX: any = slots[2].x - 77;
          const gmY: any = slots[2].y + 275;
          setPosition(gmBtn, gmX, gmY);
          try {
            natives.addChild(container, gmBtn);
          } catch (error) {
            try {
              natives.addChild(stage, gmBtn);
            } catch (error) {}
          }
          state.gamemodeButton = gmBtn;
        }
      }
    } catch (error) {}

    state.wrapper = cfg;
    state.clip = menu;
    state.container = container;
    state.open = true;
    startSliderTicker();
    return true;
  } catch (error) {
    return false;
  }
}

export function setVisible(visible: any): void {
  if (!isLibgObject(state.clip)) {
    return;
  }
  try {
    if (isValidPtr(state.wrapper)) {
      state.wrapper!.add(8).writeU8(visible ? 1 : 0);
    }
  } catch (error) {}
  try {
    state.clip!.add(8).writeU8(visible ? 1 : 0);
  } catch (error) {
    return;
  }
}

export function flip(): void {
  if (isLibgObject(state.clip)) {
    if (state.open) {
      state.open = false;
      setVisible(false);
      return;
    }
    state.open = true;
    setVisible(true);
    return;
  }
  if (build()) {
    setVisible(true);
  }
}

export function installTouchHook(): void {
  if (state.touchHook || !coreState.base) {
    return;
  }
  try {
    state.touchHook = attachHook(coreState.base.add(LibgOffsets.CustomButton_setState), {
      onEnter: function (args: any) {
        let target: any;
        let now: any;
        let toggleIndex: any;
        let entry: any;
        try {
          if ((menuStyleState.current ? menuStyleState.current : "coretools") !== "switchgear") {
            return;
          }
          if (args[1].toInt32() !== 1) {
            return;
          }
          if (!state.open) {
            return;
          }
          target = args[0];
          if (!isValidPtr(target)) {
            return;
          }
          if (state.gamemodeButton && !isLibgObject(state.gamemodeButton)) {
            state.gamemodeButton = null;
          }
          if (state.resetButton && !isLibgObject(state.resetButton)) {
            state.resetButton = null;
          }
          now = Date.now();

          // reset button: zero all sliders
          if (isNodeOrParent(target, state.resetButton)) {
            if (now - (state.lastResetTap ? state.lastResetTap : 0) < 600) {
              return;
            }
            state.lastResetTap = now;
            scheduleTimeout(function () {
              let index: any;
              let row: any;
              try {
                if (!state.sliders) {
                  return;
                }
                for (index = 0; index < state.sliders.length; index++) {
                  row = state.sliders[index];
                  if (!isLibgObject(row.slider)) {
                    continue;
                  }
                  row.slider.add(232).writeS32(0);
                  row.lastValue = 0;
                  if (isLibgObject(row.tf)) {
                    natives.setText(row.tf, pooledString(row.name + ": 0"));
                    row.tf.add(28).writeFloat(MENU_SCALE_X / MENU_SCALE_Y);
                  }
                }
                return;
              } catch (error) {
                return;
              }
            }, 0);
            return;
          }

          // gamemode button: debounce only
          if (isNodeOrParent(target, state.gamemodeButton)) {
            if (now - (state.lastGamemodeTap ? state.lastGamemodeTap : 0) < 600) {
              return;
            }
            state.lastGamemodeTap = now;
            return;
          }

          // camera button: debounce only
          if (isNodeOrParent(target, state.cameraButton)) {
            if (now - (state.lastCameraTap ? state.lastCameraTap : 0) < 600) {
              return;
            }
            state.lastCameraTap = now;
            return;
          }

          // toggle buttons
          if (state.toggles && state.toggles.length) {
            for (toggleIndex = 0; toggleIndex < state.toggles.length; toggleIndex++) {
              entry = state.toggles[toggleIndex];
              if (!isValidPtr(entry.button) || !isNodeOrParent(target, entry.button)) {
                continue;
              }
              if (now - (entry.lastTapAt ? entry.lastTapAt : 0) < 400) {
                return;
              }
              entry.lastTapAt = now;
              (function (toggle: any) {
                scheduleTimeout(function () {
                  try {
                    toggle.enabled = !toggle.enabled;
                    if (isValidPtr(toggle.stateClip)) {
                      natives.setWidgetFrame(toggle.stateClip, toggle.enabled ? 0 : 1);
                    }
                    if (toggle.name === "Dodge") {
                      if (runtimeState.autoDodgeApi) {
                        runtimeState.autoDodgeApi.setEnabled(toggle.enabled);
                      }
                    }
                    return;
                  } catch (error) {
                    return;
                  }
                }, 0);
              })(entry);
              return;
            }
          }
          return;
        } catch (error) {
          return;
        }
      },
    });
    return;
  } catch (error) {
    return;
  }
}
