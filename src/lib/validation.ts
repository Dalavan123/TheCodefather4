export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validators = {
  email: (value: string): ValidationResult => {
    if (!value.trim()) {
      return { isValid: false, error: "E-postadress krävs" };
    }
    if (!EMAIL_REGEX.test(value)) {
      return { isValid: false, error: "Ange en giltig e-postadress" };
    }
    return { isValid: true };
  },

  password: (value: string, minLength = 6): ValidationResult => {
    if (!value) {
      return { isValid: false, error: "Lösenord krävs" };
    }
    if (value.length < minLength) {
      return {
        isValid: false,
        error: `Lösenord måste vara minst ${minLength} tecken`,
      };
    }
    return { isValid: true };
  },

  confirmPassword: (
    password: string,
    confirmPassword: string
  ): ValidationResult => {
    if (password !== confirmPassword) {
      return { isValid: false, error: "Lösenorden matchar inte" };
    }
    return { isValid: true };
  },

  name: (value: string): ValidationResult => {
    if (!value.trim()) {
      return { isValid: false, error: "Namn krävs" };
    }
    if (value.trim().length < 2) {
      return { isValid: false, error: "Namn måste vara minst 2 tecken" };
    }
    return { isValid: true };
  },

  required: (value: string, fieldName = "Detta fält"): ValidationResult => {
    if (!value.trim()) {
      return { isValid: false, error: `${fieldName} krävs` };
    }
    return { isValid: true };
  },
};
