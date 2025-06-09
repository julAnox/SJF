"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  Mail,
  Phone,
  Globe,
  Briefcase,
  GraduationCap,
  Calendar,
  Code,
  Figma,
  PenTool,
  Loader2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext";
import { usersApi } from "../../services/api";
import { useState, useEffect } from "react";

interface ResumeViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  resume: any;
}

const ResumeViewModal = ({ isOpen, onClose, resume }: ResumeViewModalProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [resumeUser, setResumeUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (resume && resume.user) {
        try {
          setIsLoading(true);
          const userData = await usersApi.getById(resume.user);
          setResumeUser(userData);
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (isOpen) {
      fetchUserData();
    }
  }, [resume, isOpen]);

  if (!resume) return null;

  const renderSkills = () => {
    if (!resume.skills) return [];

    if (typeof resume.skills === "string") {
      return resume.skills
        .split(",")
        .filter((skill: string) => skill.trim() !== "")
        .map((skill: string) => skill.trim());
    } else if (typeof resume.skills === "object") {
      try {
        return Object.keys(resume.skills).filter((key) => key.trim() !== "");
      } catch (e) {
        return [];
      }
    }

    return [];
  };

  const getSkillIcon = (skill: string) => {
    const designTools = ["figma", "sketch", "photoshop", "illustrator", "xd"];
    const designKeywords = ["design", "ui", "ux", "graphic"];

    if (designTools.some((tool) => skill.toLowerCase().includes(tool))) {
      return (
        <Figma className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400 mr-1 flex-shrink-0" />
      );
    }

    if (
      designKeywords.some((keyword) => skill.toLowerCase().includes(keyword))
    ) {
      return (
        <PenTool className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400 mr-1 flex-shrink-0" />
      );
    }

    return (
      <Code className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400 mr-1 flex-shrink-0" />
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-800 rounded-xl shadow-xl w-full max-w-sm sm:max-w-2xl lg:max-w-4xl overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="relative p-3 sm:p-6 border-b border-gray-700 bg-gradient-to-r from-emerald-600/10 to-blue-600/10">
              <button
                onClick={onClose}
                className="absolute right-3 top-3 sm:right-6 sm:top-6 text-gray-400 hover:text-white transition-colors z-10"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <div className="pr-8 sm:pr-0">
                <h2 className="text-lg sm:text-2xl font-bold text-white">
                  {resume.profession || t("resumeViewModal.defaultTitle")}
                </h2>
                <p className="text-sm sm:text-base text-gray-400 mt-1 sm:mt-2">
                  {t("resumeViewModal.created")}:{" "}
                  {new Date(resume.created_at).toLocaleDateString()}
                </p>
                {resumeUser && (
                  <p className="text-sm sm:text-base text-emerald-400 mt-1">
                    {resumeUser.first_name} {resumeUser.last_name}
                  </p>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-3 sm:p-6">
              {isLoading ? (
                <div className="flex justify-center items-center py-8 sm:py-12">
                  <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {/* Personal Information & Education Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Personal Information */}
                    <div className="space-y-3 sm:space-y-4">
                      <h3 className="text-base sm:text-lg font-semibold text-white border-b border-gray-700 pb-2 flex items-center gap-2">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                        {t("resumeViewModal.personalInfo.title")}
                      </h3>

                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-700/50 rounded-lg">
                          <User className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm sm:text-base text-white font-medium">
                              {resumeUser?.first_name || ""}{" "}
                              {resumeUser?.last_name || ""}
                            </p>
                            {resume.gender && (
                              <p className="text-xs sm:text-sm text-gray-400">
                                {resume.gender}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-700/50 rounded-lg">
                          <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0" />
                          <p className="text-sm sm:text-base text-white break-all">
                            {resumeUser?.email ||
                              t("resumeViewModal.notSpecified")}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-700/50 rounded-lg">
                          <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0" />
                          <p className="text-sm sm:text-base text-white">
                            {resumeUser?.phone ||
                              t("resumeViewModal.notSpecified")}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-700/50 rounded-lg">
                          <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm sm:text-base text-white">
                              {resumeUser?.country ||
                                t("resumeViewModal.notSpecified")}
                            </p>
                            {resumeUser?.region && (
                              <p className="text-xs sm:text-sm text-gray-400">
                                {resumeUser.region}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Education */}
                    <div className="space-y-3 sm:space-y-4">
                      <h3 className="text-base sm:text-lg font-semibold text-white border-b border-gray-700 pb-2 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                        {t("resumeViewModal.education.title")}
                      </h3>

                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-700/50 rounded-lg">
                          <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm sm:text-base text-white font-medium">
                              {resume.education ||
                                t("resumeViewModal.notSpecified")}
                            </p>
                            {resume.specialization && (
                              <p className="text-xs sm:text-sm text-gray-400">
                                {resume.specialization}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-700/50 rounded-lg">
                          <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0" />
                          <p className="text-sm sm:text-base text-white">
                            {resume.institutionName ||
                              t("resumeViewModal.notSpecified")}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-700/50 rounded-lg">
                          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0" />
                          <p className="text-sm sm:text-base text-white">
                            {resume.graduationYear ||
                              t("resumeViewModal.notSpecified")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Experience */}
                  <div className="bg-gray-700/30 rounded-lg p-3 sm:p-4">
                    <h3 className="text-base sm:text-lg font-semibold text-white border-b border-gray-600 pb-2 mb-3 sm:mb-4 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                      {t("resumeViewModal.experience.title")}
                    </h3>
                    <div className="prose prose-sm sm:prose-base prose-invert max-w-none">
                      <p className="text-sm sm:text-base text-white whitespace-pre-line leading-relaxed">
                        {resume.experience ||
                          t("resumeViewModal.experience.noExperience")}
                      </p>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="bg-gray-700/30 rounded-lg p-3 sm:p-4">
                    <h3 className="text-base sm:text-lg font-semibold text-white border-b border-gray-600 pb-2 mb-3 sm:mb-4 flex items-center gap-2">
                      <Code className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                      {t("resumeViewModal.skills.title")}
                    </h3>
                    {renderSkills().length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {renderSkills().map((skill: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 sm:px-3 sm:py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs sm:text-sm flex items-center border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
                          >
                            {getSkillIcon(skill)}
                            <span className="truncate max-w-[120px] sm:max-w-none">
                              {skill}
                            </span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm sm:text-base text-gray-400 italic">
                        {t("resumeViewModal.skills.noSkills")}
                      </p>
                    )}
                  </div>

                  {/* Contacts */}
                  {resume.contacts && (
                    <div className="bg-gray-700/30 rounded-lg p-3 sm:p-4">
                      <h3 className="text-base sm:text-lg font-semibold text-white border-b border-gray-600 pb-2 mb-3 sm:mb-4 flex items-center gap-2">
                        <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                        {t("resumeViewModal.contacts.title")}
                      </h3>
                      <div className="prose prose-sm sm:prose-base prose-invert max-w-none">
                        <p className="text-sm sm:text-base text-white whitespace-pre-line leading-relaxed">
                          {resume.contacts ||
                            t("resumeViewModal.contacts.noContacts")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 sm:p-6 border-t border-gray-700 bg-gray-800/50 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 sm:px-6 sm:py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base font-medium"
              >
                {t("resumeViewModal.close")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ResumeViewModal;
