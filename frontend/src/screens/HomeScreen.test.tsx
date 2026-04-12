import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HomeScreen from "./HomeScreen";

describe("HomeScreen", () => {
  it("renders welcome message and key navigation links", () => {
    render(
      <MemoryRouter>
        <HomeScreen />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Bienvenido al Sistema/i)).toBeInTheDocument();

    const eventsLink = screen.getByRole("link", { name: "Ir a eventos" });
    expect(eventsLink).toHaveAttribute("href", "/events");

    const inscriptionsLink = screen.getByRole("link", { name: "Ver mis inscripciones" });
    expect(inscriptionsLink).toHaveAttribute("href", "/inscriptions/mine");
  });
});
