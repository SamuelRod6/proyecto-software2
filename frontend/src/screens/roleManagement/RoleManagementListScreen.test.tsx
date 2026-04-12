import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import RoleManagementListScreen from "./RoleManagementListScreen";
import {
  createRole,
  deleteRole,
  getPermissions,
  getRolePermissions,
  getRoles,
  getUsers,
  updateRole,
  updateRolePermissions,
  updateUserRoles,
} from "../../services/roleServices";

jest.mock("../../services/roleServices", () => ({
  getUsers: jest.fn(),
  getRoles: jest.fn(),
  getRolePermissions: jest.fn(),
  getPermissions: jest.fn(),
  updateUserRoles: jest.fn(),
  createRole: jest.fn(),
  updateRole: jest.fn(),
  deleteRole: jest.fn(),
  updateRolePermissions: jest.fn(),
}));

jest.mock("../../contexts/Toast/ToastContext", () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));

jest.mock("../../utils/notifications", () => ({
  addUserNotification: jest.fn(),
}));

const mockedGetUsers = getUsers as jest.MockedFunction<typeof getUsers>;
const mockedGetRoles = getRoles as jest.MockedFunction<typeof getRoles>;
const mockedGetRolePermissions = getRolePermissions as jest.MockedFunction<
  typeof getRolePermissions
>;

const mockedGetPermissions = getPermissions as jest.MockedFunction<typeof getPermissions>;
const mockedUpdateUserRoles = updateUserRoles as jest.MockedFunction<typeof updateUserRoles>;
const mockedCreateRole = createRole as jest.MockedFunction<typeof createRole>;
const mockedUpdateRole = updateRole as jest.MockedFunction<typeof updateRole>;
const mockedDeleteRole = deleteRole as jest.MockedFunction<typeof deleteRole>;
const mockedUpdateRolePermissions =
  updateRolePermissions as jest.MockedFunction<typeof updateRolePermissions>;

describe("RoleManagementListScreen", () => {
  beforeEach(() => {
    mockedGetUsers.mockResolvedValue({
      status: 200,
      data: {
        total: 3,
        users: [
          {
            id: 1,
            name: "Juan Admin",
            email: "juan@test.com",
            roles: ["ADMIN"],
          },
          {
            id: 2,
            name: "Maria Revisora",
            email: "maria@test.com",
            roles: ["REVISOR"],
          },
          {
            id: 3,
            name: "Pedro",
            email: "pedro@test.com",
            roles: ["FANTASMA"],
          },
        ],
      },
    });

    mockedGetRoles.mockResolvedValue({
      status: 200,
      data: {
        roles: [
          { id: 1, name: "ADMIN", description: "Administrador" },
          { id: 2, name: "REVISOR", description: "Revisor" },
        ],
      },
    });

    mockedGetRolePermissions.mockImplementation(async (roleId: number) => {
      if (roleId === 1) {
        return {
          status: 200,
          data: {
            permissions: [{ id: 11, name: "users.read", resource: "users" }],
          },
        };
      }
      return {
        status: 200,
        data: {
          permissions: [],
        },
      };
    });

    mockedGetPermissions.mockResolvedValue({ status: 200, data: { permissions: [] } });
    mockedUpdateUserRoles.mockResolvedValue({ status: 200, data: {} });
    mockedCreateRole.mockResolvedValue({ status: 200, data: {} });
    mockedUpdateRole.mockResolvedValue({ status: 200, data: {} });
    mockedDeleteRole.mockResolvedValue({ status: 200, data: {} });
    mockedUpdateRolePermissions.mockResolvedValue({ status: 200, data: {} });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("muestra detalles del usuario y estado de permisos por rol", async () => {
    render(<RoleManagementListScreen />);

    await waitFor(() => {
      expect(screen.getByText("Maria Revisora")).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Detalles" })[1]);

    expect(screen.getByText("Detalle de usuario")).toBeInTheDocument();
    expect(screen.getAllByText("maria@test.com").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Sin permisos").length).toBeGreaterThan(0);
  });

  it("permite búsqueda por nombre o correo", async () => {
    render(<RoleManagementListScreen />);

    await waitFor(() => {
      expect(screen.getByText("Juan Admin")).toBeInTheDocument();
      expect(screen.getByText("Maria Revisora")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Buscar por nombre o correo"), {
      target: { value: "maria" },
    });

    expect(screen.getByText("Maria Revisora")).toBeInTheDocument();
    expect(screen.queryByText("Juan Admin")).not.toBeInTheDocument();
  });

  it("permite filtrar por rol", async () => {
    render(<RoleManagementListScreen />);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "REVISOR" })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Filtrar por rol"), {
      target: { value: "REVISOR" },
    });

    expect(screen.getByText("Maria Revisora")).toBeInTheDocument();
    expect(screen.queryByText("Juan Admin")).not.toBeInTheDocument();
  });

  it("muestra validación de roles inválidos y roles sin permisos", async () => {
    render(<RoleManagementListScreen />);

    await waitFor(() => {
      expect(screen.getByText("Sin permisos: REVISOR")).toBeInTheDocument();
      expect(screen.getByText("Roles inválidos: FANTASMA")).toBeInTheDocument();
    });
  });
});
