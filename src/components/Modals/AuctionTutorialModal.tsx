import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  Percent,
  Package,
  Award,
  ChevronRight,
  ChevronLeft,
  X
} from 'lucide-react';

interface AuctionTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const tutorialSteps = [
  {
    title: 'Welcome to Talent Auction',
    description: 'Companies will compete for your talent through a 4-stage bidding process. Each stage focuses on a different aspect of the job offer.',
    icon: <Award className="w-12 h-12 text-emerald-400" />
  },
  {
    title: 'Stage 1: Salary Bidding',
    description: 'Companies will bid on your base salary. Each company has 10 seconds to make their offer, and the highest bid sets the bar for the next company.',
    icon: <DollarSign className="w-12 h-12 text-emerald-400" />
  },
  {
    title: 'Stage 2: Equity Offering',
    description: 'Companies will offer equity percentages in their organization. This represents your ownership stake in the company.',
    icon: <Percent className="w-12 h-12 text-blue-400" />
  },
  {
    title: 'Stage 3: Benefits Package',
    description: 'Companies will compete on benefits packages, including health insurance, vacation days, professional development, and other perks.',
    icon: <Package className="w-12 h-12 text-purple-400" />
  },
  {
    title: 'Stage 4: Position Level',
    description: 'Finally, companies will bid on your position level, from Junior to Head of Department, affecting your role and responsibilities.',
    icon: <Award className="w-12 h-12 text-amber-400" />
  }
];

const AuctionTutorialModal = ({ isOpen, onClose }: AuctionTutorialModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-700"
          >
            <div className="relative p-8">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex items-center justify-center mb-8">
                <div className="flex space-x-2">
                  {tutorialSteps.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentStep ? 'bg-emerald-500' : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center"
              >
                <div className="flex items-center justify-center w-24 h-24 mx-auto bg-gray-700 rounded-full mb-6">
                  {tutorialSteps[currentStep].icon}
                </div>

                <h2 className="text-2xl font-bold text-white mb-4">
                  {tutorialSteps[currentStep].title}
                </h2>

                <p className="text-gray-300 text-lg leading-relaxed mb-8">
                  {tutorialSteps[currentStep].description}
                </p>

                <div className="flex justify-between items-center">
                  <button
                    onClick={handlePrevious}
                    className={`px-6 py-3 rounded-lg flex items-center gap-2 transition-colors ${
                      currentStep === 0
                        ? 'text-gray-500 cursor-not-allowed'
                        : 'text-white hover:bg-gray-700'
                    }`}
                    disabled={currentStep === 0}
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Previous
                  </button>

                  <button
                    onClick={handleNext}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors flex items-center gap-2"
                  >
                    {currentStep === tutorialSteps.length - 1 ? (
                      'Start Auction'
                    ) : (
                      <>
                        Next
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuctionTutorialModal;