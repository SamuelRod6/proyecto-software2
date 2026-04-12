import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ResourceRoute from "./ResourceRoute";

const mockHasResourceAccess = jest.fn();

jest.mock("../utils/accessControl", () => ({
  hasResourceAccess: (...args: unknown[]) => mockHasResourceAccess(...args),
}));

describe("ResourceRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders children when access is granted", async () => {
    mockHasResourceAccess.mockResolvedValue(true);

    render(
      <MemoryRouter>
        <ResourceRoute resourceKey="scientific.works">
          <div>Allowed content</div>
        </ResourceRoute>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Allowed content")).toBeInTheDocument();
    });
    expect(mockHasResourceAccess).toHaveBeenCalledWith("scientific.works");
  });

  it("redirects to home when access is denied", async () => {
    mockHasResourceAccess.mockResolvedValue(false);

    render(
      <MemoryRouter initialEntries={["/private"]}>
        <Routes>
          <Route path="/" element={<div>Home page</div>} />
          <Route
            path="/private"
            element={
              <ResourceRoute resourceKey="scientific.works">
                <div>Allowed content</div>
              </ResourceRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Home page")).toBeInTheDocument();
    });
    expect(screen.queryByText("Allowed content")).not.toBeInTheDocument();
  });
});
