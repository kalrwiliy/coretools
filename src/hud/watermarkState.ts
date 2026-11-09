/** Native widget references remain opaque; scalar controller state is explicit. */
export interface WatermarkStateState {
  container: any;
  textField: any;
  built: boolean;
  [key: string]: any;
}
export const watermarkState: WatermarkStateState = {
  container: null,
  textField: null,
  built: false,
};
