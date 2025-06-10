"use client";

import type React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Loader2,
  Building2,
  Globe,
  FileText,
  Calendar,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { companiesApi } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { ValidatedInput } from "../validated-input";
import { ValidatedTextarea } from "../validated-textarea";
import { useFieldValidation } from "../../hooks/use-field-validation";

interface CreateCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (company: any) => void;
}

const CreateCompanyModal = ({
  isOpen,
  onClose,
  onComplete,
}: CreateCompanyModalProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { validateForm } = useFieldValidation();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    logo: "",
    description: "",
    website: "",
    industry: "",
    size: "",
    founded_year: new Date().getFullYear(),
    status: "active",
  });
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "founded_year" ? Number.parseInt(value) : value,
    }));
  };

  const handleValidatedFieldChange = (fieldName: string, value: string) => {
    if (fieldName === "founded_year") {
      const numericValue = value.replace(/[^0-9]/g, "");
      const numValue = numericValue ? Number.parseInt(numericValue) : "";
      setFormData((prev) => ({
        ...prev,
        [fieldName]: numValue,
      }));
      return;
    }

    if (fieldName === "size") {
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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          logo: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setValidationErrors([]);
    setError(null);

    const requiredFields = [
      "name",
      "description",
      "website",
      "industry",
      "size",
      "founded_year",
    ];

    const fieldLabels = {
      name: "Название компании",
      description: "Описание компании",
      website: "Веб-сайт",
      industry: "Отрасль",
      size: "Размер компании",
      founded_year: "Год основания",
    };

    const validationData = {
      ...formData,
      founded_year: formData.founded_year.toString(),
    };

    const validation = validateForm("company", validationData, requiredFields);

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

    if (
      !formData.founded_year ||
      formData.founded_year < 1800 ||
      formData.founded_year > new Date().getFullYear()
    ) {
      setValidationErrors([
        `Год основания должен быть между 1800 и ${new Date().getFullYear()}`,
      ]);
      return;
    }

    if (!user) {
      setError(t("createCompanyModal.errors.mustBeLoggedIn"));
      return;
    }

    try {
      setIsLoading(true);

      const newCompany = await companiesApi.create({
        ...formData,
        user: Number(user.id),
      });

      onComplete(newCompany);
      onClose();
    } catch (error) {
      console.error("Error creating company:", error);
      setError(t("createCompanyModal.errors.failedToCreate"));
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
            <div className="flex items-center justify-between p-3 sm:p-6 border-b border-gray-700">
              <h2 className="text-lg sm:text-xl font-bold text-white">
                {t("createCompanyModal.title")}
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
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                    Название компании*
                  </label>
                  <ValidatedInput
                    modelName="company"
                    fieldName="name"
                    value={formData.name}
                    onChange={(value) =>
                      handleValidatedFieldChange("name", value)
                    }
                    placeholder="Введите название компании"
                    className="w-full px-3 py-2 sm:px-4 sm:py-2 pl-8 sm:pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                    icon={
                      <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                    Логотип компании
                  </label>
                  {formData.logo && (
                    <div className="mb-3 sm:mb-4">
                      <img
                        src={formData.logo || "/placeholder.svg"}
                        alt="Предпросмотр логотипа"
                        className="w-24 h-24 sm:w-32 sm:h-32 object-contain rounded-lg bg-gray-700 p-2"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="w-full px-3 py-2 sm:px-4 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm sm:text-base file:mr-3 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                    Описание компании*
                  </label>
                  <ValidatedTextarea
                    modelName="company"
                    fieldName="description"
                    value={formData.description}
                    onChange={(value) =>
                      handleValidatedFieldChange("description", value)
                    }
                    rows={3}
                    className="w-full px-3 py-2 sm:px-4 sm:py-2 pl-8 sm:pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none text-sm sm:text-base"
                    placeholder="Расскажите о вашей компании"
                    icon={
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                    Веб-сайт*
                  </label>
                  <ValidatedInput
                    modelName="company"
                    fieldName="website"
                    value={formData.website}
                    onChange={(value) =>
                      handleValidatedFieldChange("website", value)
                    }
                    type="url"
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 sm:px-4 sm:py-2 pl-8 sm:pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                    icon={
                      <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                      Отрасль*
                    </label>
                    <ValidatedInput
                      modelName="company"
                      fieldName="industry"
                      value={formData.industry}
                      onChange={(value) =>
                        handleValidatedFieldChange("industry", value)
                      }
                      placeholder="IT, Финансы, Медицина"
                      className="w-full px-3 py-2 sm:px-4 sm:py-2 pl-8 sm:pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                      icon={
                        <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                      Размер компании* (только цифры)
                    </label>
                    <ValidatedInput
                      modelName="company"
                      fieldName="size"
                      value={formData.size}
                      onChange={(value) =>
                        handleValidatedFieldChange("size", value)
                      }
                      placeholder="50"
                      className="w-full px-3 py-2 sm:px-4 sm:py-2 pl-8 sm:pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                      icon={
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                    Год основания* (1800-{new Date().getFullYear()})
                  </label>
                  <ValidatedInput
                    modelName="company"
                    fieldName="founded_year"
                    value={formData.founded_year.toString()}
                    onChange={(value) =>
                      handleValidatedFieldChange("founded_year", value)
                    }
                    placeholder="2020"
                    className="w-full px-3 py-2 sm:px-4 sm:py-2 pl-8 sm:pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                    icon={
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    }
                    required
                  />
                </div>

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
                        <span>Создание...</span>
                      </>
                    ) : (
                      <span>Создать компанию</span>
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

export default CreateCompanyModal;
