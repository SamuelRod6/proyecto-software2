import { showToast } from "./actions";

describe("Toast actions", () => {
  it("dispatches SHOW_TOAST with payload", () => {
    const dispatch = jest.fn();
    const payload = { title: "Ok", message: "Guardado", status: "success" as const };

    showToast(dispatch as never, payload);

    expect(dispatch).toHaveBeenCalledWith({
      type: "SHOW_TOAST",
      payload,
    });
  });
});
