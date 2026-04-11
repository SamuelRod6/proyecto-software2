import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "ghost";
    disabled?: boolean;
	loading?: boolean;
	loadingText?: string;
}

export default function Button({
	className = "",
	variant = "primary",
	disabled = false,
	loading = false,
	loadingText,
	children,
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
			disabled={disabled || loading}
			className={`${base} ${variants[variant]} ${disabled || loading ? disabledStyles : ""} ${className}`}
			{...props}
		>
			{loading ? (
				<span className="inline-flex items-center gap-2">
					<span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
					{loadingText || "Procesando..."}
				</span>
			) : (
				children
			)}
		</button>
	);
}
