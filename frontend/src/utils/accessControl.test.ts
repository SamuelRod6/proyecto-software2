import {
  getResourcePermissionMap,
  getStoredAuthUser,
  getStoredUserRole,
  getStoredUserRoleIds,
  getStoredUserRoleNames,
  hasResourceAccess,
  isAdminRole,
  isAdminUser,
  setResourcePermissionMap,
} from "./accessControl";
import { getRolePermissions, getRoles } from "../services/roleServices";

jest.mock("../services/roleServices", () => ({
  getRoles: jest.fn(),
  getRolePermissions: jest.fn(),
}));

const mockedGetRoles = getRoles as jest.MockedFunction<typeof getRoles>;
const mockedGetRolePermissions = getRolePermissions as jest.MockedFunction<typeof getRolePermissions>;

describe("accessControl", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("reads stored auth user and role names", () => {
    localStorage.setItem(
      "auth-user",
      JSON.stringify({
        id: 8,
        roles: [
          { id: 2, name: "REVISOR" },
          { id: 3, name: "PONENTE" },
        ],
      }),
    );

    expect(getStoredAuthUser()).toEqual({
      id: 8,
      roles: [
        { id: 2, name: "REVISOR" },
        { id: 3, name: "PONENTE" },
      ],
    });
    expect(getStoredUserRoleNames()).toEqual(["REVISOR", "PONENTE"]);
    expect(getStoredUserRole()).toBe("REVISOR");
    expect(getStoredUserRoleIds()).toEqual([2, 3]);
  });

  it("supports comma-separated role string", () => {
    localStorage.setItem("auth-user", JSON.stringify({ role: " PONENTE, REVISOR " }));
    expect(getStoredUserRoleNames()).toEqual(["PONENTE", "REVISOR"]);
  });

  it("handles admin role checks", () => {
    localStorage.setItem("auth-user", JSON.stringify({ roles: ["ADMIN"] }));
    expect(isAdminRole(" admin ")).toBe(true);
    expect(isAdminUser()).toBe(true);
  });

  it("stores and reads resource permission map", () => {
    setResourcePermissionMap({ "scientific.works": 9 });
    expect(getResourcePermissionMap()).toEqual({ "scientific.works": 9 });
  });

  it("grants access immediately for admin", async () => {
    localStorage.setItem("auth-user", JSON.stringify({ roles: ["ADMIN"] }));
    await expect(hasResourceAccess("scientific.works")).resolves.toBe(true);
    expect(mockedGetRoles).not.toHaveBeenCalled();
  });

  it("denies access when required permission is missing", async () => {
    localStorage.setItem("auth-user", JSON.stringify({ roles: ["REVISOR"] }));
    await expect(hasResourceAccess("scientific.works")).resolves.toBe(false);
  });

  it("grants access by matching role permission", async () => {
    localStorage.setItem("auth-user", JSON.stringify({ roles: [{ id: 5, name: "REVISOR" }] }));
    setResourcePermissionMap({ "scientific.works": 10 });

    mockedGetRolePermissions.mockResolvedValue({
      status: 200,
      data: [{ id: 10, name: "Ver trabajos", resource: "scientific.works" }],
    } as never);

    await expect(hasResourceAccess("scientific.works")).resolves.toBe(true);
    expect(mockedGetRolePermissions).toHaveBeenCalledWith(5);
  });

  it("resolves role IDs from getRoles when stored roles have only names", async () => {
    localStorage.setItem("auth-user", JSON.stringify({ roles: ["Revisor"] }));
    setResourcePermissionMap({ "scientific.works": 10 });

    mockedGetRoles.mockResolvedValue({
      status: 200,
      data: [{ id: 7, name: "REVISOR" }],
    } as never);
    mockedGetRolePermissions.mockResolvedValue({
      status: 200,
      data: [{ id: 10, name: "Ver trabajos", resource: "scientific.works" }],
    } as never);

    await expect(hasResourceAccess("scientific.works")).resolves.toBe(true);
    expect(mockedGetRoles).toHaveBeenCalled();
    expect(mockedGetRolePermissions).toHaveBeenCalledWith(7);
  });
});
