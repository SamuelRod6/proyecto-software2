import React from "react";

interface ModalProps {
	open: boolean;
	onClose: () => void;
	title?: string;
	children: React.ReactNode;
	className?: string;
}

const Modal: React.FC<ModalProps> = ({ 
	open, 
	onClose, 
	title, 
	children,
	className = "max-w-3xl"
}) => {
	if (!open) return null;
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Overlay */}
			<div
				className="fixed inset-0 bg-black bg-opacity-60 transition-opacity"
				onClick={onClose}
			/>
			<div className={`relative z-10 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 w-full mx-4 ${className}`}>
				<div className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-slate-700">
					<h2 className="text-xl font-bold text-[#F5E427]">
						{title}
					</h2>
					<button
						onClick={onClose}
						className="text-slate-400 hover:text-[#F5E427] text-2xl font-bold px-2 focus:outline-none"
						aria-label="Cerrar"
					>
						×
					</button>
				</div>
				<div className="p-6">
					{children}
				</div>
			</div>
		</div>
	);
};

export default Modal;
