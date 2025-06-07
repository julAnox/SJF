"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { resumesApi } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import SkillSelect from "../../components/SkillSelect/SkillSelect";

interface ResumeWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: any) => void;
}

interface FormData {
  user: number;
  gender: string;
  profession: string;
  experience: string;
  education: string;
  institutionName: string;
  graduationYear: string;
  specialization: string;
  skills: string;
  contacts: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  country: string;
  region: string;
}

const initialFormData: FormData = {
  user: 0,
  gender: "",
  profession: "",
  experience: "",
  education: "",
  institutionName: "",
  graduationYear: "",
  specialization: "",
  skills: "",
  contacts: "",
  name: "",
  surname: "",
  email: "",
  phone: "",
  country: "",
  region: "",
};

const ResumeWizard = ({ isOpen, onClose, onComplete }: ResumeWizardProps) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const { user } = useAuth();

  const educationOptions = [
    t("profile.wizard.education.levels.highSchool"),
    t("profile.wizard.education.levels.vocational"),
    t("profile.wizard.education.levels.incompleteHigher"),
    t("profile.wizard.education.levels.higher"),
    t("profile.wizard.education.levels.bachelor"),
    t("profile.wizard.education.levels.master"),
    t("profile.wizard.education.levels.phd"),
    t("profile.wizard.education.levels.doctorOfSciences"),
  ];

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        user: user.id,
        name: user.first_name || "",
        surname: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
        country: user.country || "",
        region: user.region || "",
      }));
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === "graduationYear") {
      newValue = value.replace(/[^0-9]/g, "");
    } else if (name === "phone") {
      newValue = value.replace(/[^0-9+\-()]/g, "");
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleEducationSelect = (education: string) => {
    setFormData((prev) => ({
      ...prev,
      education,
    }));
  };

  const handleNext = async () => {
    if (step < 4) {
      setStep((prev) => prev + 1);
    } else {
      try {
        const dataToSend = {
          ...formData,
          skills: typeof formData.skills === "string" ? formData.skills : "",
        };

        console.log("Data to send:", dataToSend);
        const response = await resumesApi.create(dataToSend);
        onComplete(response);
        onClose();
      } catch (error) {
        console.error("Error creating resume:", error);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-2">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t("profile.wizard.personalInfo.name")}
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                readOnly
                className="w-full px-4 py-2 bg-gray-600 border border-gray-600 rounded-lg text-gray-300 placeholder-gray-400 focus:outline-none cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t("profile.wizard.personalInfo.surname")}
              </label>
              <input
                type="text"
                name="surname"
                value={formData.surname}
                readOnly
                className="w-full px-4 py-2 bg-gray-600 border border-gray-600 rounded-lg text-gray-300 placeholder-gray-400 focus:outline-none cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t("profile.wizard.personalInfo.email")}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                readOnly
                className="w-full px-4 py-2 bg-gray-600 border border-gray-600 rounded-lg text-gray-300 placeholder-gray-400 focus:outline-none cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t("profile.wizard.personalInfo.phone")}
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                readOnly
                className="w-full px-4 py-2 bg-gray-600 border border-gray-600 rounded-lg text-gray-300 placeholder-gray-400 focus:outline-none cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t("profile.wizard.personalInfo.country")}
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                readOnly
                className="w-full px-4 py-2 bg-gray-600 border border-gray-600 rounded-lg text-gray-300 placeholder-gray-400 focus:outline-none cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t("profile.personalInfo.region")}
              </label>
              <input
                type="text"
                name="region"
                value={formData.region}
                readOnly
                className="w-full px-4 py-2 bg-gray-600 border border-gray-600 rounded-lg text-gray-300 placeholder-gray-400 focus:outline-none cursor-not-allowed"
              />
            </div>
            <p className="text-sm text-gray-400 italic mt-2 mb-4">
              {t("resumeWizard.profileDataNote")}
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t("profile.wizard.personalInfo.gender")}
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">{t("resumeWizard.selectGender")}</option>
                <option value="male">
                  {t("profile.wizard.personalInfo.genderOptions.male")}
                </option>
                <option value="female">
                  {t("profile.wizard.personalInfo.genderOptions.female")}
                </option>
              </select>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t("profile.wizard.experience.profession")}
              </label>
              <input
                type="text"
                name="profession"
                value={formData.profession}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder={t("resumeWizard.placeholders.profession")}
                maxLength={100}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t("profile.wizard.experience.experience")}
              </label>
              <textarea
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                placeholder={t(
                  "profile.wizard.experience.experiencePlaceholder"
                )}
                maxLength={1000}
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t("profile.wizard.education.level")}
              </label>
              <div className="grid grid-cols-2 gap-4">
                {educationOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleEducationSelect(option)}
                    className={`p-4 rounded-lg border ${
                      formData.education === option
                        ? "border-emerald-500 bg-emerald-500/10 text-white"
                        : "border-gray-600 text-gray-400 hover:border-gray-500"
                    } transition-colors text-left`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t("profile.wizard.education.institution")}
              </label>
              <input
                type="text"
                name="institutionName"
                value={formData.institutionName}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder={t("resumeWizard.placeholders.institution")}
                maxLength={150}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t("profile.wizard.education.graduationYear")}
              </label>
              <input
                type="text"
                name="graduationYear"
                value={formData.graduationYear}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder={t("resumeWizard.placeholders.graduationYear")}
                maxLength={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t("profile.wizard.education.specialization")}
              </label>
              <input
                type="text"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder={t("resumeWizard.placeholders.specialization")}
                maxLength={150}
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t("profile.wizard.skills.skills")}
              </label>
              <SkillSelect
                selectedSkills={formData.skills || ""}
                onChange={(skills) => {
                  setFormData((prev) => ({
                    ...prev,
                    skills: skills,
                  }));
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t("profile.wizard.skills.contacts")}
              </label>
              <textarea
                name="contacts"
                value={formData.contacts}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                placeholder={t("profile.wizard.skills.contactsPlaceholder")}
                maxLength={500}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden"
          >
            <div className="relative p-6 border-b border-gray-700">
              <button
                onClick={onClose}
                className="absolute right-6 top-6 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-bold text-white">
                {t("profile.wizard.title")}
              </h2>
              <p className="text-gray-400 mt-2">
                {t("resumeWizard.stepProgress", { current: step, total: 4 })}
              </p>
              <div className="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${(step / 4) * 100}%` }}
                />
              </div>
            </div>

            <div className="p-6">{renderStep()}</div>

            <div className="p-6 border-t border-gray-700 flex justify-between">
              <button
                onClick={handleBack}
                disabled={step === 1}
                className="px-6 py-2 flex items-center gap-2 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
                {t("profile.wizard.back")}
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors flex items-center gap-2"
              >
                {step === 4
                  ? t("profile.wizard.finish")
                  : t("profile.wizard.next")}
                {step < 4 && <ChevronRight className="w-5 h-5" />}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ResumeWizard;
