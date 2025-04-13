import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Share2 } from 'lucide-react';

interface ShareContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (chatId: string) => void;
  chats: Array<{ id: string; userName: string; userAvatar: string }>;
}

const ShareContactModal = ({ isOpen, onClose, onShare, chats }: ShareContactModalProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = chats.filter(chat =>
    chat.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">
                {t('chat.share.title')}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="relative mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('chat.share.search')}
                  className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredChats.map(chat => (
                  <button
                    key={chat.id}
                    onClick={() => {
                      onShare(chat.id);
                      onClose();
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <img
                      src={chat.userAvatar}
                      alt={chat.userName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <span className="text-white">{chat.userName}</span>
                    <Share2 className="w-5 h-5 text-gray-400 ml-auto" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ShareContactModal;