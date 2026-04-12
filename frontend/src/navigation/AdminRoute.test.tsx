import { render, screen } from "@testing-library/react";
import AdminRoute from "./AdminRoute";

const mockResourceRoute = jest.fn();

jest.mock("./ResourceRoute", () => ({
  __esModule: true,
  default: ({ resourceKey, children }: { resourceKey: string; children: JSX.Element }) => {
    mockResourceRoute(resourceKey);
    return <div data-testid="resource-route">{children}</div>;
  },
}));

describe("AdminRoute", () => {
  it("delegates rendering to ResourceRoute with the same resource key", () => {
    render(
      <AdminRoute resourceKey="roles.manage">
        <div>Admin content</div>
      </AdminRoute>,
    );

    expect(mockResourceRoute).toHaveBeenCalledWith("roles.manage");
    expect(screen.getByTestId("resource-route")).toBeInTheDocument();
    expect(screen.getByText("Admin content")).toBeInTheDocument();
  });
});
