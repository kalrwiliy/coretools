/** Native widget references remain opaque; scalar controller state is explicit. */
export interface ModulesPageStateState {
  slider: any;
  dodgebotToggleButton: any;
  interval: any;
  value: number;
  built: boolean;
  unknownW: number;
  screenWidth: number;
  [key: string]: any;
}
export const modulesPageState: ModulesPageStateState = {
  slider: null,
  dodgebotToggleButton: null,
  interval: null,
  value: 0,
  built: false,
  unknownW: 0,
  screenWidth: 0,
};
