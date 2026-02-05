import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "./App";

test("renders home greeting", () => {
    render(<App />);
    expect(screen.getByText(/Login/i)).toBeInTheDocument();
});
