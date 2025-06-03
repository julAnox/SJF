"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, FileText, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { resumesApi } from "../../services/api";
import applicationsService from "../../services/applicationsService";
import chatsService from "../../services/chatsService";
import messagesService from "../../services/messagesService";
import { toast } from "../../utils/toast";

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  companyName: string;
  companyId: string;
}

const ApplicationModal = ({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  companyName,
  companyId,
}: ApplicationModalProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedResume, setSelectedResume] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [resumes, setResumes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitAttempts, setSubmitAttempts] = useState(0);

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
        setError("Failed to load resumes");
      }
    };

    if (isOpen) {
      fetchResumes();
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(selectedResume && coverLetter)) {
      setError("Please select a resume and provide a cover letter");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSubmitAttempts((prev) => prev + 1);

      if (!user) {
        setError("You must be logged in to apply");
        return;
      }

      const applicationData = {
        user: Number.parseInt(user.id),
        job: Number.parseInt(jobId),
        resume: selectedResume ? Number.parseInt(selectedResume) : null,
        cover_letter: coverLetter,
        status: "pending",
      };

      const application = await applicationsService.create(applicationData);

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
          ? `Resume: ${
              resumes.find((r) => r.id === Number.parseInt(selectedResume))
                ?.profession || "My Resume"
            }`
          : "Resume uploaded as document",
        message_type: "resume",
        metadata: selectedResume ? { resumeId: selectedResume } : null,
        read: false,
      };

      await messagesService.create(resumeMessage);

      const coverLetterMessage = {
        chat: chat.id,
        sender: Number.parseInt(user.id),
        content: coverLetter,
        message_type: "coverLetter",
        read: false,
      };

      await messagesService.create(coverLetterMessage);

      toast.success("Application submitted successfully!");

      navigate(`/chat/${chat.id}`);
      onClose();
    } catch (err) {
      console.error("Error submitting application:", err);
      setError("Failed to submit application. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateToProfile = () => {
    navigate("/profile");
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedResume("");
      setCoverLetter("");
      setError(null);
      setSubmitAttempts(0);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">
                Apply for Position
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300">
                  <div className="flex-1">
                    <p className="font-medium">Applying for: {jobTitle}</p>
                    <p className="text-sm text-emerald-300/80">
                      Company: {companyName}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-300">
                  Choose Resume
                </label>

                {/* Profile Resumes */}
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">From Your Profile</p>
                  <div className="grid grid-cols-2 gap-4">
                    {resumes.length > 0 ? (
                      resumes.map((resume) => (
                        <button
                          key={resume.id}
                          type="button"
                          onClick={() => {
                            setSelectedResume(resume.id.toString());
                          }}
                          className={`flex items-center gap-2 p-4 rounded-lg border ${
                            selectedResume === resume.id.toString()
                              ? "border-emerald-500 bg-emerald-500/10"
                              : "border-gray-600 hover:border-gray-500"
                          } transition-colors text-left`}
                        >
                          <FileText className="w-5 h-5 text-emerald-400" />
                          <span className="text-white">
                            {resume.profession || "Resume"}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="col-span-2 p-4 border border-gray-600 border-dashed rounded-lg">
                        <p className="text-gray-400 text-sm text-center mb-3">
                          No resumes found in your profile
                        </p>
                        <button
                          type="button"
                          onClick={handleNavigateToProfile}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                        >
                          Create Resume in Profile
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cover Letter
                </label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  required
                  rows={6}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  placeholder="Write a brief cover letter explaining why you're a good fit for this position..."
                />
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!(selectedResume && coverLetter) || isLoading}
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Application
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ApplicationModal;
