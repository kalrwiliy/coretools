/** Native widget references remain opaque; scalar controller state is explicit. */
export interface DragStateState {
  javaHookInstalled: boolean;
  dragging: boolean;
  handleButton: any;
  lastTouchX: number;
  lastTouchY: number;
  dragStartTouchX: number;
  dragStartTouchY: number;
  dragStartMenuX: number;
  dragStartMenuY: number;
  touchScaleX: number;
  touchScaleY: number;
  screenWidth: number;
  screenHeight: number;
  touchEventCount: number;
  [key: string]: any;
}
export const dragState: DragStateState = {
  javaHookInstalled: false,
  dragging: false,
  handleButton: null,
  lastTouchX: 0,
  lastTouchY: 0,
  dragStartTouchX: 0,
  dragStartTouchY: 0,
  dragStartMenuX: 0,
  dragStartMenuY: 0,
  touchScaleX: 1,
  touchScaleY: 1,
  screenWidth: 0,
  screenHeight: 0,
  touchEventCount: 0,
};
