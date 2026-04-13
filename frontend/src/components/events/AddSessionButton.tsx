/*
File: AddSessionButton.tsx

Contains:
Reusable action button component to open the session creation flow.

Course: CI-4712 Ingeniería de Software II
Term: Enero - Marzo 2026
Designed by: Equipo 2 - Arcadian
*/

import React from 'react';
import Button from '../ui/Button';
import { Plus } from 'react-feather';

// AddSessionButtonProps defines behavior and visual state for the action button.
interface AddSessionButtonProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  disabled?: boolean;
}

// AddSessionButton renders the compact action button used to open
// the create-session flow from event cards.
const AddSessionButton: React.FC<AddSessionButtonProps> = ({ onClick, className = '', disabled = false }) => (
  <Button
    className={`flex items-center justify-center p-2 rounded-full bg-primary-100 hover:bg-primary-200 text-primary-700 shadow ${className}`}
    onClick={onClick}
    disabled={disabled}
    aria-label="Agregar sesión"
    type="button"
  >
    <Plus size={18} />
  </Button>
);

export default AddSessionButton;
