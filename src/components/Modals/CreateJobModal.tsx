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
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    salary_min: 0,
    salary_max: 0,
    city: "",
    metro: "",
    type: "",
    schedule: "",
    experiense: 0,
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
        salary_min: initialData.salary_min || 0,
        salary_max: initialData.salary_max || 0,
        city: initialData.city || "",
        metro: initialData.metro || "",
        type: initialData.type || "",
        schedule: initialData.schedule || "",
        experiense: initialData.experiense || 0,
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

    if (name === "requirements") {
      setFormData((prev) => ({ ...prev, [name]: value }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]:
        name.includes("salary") || name === "experiense"
          ? Number.parseFloat(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      const processedFormData = {
        ...formData,
        requirements: formData.requirements
          .split(/\s+/)
          .filter((req) => req.trim() !== "")
          .join(", "),
      };

      if (initialData) {
        const updatedJob = await jobsApi.update(initialData.id.toString(), {
          ...processedFormData,
          company: companyId,
        });
        onComplete(updatedJob);
      } else {
        const newJob = await jobsApi.create({
          ...processedFormData,
          company: companyId,
        });
        onComplete(newJob);
      }

      onClose();
    } catch (error) {
      console.error("Error saving job:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">
                {initialData
                  ? t("jobModal.titleEdit")
                  : t("jobModal.titleCreate")}
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-700 transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t("jobModal.fields.title")}*
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder={t("jobModal.placeholders.title")}
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t("jobModal.fields.description")}*
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    placeholder={t("jobModal.placeholders.description")}
                    required
                  />
                </div>

                {/* Requirements */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t("jobModal.fields.requirements")}*
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      name="requirements"
                      value={formData.requirements}
                      onChange={handleChange}
                      className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder={t("jobModal.placeholders.requirements")}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {t("jobModal.hints.requirements")}
                  </p>
                </div>

                {/* Salary Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t("jobModal.fields.salaryMin")}*
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="number"
                        name="salary_min"
                        value={formData.salary_min}
                        onChange={handleChange}
                        className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder={t("jobModal.placeholders.salaryMin")}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t("jobModal.fields.salaryMax")}*
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="number"
                        name="salary_max"
                        value={formData.salary_max}
                        onChange={handleChange}
                        className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder={t("jobModal.placeholders.salaryMax")}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t("jobModal.fields.currency")}*
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      name="type_of_money"
                      value={formData.type_of_money}
                      onChange={handleChange}
                      maxLength={3}
                      className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder={t("jobModal.placeholders.currency")}
                      required
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t("jobModal.fields.city")}*
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder={t("jobModal.placeholders.city")}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t("jobModal.fields.metro")}
                    </label>
                    <div className="relative">
                      <Train className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        name="metro"
                        value={formData.metro}
                        onChange={handleChange}
                        className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder={t("jobModal.placeholders.metro")}
                      />
                    </div>
                  </div>
                </div>

                {/* Employment Type & Schedule */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t("jobModal.fields.employmentType")}*
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      >
                        <option value="">
                          {t("jobModal.options.selectType")}
                        </option>
                        <option value="Full-time">
                          {t("jobModal.options.fullTime")}
                        </option>
                        <option value="Part-time">
                          {t("jobModal.options.partTime")}
                        </option>
                        <option value="Contract">
                          {t("jobModal.options.contract")}
                        </option>
                        <option value="Temporary">
                          {t("jobModal.options.temporary")}
                        </option>
                        <option value="Internship">
                          {t("jobModal.options.internship")}
                        </option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t("jobModal.fields.schedule")}*
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <select
                        name="schedule"
                        value={formData.schedule}
                        onChange={handleChange}
                        className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      >
                        <option value="">
                          {t("jobModal.options.selectSchedule")}
                        </option>
                        <option value="Standard">
                          {t("jobModal.options.standard")}
                        </option>
                        <option value="Flexible">
                          {t("jobModal.options.flexible")}
                        </option>
                        <option value="Shift">
                          {t("jobModal.options.shift")}
                        </option>
                        <option value="Remote">
                          {t("jobModal.options.remote")}
                        </option>
                        <option value="Hybrid">
                          {t("jobModal.options.hybrid")}
                        </option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Experience */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t("jobModal.fields.experience")}*
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      name="experiense"
                      value={formData.experiense}
                      onChange={handleChange}
                      className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder={t("jobModal.placeholders.experience")}
                      required
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    disabled={isLoading}
                  >
                    {t("jobModal.buttons.cancel")}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{t("jobModal.buttons.saving")}</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        <span>
                          {initialData
                            ? t("jobModal.buttons.updateJob")
                            : t("jobModal.buttons.createJob")}
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
