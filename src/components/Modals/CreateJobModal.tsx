"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  MapPin,
  Train,
  Clock,
  Calendar,
  DollarSign,
  Save,
  X,
  Loader2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { jobsApi } from "../../services/api";
import { ValidatedInput } from "../validated-input";
import { ValidatedTextarea } from "../validated-textarea";
import { useFieldValidation } from "../../hooks/use-field-validation";

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (job: any) => void;
  companyId: number;
  initialData?: any | null;
}

const CreateJobModal = ({
  isOpen,
  onClose,
  onComplete,
  companyId,
  initialData,
}: CreateJobModalProps) => {
  const { t } = useTranslation();
  const { validateForm } = useFieldValidation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    salary_min: "",
    salary_max: "",
    city: "",
    metro: "",
    type: "",
    schedule: "",
    experiense: "",
    status: "active",
    type_of_money: "USD",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        requirements: initialData.requirements
          ? initialData.requirements.replace(/,\s*/g, " ").trim()
          : "",
        salary_min: initialData.salary_min?.toString() || "",
        salary_max: initialData.salary_max?.toString() || "",
        city: initialData.city || "",
        metro: initialData.metro || "",
        type: initialData.type || "",
        schedule: initialData.schedule || "",
        experiense: initialData.experiense?.toString() || "",
        status: initialData.status || "active",
        type_of_money: initialData.type_of_money || "USD",
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "type_of_money") {
      const formattedValue = value.toUpperCase().slice(0, 3);
      setFormData((prev) => ({ ...prev, [name]: formattedValue }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleValidatedFieldChange = (fieldName: string, value: string) => {
    if (["salary_min", "salary_max", "experiense"].includes(fieldName)) {
      const numericValue = value.replace(/[^0-9]/g, "");
      setFormData((prev) => ({
        ...prev,
        [fieldName]: numericValue,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setValidationErrors([]);
    setError(null);

    const requiredFields = [
      "title",
      "description",
      "requirements",
      "salary_min",
      "salary_max",
      "city",
      "type",
      "schedule",
      "experiense",
      "type_of_money",
    ];

    const fieldLabels = {
      title: "Название вакансии",
      description: "Описание вакансии",
      requirements: "Требования",
      salary_min: "Минимальная зарплата",
      salary_max: "Максимальная зарплата",
      city: "Город",
      type: "Тип занятости",
      schedule: "График работы",
      experiense: "Опыт работы",
      type_of_money: "Валюта",
    };

    const validation = validateForm("job", formData, requiredFields);

    if (!validation.isValid) {
      const errors: string[] = [];

      validation.missingRequired.forEach((fieldName) => {
        const label =
          fieldLabels[fieldName as keyof typeof fieldLabels] || fieldName;
        errors.push(`${label} обязательно для заполнения`);
      });

      Object.entries(validation.errors).forEach(([fieldName, error]) => {
        const label =
          fieldLabels[fieldName as keyof typeof fieldLabels] || fieldName;
        errors.push(`${label}: ${error.message}`);
      });

      setValidationErrors(errors);
      return;
    }

    const salaryMin = Number.parseFloat(formData.salary_min);
    const salaryMax = Number.parseFloat(formData.salary_max);

    if (salaryMin <= 0) {
      setValidationErrors(["Минимальная зарплата должна быть больше 0"]);
      return;
    }

    if (salaryMax <= 0) {
      setValidationErrors(["Максимальная зарплата должна быть больше 0"]);
      return;
    }

    if (salaryMin > salaryMax) {
      setValidationErrors([
        "Минимальная зарплата не может быть больше максимальной",
      ]);
      return;
    }

    try {
      setIsLoading(true);

      const processedFormData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        requirements: formData.requirements
          .split(/\s+/)
          .filter((req) => req.trim() !== "")
          .join(", "),
        salary_min: Number.parseFloat(formData.salary_min),
        salary_max: Number.parseFloat(formData.salary_max),
        city: formData.city.trim(),
        metro: formData.metro.trim(),
        type: formData.type.trim(),
        schedule: formData.schedule.trim(),
        experiense: Number.parseInt(formData.experiense),
        status: formData.status,
        type_of_money: formData.type_of_money.trim(),
        company: companyId,
      };

      if (initialData) {
        const updatedJob = await jobsApi.update(
          initialData.id.toString(),
          processedFormData
        );
        onComplete(updatedJob);
      } else {
        const newJob = await jobsApi.create(processedFormData);
        onComplete(newJob);
      }

      onClose();
    } catch (error) {
      console.error("Error saving job:", error);
      setError("Произошла ошибка при сохранении вакансии");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-800 rounded-xl shadow-xl w-full max-w-sm sm:max-w-2xl max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-6 border-b border-gray-700">
              <h2 className="text-lg sm:text-xl font-bold text-white">
                {initialData ? "Редактировать вакансию" : "Создать вакансию"}
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
              </button>
            </div>

            {/* Form */}
            <div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {error && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm sm:text-base">
                  {error}
                </div>
              )}
              {validationErrors.length > 0 && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg text-yellow-400 text-sm sm:text-base">
                  <div className="font-medium mb-2">
                    Пожалуйста, исправьте следующие ошибки:
                  </div>
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                    Название вакансии*
                  </label>
                  <ValidatedInput
                    modelName="job"
                    fieldName="title"
                    value={formData.title}
                    onChange={(value) =>
                      handleValidatedFieldChange("title", value)
                    }
                    placeholder="Frontend разработчик"
                    className="w-full px-3 py-2 sm:px-4 sm:py-2 pl-8 sm:pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                    icon={
                      <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    }
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                    Описание вакансии*
                  </label>
                  <ValidatedTextarea
                    modelName="job"
                    fieldName="description"
                    value={formData.description}
                    onChange={(value) =>
                      handleValidatedFieldChange("description", value)
                    }
                    rows={3}
                    className="w-full px-3 py-2 sm:px-4 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none text-sm sm:text-base"
                    placeholder="Подробное описание вакансии и обязанностей"
                    required
                  />
                </div>

                {/* Requirements */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                    Требования*
                  </label>
                  <ValidatedInput
                    modelName="job"
                    fieldName="requirements"
                    value={formData.requirements}
                    onChange={(value) =>
                      handleValidatedFieldChange("requirements", value)
                    }
                    placeholder="React JavaScript TypeScript"
                    className="w-full px-3 py-2 sm:px-4 sm:py-2 pl-8 sm:pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                    icon={
                      <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    }
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Перечислите требования через пробел
                  </p>
                </div>

                {/* Salary Range */}
                <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                      Минимальная зарплата*
                    </label>
                    <ValidatedInput
                      modelName="job"
                      fieldName="salary_min"
                      value={formData.salary_min}
                      onChange={(value) =>
                        handleValidatedFieldChange("salary_min", value)
                      }
                      placeholder="50000"
                      className="w-full px-3 py-2 sm:px-4 sm:py-2 pl-8 sm:pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                      icon={
                        <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                      Максимальная зарплата*
                    </label>
                    <ValidatedInput
                      modelName="job"
                      fieldName="salary_max"
                      value={formData.salary_max}
                      onChange={(value) =>
                        handleValidatedFieldChange("salary_max", value)
                      }
                      placeholder="100000"
                      className="w-full px-3 py-2 sm:px-4 sm:py-2 pl-8 sm:pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                      icon={
                        <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      }
                      required
                    />
                  </div>
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                    Валюта*
                  </label>
                  <ValidatedInput
                    modelName="job"
                    fieldName="type_of_money"
                    value={formData.type_of_money}
                    onChange={(value) =>
                      handleValidatedFieldChange(
                        "type_of_money",
                        value.toUpperCase()
                      )
                    }
                    placeholder="USD"
                    className="w-full px-3 py-2 sm:px-4 sm:py-2 pl-8 sm:pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                    icon={
                      <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    }
                    required
                  />
                </div>

                {/* Location */}
                <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                      Город*
                    </label>
                    <ValidatedInput
                      modelName="job"
                      fieldName="city"
                      value={formData.city}
                      onChange={(value) =>
                        handleValidatedFieldChange("city", value)
                      }
                      placeholder="Москва"
                      className="w-full px-3 py-2 sm:px-4 sm:py-2 pl-8 sm:pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                      icon={
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                      Метро
                    </label>
                    <ValidatedInput
                      modelName="job"
                      fieldName="metro"
                      value={formData.metro}
                      onChange={(value) =>
                        handleValidatedFieldChange("metro", value)
                      }
                      placeholder="Красные ворота"
                      className="w-full px-3 py-2 sm:px-4 sm:py-2 pl-8 sm:pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                      icon={
                        <Train className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      }
                    />
                  </div>
                </div>

                {/* Employment Type & Schedule */}
                <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                      Тип занятости*
                    </label>
                    <ValidatedInput
                      modelName="job"
                      fieldName="type"
                      value={formData.type}
                      onChange={(value) =>
                        handleValidatedFieldChange("type", value)
                      }
                      placeholder="Полная занятость"
                      className="w-full px-3 py-2 sm:px-4 sm:py-2 pl-8 sm:pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                      icon={
                        <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                      График работы*
                    </label>
                    <ValidatedInput
                      modelName="job"
                      fieldName="schedule"
                      value={formData.schedule}
                      onChange={(value) =>
                        handleValidatedFieldChange("schedule", value)
                      }
                      placeholder="5/2"
                      className="w-full px-3 py-2 sm:px-4 sm:py-2 pl-8 sm:pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                      icon={
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      }
                      required
                    />
                  </div>
                </div>

                {/* Experience */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                    Опыт работы (лет)*
                  </label>
                  <ValidatedInput
                    modelName="job"
                    fieldName="experiense"
                    value={formData.experiense}
                    onChange={(value) =>
                      handleValidatedFieldChange("experiense", value)
                    }
                    placeholder="3"
                    className="w-full px-3 py-2 sm:px-4 sm:py-2 pl-8 sm:pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                    icon={
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    }
                    required
                  />
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-2 sm:gap-4 pt-3 sm:pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 sm:px-6 sm:py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base"
                    disabled={isLoading}
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 sm:px-6 sm:py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                        <span>Сохранение...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>
                          {initialData
                            ? "Обновить вакансию"
                            : "Создать вакансию"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateJobModal;
