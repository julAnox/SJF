"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useFieldValidation } from "../hooks/use-field-validation";

interface ValidatedTextareaProps {
  modelName: string;
  fieldName: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  rows?: number;
  showCounter?: boolean;
  showError?: boolean;
  icon?: React.ReactNode;
}

export function ValidatedTextarea({
  modelName,
  fieldName,
  value,
  onChange,
  placeholder,
  className = "",
  disabled = false,
  required = false,
  rows = 3,
  showCounter = true,
  showError = true,
  icon,
}: ValidatedTextareaProps) {
  const { validateField, getMaxLength } = useFieldValidation();
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const maxLength = getMaxLength(modelName, fieldName);

  useEffect(() => {
    if (value) {
      const result = validateField(modelName, fieldName, value);

      if (!result.isValid) {
        setError(
          result.message ||
            `Превышена максимальная длина (${result.currentLength}/${result.maxLength})`
        );
        setWarning(null);
      } else {
        setError(null);

        // Показываем предупреждение, если заполнено более 90% от максимальной длины
        if (maxLength && result.currentLength > maxLength * 0.9) {
          setWarning(
            `Приближение к лимиту (${result.currentLength}/${result.maxLength})`
          );
        } else {
          setWarning(null);
        }
      }
    } else {
      setError(null);
      setWarning(null);
    }
  }, [value, modelName, fieldName, maxLength]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;

    // Если есть ограничение по длине и новое значение превышает его, не обновляем
    if (maxLength && newValue.length > maxLength) {
      setError(
        `Превышена максимальная длина (${newValue.length}/${maxLength})`
      );
      return;
    }

    onChange(newValue);
  };

  // Определяем цвет границы в зависимости от состояния
  const getBorderClass = () => {
    if (error) return "border-red-500";
    if (warning) return "border-yellow-500";
    return "";
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        {icon && <div className="absolute left-2 sm:left-3 top-3">{icon}</div>}

        <textarea
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          rows={rows}
          maxLength={maxLength}
          className={`w-full ${
            icon ? "pl-8 sm:pl-10" : ""
          } ${getBorderClass()} ${className}`}
        />

        {showCounter && maxLength && (
          <div className="absolute right-3 bottom-3 text-xs text-gray-400 bg-gray-700 px-1 rounded">
            {value.length}/{maxLength}
          </div>
        )}
      </div>

      {showError && error && (
        <div className="text-red-500 text-xs mt-1">{error}</div>
      )}

      {showError && !error && warning && (
        <div className="text-yellow-500 text-xs mt-1">{warning}</div>
      )}
    </div>
  );
}
