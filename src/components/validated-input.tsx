"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useFieldValidation } from "../hooks/use-field-validation";

interface ValidatedInputProps {
  modelName: string;
  fieldName: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  type?: string;
  showCounter?: boolean;
  showError?: boolean;
  icon?: React.ReactNode;
}

export function ValidatedInput({
  modelName,
  fieldName,
  value,
  onChange,
  placeholder,
  className = "",
  disabled = false,
  required = false,
  type = "text",
  showCounter = true,
  showError = true,
  icon,
}: ValidatedInputProps) {
  const { validateField, getMaxLength, isNumericField } = useFieldValidation();
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

        const isNumeric = isNumericField(modelName, fieldName);
        if (maxLength && !isNumeric && result.currentLength > maxLength * 0.9) {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    if (isNumericField(modelName, fieldName)) {
      newValue = newValue.replace(/[^0-9]/g, "");
    }

    if (maxLength && newValue.length > maxLength) {
      return;
    }

    onChange(newValue);
  };

  const getBorderClass = () => {
    if (error) return "border-red-500";
    if (warning) return "border-yellow-500";
    return "";
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        {icon && (
          <div className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2">
            {icon}
          </div>
        )}

        <input
          type={type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full ${
            icon ? "pl-8 sm:pl-10" : ""
          } ${getBorderClass()} ${className}`}
        />

        {showCounter && maxLength && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
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
