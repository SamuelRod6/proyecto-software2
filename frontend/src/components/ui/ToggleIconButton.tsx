import React from "react";
import { LockClosedIcon, LockOpenIcon } from "@heroicons/react/24/outline";


interface ToggleIconButtonProps {
    open: boolean; // true = inscripciones abiertas
    onClick: () => void;
    className?: string;
    title?: string;
    iconSize?: number;
}

const ToggleIconButton: React.FC<ToggleIconButtonProps> = ({ open, onClick, className = "", title, iconSize = 22 }) => (
	<button
		type="button"
		onClick={onClick}
		aria-label={title || (open ? "Cerrar inscripciones" : "Abrir inscripciones")}
		title={title || (open ? "Cerrar inscripciones" : "Abrir inscripciones")}
		className={`relative flex items-center justify-center p-2 rounded-md border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-all duration-200 focus:outline-none ${className}`}
		style={{ boxShadow: '0 1px 4px 0 rgba(0,0,0,0.10)' }}
	>
		{open ? (
			<LockClosedIcon className="text-red-400" style={{ width: iconSize, height: iconSize }} />
		) : (
			<LockOpenIcon className="text-green-400" style={{ width: iconSize, height: iconSize }} />
		)}
    </button>
);

export default ToggleIconButton;
