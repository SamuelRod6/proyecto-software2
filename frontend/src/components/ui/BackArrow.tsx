interface BackArrowProps {
  onClick: () => void;
  className?: string;
}

export default function BackArrow({ onClick, className = "" }: BackArrowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Volver"
      className={`flex items-center focus:outline-none ${className}`}
	>
		<svg 
			width="24" 
			height="24" 
			viewBox="0 0 24 24" 
			fill="none" 
			xmlns="http://www.w3.org/2000/svg"
		>
			<path 
				d="M15 19L8 12L15 5" 
				stroke="#94a3b8"
				strokeWidth="2" 
				strokeLinecap="round" 
				strokeLinejoin="round"
			/>
		</svg>
    </button>
  );
}
