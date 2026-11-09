/** Native widget references remain opaque; scalar controller state is explicit. */
export interface MainMenuStateState {
  button: any;
  pingButton: any;
  pingClip: any;
  pingVisible: boolean;
  telegramButton: any;
  telegramClip: any;
  menu: any;
  clip: any;
  isOpen: boolean;
  page: number;
  [key: string]: any;
}
export const mainMenuState: MainMenuStateState = {
  button: null,
  pingButton: null,
  pingClip: null,
  pingVisible: true,
  telegramButton: null,
  telegramClip: null,
  menu: null,
  clip: null,
  isOpen: false,
  page: 1,
};
