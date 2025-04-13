import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, GavelIcon, X, Briefcase, Building2, GraduationCap, Rocket } from 'lucide-react';

interface AuctionNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuctionNotificationModal = ({ isOpen, onClose }: AuctionNotificationModalProps) => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(30); // Reset countdown when modal closes
      return;
    }
    
    let timer: NodeJS.Timeout;
    if (isOpen && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      navigate('/auction');
      onClose();
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown, isOpen, navigate, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-700"
          >
            <div className="relative p-8 flex flex-col items-center">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-center gap-2 mb-6"
              >
                <Briefcase className="w-8 h-8 text-emerald-400" />
                <Building2 className="w-8 h-8 text-blue-400" />
                <GraduationCap className="w-8 h-8 text-purple-400" />
                <Rocket className="w-8 h-8 text-amber-400" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-white mb-4 text-center"
              >
                Talent Auction Starting Soon!
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-300 text-center mb-8"
              >
                Congratulations! You've applied to 3 positions. Companies will now compete for your talent in a live auction.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-4 text-5xl font-mono font-bold text-emerald-400 mb-8 bg-emerald-900/20 px-8 py-4 rounded-xl"
              >
                <Timer className="w-10 h-10" />
                <span>{countdown}s</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex gap-4"
              >
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    navigate('/auction');
                    onClose();
                  }}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors flex items-center gap-2"
                >
                  <GavelIcon className="w-5 h-5" />
                  Go to Auction
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuctionNotificationModal;