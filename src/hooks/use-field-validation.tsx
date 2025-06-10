"use client";

import { useState, useEffect } from "react";

const DEFAULT_FIELD_LIMITS: Record<string, Record<string, number>> = {
  user: {
    email: 30,
    first_name: 15,
    last_name: 15,
    date_of_birth: 10,
    phone: 20,
    country: 255,
    region: 255,
    district: 255,
    role: 10,
    password: 20,
  },
  resume: {
    profession: 50,
    experience: 255,
    education: 50,
    institutionName: 50,
    graduationYear: 4,
    specialization: 50,
    skills: 255,
    contacts: 300,
  },
  comment: {
    content: 255,
  },
  issue: {
    issue: 300,
    solution: 300,
  },
  company: {
    name: 40,
    description: 1000,
    website: 40,
    industry: 50,
    size: 20,
    founded_year: 4,
    status: 20,
  },
  job: {
    title: 30,
    description: 2000,
    requirements: 1000,
    salary_min: 15,
    salary_max: 15,
    city: 20,
    metro: 30,
    type: 30,
    schedule: 30,
    experiense: 2,
    status: 20,
    type_of_money: 3,
  },
  jobapplication: {
    cover_letter: 255,
    status: 255,
  },
  resumeapplication: {
    message: 255,
    status: 255,
  },
};

const NUMERIC_ONLY_FIELDS: Record<string, string[]> = {
  company: ["size", "founded_year"],
  job: ["salary_min", "salary_max", "experiense"],
  user: [],
  resume: ["graduationYear"],
};

const FIELD_VALIDATION_RULES: Record<
  string,
  Record<string, (value: string) => { isValid: boolean; message?: string }>
> = {
  company: {
    founded_year: (value: string) => {
      const year = Number.parseInt(value);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1800 || year > currentYear) {
        return {
          isValid: false,
          message: `Год должен быть между 1800 и ${currentYear}`,
        };
      }
      return { isValid: true };
    },
    website: (value: string) => {
      if (value && !value.match(/^https?:\/\/.+/)) {
        return {
          isValid: false,
          message: "Веб-сайт должен начинаться с http:// или https://",
        };
      }
      return { isValid: true };
    },
    size: (value: string) => {
      const num = Number.parseInt(value);
      if (value && (isNaN(num) || num <= 0)) {
        return {
          isValid: false,
          message: "Размер компании должен быть положительным числом",
        };
      }
      return { isValid: true };
    },
  },
  user: {
    email: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        return {
          isValid: false,
          message: "Неверный формат email",
        };
      }
      return { isValid: true };
    },
  },
  job: {
    salary_min: (value: string) => {
      const num = Number.parseFloat(value);
      if (value && (isNaN(num) || num < 0)) {
        return {
          isValid: false,
          message: "Минимальная зарплата должна быть положительным числом",
        };
      }
      return { isValid: true };
    },
    salary_max: (value: string) => {
      const num = Number.parseFloat(value);
      if (value && (isNaN(num) || num < 0)) {
        return {
          isValid: false,
          message: "Максимальная зарплата должна быть положительным числом",
        };
      }
      return { isValid: true };
    },
    experiense: (value: string) => {
      const num = Number.parseInt(value);
      if (value && (isNaN(num) || num < 0 || num > 50)) {
        return {
          isValid: false,
          message: "Опыт должен быть от 0 до 50 лет",
        };
      }
      return { isValid: true };
    },
  },
};

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  currentLength: number;
  maxLength: number;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, ValidationResult>;
  missingRequired: string[];
}

export function useFieldValidation() {
  const [fieldLimits, setFieldLimits] =
    useState<Record<string, Record<string, number>>>(DEFAULT_FIELD_LIMITS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateField = (
    modelName: string,
    fieldName: string,
    value: string
  ): ValidationResult => {
    const model = fieldLimits[modelName.toLowerCase()];
    if (!model) {
      return {
        isValid: true,
        currentLength: value.length,
        maxLength: Number.POSITIVE_INFINITY,
      };
    }

    const maxLength = model[fieldName];
    if (!maxLength) {
      return {
        isValid: true,
        currentLength: value.length,
        maxLength: Number.POSITIVE_INFINITY,
      };
    }

    const currentLength = value.length;
    let isValid = currentLength <= maxLength;
    let message: string | undefined;

    const numericFields = NUMERIC_ONLY_FIELDS[modelName.toLowerCase()];
    if (numericFields && numericFields.includes(fieldName)) {
      const isNumeric = /^\d*$/.test(value) || value === "";
      if (!isNumeric) {
        isValid = false;
        message = "Поле должно содержать только цифры";
      }
    }

    const validationRules = FIELD_VALIDATION_RULES[modelName.toLowerCase()];
    if (validationRules && validationRules[fieldName] && value.trim()) {
      const customValidation = validationRules[fieldName](value);
      if (!customValidation.isValid) {
        isValid = false;
        message = customValidation.message;
      }
    }

    if (isValid && currentLength > maxLength) {
      isValid = false;
      message = `Превышена максимальная длина (${currentLength}/${maxLength})`;
    }

    return {
      isValid,
      message,
      currentLength,
      maxLength,
    };
  };

  const validateForm = (
    modelName: string,
    formData: Record<string, any>,
    requiredFields: string[] = []
  ): FormValidationResult => {
    const errors: Record<string, ValidationResult> = {};
    const missingRequired: string[] = [];

    requiredFields.forEach((fieldName) => {
      const value = formData[fieldName];
      if (
        !value ||
        (typeof value === "string" && !value.trim()) ||
        (typeof value === "number" && (isNaN(value) || value === 0))
      ) {
        missingRequired.push(fieldName);
      }
    });

    Object.entries(formData).forEach(([fieldName, value]) => {
      if (typeof value === "string") {
        const result = validateField(modelName, fieldName, value);
        if (!result.isValid) {
          errors[fieldName] = result;
        }
      }
    });

    return {
      isValid: Object.keys(errors).length === 0 && missingRequired.length === 0,
      errors,
      missingRequired,
    };
  };

  const getMaxLength = (
    modelName: string,
    fieldName: string
  ): number | undefined => {
    return fieldLimits[modelName.toLowerCase()]?.[fieldName];
  };

  const isNumericField = (modelName: string, fieldName: string): boolean => {
    const numericFields = NUMERIC_ONLY_FIELDS[modelName.toLowerCase()];
    return numericFields ? numericFields.includes(fieldName) : false;
  };

  const filterNumericValue = (
    modelName: string,
    fieldName: string,
    value: string
  ): string => {
    if (isNumericField(modelName, fieldName)) {
      return value.replace(/[^0-9]/g, "");
    }
    return value;
  };

  const getFormErrorMessages = (
    modelName: string,
    formData: Record<string, any>,
    requiredFields: string[] = [],
    fieldLabels: Record<string, string> = {}
  ): string[] => {
    const validation = validateForm(modelName, formData, requiredFields);
    const messages: string[] = [];

    validation.missingRequired.forEach((fieldName) => {
      const label = fieldLabels[fieldName] || fieldName;
      messages.push(`${label} обязательно для заполнения`);
    });

    Object.entries(validation.errors).forEach(([fieldName, error]) => {
      const label = fieldLabels[fieldName] || fieldName;
      messages.push(`${label}: ${error.message}`);
    });

    return messages;
  };

  return {
    validateField,
    validateForm,
    getMaxLength,
    isNumericField,
    filterNumericValue,
    getFormErrorMessages,
    fieldLimits,
    isLoading,
    error,
  };
}
