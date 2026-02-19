export function toStartOfLocalDay(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function buildValidLocalDate(year: number, month: number, day: number): Date | null {
	const candidate = new Date(year, month - 1, day);
	const isValid =
		candidate.getFullYear() === year &&
		candidate.getMonth() === month - 1 &&
		candidate.getDate() === day;

	return isValid ? candidate : null;
}

export function parseFlexibleDate(rawValue: string): Date | null {
	if (!rawValue) return null;

	const value = rawValue.trim();

	const ymdMatch = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:\b|T|\s)/);
	if (ymdMatch) {
		const [, year, month, day] = ymdMatch;
		return buildValidLocalDate(Number(year), Number(month), Number(day));
	}

	const dmyMatch = value.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:\b|T|\s|$)/);
	if (dmyMatch) {
		const [, day, month, year] = dmyMatch;
		return buildValidLocalDate(Number(year), Number(month), Number(day));
	}

	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return null;

	return toStartOfLocalDay(parsed);
}

export function normalizeText(value: string): string {
	return value
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.toLowerCase()
		.trim();
}

export function parseLocationParts(location: string): {
	city: string;
	country: string;
} {
	const parts = location
		.split(",")
		.map((part) => part.trim())
		.filter(Boolean);

	if (parts.length >= 2) {
		return {
			city: parts[0],
			country: parts.slice(1).join(", ")
		};
	}

	return {
		city: parts[0] ?? "",
		country: ""
	};
}
