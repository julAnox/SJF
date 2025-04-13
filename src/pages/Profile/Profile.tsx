import type React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Globe,
  Camera,
  Save,
  Loader2,
  FileText,
  Plus,
  Building2,
  ChevronDown,
  ChevronUp,
  Briefcase,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import ResumeWizard from "./ResumeWizard";
import CompanyForm, { CompanyFormData } from "./CompanyForm";
import JobForm from "./JobForm";
import { companiesApi } from "../../api/companies";

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string;
  phone: string;
  country: string;
  region: string;
  district: string;
  publish_phone: boolean;
  publish_status: boolean;
  role: string;
  avatar: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    updateProfile,
    isLoading: authLoading,
  } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showResumeWizard, setShowResumeWizard] = useState(false);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    email: "",
    date_of_birth: "",
    phone: "",
    country: "",
    region: "",
    district: "",
    publish_phone: false,
    publish_status: false,
    role: "student",
    avatar: "",
  });
  const [companyData, setCompanyData] = useState<CompanyFormData | null>(null);
  const [jobs, setJobs] = useState([]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      navigate("/login");
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Initialize form data with user data
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        date_of_birth: user.date_of_birth || "",
        phone: user.phone || "",
        country: user.country || "",
        region: user.region || "",
        district: user.district || "",
        publish_phone: user.publish_phone || false,
        publish_status: user.publish_status || false,
        role: user.role || "student",
        avatar: user.avatar || "",
      });

      // Fetch company data if user is a company
      if (user.role === "company") {
        fetchCompanyData();
      }
    }
  }, [user]);

  // Fetch company data
  const fetchCompanyData = async () => {
    try {
      setIsLoading(true);
      const response = await companiesApi.getAll();
      const userCompany = response.find(
        (company: any) => company.user === parseInt(user?.id || "0")
      );

      if (userCompany) {
        setCompanyData({
          name: userCompany.name,
          logo: userCompany.logo,
          description: userCompany.description,
          website: userCompany.website,
          industry: userCompany.industry,
          size: userCompany.size,
          founded_year: userCompany.founded_year,
          status: userCompany.status,
        });
      }
    } catch (error) {
      console.error("Error fetching company data:", error);
      setNotification({
        type: "error",
        message: "Failed to load company data",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateProfile(formData);
      setNotification({
        type: "success",
        message: "Profile updated successfully!",
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setNotification({
        type: "error",
        message: "Failed to update profile. Please try again.",
      });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle company form submission
  const handleCompanySubmit = async (data: CompanyFormData) => {
    try {
      setIsLoading(true);
      await companiesApi.create({
        ...data,
        user: parseInt(user?.id || "0"),
      });

      setCompanyData(data);
      setNotification({
        type: "success",
        message: "Company details saved successfully!",
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error("Error saving company data:", error);
      setNotification({
        type: "error",
        message: "Failed to save company details. Please try again.",
      });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle job form submission
  const handleJobSubmit = async (jobData: any) => {
    // Implementation for job submission
  };

  // Handle job deletion
  const handleDeleteJob = async (jobId: string) => {
    // Implementation for job deletion
  };

  // Handle job status toggle
  const handleToggleJobStatus = async (jobId: string) => {
    // Implementation for toggling job status
  };

  // Handle resume completion
  const handleResumeComplete = (resumeData: any) => {
    // Implementation for resume completion
  };

  // Handle avatar change
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData((prev) => ({
          ...prev,
          avatar: base64String,
        }));
        updateProfile({ avatar: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isAuthenticated && !authLoading) {
    return null;
  }

  return (
    <div className="pt-20 min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Notification Toast */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-24 right-4 px-6 py-3 rounded-lg shadow-lg ${
                notification.type === "success"
                  ? "bg-emerald-500"
                  : "bg-red-500"
              } text-white z-50`}
            >
              {notification.message}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Profile Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 bg-gray-800 rounded-xl shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="relative h-48 bg-gradient-to-r from-emerald-600 to-blue-600">
              <div className="absolute -bottom-16 left-8">
                <div className="relative">
                  <img
                    src={
                      formData.avatar ||
                      `https://ui-avatars.com/api/?name=${formData.first_name}+${formData.last_name}&background=random`
                    }
                    alt={`${formData.first_name} ${formData.last_name}`}
                    className="w-32 h-32 rounded-xl object-cover border-4 border-gray-800"
                  />
                  <label className="absolute bottom-2 right-2 w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors">
                    <Camera className="w-5 h-5 text-emerald-400" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 pt-20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    First Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Enter your first name"
                    />
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Last Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Enter your last name"
                    />
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Enter your email"
                      disabled
                    />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="date_of_birth"
                      value={
                        formData.date_of_birth
                          ? formData.date_of_birth
                              .split(".")
                              .reverse()
                              .join("-")
                          : ""
                      }
                      onChange={(e) => {
                        const date = e.target.value;
                        const formattedDate = date
                          ? date.split("-").reverse().join(".")
                          : "";
                        setFormData((prev) => ({
                          ...prev,
                          date_of_birth: formattedDate,
                        }));
                      }}
                      className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Phone
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Enter your phone number"
                    />
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Country
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Enter your country"
                    />
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                </div>

                {/* Region */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Region
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="region"
                      value={formData.region}
                      onChange={handleChange}
                      className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Enter your region"
                    />
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                </div>

                {/* District */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    District
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Enter your district"
                    />
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                </div>

                {/* Publish Phone */}
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="publish_phone"
                      checked={formData.publish_phone}
                      onChange={handleChange}
                      className="w-5 h-5 bg-gray-700 border border-gray-600 rounded text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium text-gray-400">
                      Publish Phone Number
                    </span>
                  </label>
                </div>

                {/* Public Status */}
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="publish_status"
                      checked={formData.publish_status}
                      onChange={handleChange}
                      className="w-5 h-5 bg-gray-700 border border-gray-600 rounded text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium text-gray-400">
                      Public Profile
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>

          {/* Right Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:w-[400px] flex-shrink-0 space-y-4"
          >
            {/* Resumes Section (for students) */}
            {formData.role === "student" && (
              <div className="bg-gray-800 rounded-xl shadow-xl">
                <button
                  onClick={() => setShowResumeWizard(true)}
                  className="w-full p-6 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-6 h-6 text-emerald-400" />
                    <h2 className="text-xl font-bold text-white">
                      Your Resumes
                    </h2>
                  </div>
                  <Plus className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            )}

            {/* Company Section (for companies) */}
            {formData.role === "company" && (
              <>
                <div className="bg-gray-800 rounded-xl shadow-xl">
                  <button
                    onClick={() => setShowCompanyForm(!showCompanyForm)}
                    className="w-full p-6 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-6 h-6 text-emerald-400" />
                      <h2 className="text-xl font-bold text-white">
                        Company Details
                      </h2>
                    </div>
                    {showCompanyForm ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  <AnimatePresence>
                    {showCompanyForm && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-6 pt-0">
                          <CompanyForm
                            onSubmit={handleCompanySubmit}
                            isLoading={isLoading}
                            initialData={companyData}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="bg-gray-800 rounded-xl shadow-xl">
                  <button
                    onClick={() => setShowJobForm(!showJobForm)}
                    className="w-full p-6 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-6 h-6 text-emerald-400" />
                      <h2 className="text-xl font-bold text-white">
                        Job Listings
                      </h2>
                    </div>
                    {showJobForm ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  <AnimatePresence>
                    {showJobForm && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-6 pt-0">
                          <JobForm
                            onSubmit={handleJobSubmit}
                            isLoading={isLoading}
                            jobs={jobs}
                            onDeleteJob={handleDeleteJob}
                            onToggleJobStatus={handleToggleJobStatus}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>

      {/* Resume Creation Wizard */}
      <AnimatePresence>
        {showResumeWizard && (
          <ResumeWizard
            isOpen={showResumeWizard}
            onClose={() => setShowResumeWizard(false)}
            onComplete={handleResumeComplete}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
