/** Native widget references remain opaque; scalar controller state is explicit. */
export interface CoreStateState {
  base: any;
  debugButton: any;
  debugMenu: any;
  debugMenuCloseButton: any;
  miscCategory: any;
  battleCategory: any;
  debugMenuItems: any;
  tabButtons: NativePointer[] | null;
  actionsByPtr: Record<string, any>;
  debugMenuOpen: boolean;
  miscExpanded: boolean;
  battleExpanded: boolean;
  menuStylesExpanded: boolean;
  debugScLoaded: boolean;
  lastReturnHomeAt: number;
  lastPressAt: number;
  busy: boolean;
  watermarkTimer: any;
  stateWatchInterval: any;
  refreshTimer: any;
  lastGameState: number;
  initialized: boolean;
  battleActionForced: boolean;
  battleActionDone: boolean;
  uiHidden: boolean;
  pendingFlag: boolean;
  [key: string]: any;
}
export const coreState: CoreStateState = {
  base: null,
  debugButton: null,
  debugMenu: null,
  debugMenuCloseButton: null,
  miscCategory: null,
  battleCategory: null,
  debugMenuItems: null,
  tabButtons: null,
  actionsByPtr: {},
  debugMenuOpen: false,
  miscExpanded: false,
  battleExpanded: false,
  menuStylesExpanded: true,
  debugScLoaded: false,
  lastReturnHomeAt: 0,
  lastPressAt: 0,
  busy: false,
  watermarkTimer: null,
  stateWatchInterval: null,
  refreshTimer: null,
  lastGameState: -1,
  initialized: false,
  battleActionForced: false,
  battleActionDone: false,
  uiHidden: false,
  pendingFlag: false,
};
