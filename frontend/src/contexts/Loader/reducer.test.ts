import { initialState, loaderReducer } from "./reducer";

describe("Loader reducer", () => {
  it("shows loader", () => {
    expect(loaderReducer(initialState, { type: "SHOW_LOADER" })).toEqual({ visible: true });
  });

  it("hides loader", () => {
    expect(loaderReducer({ visible: true }, { type: "HIDE_LOADER" })).toEqual({ visible: false });
  });
});
