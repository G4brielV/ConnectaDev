import { sanitizeName } from '@/shared/lib/sanitization';

export const AUTH_INPUT_LIMITS = {
  NAME_MAX_LENGTH: 100,
  EMAIL_MAX_LENGTH: 254,
  PASSWORD_MAX_LENGTH: 128,
  PASSWORD_MIN_LENGTH: 8,
  LOGIN_PASSWORD_MIN_LENGTH: 6,
} as const;

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export interface PasswordValidationResult {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  isValid: boolean;
}

export function checkPasswordComplexity(password: string): PasswordValidationResult {
  const hasMinLength = password.length >= AUTH_INPUT_LIMITS.PASSWORD_MIN_LENGTH;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const isValid =
    hasMinLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    password.length <= AUTH_INPUT_LIMITS.PASSWORD_MAX_LENGTH;

  return {
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    isValid,
  };
}

export function validateName(name: string): string | null {
  const cleanName = sanitizeName(name);
  if (!cleanName) {
    return 'Preenchimento obrigatório';
  }
  if (cleanName.length > AUTH_INPUT_LIMITS.NAME_MAX_LENGTH) {
    return `O nome deve conter no máximo ${AUTH_INPUT_LIMITS.NAME_MAX_LENGTH} caracteres`;
  }
  return null;
}

export function validateEmail(
  email: string,
  emptyMessage: string = 'Preenchimento obrigatório'
): string | null {
  const trimmed = email.trim();
  if (!trimmed) {
    return emptyMessage;
  }
  if (trimmed.length > AUTH_INPUT_LIMITS.EMAIL_MAX_LENGTH) {
    return `O e-mail deve conter no máximo ${AUTH_INPUT_LIMITS.EMAIL_MAX_LENGTH} caracteres`;
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return 'Informe um e-mail válido';
  }
  return null;
}

export function validateRegisterPassword(password: string): string | null {
  if (!password) {
    return 'Preenchimento obrigatório';
  }
  if (password.length > AUTH_INPUT_LIMITS.PASSWORD_MAX_LENGTH) {
    return `A senha deve conter no máximo ${AUTH_INPUT_LIMITS.PASSWORD_MAX_LENGTH} caracteres`;
  }
  const complexity = checkPasswordComplexity(password);
  if (!complexity.isValid) {
    return 'A senha não cumpre todos os requisitos de segurança';
  }
  return null;
}

export function validateLoginPassword(password: string): string | null {
  if (!password) {
    return 'Informe sua senha';
  }
  if (password.length < AUTH_INPUT_LIMITS.LOGIN_PASSWORD_MIN_LENGTH) {
    return `A senha deve conter no mínimo ${AUTH_INPUT_LIMITS.LOGIN_PASSWORD_MIN_LENGTH} caracteres`;
  }
  if (password.length > AUTH_INPUT_LIMITS.PASSWORD_MAX_LENGTH) {
    return `A senha deve conter no máximo ${AUTH_INPUT_LIMITS.PASSWORD_MAX_LENGTH} caracteres`;
  }
  return null;
}
