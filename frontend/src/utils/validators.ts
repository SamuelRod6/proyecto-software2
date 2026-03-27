// Functions to validate user email format
export const isValidEmail = (value: string): boolean => {
  const email = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidPassword = (value: string): boolean => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,20}$/.test(value.trim());
};