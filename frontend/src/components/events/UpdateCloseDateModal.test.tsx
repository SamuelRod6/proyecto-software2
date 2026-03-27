import { fireEvent, render, screen } from "@testing-library/react";
import UpdateCloseDateModal from "./UpdateCloseDateModal";

const mockShowToast = jest.fn();

jest.mock("../../contexts/Toast/ToastContext", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

jest.mock("../ui/DayPickerSingle", () => ({
  __esModule: true,
  default: ({ onSelect }: { onSelect: (date: Date) => void }) => (
    <button type="button" onClick={() => onSelect(new Date(2027, 2, 8))}>
      Seleccionar nueva fecha
    </button>
  ),
}));

describe("UpdateCloseDateModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("keeps change disabled until a different close date is selected", () => {
    render(
      <UpdateCloseDateModal
        open={true}
        onClose={jest.fn()}
        event={{
          id_evento: 3,
          nombre: "Evento X",
          fecha_inicio: "10/03/2027",
          fecha_fin: "12/03/2027",
          fecha_cierre_inscripcion: "09/03/2027",
          ubicacion: "Caracas, Venezuela",
          inscripciones_abiertas: true,
        }}
      />,
    );

    const changeButton = screen.getByRole("button", { name: "Cambiar" });
    expect(changeButton).toBeDisabled();

    fireEvent.click(screen.getByText("Seleccionar nueva fecha"));

    expect(changeButton).not.toBeDisabled();
  });
});