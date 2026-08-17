export type ValidationErrors = Partial<
  Record<"email" | "password" | "confirmPassword", string>
>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const minimumPasswordLength = 8;

export function validateLogin(
  email: string,
  password: string,
): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!email) errors.email = "Email is required.";
  else if (!emailPattern.test(email))
    errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Password is required.";
  return errors;
}

export function validateSignup(
  email: string,
  password: string,
  confirmPassword: string,
): ValidationErrors {
  const errors = validateLogin(email, password);
  if (password && password.length < minimumPasswordLength) {
    errors.password = `Password must be at least ${minimumPasswordLength} characters.`;
  }
  if (!confirmPassword) errors.confirmPassword = "Confirm your password.";
  else if (password !== confirmPassword)
    errors.confirmPassword = "Passwords do not match.";
  return errors;
}
