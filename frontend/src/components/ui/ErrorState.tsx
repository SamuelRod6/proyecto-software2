import React from "react";
import Button from "./Button";

interface ErrorStateProps {
    title?: string;
    description?: string;
    buttonText?: string;
    onRetry?: () => void;
    iconClassName?: string;
    buttonClassName?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({
    title = "Error al cargar los datos",
    description = "Hubo un problema al cargar la información. Por favor, recarga para intentarlo nuevamente.",
    buttonText = "Volver a intentar",
    onRetry,
    iconClassName = "h-16 w-16 text-red-500 mb-2",
    buttonClassName = "flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 border border-gray-500 text-white font-medium shadow-md transition hover:bg-gray-800 focus:outline-none",
}) => (
    <div className="rounded-xl border border-solid border-red-500 bg-slate-900/90 p-8 flex flex-col items-center gap-6 shadow-lg">
        {/* ! icon */}
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={iconClassName} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
        >
            <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0z" 
            />
        </svg>
        <h2 className="text-2xl font-bold text-red-400">
            {title}
        </h2>
        <p className="text-slate-300 text-base text-center max-w-md">
            {description}
        </p>
        {onRetry && (
            <Button
                className={buttonClassName}
                onClick={onRetry}
                title={buttonText}
            >
                {/* Reload icon */}
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 text-white" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                >
                    <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M4 4v5h.582M20 20v-5h-.582M5.582 9A7.003 7.003 0 0 1 12 5c3.314 0 6.13 2.418 6.418 5.582M18.418 15A7.003 7.003 0 0 1 12 19c-3.314 0-6.13-2.418-6.418-5.582" 
                    />
                </svg>
                {buttonText}
            </Button>
        )}
    </div>
);

export default ErrorState;
