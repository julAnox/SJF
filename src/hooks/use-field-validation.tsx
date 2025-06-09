"use client";

import { useState, useEffect } from "react";

// Объект с ограничениями полей из Django моделей
// Это будет использоваться как fallback, если API недоступен
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
    contacts: 255,
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
    website: 40,
    industry: 50,
    size: 20,
    status: 20,
  },
  job: {
    title: 30,
    description: 255,
    requirements: 255,
    city: 20,
    metro: 30,
    type: 30,
    schedule: 30,
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

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  currentLength: number;
  maxLength: number;
}

export function useFieldValidation() {
  const [fieldLimits, setFieldLimits] =
    useState<Record<string, Record<string, number>>>(DEFAULT_FIELD_LIMITS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузка ограничений полей с сервера
  useEffect(() => {
    const fetchFieldLimits = async () => {
      try {
        const response = await fetch("/api/field-limits/");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setFieldLimits(data);
        setError(null);
      } catch (err) {
        console.error("Ошибка при загрузке ограничений полей:", err);
        setError(
          "Не удалось загрузить ограничения полей. Используются значения по умолчанию."
        );
        // Используем значения по умолчанию в случае ошибки
      } finally {
        setIsLoading(false);
      }
    };

    fetchFieldLimits();
  }, []);

  // Проверка одного поля
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
    const isValid = currentLength <= maxLength;

    return {
      isValid,
      message: isValid
        ? undefined
        : `Превышена максимальная длина (${currentLength}/${maxLength})`,
      currentLength,
      maxLength,
    };
  };

  // Проверка всей формы
  const validateForm = (
    modelName: string,
    formData: Record<string, string>
  ): Record<string, ValidationResult> => {
    const errors: Record<string, ValidationResult> = {};

    Object.entries(formData).forEach(([fieldName, value]) => {
      if (typeof value === "string") {
        const result = validateField(modelName, fieldName, value);
        if (!result.isValid) {
          errors[fieldName] = result;
        }
      }
    });

    return errors;
  };

  // Получение максимальной длины для поля
  const getMaxLength = (
    modelName: string,
    fieldName: string
  ): number | undefined => {
    return fieldLimits[modelName.toLowerCase()]?.[fieldName];
  };

  return {
    validateField,
    validateForm,
    getMaxLength,
    fieldLimits,
    isLoading,
    error,
  };
}
