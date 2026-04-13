import { modalReducer } from "./reducer";
import { CLOSE_MODAL, OPEN_MODAL } from "./actions";

describe("Modal reducer", () => {
  it("opens modal with object payload", () => {
    const result = modalReducer(undefined, {
      type: OPEN_MODAL,
      payload: { modalName: "editUser", payload: { id: 10 } },
    });

    expect(result).toEqual({
      openModal: "editUser",
      payload: { id: 10 },
    });
  });

  it("supports legacy OPEN_MODAL string payload", () => {
    const result = modalReducer(undefined, {
      type: OPEN_MODAL,
      payload: "legacyModal",
    });

    expect(result).toEqual({
      openModal: "legacyModal",
      payload: undefined,
    });
  });

  it("closes modal", () => {
    const result = modalReducer(
      { openModal: "editUser", payload: { id: 1 } },
      { type: CLOSE_MODAL },
    );

    expect(result).toEqual({ openModal: null, payload: undefined });
  });
});
