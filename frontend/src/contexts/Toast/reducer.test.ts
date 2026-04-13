import { initialState, toastReducer } from "./reducer";

describe("Toast reducer", () => {
  it("stores toast payload", () => {
    const payload = { title: "Info", message: "Mensaje", status: "info" as const };

    expect(toastReducer(initialState, { type: "SHOW_TOAST", payload })).toEqual({
      toast: payload,
    });
  });
});
