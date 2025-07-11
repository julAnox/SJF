"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { resumesApi } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import ValidatedSkillSelect from "../../components/validated-skill-select";
import { ValidatedInput } from "../../components/validated-input";
import { ValidatedTextarea } from "../../components/validated-textarea";
import { useFieldValidation } from "../../hooks/use-field-validation";

interface ResumeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeId: string | null;
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

const ResumeEditModal = ({
  isOpen,
  onClose,
  resumeId,
  onComplete,
}: ResumeEditModalProps) => {
  const { t } = useTranslation();
  const { validateField } = useFieldValidation();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    if (isOpen && resumeId) {
      fetchResumeData();
    }
    if (isOpen && user) {
      setFormData((prev) => ({
        ...prev,
        name: user.first_name || "",
        surname: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
        country: user.country || "",
        region: user.region || "",
      }));
    }
  }, [isOpen, resumeId, user]);

  const fetchResumeData = async () => {
    if (!resumeId) return;

    try {
      setIsLoading(true);
      const resumeData = await resumesApi.getById(resumeId);

      let processedSkills = "";

      if (typeof resumeData.skills === "string") {
        processedSkills = resumeData.skills;
      } else if (resumeData.skills && typeof resumeData.skills === "object") {
        try {
          processedSkills = Object.keys(resumeData.skills).join(",");
        } catch (e) {
          processedSkills = "";
        }
      }

      setFormData((prev) => ({
        ...prev,
        ...resumeData,
        skills: processedSkills,
        name: user?.first_name || prev.name,
        surname: user?.last_name || prev.surname,
        email: user?.email || prev.email,
        phone: user?.phone || prev.phone,
        country: user?.country || prev.country,
        region: user?.region || prev.region,
      }));
    } catch (error) {
      console.error("Error fetching resume data:", error);
      setError(t("resumeEditModal.errors.failedToLoad"));
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleValidatedFieldChange = (fieldName: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleEducationSelect = (education: string) => {
    setFormData((prev) => ({
      ...prev,
      education,
    }));
  };

  const isCurrentStepValid = () => {
    switch (step) {
      case 2:
        const professionValid = validateField(
          "resume",
          "profession",
          formData.profession
        ).isValid;
        const experienceValid = validateField(
          "resume",
          "experience",
          formData.experience
        ).isValid;
        return professionValid && experienceValid;
      case 3:
        const institutionValid = validateField(
          "resume",
          "institutionName",
          formData.institutionName
        ).isValid;
        const specializationValid = validateField(
          "resume",
          "specialization",
          formData.specialization
        ).isValid;
        return institutionValid && specializationValid;
      case 4:
        const contactsValid = validateField(
          "resume",
          "contacts",
          formData.contacts
        ).isValid;
        const skillsValid = formData.skills.length <= 100;
        return contactsValid && skillsValid;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (step < 4) {
      setStep((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!resumeId) return;

    try {
      setIsLoading(true);
      const dataToSend = {
        ...formData,
        skills: typeof formData.skills === "string" ? formData.skills : "",
      };

      const response = await resumesApi.update(resumeId, dataToSend);
      onComplete(response);
      onClose();
    } catch (error) {
      console.error("Error updating resume:", error);
      setError(t("resumeEditModal.errors.failedToUpdate"));
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                {t("profile.wizard.personalInfo.name")}
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  readOnly
                  className="w-full px-3 py-2 sm:px-4 sm:py-2 pl-8 sm:pl-10 bg-gray-600 border border-gray-600 rounded-lg text-gray-300 placeholder-gray-400 focus:outline-none cursor-not-allowed text-sm sm:text-base"
                />
                <User className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                {t("profile.wizard.personalInfo.surname")}
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="surname"
                  value={formData.surname}
                  readOnly
                  className="w-full px-3 py-2 sm:px-4 sm:py-2 pl-8 sm:pl-10 bg-gray-600 border border-gray-600 rounded-lg text-gray-300 placeholder-gray-400 focus:outline-none cursor-not-allowed text-sm sm:text-base"
                />
                <User className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                {t("profile.wizard.personalInfo.email")}
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  readOnly
                  className="w-full px-3 py-2 sm:px-4 sm:py-2 pl-8 sm:pl-10 bg-gray-600 border border-gray-600 rounded-lg text-gray-300 placeholder-gray-400 focus:outline-none cursor-not-allowed text-sm sm:text-base"
                />
                <Mail className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                {t("profile.wizard.personalInfo.phone")}
              </label>
              <div className="relative">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  readOnly
                  className="w-full px-3 py-2 sm:px-4 sm:py-2 pl-8 sm:pl-10 bg-gray-600 border border-gray-600 rounded-lg text-gray-300 placeholder-gray-400 focus:outline-none cursor-not-allowed text-sm sm:text-base"
                />
                <Phone className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                {t("profile.wizard.personalInfo.country")}
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  readOnly
                  className="w-full px-3 py-2 sm:px-4 sm:py-2 pl-8 sm:pl-10 bg-gray-600 border border-gray-600 rounded-lg text-gray-300 placeholder-gray-400 focus:outline-none cursor-not-allowed text-sm sm:text-base"
                />
                <Globe className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                {t("profile.personalInfo.region")}
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="region"
                  value={formData.region}
                  readOnly
                  className="w-full px-3 py-2 sm:px-4 sm:py-2 pl-8 sm:pl-10 bg-gray-600 border border-gray-600 rounded-lg text-gray-300 placeholder-gray-400 focus:outline-none cursor-not-allowed text-sm sm:text-base"
                />
                <MapPin className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-400 italic mt-1 sm:mt-2 mb-2 sm:mb-4">
              {t("resumeEditModal.profileDataNote")}
            </p>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                {t("profile.wizard.personalInfo.gender")}
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 sm:px-4 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
              >
                <option value="">{t("resumeEditModal.selectGender")}</option>
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
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                {t("profile.wizard.experience.profession")}
              </label>
              <ValidatedInput
                modelName="resume"
                fieldName="profession"
                value={formData.profession}
                onChange={(value) =>
                  handleValidatedFieldChange("profession", value)
                }
                className="w-full px-3 py-2 sm:px-4 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                placeholder={t("resumeEditModal.placeholders.profession")}
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                {t("profile.wizard.experience.experience")}
              </label>
              <ValidatedTextarea
                modelName="resume"
                fieldName="experience"
                value={formData.experience}
                onChange={(value) =>
                  handleValidatedFieldChange("experience", value)
                }
                rows={3}
                className="w-full px-3 py-2 sm:px-4 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none text-sm sm:text-base"
                placeholder={t(
                  "profile.wizard.experience.experiencePlaceholder"
                )}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                {t("profile.wizard.education.level")}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                {educationOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleEducationSelect(option)}
                    className={`p-2 sm:p-4 rounded-lg border text-xs sm:text-sm ${
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
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                {t("profile.wizard.education.institution")}
              </label>
              <ValidatedInput
                modelName="resume"
                fieldName="institutionName"
                value={formData.institutionName}
                onChange={(value) =>
                  handleValidatedFieldChange("institutionName", value)
                }
                className="w-full px-3 py-2 sm:px-4 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                placeholder={t("resumeEditModal.placeholders.institution")}
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                {t("profile.wizard.education.graduationYear")}
              </label>
              <input
                type="text"
                name="graduationYear"
                value={formData.graduationYear}
                onChange={handleChange}
                className="w-full px-3 py-2 sm:px-4 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                placeholder={t("resumeEditModal.placeholders.graduationYear")}
                maxLength={4}
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                {t("profile.wizard.education.specialization")}
              </label>
              <ValidatedInput
                modelName="resume"
                fieldName="specialization"
                value={formData.specialization}
                onChange={(value) =>
                  handleValidatedFieldChange("specialization", value)
                }
                className="w-full px-3 py-2 sm:px-4 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                placeholder={t("resumeEditModal.placeholders.specialization")}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                {t("profile.wizard.skills.skills")}
              </label>
              <ValidatedSkillSelect
                selectedSkills={formData.skills || ""}
                onChange={(skills) => {
                  setFormData((prev) => ({
                    ...prev,
                    skills: skills,
                  }));
                }}
                maxSkillLength={15}
                maxTotalLength={100}
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                {t("resumeEditModal.additionalContacts")}
              </label>
              <ValidatedTextarea
                modelName="resume"
                fieldName="contacts"
                value={formData.contacts}
                onChange={(value) =>
                  handleValidatedFieldChange("contacts", value)
                }
                rows={3}
                className="w-full px-3 py-2 sm:px-4 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none text-sm sm:text-base"
                placeholder={t("resumeEditModal.placeholders.contacts")}
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
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-800 rounded-xl shadow-xl w-full max-w-sm sm:max-w-2xl overflow-hidden"
          >
            <div className="relative p-3 sm:p-6 border-b border-gray-700">
              <button
                onClick={onClose}
                className="absolute right-3 top-3 sm:right-6 sm:top-6 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <h2 className="text-lg sm:text-2xl font-bold text-white pr-8">
                {t("resumeEditModal.title")}
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-1 sm:mt-2">
                {t("resumeEditModal.stepProgress", { current: step, total: 4 })}
              </p>
              <div className="mt-2 sm:mt-4 h-1.5 sm:h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${(step / 4) * 100}%` }}
                />
              </div>
            </div>

            {isLoading ? (
              <div className="p-3 sm:p-6 flex justify-center items-center h-40 sm:h-64">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 border-emerald-500"></div>
              </div>
            ) : error ? (
              <div className="p-3 sm:p-6 text-center">
                <p className="text-red-500 text-sm sm:text-base">{error}</p>
                <button
                  onClick={onClose}
                  className="mt-3 sm:mt-4 px-4 py-2 sm:px-6 sm:py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base"
                >
                  {t("resumeEditModal.close")}
                </button>
              </div>
            ) : (
              <>
                <div className="p-3 sm:p-6 max-h-[60vh] sm:max-h-none overflow-y-auto">
                  {renderStep()}
                </div>

                <div className="p-3 sm:p-6 border-t border-gray-700 flex justify-between">
                  <button
                    onClick={handleBack}
                    disabled={step === 1}
                    className="px-3 py-1.5 sm:px-6 sm:py-2 flex items-center gap-1 sm:gap-2 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    {t("profile.wizard.back")}
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!isCurrentStepValid()}
                    className="px-3 py-1.5 sm:px-6 sm:py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors flex items-center gap-1 sm:gap-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {step === 4
                      ? t("resumeEditModal.save")
                      : t("profile.wizard.next")}
                    {step < 4 && (
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ResumeEditModal;
