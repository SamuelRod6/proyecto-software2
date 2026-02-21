// Functions to validate user email format
export const isValidEmail = (value: string): boolean => {
    const email = value.trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};