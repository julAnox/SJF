"use client";

import type React from "react";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import messagesService from "../../services/messagesService";
import chatsService from "../../services/chatsService";
import applicationsService from "../../services/applicationsService";
import { toast } from "../../utils/toast";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (message: string) => void;
  recipientName: string;
  recipientId: string;
  resumeId?: string;
}

const ContactModal = ({
  isOpen,
  onClose,
  onSubmit,
  recipientName,
  recipientId,
  resumeId,
}: ContactModalProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
      console.log("Starting chat creation process...");
      console.log("User data:", user);
      console.log("Recipient ID:", recipientId);
      console.log("Resume ID:", resumeId);

      if (!user) {
        throw new Error("User is not authenticated. Please log in.");
      }

      // Create application
      console.log("Creating application...");
      const applicationData = {
        user: Number(recipientId),
        job: Number(user.id),
        resume: resumeId ? Number(resumeId) : null,
        cover_letter: message,
        status: "pending",
      };

      console.log("Application data:", applicationData);

      const application = await applicationsService.create(applicationData);
      console.log("Application created:", application);

      // Create chat
      console.log("Creating chat...");
      const chatData = {
        application: application.id,
        status: "active",
      };

      console.log("Chat data:", chatData);

      const chat = await chatsService.create(chatData);
      console.log("Chat created:", chat);

      // Create message
      console.log("Creating message...");
      const messageData = {
        chat: chat.id,
        sender: Number(user.id),
        content: message,
        message_type: "text",
        read: false,
      };

      console.log("Message data:", messageData);

      const createdMessage = await messagesService.create(messageData);
      console.log("Message created:", createdMessage);

      // Call onSubmit callback
      onSubmit(message);

      // Navigate to the chat
      navigate(`/chat/${chat.id}`);

      // Close modal
      onClose();

      toast.success("Message sent successfully!");
    } catch (error) {
      console.error("Error creating chat:", error);

      // Extract and display more detailed error information
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
                Send Message to {recipientName}
              </h2>
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
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Your Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={6}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  placeholder="Write your message here..."
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

export default ContactModal;
