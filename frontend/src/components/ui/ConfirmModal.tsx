import React from "react";
import Modal from "./Modal";
import Button from "./Button";

interface ConfirmModalProps {
	open: boolean;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	onConfirm: () => void;
	onCancel: () => void;
	loading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
	open,
	title,
	message,
	confirmText = "Confirmar",
	cancelText = "Cancelar",
	onConfirm,
	onCancel,
	loading = false,
}) => {
	return (
		<Modal 
			open={open} 
			onClose={onCancel} 
			className="max-w-md w-full p-0"
			title={title}
		>
			<div className="text-slate-300 mb-4">
				{message}
			</div>
			<div className="flex gap-3 justify-end mt-2">
				<Button
					variant="ghost"
					onClick={onCancel}
					disabled={loading}
				>
					{cancelText}
				</Button>
				<Button
					variant="primary"
					onClick={onConfirm}
					disabled={loading}
				>
					{confirmText}
				</Button>
			</div>
		</Modal>
	);
};

export default ConfirmModal;
