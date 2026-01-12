import { useState, useCallback } from "react";
import { ValidationResult } from "@/lib/validation";

interface FormField {
  value: string;
  error: string;
  touched: boolean;
}

interface UseFormOptions<T> {
  initialValues: T;
  validators: Partial<Record<keyof T, (value: string) => ValidationResult>>;
  onSubmit: (values: T) => Promise<void>;
}

export function useForm<T extends Record<string, string>>({
  initialValues,
  validators,
  onSubmit,
}: UseFormOptions<T>) {
  const [fields, setFields] = useState<Record<keyof T, FormField>>(() => {
    const initial = {} as Record<keyof T, FormField>;
    Object.keys(initialValues).forEach((key) => {
      initial[key as keyof T] = {
        value: initialValues[key as keyof T],
        error: "",
        touched: false,
      };
    });
    return initial;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const validateField = useCallback(
    (name: keyof T, value: string): string => {
      const validator = validators[name];
      if (!validator) return "";
      const result = validator(value);
      return result.isValid ? "" : result.error || "";
    },
    [validators]
  );

  const handleChange = useCallback(
    (name: keyof T, value: string) => {
      setFields((prev) => ({
        ...prev,
        [name]: {
          ...prev[name],
          value,
          error: prev[name].touched ? validateField(name, value) : "",
        },
      }));
    },
    [validateField]
  );

  const handleBlur = useCallback(
    (name: keyof T) => {
      setFields((prev) => ({
        ...prev,
        [name]: {
          ...prev[name],
          touched: true,
          error: validateField(name, prev[name].value),
        },
      }));
    },
    [validateField]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitError("");

      // Mark all as touched and validate
      const newFields = { ...fields };
      let hasErrors = false;

      Object.keys(fields).forEach((key) => {
        const fieldKey = key as keyof T;
        const error = validateField(fieldKey, fields[fieldKey].value);
        newFields[fieldKey] = {
          ...fields[fieldKey],
          touched: true,
          error,
        };
        if (error) hasErrors = true;
      });

      setFields(newFields);

      if (hasErrors) return;

      setIsSubmitting(true);
      try {
        const values = {} as T;
        Object.keys(fields).forEach((key) => {
          values[key as keyof T] = fields[key as keyof T].value as T[keyof T];
        });
        await onSubmit(values);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Något gick fel";
        setSubmitError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [fields, validateField, onSubmit]
  );

  const isValid = Object.values(fields).every(
    (field) => !field.error && field.value
  );

  return {
    fields,
    isSubmitting,
    submitError,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
  };
}
