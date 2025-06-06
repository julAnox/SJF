"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext";
import { resumesApi } from "../../services/api";
import applicationsService from "../../services/applicationsService";
import chatsService from "../../services/chatsService";
import messagesService from "../../services/messagesService";

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  companyName: string;
  companyId: string;
  onApplicationSubmitted?: () => void;
}

const ApplicationModal = ({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  companyName,
  companyId,
  onApplicationSubmitted,
}: ApplicationModalProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [selectedResume, setSelectedResume] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [resumes, setResumes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        if (!user) return;

        const allResumes = await resumesApi.getAll();
        const userResumes = allResumes.filter(
          (resume: any) => resume.user === Number.parseInt(user.id)
        );
        setResumes(userResumes);
      } catch (err) {
        console.error("Error fetching resumes:", err);
        setError(t("applications.modal.errors.failedToLoadResumes"));
      }
    };

    if (isOpen) {
      fetchResumes();
    }
  }, [isOpen, user, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(selectedResume && coverLetter.trim())) {
      setError(t("applications.modal.errors.selectResumeAndCoverLetter"));
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      if (!user) {
        setError(t("applications.modal.errors.mustBeLoggedIn"));
        return;
      }

      console.log("Submitting application...");

      const applicationData = {
        user: Number.parseInt(user.id),
        job: Number.parseInt(jobId),
        resume: selectedResume ? Number.parseInt(selectedResume) : null,
        cover_letter: coverLetter.trim(),
        status: "pending",
      };

      console.log("Creating application:", applicationData);
      const application = await applicationsService.create(applicationData);
      console.log("Application created:", application);

      if (!application || !application.id) {
        throw new Error("Failed to create application");
      }

      const chatData = {
        application: application.id,
        status: "active",
      };

      const chat = await chatsService.create(chatData);

      if (!chat || !chat.id) {
        throw new Error("Failed to create chat");
      }

      const resumeMessage = {
        chat: chat.id,
        sender: Number.parseInt(user.id),
        content: selectedResume
          ? `${t("applications.modal.resumeLabel")}: ${
              resumes.find((r) => r.id === Number.parseInt(selectedResume))
                ?.profession || t("applications.modal.myResume")
            }`
          : t("applications.modal.resumeUploadedAsDocument"),
        message_type: "resume",
        metadata: selectedResume ? { resumeId: selectedResume } : null,
        read: false,
      };

      await messagesService.create(resumeMessage);

      const coverLetterMessage = {
        chat: chat.id,
        sender: Number.parseInt(user.id),
        content: coverLetter.trim(),
        message_type: "coverLetter",
        read: false,
      };

      await messagesService.create(coverLetterMessage);

      setIsSubmitted(true);

      if (onApplicationSubmitted) {
        onApplicationSubmitted();
      }

      console.log("Application submitted successfully!");

      setTimeout(() => {
        navigate(`/chat/${chat.id}`);
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Error submitting application:", err);
      setError(t("applications.modal.errors.failedToSubmit"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateToProfile = () => {
    navigate("/profile");
    onClose();
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedResume("");
      setCoverLetter("");
      setError(null);
      setIsSubmitted(false);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">
                {t("applications.modal.title")}
              </h2>
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {isSubmitted ? (
              <div className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {t("applications.modal.success.title")}
                </h3>
                <p className="text-gray-400 mb-4">
                  {t("applications.modal.success.description", { companyName })}
                </p>
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-300 flex items-center gap-2"
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300">
                    <div className="flex-1">
                      <p className="font-medium text-lg">{jobTitle}</p>
                      <p className="text-sm text-emerald-300/80">
                        {companyName}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-300">
                    {t("applications.modal.selectResume")} *
                  </label>

                  <div className="space-y-3">
                    {resumes.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3">
                        {resumes.map((resume) => (
                          <button
                            key={resume.id}
                            type="button"
                            onClick={() => {
                              setSelectedResume(resume.id.toString());
                            }}
                            className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                              selectedResume === resume.id.toString()
                                ? "border-emerald-500 bg-emerald-500/10 shadow-lg"
                                : "border-gray-600 hover:border-gray-500 hover:bg-gray-700/50"
                            } text-left`}
                          >
                            <FileText className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-white font-medium">
                                {resume.profession ||
                                  t("applications.modal.resumeDefaultTitle")}
                              </p>
                              {resume.experience && (
                                <p className="text-gray-400 text-sm">
                                  {t("applications.modal.yearsExperience", {
                                    years: resume.experience,
                                  })}
                                </p>
                              )}
                            </div>
                            {selectedResume === resume.id.toString() && (
                              <CheckCircle className="w-5 h-5 text-emerald-400" />
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 border border-gray-600 border-dashed rounded-lg text-center">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-400 mb-4">
                          {t("applications.modal.noResumesFound")}
                        </p>
                        <button
                          type="button"
                          onClick={handleNavigateToProfile}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                        >
                          {t("applications.modal.createResumeInProfile")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t("applications.modal.coverLetter")} *
                  </label>
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    required
                    rows={6}
                    maxLength={1000}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    placeholder={t("applications.modal.coverLetterPlaceholder")}
                  />
                  <div className="flex justify-between mt-2">
                    <p className="text-gray-500 text-sm">
                      {t("applications.modal.coverLetterHint")}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {coverLetter.length}/1000
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="px-6 py-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
                  >
                    {t("applications.modal.cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={
                      !(selectedResume && coverLetter.trim()) || isLoading
                    }
                    className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {t("applications.modal.submitting")}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        {t("applications.modal.submit")}
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ApplicationModal;
