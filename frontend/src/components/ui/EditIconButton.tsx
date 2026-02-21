import React from "react";

interface EditIconButtonProps {
    onClick: () => void;
    className?: string;
    title?: string;
    color?: string;
}

const EditIconButton: React.FC<EditIconButtonProps> = ({ 
    onClick, 
    className = "", 
    title = "Editar",
    color = "#F5E427"
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
            stroke={color}
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
        >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
        </svg>
    </button>
);

export default EditIconButton;
