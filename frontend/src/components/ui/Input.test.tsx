import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Input from "./Input";

describe("Input Component", () => {
    it("renders with label correctly", () => {
        render(<Input label="Username" placeholder="Enter text" />);
        expect(screen.getByText("Username")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
    });

    it("handles change events", () => {
        const handleChange = jest.fn();
        render(<Input onChange={handleChange} placeholder="Type here" />);
        const input = screen.getByPlaceholderText("Type here");
        fireEvent.change(input, { target: { value: "Hello" } });
        expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it("displays error message when error prop is provided", () => {
        render(<Input error="Field required" />);
        expect(screen.getByText("Field required")).toBeInTheDocument();
    });
});
