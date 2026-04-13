import { LOGIN, LOGOUT, login, logout } from "./actions";

describe("Auth actions", () => {
  it("creates LOGIN action", () => {
    const user = { id: 1, name: "Ada" };
    expect(login(user)).toEqual({ type: LOGIN, payload: user });
  });

  it("creates LOGOUT action", () => {
    expect(logout()).toEqual({ type: LOGOUT });
  });
});
