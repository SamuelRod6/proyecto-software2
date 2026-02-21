import { forwardRef, type InputHTMLAttributes } from "react";

import { TextareaHTMLAttributes, useState } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
	descripcion?: boolean;
	maxLength?: number;
	value?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
({ 
	label, 
	error, 
	className = "", 
	descripcion = false,
	maxLength,
	value,
	...props 
}, ref) => {
	const [count, setCount] = useState(value ? value.length : 0);
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setCount(e.target.value.length);
		if (props.onChange) props.onChange(e);
	};
	const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setCount(e.target.value.length);
		if (props.onChange) props.onChange(e);
	};
	return (
		<label className="block space-y-1 text-sm">
			{label ? <span className="text-slate-200">{label}</span> : null}
			{descripcion ? (
				<div className="relative">
					<textarea
						className={`w-full min-h-[200px] rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-[#F5E427] focus:outline-none focus:ring-2 focus:ring-[#F5E427]/30 resize-none ${className}`}
						maxLength={maxLength}
						value={value}
						onChange={handleTextareaChange}
					/>
					{maxLength && (
						<span className="absolute bottom-2 right-3 text-xs text-slate-400">{count}/{maxLength}</span>
					)}
				</div>
			) : (
				<input
					ref={ref}
					className={`w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-[#F5E427] focus:outline-none focus:ring-2 focus:ring-[#F5E427]/30 ${className}`}
					maxLength={maxLength}
					value={value}
					onChange={handleInputChange}
					{...props}
				/>
			)}
			{error ? <span className="text-xs text-red-300">{error}</span> : null}
		</label>
	);
});

Input.displayName = "Input";

export default Input;
