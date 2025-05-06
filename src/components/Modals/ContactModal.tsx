import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (message: string) => void;
  recipientName: string;
  recipientId: string;
}

const ContactModal = ({
  isOpen,
  onClose,
  onSubmit,
  recipientName,
  recipientId,
}: ContactModalProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const chats = JSON.parse(localStorage.getItem("chats") || "{}");
    const chatId = `chat_${Date.now()}`;

    const newChat = {
      id: chatId,
      companyId: recipientId,
      companyName: recipientName,
      messages: [
        {
          id: Date.now().toString(),
          senderId: "currentUser",
          type: "text",
          content: message,
          timestamp: new Date().toISOString(),
        },
      ],
      lastMessage: message,
      timestamp: new Date().toISOString(),
      status: "active",
    };

    chats[chatId] = newChat;
    localStorage.setItem("chats", JSON.stringify(chats));

    onSubmit(message);

    navigate(`/chat/${chatId}`);
    onClose();
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
                  disabled={!message.trim()}
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
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
