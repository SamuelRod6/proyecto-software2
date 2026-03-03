import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "ghost";
    disabled?: boolean;
}

export default function Button({
	className = "",
	variant = "primary",
	disabled = false,
	...props
}: ButtonProps): JSX.Element {
	const base =
		"inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition";
	const variants = {
		primary: "bg-[#F5E427] text-slate-900 hover:bg-[#E6D51E]",
		ghost: "bg-transparent text-[#F5E427] hover:text-[#E6D51E] border border-[#F5E427]",
	};
	const disabledStyles = "opacity-60 cursor-not-allowed hover:bg-none";

	return (
		<button
			disabled={disabled}
			className={`${base} ${variants[variant]} ${disabled ? disabledStyles : ""} ${className}`}
			{...props}
		/>
	);
}
