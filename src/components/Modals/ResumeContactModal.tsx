"use client";

import type React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, AlertCircle, User, Briefcase } from "lucide-react";
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
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        throw new Error("User is not authenticated. Please log in.");
      }

      if (user.role !== "company") {
        throw new Error("Only companies can contact students about resumes.");
      }

      // Get the company for the current user
      const companies = await companiesApi.getAll();
      const userCompany = companies.find(
        (c) => c.user === Number.parseInt(user.id)
      );

      if (!userCompany) {
        throw new Error(
          "No company profile found. Please create a company profile first."
        );
      }

      console.log("Found company:", userCompany);

      // Check if there's an existing chat between this company and student
      const existingChats = await chatsService.getAll();
      let existingChat = null;

      // Look for any chat that connects this company and student
      for (const chat of existingChats) {
        if (chat.application) {
          // Check job application chats
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
          // Check resume application chats
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
        // Step 1: Create resume application
        const resumeApplication = await resumeApplicationsService.create({
          resume: resume.id,
          company: userCompany.id,
          message: message.trim(),
          status: "pending",
        });

        console.log("Created resume application:", resumeApplication);

        // Step 2: Create chat linked to the resume application
        const chat = await chatsService.create({
          resume_application: resumeApplication.id,
          status: "active",
        });

        console.log("Created chat:", chat);
        chatId = chat.id;
      }

      // Step 3: Create the initial message from the company
      const messageData = await messagesService.create({
        chat: chatId,
        sender: Number.parseInt(user.id),
        content: message.trim(),
        message_type: "text",
        read: false,
      });

      console.log("Created message:", messageData);

      // Add a small delay to ensure the message is processed
      await new Promise((resolve) => setTimeout(resolve, 500));

      toast.success("Message sent successfully!");

      // Force refresh the chat list in the Chat component
      const event = new CustomEvent("chatCreated", {
        detail: { chatId: chatId.toString() },
      });
      window.dispatchEvent(event);

      onSuccess(chatId.toString());
      onClose();
      setMessage("");
    } catch (error) {
      console.error("Error creating resume contact:", error);

      let errorMessage = "Failed to send message. Please try again.";
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

  const generateSampleMessage = () => {
    const sampleMessage = `Hello ${resumeUser?.first_name || "there"},

I came across your resume for ${
      resume?.profession || "your profession"
    } and I'm impressed with your background. 

We have an exciting opportunity at our company that might be a great fit for your skills and experience. I'd love to discuss this further with you.

Would you be interested in learning more about this position?

Best regards`;

    setMessage(sampleMessage);
  };

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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Contact {resumeUser?.first_name || "Student"}
                  </h2>
                  <p className="text-sm text-gray-400 flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {resume?.profession || "Resume"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {errorDetails && (
              <div className="p-4 bg-red-900/30 border border-red-700 m-6 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-red-400">
                      Error Details (for debugging)
                    </h3>
                    <pre className="mt-2 text-xs text-red-300 overflow-auto max-h-40 p-2 bg-black/20 rounded">
                      {errorDetails}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Your Message
                  </label>
                  <button
                    type="button"
                    onClick={generateSampleMessage}
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Use sample message
                  </button>
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={8}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  placeholder="Write your message to the student here..."
                />
                <p className="text-xs text-gray-400 mt-1">
                  This message will start a new conversation with the student.
                </p>
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
                  disabled={!message.trim() || isSubmitting}
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Send Message
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ResumeContactModal;
