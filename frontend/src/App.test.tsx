import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "./App";

test("renders greeting", () => {
  render(<App />);
  expect(screen.getByText(/Hola desde React/i)).toBeInTheDocument();
});
