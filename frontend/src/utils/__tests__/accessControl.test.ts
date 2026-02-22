import {
  getStoredUserRoleNames,
  getStoredUserRoleIds,
  hasResourceAccess,
  isAdminUser,
} from "../accessControl";

jest.mock("../../services/roleServices", () => ({
  getRoles: jest.fn(),
  getRolePermissions: jest.fn(),
}));

import { getRoles, getRolePermissions } from "../../services/roleServices";

type MockResponse = { status: number; data: any };

const setAuthUser = (user: unknown) => {
  localStorage.setItem("auth-user", JSON.stringify(user));
};

const setResourceMap = (map: Record<string, number>) => {
  localStorage.setItem("resource-permissions", JSON.stringify(map));
};

describe("accessControl", () => {
  beforeEach(() => {
    localStorage.clear();
    (getRoles as jest.Mock).mockReset();
    (getRolePermissions as jest.Mock).mockReset();
  });

  test("getStoredUserRoleNames reads role objects", () => {
    setAuthUser({ roles: [{ id: 1, name: "ADMIN" }, { id: 2, name: "PONENTE" }] });
    expect(getStoredUserRoleNames()).toEqual(["ADMIN", "PONENTE"]);
  });

  test("getStoredUserRoleIds reads role ids", () => {
    setAuthUser({ roles: [{ id: 3, name: "EDITOR" }, { id: 4, name: "PONENTE" }] });
    expect(getStoredUserRoleIds()).toEqual([3, 4]);
  });

  test("isAdminUser uses roles list", () => {
    setAuthUser({ roles: [{ id: 1, name: "ADMIN" }] });
    expect(isAdminUser()).toBe(true);
  });

  test("hasResourceAccess grants access when permission is assigned to role", async () => {
    setAuthUser({ roles: [{ id: 10, name: "PONENTE" }] });
    setResourceMap({ "events.create": 99 });

    (getRolePermissions as jest.Mock).mockResolvedValue({
      status: 200,
      data: { permissions: [{ id: 99, name: "crear_evento" }] },
    } satisfies MockResponse);

    const allowed = await hasResourceAccess("events.create");
    expect(allowed).toBe(true);
    expect(getRolePermissions).toHaveBeenCalledWith(10);
  });

  test("hasResourceAccess denies when permission not present", async () => {
    setAuthUser({ roles: [{ id: 10, name: "PONENTE" }] });
    setResourceMap({ "events.create": 99 });

    (getRolePermissions as jest.Mock).mockResolvedValue({
      status: 200,
      data: { permissions: [{ id: 101, name: "otro" }] },
    } satisfies MockResponse);

    const allowed = await hasResourceAccess("events.create");
    expect(allowed).toBe(false);
  });

  test("hasResourceAccess uses admin short-circuit", async () => {
    setAuthUser({ roles: [{ id: 1, name: "ADMIN" }] });
    setResourceMap({ "events.create": 99 });

    const allowed = await hasResourceAccess("events.create");
    expect(allowed).toBe(true);
    expect(getRolePermissions).not.toHaveBeenCalled();
    expect(getRoles).not.toHaveBeenCalled();
  });
});
