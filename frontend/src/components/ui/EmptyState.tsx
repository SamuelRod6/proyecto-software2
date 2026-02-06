import React from "react";
import Lottie from "lottie-react";

interface EmptyStateProps {
    title?: string;
    description?: string;
    iconClassName?: string;
    animationData?: object;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    title = "Sin datos disponibles",
    description = "No hay información para mostrar en este momento.",
    animationData,
}) => (
    <div className="rounded-xl border border-dashed border-slate-700 bg-slate-800/80 p-8 flex flex-col items-center gap-6 shadow-md">
        {
            animationData ? 
                <Lottie 
                    animationData={animationData} 
                    loop={true} 
                    className="h-32 w-32 mb-2" 
                />
            : null
        }
        <h2 className="text-2xl font-bold text-slate-200">
            {title}
        </h2>
        <p className="text-slate-400 text-base text-center max-w-md">
            {description}
        </p>
    </div>
);

export default EmptyState;
