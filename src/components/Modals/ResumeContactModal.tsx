"use client";

import type React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, AlertCircle, Briefcase, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext";
import { resumeApplicationsService } from "../../services/resumeApplicationsService";
import { companiesApi } from "../../services/api";
import chatsService from "../../services/chatsService";
import messagesService from "../../services/messagesService";
import { toast } from "../../utils/toast";

interface ResumeContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (chatId: string) => void;
  resume: any;
  resumeUser: any;
}

const ResumeContactModal = ({
  isOpen,
  onClose,
  onSuccess,
  resume,
  resumeUser,
}: ResumeContactModalProps) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorDetails(null);

    try {
      console.log("Starting resume contact process...");
      console.log("Current user:", user);
      console.log("Resume:", resume);
      console.log("Resume user:", resumeUser);

      if (!user) {
        throw new Error(t("resumeContact.errors.notAuthenticated"));
      }

      if (user.role !== "company") {
        throw new Error(t("resumeContact.errors.onlyCompanies"));
      }

      const companies = await companiesApi.getAll();
      const userCompany = companies.find(
        (c) => c.user === Number.parseInt(user.id)
      );

      if (!userCompany) {
        throw new Error(t("resumeContact.errors.noCompanyProfile"));
      }

      console.log("Found company:", userCompany);

      const existingChats = await chatsService.getAll();
      let existingChat = null;

      for (const chat of existingChats) {
        if (chat.application) {
          try {
            const application = await fetch(
              `${chatsService.getBaseUrl()}/job_applications/${
                chat.application
              }/`
            ).then((res) => res.json());
            if (
              application.user === resume.user &&
              application.company === userCompany.id
            ) {
              existingChat = chat;
              break;
            }
          } catch (error) {
            console.log("Error checking job application:", error);
          }
        } else if (chat.resume_application) {
          try {
            const resumeApp = await fetch(
              `${chatsService.getBaseUrl()}/resume_applications/${
                chat.resume_application
              }/`
            ).then((res) => res.json());
            if (
              resumeApp.resume === resume.id &&
              resumeApp.company === userCompany.id
            ) {
              existingChat = chat;
              break;
            }
          } catch (error) {
            console.log("Error checking resume application:", error);
          }
        }
      }

      let chatId;

      if (existingChat) {
        console.log("Found existing chat:", existingChat);
        chatId = existingChat.id;
      } else {
        const resumeApplication = await resumeApplicationsService.create({
          resume: resume.id,
          company: userCompany.id,
          message: message.trim(),
          status: "pending",
        });

        console.log("Created resume application:", resumeApplication);

        const chat = await chatsService.create({
          resume_application: resumeApplication.id,
          status: "active",
        });

        console.log("Created chat:", chat);
        chatId = chat.id;
      }

      const actualMessage = await messagesService.create({
        chat: chatId,
        sender: Number.parseInt(user.id),
        content: message.trim(),
        message_type: "text",
        read: false,
      });

      console.log("Created actual message:", actualMessage);

      setIsSubmitted(true);

      toast.success(t("resumeContact.success.messageSent"));

      const event = new CustomEvent("chatCreated", {
        detail: { chatId: chatId.toString() },
      });
      window.dispatchEvent(event);

      setTimeout(() => {
        onSuccess(chatId.toString());
        onClose();
        setMessage("");
        setIsSubmitted(false);
      }, 1500);
    } catch (error) {
      console.error("Error creating resume contact:", error);

      let errorMessage = t("resumeContact.errors.failedToSend");
      let details = "";

      if (error instanceof Error) {
        errorMessage = error.message;
        details = JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
      } else if (typeof error === "object" && error !== null) {
        details = JSON.stringify(error, null, 2);
      }

      setErrorDetails(details);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setTimeout(() => {
        setMessage("");
        setIsSubmitted(false);
        setErrorDetails(null);
      }, 300);
    }
  };

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
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700">
                  {resumeUser?.avatar ? (
                    <img
                      src={resumeUser.avatar || "/placeholder.svg"}
                      alt={`${resumeUser.first_name} ${resumeUser.last_name}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://ui-avatars.com/api/?name=${
                          resumeUser?.first_name?.charAt(0) || "U"
                        }&background=10B981&color=fff`;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                      {resumeUser?.first_name?.charAt(0) || "U"}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {t("resumeContact.title", {
                      firstName:
                        resumeUser?.first_name ||
                        t("resumeContact.defaultStudent"),
                      lastName: resumeUser?.last_name || "",
                    })}
                  </h2>
                  <p className="text-sm text-gray-400 flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {resume?.profession || t("resumeContact.defaultResume")}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
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
                  {t("resumeContact.success.title")}
                </h3>
                <p className="text-gray-400 mb-4">
                  {t("resumeContact.success.description", {
                    firstName:
                      resumeUser?.first_name ||
                      t("resumeContact.defaultStudent"),
                  })}
                </p>
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : (
              <>
                {errorDetails && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-900/30 border border-red-700 m-6 rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-red-400">
                          {t("resumeContact.errorDetails")}
                        </h3>
                        <pre className="mt-2 text-xs text-red-300 overflow-auto max-h-40 p-2 bg-black/20 rounded">
                          {errorDetails}
                        </pre>
                      </div>
                    </div>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="p-6">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t("resumeContact.messageLabel")}
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      rows={8}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                      placeholder={t("resumeContact.messagePlaceholder")}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {t("resumeContact.messageHint")}
                    </p>
                  </div>

                  <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isSubmitting}
                      className="px-6 py-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
                    >
                      {t("resumeContact.cancel")}
                    </button>
                    <button
                      type="submit"
                      disabled={!message.trim() || isSubmitting}
                      className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          {t("resumeContact.sending")}
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          {t("resumeContact.sendMessage")}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ResumeContactModal;
