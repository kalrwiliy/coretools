/** Native widget references remain opaque; scalar controller state is explicit. */
export interface ToggleGroupState {
  items: any[];
  built: boolean;
  [key: string]: any;
}
export const toggleGroup: ToggleGroupState = { items: [], built: false };

export const toggleStates: Record<number, boolean> = {};
