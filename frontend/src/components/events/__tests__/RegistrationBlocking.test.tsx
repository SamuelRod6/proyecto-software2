import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AvailableEventsList from '../AvailableEventsList';

const mockOnInscribir = jest.fn();

// Mock EventDetailModal to avoid context errors and isolate test
jest.mock('../EventDetailModal', () => () => <div data-testid="event-detail-modal" />);


describe('RegistrationBlocking', () => {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 5);
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - 5);

    const formatDate = (date: Date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const mockEvents = [
        {
            id_evento: 1,
            nombre: 'Evento Abierto',
            fecha_inicio: '25/12/2026',
            fecha_fin: '31/12/2026',
            ubicacion: 'Lugar 1',
            fecha_cierre_inscripcion: formatDate(futureDate),
            inscripciones_abiertas: true
        },
        {
            id_evento: 2,
            nombre: 'Evento Cerrado',
            fecha_inicio: '25/12/2026',
            fecha_fin: '31/12/2026',
            ubicacion: 'Lugar 2',
            fecha_cierre_inscripcion: formatDate(pastDate),
            inscripciones_abiertas: true
        }
    ];

    test('renders available events list', () => {
        render(<AvailableEventsList eventos={mockEvents} onInscribir={mockOnInscribir} />);
        expect(screen.getByText('Evento Abierto')).toBeInTheDocument();
        expect(screen.getByText('Evento Cerrado')).toBeInTheDocument();
    });

    // Requirement (a) & (d) - Check open event allows inscription
    test('displays "Inscribirme" button for open events', () => {
        render(<AvailableEventsList eventos={mockEvents} onInscribir={mockOnInscribir} />);

        const openEventContainer = screen.getByText('Evento Abierto').closest('li')!;
        const button = openEventContainer.querySelector('button')!;

        expect(button).toHaveTextContent('Inscribirme');
        expect(button).not.toBeDisabled();

        fireEvent.click(button);
        expect(mockOnInscribir).toHaveBeenCalledWith(mockEvents[0]);
    });

    // Requirement (a), (b) & (d) - Check closed event blocks inscription
    test('displays "Cerrado" button and warning for closed events', () => {
        render(<AvailableEventsList eventos={mockEvents} onInscribir={mockOnInscribir} />);

        const closedEventContainer = screen.getByText('Evento Cerrado').closest('li')!;
        const button = closedEventContainer.querySelector('button')!;

        expect(button).toHaveTextContent('Cerrado');
        expect(button).toBeDisabled();

        const warningMessage = closedEventContainer.querySelector('span.text-red-400')!;
        expect(warningMessage).toHaveTextContent('Inscripciones cerradas');

        fireEvent.click(button);
        // Should not call onInscribir for this event
        expect(mockOnInscribir).not.toHaveBeenCalledWith(mockEvents[1]);
    });
});
