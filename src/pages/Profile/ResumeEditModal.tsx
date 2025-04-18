import type React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  X,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Globe,
} from "lucide-react";
import { resumesApi } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import SkillSelect from "../../components/SkillSelect/SkillSelect";

interface ResumeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeId: string | null;
  onComplete: (data: any) => void;
}

interface FormData {
  user: number;
  gender: string;
  profession: string;
  experience: string;
  education: string;
  institutionName: string;
  graduationYear: string;
  specialization: string;
  skills: string;
  contacts: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  country: string;
  region: string;
}

const initialFormData: FormData = {
  user: 0,
  gender: "",
  profession: "",
  experience: "",
  education: "",
  institutionName: "",
  graduationYear: "",
  specialization: "",
  skills: "",
  contacts: "",
  name: "",
  surname: "",
  email: "",
  phone: "",
  country: "",
  region: "",
};

const educationOptions = [
  "High School",
  "Vocational",
  "Incomplete Higher",
  "Higher",
  "Bachelor's",
  "Master's",
  "PhD",
  "Doctor of Sciences",
];

const ResumeEditModal = ({
  isOpen,
  onClose,
  resumeId,
  onComplete,
}: ResumeEditModalProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && resumeId) {
      fetchResumeData();
    }
    if (isOpen && user) {
      setFormData((prev) => ({
        ...prev,
        name: user.first_name || "",
        surname: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
        country: user.country || "",
        region: user.region || "",
      }));
    }
  }, [isOpen, resumeId, user]);

  const fetchResumeData = async () => {
    if (!resumeId) return;

    try {
      setIsLoading(true);
      const resumeData = await resumesApi.getById(resumeId);

      let processedSkills = "";

      if (typeof resumeData.skills === "string") {
        processedSkills = resumeData.skills;
      } else if (resumeData.skills && typeof resumeData.skills === "object") {
        try {
          processedSkills = Object.keys(resumeData.skills).join(",");
        } catch (e) {
          processedSkills = "";
        }
      }

      setFormData((prev) => ({
        ...prev,
        ...resumeData,
        skills: processedSkills,
        name: user?.first_name || prev.name,
        surname: user?.last_name || prev.surname,
        email: user?.email || prev.email,
        phone: user?.phone || prev.phone,
        country: user?.country || prev.country,
        region: user?.region || prev.region,
      }));
    } catch (error) {
      console.error("Error fetching resume data:", error);
      setError("Failed to load resume data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === "graduationYear") {
      newValue = value.replace(/[^0-9]/g, "");
    } else if (name === "phone") {
      newValue = value.replace(/[^0-9+\-()]/g, "");
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleEducationSelect = (education: string) => {
    setFormData((prev) => ({
      ...prev,
      education,
    }));
  };

  const handleNext = () => {
    if (step < 4) {
      setStep((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!resumeId) return;

    try {
      setIsLoading(true);
      const dataToSend = {
        ...formData,
        skills: typeof formData.skills === "string" ? formData.skills : "",
      };

      const response = await resumesApi.update(resumeId, dataToSend);
      onComplete(response);
      onClose();
    } catch (error) {
      console.error("Error updating resume:", error);
      setError("Failed to update resume");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  readOnly
                  className="w-full px-4 py-2 pl-10 bg-gray-600 border border-gray-600 rounded-lg text-gray-300 placeholder-gray-400 focus:outline-none cursor-not-allowed"
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Surname
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="surname"
                  value={formData.surname}
                  readOnly
                  className="w-full px-4 py-2 pl-10 bg-gray-600 border border-gray-600 rounded-lg text-gray-300 placeholder-gray-400 focus:outline-none cursor-not-allowed"
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  readOnly
                  className="w-full px-4 py-2 pl-10 bg-gray-600 border border-gray-600 rounded-lg text-gray-300 placeholder-gray-400 focus:outline-none cursor-not-allowed"
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone
              </label>
              <div className="relative">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  readOnly
                  className="w-full px-4 py-2 pl-10 bg-gray-600 border border-gray-600 rounded-lg text-gray-300 placeholder-gray-400 focus:outline-none cursor-not-allowed"
                />
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Country
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  readOnly
                  className="w-full px-4 py-2 pl-10 bg-gray-600 border border-gray-600 rounded-lg text-gray-300 placeholder-gray-400 focus:outline-none cursor-not-allowed"
                />
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Region
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="region"
                  value={formData.region}
                  readOnly
                  className="w-full px-4 py-2 pl-10 bg-gray-600 border border-gray-600 rounded-lg text-gray-300 placeholder-gray-400 focus:outline-none cursor-not-allowed"
                />
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>

            <p className="text-sm text-gray-400 italic mt-2 mb-4">
              These details were automatically loaded from your profile.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select your gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Profession
              </label>
              <input
                type="text"
                name="profession"
                value={formData.profession}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter your profession"
                maxLength={100}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Experience
              </label>
              <textarea
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                placeholder="Describe your experience"
                maxLength={1000}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Education
              </label>
              <div className="grid grid-cols-2 gap-4">
                {educationOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleEducationSelect(option)}
                    className={`p-4 rounded-lg border ${
                      formData.education === option
                        ? "border-emerald-500 bg-emerald-500/10 text-white"
                        : "border-gray-600 text-gray-400 hover:border-gray-500"
                    } transition-colors text-left`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Institution Name
              </label>
              <input
                type="text"
                name="institutionName"
                value={formData.institutionName}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter institution name"
                maxLength={150}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Graduation Year
              </label>
              <input
                type="text"
                name="graduationYear"
                value={formData.graduationYear}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter graduation year"
                maxLength={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Specialization
              </label>
              <input
                type="text"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter your specialization"
                maxLength={150}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Skills
              </label>
              <SkillSelect
                selectedSkills={formData.skills || ""}
                onChange={(skills) => {
                  setFormData((prev) => ({
                    ...prev,
                    skills: skills,
                  }));
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Additional Contacts
              </label>
              <textarea
                name="contacts"
                value={formData.contacts}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                placeholder="Enter additional contact information"
                maxLength={500}
              />
            </div>
          </div>
        );

      default:
        return null;
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden"
          >
            <div className="relative p-6 border-b border-gray-700">
              <button
                onClick={onClose}
                className="absolute right-6 top-6 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-bold text-white">Edit Resume</h2>
              <p className="text-gray-400 mt-2">Step {step} of 4</p>
              <div className="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${(step / 4) * 100}%` }}
                />
              </div>
            </div>

            {isLoading ? (
              <div className="p-6 flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <p className="text-red-500">{error}</p>
                <button
                  onClick={onClose}
                  className="mt-4 px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="p-6">{renderStep()}</div>

                <div className="p-6 border-t border-gray-700 flex justify-between">
                  <button
                    onClick={handleBack}
                    disabled={step === 1}
                    className="px-6 py-2 flex items-center gap-2 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Back
                  </button>
                  <button
                    onClick={handleNext}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors flex items-center gap-2"
                  >
                    {step === 4 ? "Save" : "Next"}
                    {step < 4 && <ChevronRight className="w-5 h-5" />}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ResumeEditModal;
