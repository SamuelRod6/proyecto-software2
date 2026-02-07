import React from "react";

interface DeleteIconButtonProps {
    onClick: () => void;
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
        className={`p-2 rounded hover:bg-slate-700 transition focus:outline-none ${className}`}
    >
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
            <rect x="3" y="6" width="18" height="14" rx="2" />
            <path d="M8 10v6" />
            <path d="M16 10v6" />
            <path d="M5 6V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2" />
        </svg>
    </button>
);

export default DeleteIconButton;
