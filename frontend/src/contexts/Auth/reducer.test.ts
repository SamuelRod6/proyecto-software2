import { authReducer, initAuthState } from "./reducer";
import { LOGIN, LOGOUT } from "./actions";

describe("Auth reducer", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initializes authenticated state when token exists", () => {
    localStorage.setItem("auth-token", "token-123");
    localStorage.setItem("auth-user", JSON.stringify({ id: 9, name: "Laura" }));

    expect(initAuthState()).toEqual({
      isAuthenticated: true,
      user: { id: 9, name: "Laura" },
    });
  });

  it("initializes with null user when auth-user is invalid", () => {
    localStorage.setItem("auth-token", "token-123");
    localStorage.setItem("auth-user", "{invalid");

    expect(initAuthState()).toEqual({
      isAuthenticated: true,
      user: null,
    });
  });

  it("handles LOGIN and LOGOUT actions", () => {
    const initialState = { isAuthenticated: false, user: null };
    const loggedIn = authReducer(initialState, {
      type: LOGIN,
      payload: { id: 1, name: "Ada", email: "ada@mail.com" },
    });

    expect(loggedIn.isAuthenticated).toBe(true);
    expect(loggedIn.user).toEqual({ id: 1, name: "Ada", email: "ada@mail.com" });

    const loggedOut = authReducer(loggedIn, { type: LOGOUT });
    expect(loggedOut).toEqual({ isAuthenticated: false, user: null });
  });
});
