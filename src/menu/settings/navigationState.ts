/** Native widget references remain opaque; scalar controller state is explicit. */
export interface CameraNavButtonsState {
  items: any[];
  built: boolean;
  [key: string]: any;
}
export const cameraNavButtons: CameraNavButtonsState = { items: [], built: false };
