import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Modal from "./Modal";

describe("Modal Component", () => {
    it("does not render when open is false", () => {
        render(
            <Modal open={false} onClose={jest.fn()}>
                <p>Modal Content</p>
            </Modal>
        );
        expect(screen.queryByText("Modal Content")).not.toBeInTheDocument();
    });

    it("renders children and title when open is true", () => {
        render(
            <Modal open={true} onClose={jest.fn()} title="Test Modal">
                <p>Modal Content</p>
            </Modal>
        );
        expect(screen.getByText("Test Modal")).toBeInTheDocument();
        expect(screen.getByText("Modal Content")).toBeInTheDocument();
    });

    it("calls onClose when close button is clicked", () => {
        const handleClose = jest.fn();
        render(
            <Modal open={true} onClose={handleClose} title="Test Modal">
                <p>Content</p>
            </Modal>
        );
        fireEvent.click(screen.getByLabelText("Cerrar"));
        expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when overlay is clicked", () => {
        const handleClose = jest.fn();
        const { container } = render(
            <Modal open={true} onClose={handleClose}>
                <p>Content</p>
            </Modal>
        );
        // Overlay is the div with fixed inset-0 bg-black
        // We can find it by class or just assumption it's the first div in root if Portal not used
        // In this implementation, it is a direct child of the root div returned
        const overlay = container.firstChild?.childNodes[0] as HTMLElement;
        fireEvent.click(overlay);
        expect(handleClose).toHaveBeenCalledTimes(1);
    });
});
