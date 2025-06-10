"use client";

import type React from "react";
import { useState, useEffect, type KeyboardEvent } from "react";
import { X, Code, Figma, PenTool, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ValidatedSkillSelectProps {
  selectedSkills: string;
  onChange: (skills: string) => void;
  maxSkillLength?: number;
  maxTotalLength?: number;
  className?: string;
}

const ValidatedSkillSelect = ({
  selectedSkills,
  onChange,
  maxSkillLength = 15,
  maxTotalLength = 100,
  className = "",
}: ValidatedSkillSelectProps) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    if (selectedSkills) {
      setSkills(
        selectedSkills.split(",").filter((skill) => skill.trim() !== "")
      );
    } else {
      setSkills([]);
    }
  }, [selectedSkills]);

  const currentTotalLength = skills.join(",").length;

  useEffect(() => {
    setError(null);
    setWarning(null);

    if (currentTotalLength > maxTotalLength) {
      setError(
        `Превышен общий лимит (${currentTotalLength}/${maxTotalLength} символов)`
      );
    } else if (currentTotalLength > maxTotalLength * 0.9) {
      setWarning(
        `Приближение к общему лимиту (${currentTotalLength}/${maxTotalLength} символов)`
      );
    }
  }, [currentTotalLength, maxTotalLength]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    if (value.length > maxSkillLength) {
      value = value.slice(0, maxSkillLength);
      setError(`Максимальная длина одного скила: ${maxSkillLength} символов`);
    }

    setInputValue(value);

    if (value.endsWith(" ") && value.trim() !== "") {
      addSkill(value.trim());
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData("text");

    if (pastedText.length > maxSkillLength) {
      e.preventDefault();
      const trimmedText = pastedText.slice(0, maxSkillLength);
      setInputValue(trimmedText);
      setError(`Вставка обрезана до ${maxSkillLength} символов`);
    }
  };

  const addSkill = (newSkill: string) => {
    if (!newSkill || skills.includes(newSkill)) {
      setInputValue("");
      return;
    }

    const newTotalLength =
      currentTotalLength + (currentTotalLength > 0 ? 1 : 0) + newSkill.length;

    if (newTotalLength > maxTotalLength) {
      setError(
        `Добавление этого скила превысит общий лимит (${newTotalLength}/${maxTotalLength} символов)`
      );
      setInputValue("");
      return;
    }

    const updatedSkills = [...skills, newSkill];
    setSkills(updatedSkills);
    onChange(updatedSkills.join(","));
    setInputValue("");
    setError(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim() !== "") {
      e.preventDefault();
      addSkill(inputValue.trim());
    }

    if (e.key === "Backspace" && inputValue === "" && skills.length > 0) {
      const updatedSkills = skills.slice(0, -1);
      setSkills(updatedSkills);
      onChange(updatedSkills.join(","));
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const updatedSkills = skills.filter((skill) => skill !== skillToRemove);
    setSkills(updatedSkills);
    onChange(updatedSkills.join(","));
    setError(null);
  };

  const getSkillIcon = (skill: string) => {
    const designTools = ["figma", "sketch", "photoshop", "illustrator", "xd"];
    const designKeywords = ["design", "ui", "ux", "graphic"];

    if (designTools.some((tool) => skill.toLowerCase().includes(tool))) {
      return <Figma className="w-4 h-4 text-emerald-400" />;
    }

    if (
      designKeywords.some((keyword) => skill.toLowerCase().includes(keyword))
    ) {
      return <PenTool className="w-4 h-4 text-emerald-400" />;
    }

    return <Code className="w-4 h-4 text-emerald-400" />;
  };

  const getBorderClass = () => {
    if (error) return "border-red-500";
    if (warning) return "border-yellow-500";
    return "border-gray-600";
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Display selected skills */}
      <div className="flex flex-wrap gap-2 mb-2">
        {skills.map((skill, index) => (
          <span
            key={index}
            className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm flex items-center gap-1"
          >
            {getSkillIcon(skill)}
            {skill}
            <button
              className="ml-1 text-gray-400 hover:text-white"
              onClick={() => removeSkill(skill)}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>

      {/* Input for new skills */}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          maxLength={maxSkillLength}
          className={`w-full px-4 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${getBorderClass()}`}
          placeholder={t("skillSelect.placeholder")}
        />

        {/* Счетчик символов для текущего ввода */}
        {inputValue && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
            {inputValue.length}/{maxSkillLength}
          </div>
        )}
      </div>

      {/* Общий счетчик и подсказки */}
      <div className="flex justify-between items-center text-xs">
        <div className="text-gray-400">
          {t("skillSelect.hint")} • Макс. {maxSkillLength} символов на скил
        </div>
        <div
          className={`${
            error
              ? "text-red-400"
              : warning
              ? "text-yellow-400"
              : "text-gray-400"
          }`}
        >
          {currentTotalLength}/{maxTotalLength}
        </div>
      </div>

      {/* Сообщения об ошибках и предупреждения */}
      {error && (
        <div className="flex items-center gap-2 text-red-500 text-xs">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {!error && warning && (
        <div className="flex items-center gap-2 text-yellow-500 text-xs">
          <AlertCircle className="w-4 h-4" />
          {warning}
        </div>
      )}
    </div>
  );
};

export default ValidatedSkillSelect;
