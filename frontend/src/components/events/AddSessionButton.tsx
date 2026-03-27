import React from 'react';
import Button from '../ui/Button';
import { Plus } from 'react-feather';

interface AddSessionButtonProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  disabled?: boolean;
}

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
