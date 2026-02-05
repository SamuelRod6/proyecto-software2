import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
({ 
	label, 
	error, 
	className = "", 
	...props 
}, ref) => {
	return (
		<label className="block space-y-1 text-sm">
			{label ? <span className="text-slate-200">{label}</span> : null}
			<input
				ref={ref}
				className={`w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-[#F5E427] focus:outline-none focus:ring-2 focus:ring-[#F5E427]/30 ${className}`}
				{...props}
			/>
			{error ? <span className="text-xs text-red-300">{error}</span> : null}
		</label>
	);
});

Input.displayName = "Input";

export default Input;
