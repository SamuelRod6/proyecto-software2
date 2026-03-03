import React from "react";

interface DeleteIconButtonProps {
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
    className?: string;
    title?: string;
}

const DeleteIconButton: React.FC<DeleteIconButtonProps> = ({ 
    onClick, 
    className = "", 
    title = "Eliminar" 
}) => (
    <button
        type="button"
        onClick={onClick}
        aria-label={title}
        title={title}
        className={`relative flex items-center justify-center p-2 rounded-md border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-all duration-200 focus:outline-none ${className}`}
        style={{ boxShadow: '0 1px 4px 0 rgba(0,0,0,0.10)' }}
    >
        {/* Trash can icon */}
        <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#F5E427"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 6h18" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <rect x="5" y="6" width="14" height="14" rx="2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
    </button>
);

export default DeleteIconButton;
