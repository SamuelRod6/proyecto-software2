import { showLoader, hideLoader } from "./actions";

describe("Loader actions", () => {
  it("dispatches SHOW_LOADER", () => {
    const dispatch = jest.fn();
    showLoader(dispatch as never);
    expect(dispatch).toHaveBeenCalledWith({ type: "SHOW_LOADER" });
  });

  it("dispatches HIDE_LOADER", () => {
    const dispatch = jest.fn();
    hideLoader(dispatch as never);
    expect(dispatch).toHaveBeenCalledWith({ type: "HIDE_LOADER" });
  });
});
