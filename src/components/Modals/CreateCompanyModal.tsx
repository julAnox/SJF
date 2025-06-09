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
    if (!user) {
      setError(t("createCompanyModal.errors.mustBeLoggedIn"));
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

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

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                    {t("createCompanyModal.fields.name")}*
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 sm:px-4 sm:py-2 pl-8 sm:pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                      placeholder={t("createCompanyModal.placeholders.name")}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                    {t("createCompanyModal.fields.logo")}
                  </label>
                  {formData.logo && (
                    <div className="mb-3 sm:mb-4">
                      <img
                        src={formData.logo || "/placeholder.svg"}
                        alt={t("createCompanyModal.logoPreview")}
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
                    {t("createCompanyModal.fields.description")}*
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 sm:px-4 sm:py-2 pl-8 sm:pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none text-sm sm:text-base"
                      placeholder={t(
                        "createCompanyModal.placeholders.description"
                      )}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                    {t("createCompanyModal.fields.website")}*
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      className="w-full px-3 py-2 sm:px-4 sm:py-2 pl-8 sm:pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                      placeholder={t("createCompanyModal.placeholders.website")}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                      {t("createCompanyModal.fields.industry")}*
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                      <input
                        type="text"
                        name="industry"
                        value={formData.industry}
                        onChange={handleChange}
                        className="w-full px-3 py-2 sm:px-4 sm:py-2 pl-8 sm:pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                        placeholder={t(
                          "createCompanyModal.placeholders.industry"
                        )}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                      {t("createCompanyModal.fields.size")}*
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                      <input
                        type="text"
                        name="size"
                        value={formData.size}
                        onChange={handleChange}
                        className="w-full px-3 py-2 sm:px-4 sm:py-2 pl-8 sm:pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                        placeholder={t("createCompanyModal.placeholders.size")}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                    {t("createCompanyModal.fields.foundedYear")}*
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                      type="number"
                      name="founded_year"
                      value={formData.founded_year}
                      onChange={handleChange}
                      min="1900"
                      max={new Date().getFullYear()}
                      className="w-full px-3 py-2 sm:px-4 sm:py-2 pl-8 sm:pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 sm:gap-4 pt-3 sm:pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 sm:px-6 sm:py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base"
                    disabled={isLoading}
                  >
                    {t("createCompanyModal.buttons.cancel")}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 sm:px-6 sm:py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                        <span>{t("createCompanyModal.buttons.creating")}</span>
                      </>
                    ) : (
                      <span>
                        {t("createCompanyModal.buttons.createCompany")}
                      </span>
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
