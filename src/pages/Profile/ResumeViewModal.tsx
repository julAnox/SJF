"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Briefcase,
  GraduationCap,
  Calendar,
  Code,
  Figma,
  PenTool,
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

    fetchUserData();
  }, [resume]);

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
      return <Figma className="w-4 h-4 text-emerald-400 mr-1" />;
    }

    if (
      designKeywords.some((keyword) => skill.toLowerCase().includes(keyword))
    ) {
      return <PenTool className="w-4 h-4 text-emerald-400 mr-1" />;
    }

    return <Code className="w-4 h-4 text-emerald-400 mr-1" />;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
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
                {resume.profession || t("resumeViewModal.defaultTitle")}
              </h2>
              <p className="text-gray-400 mt-2">
                {t("resumeViewModal.created")}:{" "}
                {new Date(resume.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
                    {t("resumeViewModal.personalInfo.title")}
                  </h3>

                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div>
                      <p className="text-white">
                        {resumeUser?.first_name || ""}{" "}
                        {resumeUser?.last_name || ""}
                      </p>
                      <p className="text-sm text-gray-400">
                        {resume.gender || ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <p className="text-white">
                      {resumeUser?.email || t("resumeViewModal.notSpecified")}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <p className="text-white">
                      {resumeUser?.phone || t("resumeViewModal.notSpecified")}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <p className="text-white">
                      {resumeUser?.country || t("resumeViewModal.notSpecified")}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <p className="text-white">
                      {resumeUser?.region || t("resumeViewModal.notSpecified")}
                    </p>
                  </div>
                </div>

                {/* Education */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
                    {t("resumeViewModal.education.title")}
                  </h3>

                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div>
                      <p className="text-white">
                        {resume.education || t("resumeViewModal.notSpecified")}
                      </p>
                      <p className="text-sm text-gray-400">
                        {resume.specialization ||
                          t("resumeViewModal.notSpecified")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <p className="text-white">
                      {resume.institutionName ||
                        t("resumeViewModal.notSpecified")}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <p className="text-white">
                      {resume.graduationYear ||
                        t("resumeViewModal.notSpecified")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Experience */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2 mb-4">
                  {t("resumeViewModal.experience.title")}
                </h3>
                <p className="text-white whitespace-pre-line">
                  {resume.experience ||
                    t("resumeViewModal.experience.noExperience")}
                </p>
              </div>

              {/* Skills */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2 mb-4">
                  {t("resumeViewModal.skills.title")}
                </h3>
                {renderSkills().length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {renderSkills().map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm flex items-center"
                      >
                        {getSkillIcon(skill)}
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">
                    {t("resumeViewModal.skills.noSkills")}
                  </p>
                )}
              </div>

              {/* Contacts */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2 mb-4">
                  {t("resumeViewModal.contacts.title")}
                </h3>
                <p className="text-white whitespace-pre-line">
                  {resume.contacts || t("resumeViewModal.contacts.noContacts")}
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-700 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
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
