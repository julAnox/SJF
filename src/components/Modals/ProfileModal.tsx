import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MapPin,
  Briefcase,
  GraduationCap,
  Languages,
  Banknote,
  Clock,
  Mail,
  Phone,
  Globe,
  Linkedin,
  Github
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  resume: any;
}

const ProfileModal = ({ isOpen, onClose, resume }: ProfileModalProps) => {
  const { t } = useTranslation();

  const formatSalary = (value: number) => {
    return new Intl.NumberFormat('ru-RU').format(value);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">Profile Details</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Header Section */}
              <div className="flex gap-6 mb-8">
                <img
                  src={resume.photo}
                  alt={resume.name}
                  className="w-32 h-32 rounded-lg object-cover"
                />
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">{resume.name}</h1>
                  <p className="text-xl text-emerald-400 mb-4">{resume.title}</p>
                  <div className="flex items-center gap-2 text-gray-400">
                    <MapPin className="w-5 h-5" />
                    <span>{resume.location.city} • {resume.location.metro}</span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-3 text-gray-400">
                  <Mail className="w-5 h-5" />
                  <span>email@example.com</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <Phone className="w-5 h-5" />
                  <span>+1 234 567 890</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <Globe className="w-5 h-5" />
                  <span>portfolio.com</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <Linkedin className="w-5 h-5" />
                  <span>linkedin.com/in/profile</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <Github className="w-5 h-5" />
                  <span>github.com/profile</span>
                </div>
              </div>

              {/* Skills */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-4">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {resume.skills.map((skill: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-4">Languages</h3>
                <div className="grid grid-cols-2 gap-4">
                  {resume.languages.map((language: string, index: number) => (
                    <div key={index} className="flex items-center justify-between text-gray-400">
                      <span>{language.split(' (')[0]}</span>
                      <span className="text-emerald-400">{language.split(' (')[1].replace(')', '')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Experience */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-4">Experience</h3>
                <div className="space-y-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">{resume.experience.current}</h4>
                    <p className="text-gray-400">Current Position</p>
                  </div>
                  {resume.experience.previous.map((position: string, index: number) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2">{position}</h4>
                      <p className="text-gray-400">Previous Position</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-4">Education</h3>
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">{resume.education.degree}</h4>
                  <p className="text-gray-400">{resume.education.university}</p>
                  <p className="text-gray-400">Graduated: {resume.education.graduationYear}</p>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Additional Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Briefcase className="w-5 h-5" />
                    <span>{resume.experience.years} years experience</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Banknote className="w-5 h-5" />
                    <span>Expected: ₽{formatSalary(resume.salary.expected)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="w-5 h-5" />
                    <span>{resume.availability}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProfileModal;