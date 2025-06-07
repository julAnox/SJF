"use client";

import type React from "react";
import { useState, useEffect, type KeyboardEvent } from "react";
import { X, Code, Figma, PenTool } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SkillSelectProps {
  selectedSkills: string;
  onChange: (skills: string) => void;
}

const SkillSelect = ({ selectedSkills, onChange }: SkillSelectProps) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState("");
  const [skills, setSkills] = useState<string[]>([]);

  useEffect(() => {
    if (selectedSkills) {
      setSkills(
        selectedSkills.split(",").filter((skill) => skill.trim() !== "")
      );
    } else {
      setSkills([]);
    }
  }, [selectedSkills]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (value.endsWith(" ") && value.trim() !== "") {
      const newSkill = value.trim();
      if (newSkill && !skills.includes(newSkill)) {
        const updatedSkills = [...skills, newSkill];
        setSkills(updatedSkills);
        onChange(updatedSkills.join(","));
        setInputValue("");
      } else {
        setInputValue("");
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim() !== "") {
      e.preventDefault();
      const newSkill = inputValue.trim();
      if (!skills.includes(newSkill)) {
        const updatedSkills = [...skills, newSkill];
        setSkills(updatedSkills);
        onChange(updatedSkills.join(","));
      }
      setInputValue("");
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

  return (
    <div className="space-y-2">
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
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        placeholder={t("skillSelect.placeholder")}
      />
      <p className="text-xs text-gray-400 mt-1">{t("skillSelect.hint")}</p>
    </div>
  );
};

export default SkillSelect;
