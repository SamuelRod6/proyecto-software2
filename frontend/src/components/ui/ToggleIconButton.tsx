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
		className={`p-2 rounded hover:bg-slate-700 transition focus:outline-none ${className}`}
    >
		{open ? (
			<LockClosedIcon className="text-red-400" style={{ width: iconSize, height: iconSize }} />
		) : (
			<LockOpenIcon className="text-green-400" style={{ width: iconSize, height: iconSize }} />
		)}
    </button>
);

export default ToggleIconButton;
