import { CLOSE_MODAL, OPEN_MODAL, closeModal, openModal } from "./actions";

describe("Modal actions", () => {
  it("creates OPEN_MODAL action", () => {
    expect(openModal("confirmDelete", { id: 7 })).toEqual({
      type: OPEN_MODAL,
      payload: { modalName: "confirmDelete", payload: { id: 7 } },
    });
  });

  it("creates CLOSE_MODAL action", () => {
    expect(closeModal()).toEqual({ type: CLOSE_MODAL });
  });
});
