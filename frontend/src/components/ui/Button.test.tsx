import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Button from "./Button";

describe("Button Component", () => {
    it("renders with children correctly", () => {
        render(<Button>Click me</Button>);
        expect(screen.getByText("Click me")).toBeInTheDocument();
    });

    it("handles click events", () => {
        const handleClick = jest.fn();
        render(<Button onClick={handleClick}>Click me</Button>);
        fireEvent.click(screen.getByText("Click me"));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("is disabled when the disabled prop is true", () => {
        render(<Button disabled>Click me</Button>);
        const button = screen.getByText("Click me");
        expect(button).toBeDisabled();
        expect(button).toHaveClass("cursor-not-allowed");
    });
});
