"use client";

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
  Briefcase,
  Trash2,
  DollarSign,
  Clock,
  Edit,
  EyeOff,
  Eye,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { companiesApi, jobsApi, resumesApi } from "../../services/api";
import ResumeViewModal from "./ResumeViewModal";
import ResumeEditModal from "./ResumeEditModal";
import CreateCompanyModal from "../../components/Modals/CreateCompanyModal";
import CreateJobModal from "../../components/Modals/CreateJobModal";
import CompanyViewModal from "../../components/Modals/CompanyViewModal";
import ResumeWizard from "./ResumeWizard";
import DeleteConfirmationModal from "../../components/Modals/DeleteConfirmationModal";

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

interface Company {
  id: number;
  user: number;
  name: string;
  logo: string;
  description: string;
  website: string;
  industry: string;
  size: string;
  founded_year: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Job {
  id: number;
  company: number;
  title: string;
  description: string;
  requirements: string;
  salary_min: number;
  salary_max: number;
  city: string;
  metro: string;
  type: string;
  schedule: string;
  experiense: number;
  status: string;
  type_of_money: string;
  created_at: string;
  updated_at: string;
}

interface DeleteModalState {
  isOpen: boolean;
  type: "resume" | "job" | "company";
  id: string | null;
  title: string;
  message: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    updateProfile,
    isLoading: authLoading,
    verifyPassword,
  } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showResumeWizard, setShowResumeWizard] = useState(false);
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false);
  const [showCreateJobModal, setShowCreateJobModal] = useState(false);
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
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [userResumes, setUserResumes] = useState([]);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // Add state variables for the modals
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCompanyViewModal, setShowCompanyViewModal] = useState(false);

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false,
    type: "resume",
    id: null,
    title: "",
    message: "",
  });

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

      // Fetch resumes if user is a student
      if (user.role === "student") {
        fetchUserResumes();
      }
    }
  }, [user]);

  // Fetch company data
  const fetchCompanyData = async () => {
    try {
      setIsLoading(true);
      const companies = await companiesApi.getAll();
      const userCompany = companies.find((c) => c.user === Number(user?.id));

      if (userCompany) {
        setCompany(userCompany);
        // Fetch jobs for this company
        fetchCompanyJobs(userCompany.id);
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

  // Fetch jobs for the company
  const fetchCompanyJobs = async (companyId: number) => {
    try {
      setIsLoading(true);
      const allJobs = await jobsApi.getAll();
      const companyJobs = allJobs.filter(
        (job: Job) => job.company === companyId
      );
      setJobs(companyJobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setNotification({
        type: "error",
        message: "Failed to load job listings",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user resumes
  const fetchUserResumes = async () => {
    try {
      setIsLoading(true);
      const response = await resumesApi.getAll();
      const userResumesList = response.filter(
        (resume: any) => resume.user === Number.parseInt(user?.id || "0")
      );
      setUserResumes(userResumesList);
    } catch (error) {
      console.error("Error fetching user resumes:", error);
      setNotification({
        type: "error",
        message: "Failed to load resumes",
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

  // Handle profile form submission
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
    } finally {
      setIsLoading(false);
    }
  };

  // Handle company form submission
  const handleCompanySubmit = async (companyData: any) => {
    try {
      setIsLoading(true);
      if (company) {
        // Update existing company
        await companiesApi.update(company.id.toString(), {
          ...companyData,
          user: Number(user?.id),
        });
        setNotification({
          type: "success",
          message: "Company details updated successfully!",
        });
      } else {
        // Create new company
        const newCompany = await companiesApi.create({
          ...companyData,
          user: Number(user?.id),
        });
        setCompany(newCompany);
        setNotification({
          type: "success",
          message: "Company created successfully!",
        });
      }
      fetchCompanyData(); // Refresh data
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error("Error saving company data:", error);
      setNotification({
        type: "error",
        message: "Failed to save company details. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle company creation from modal
  const handleCompanyCreated = (newCompany: Company) => {
    setCompany(newCompany);
    setNotification({
      type: "success",
      message: "Company created successfully!",
    });
    setTimeout(() => setNotification(null), 3000);
    fetchCompanyData(); // Refresh data
  };

  // Handle job creation/update from modal
  const handleJobCreated = (job: Job) => {
    setNotification({
      type: "success",
      message: editingJob
        ? "Job updated successfully!"
        : "Job created successfully!",
    });
    setTimeout(() => setNotification(null), 3000);
    setEditingJob(null);
    if (company) {
      fetchCompanyJobs(company.id); // Refresh jobs
    }
  };

  // Handle resume creation from modal
  const handleResumeCreated = (resume: any) => {
    setNotification({
      type: "success",
      message: "Resume created successfully!",
    });
    setTimeout(() => setNotification(null), 3000);
    fetchUserResumes(); // Refresh resumes
  };

  // Open delete confirmation modal for company
  const openDeleteCompanyModal = () => {
    if (!company) return;

    setDeleteModal({
      isOpen: true,
      type: "company",
      id: company.id.toString(),
      title: "Delete Company",
      message: `Are you sure you want to delete "${company.name}"? This will also delete all associated job listings.`,
    });
  };

  // Open delete confirmation modal for job
  const openDeleteJobModal = (jobId: string, jobTitle: string) => {
    setDeleteModal({
      isOpen: true,
      type: "job",
      id: jobId,
      title: "Delete Job Listing",
      message: `Are you sure you want to delete the job listing "${jobTitle}"?`,
    });
  };

  // Open delete confirmation modal for resume
  const openDeleteResumeModal = (resumeId: string, resumeTitle: string) => {
    setDeleteModal({
      isOpen: true,
      type: "resume",
      id: resumeId,
      title: "Delete Resume",
      message: `Are you sure you want to delete the resume for "${resumeTitle}"?`,
    });
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async (password: string) => {
    if (!deleteModal.id) return;

    try {
      // First verify the password
      const isPasswordValid = await verifyPassword(password);

      if (!isPasswordValid) {
        throw new Error("Incorrect password");
      }

      setIsLoading(true);

      // Perform the deletion based on type
      switch (deleteModal.type) {
        case "company":
          await companiesApi.delete(deleteModal.id);
          setCompany(null);
          setJobs([]);
          setNotification({
            type: "success",
            message: "Company deleted successfully!",
          });
          break;

        case "job":
          await jobsApi.delete(deleteModal.id);
          if (company) {
            fetchCompanyJobs(company.id); // Refresh jobs
          }
          setNotification({
            type: "success",
            message: "Job deleted successfully!",
          });
          break;

        case "resume":
          await resumesApi.delete(deleteModal.id);
          fetchUserResumes(); // Refresh resumes
          setNotification({
            type: "success",
            message: "Resume deleted successfully!",
          });
          break;
      }

      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error(`Error deleting ${deleteModal.type}:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle job status toggle (active/hidden)
  const handleToggleJobStatus = async (
    jobId: string,
    currentStatus: string
  ) => {
    try {
      setIsLoading(true);
      const newStatus = currentStatus === "active" ? "hidden" : "active";
      await jobsApi.update(jobId, { status: newStatus });
      setNotification({
        type: "success",
        message: `Job ${
          newStatus === "active" ? "activated" : "hidden"
        } successfully!`,
      });
      if (company) {
        fetchCompanyJobs(company.id); // Refresh jobs
      }
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error("Error updating job status:", error);
      setNotification({
        type: "error",
        message: "Failed to update job status. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle editing a job
  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    setShowCreateJobModal(true);
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

  // Handle viewing a resume
  const handleViewResume = (resumeId: string) => {
    setSelectedResumeId(resumeId);
    setShowViewModal(true);
  };

  // Handle editing a resume
  const handleEditResume = (resumeId: string) => {
    setSelectedResumeId(resumeId);
    setShowEditModal(true);
  };

  // Handle resume edit completion
  const handleResumeEditComplete = (resumeData: any) => {
    fetchUserResumes();
    setNotification({
      type: "success",
      message: "Resume updated successfully",
    });
    setTimeout(() => setNotification(null), 3000);
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
                      `https://ui-avatars.com/api/?name=${
                        formData.first_name || ""
                      }+${formData.last_name || ""}&background=random`
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
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-6 h-6 text-emerald-400" />
                    <h2 className="text-xl font-bold text-white">
                      Your Resumes
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowResumeWizard(true)}
                    className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center hover:bg-emerald-500 transition-colors"
                  >
                    <Plus className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Resume List */}
                <div className="px-6 pb-6">
                  {isLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                    </div>
                  ) : userResumes.length > 0 ? (
                    <div className="space-y-3 mt-2">
                      {userResumes.map((resume: any) => (
                        <div
                          key={resume.id}
                          className="p-4 bg-gray-700 rounded-lg hover:bg-gray-650 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-white">
                                {resume.profession}
                              </h3>
                              <p className="text-sm text-gray-400 mt-1">
                                {resume.education} • {resume.specialization}
                              </p>
                            </div>
                            <span className="text-xs text-gray-400">
                              {new Date(resume.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleViewResume(resume.id)}
                              className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-500 transition-colors"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleEditResume(resume.id)}
                              className="px-3 py-1 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-500 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                openDeleteResumeModal(
                                  resume.id,
                                  resume.profession
                                )
                              }
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-500 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-4">
                      You haven't created any resumes yet.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Company Section (for companies) */}
            {formData.role === "company" && (
              <div className="bg-gray-800 rounded-xl shadow-xl">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-6 h-6 text-emerald-400" />
                      <h2 className="text-xl font-bold text-white">
                        Company Details
                      </h2>
                    </div>
                    {company ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowCompanyViewModal(true)}
                          className="p-2 text-gray-400 hover:text-emerald-500 transition-colors"
                          title="Edit Company"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={openDeleteCompanyModal}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete Company"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowCreateCompanyModal(true)}
                        className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center hover:bg-emerald-500 transition-colors"
                        title="Create Company"
                      >
                        <Plus className="w-5 h-5 text-white" />
                      </button>
                    )}
                  </div>

                  {company ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        {company.logo ? (
                          <img
                            src={company.logo || "/placeholder.svg"}
                            alt={company.name}
                            className="w-16 h-16 rounded-lg object-cover bg-gray-700"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gray-700 flex items-center justify-center">
                            <Building2 className="w-8 h-8 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-medium text-white text-lg">
                            {company.name}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {company.industry}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-400">Founded</p>
                          <p className="text-white">{company.founded_year}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Size</p>
                          <p className="text-white">{company.size}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-400">Website</p>
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:underline truncate block"
                          >
                            {company.website}
                          </a>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowCompanyViewModal(true)}
                        className="w-full mt-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                      >
                        View & Edit Details
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400 mb-4">
                        You haven't created a company yet.
                      </p>
                      <button
                        onClick={() => setShowCreateCompanyModal(true)}
                        className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
                      >
                        Create Company
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Jobs Section - Only visible if company exists */}
            {company && (
              <div className="bg-gray-800 rounded-xl shadow-xl">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-6 h-6 text-emerald-400" />
                      <h2 className="text-xl font-bold text-white">
                        Job Listings
                      </h2>
                    </div>
                    <button
                      onClick={() => {
                        setEditingJob(null);
                        setShowCreateJobModal(true);
                      }}
                      className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center hover:bg-emerald-500 transition-colors"
                      title="Add New Job"
                    >
                      <Plus className="w-5 h-5 text-white" />
                    </button>
                  </div>

                  {/* Job List */}
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    </div>
                  ) : jobs.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <p>No job listings yet. Create your first job posting!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {jobs.map((job) => (
                        <div
                          key={job.id}
                          className="bg-gray-700 rounded-lg overflow-hidden"
                        >
                          {/* Job Header */}
                          <div className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-white">
                                    {job.title}
                                  </h3>
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded ${
                                      job.status === "active"
                                        ? "bg-emerald-600"
                                        : "bg-gray-500"
                                    }`}
                                  >
                                    {job.status === "active"
                                      ? "Active"
                                      : "Hidden"}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400 mt-2">
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    <span>{job.city}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="w-4 h-4" />
                                    <span>{`${job.salary_min}-${job.salary_max} ${job.type_of_money}`}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>{job.type}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEditJob(job)}
                                  className="p-1 text-gray-400 hover:text-white transition-colors"
                                  title="Edit Job"
                                >
                                  <Edit className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleToggleJobStatus(
                                      job.id.toString(),
                                      job.status
                                    )
                                  }
                                  className="p-1 text-gray-400 hover:text-white transition-colors"
                                  title={
                                    job.status === "active"
                                      ? "Hide Job"
                                      : "Show Job"
                                  }
                                >
                                  {job.status === "active" ? (
                                    <EyeOff className="w-5 h-5" />
                                  ) : (
                                    <Eye className="w-5 h-5" />
                                  )}
                                </button>
                                <button
                                  onClick={() =>
                                    openDeleteJobModal(
                                      job.id.toString(),
                                      job.title
                                    )
                                  }
                                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                  title="Delete Job"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Modals */}
      <CreateCompanyModal
        isOpen={showCreateCompanyModal}
        onClose={() => setShowCreateCompanyModal(false)}
        onComplete={handleCompanyCreated}
      />

      {company && (
        <CreateJobModal
          isOpen={showCreateJobModal}
          onClose={() => {
            setShowCreateJobModal(false);
            setEditingJob(null);
          }}
          onComplete={handleJobCreated}
          companyId={company.id}
          initialData={editingJob}
        />
      )}

      <AnimatePresence>
        {showViewModal && selectedResumeId && (
          <ResumeViewModal
            isOpen={showViewModal}
            onClose={() => setShowViewModal(false)}
            resume={userResumes.find(
              (resume: any) => resume.id === selectedResumeId
            )}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditModal && selectedResumeId && (
          <ResumeEditModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            resumeId={selectedResumeId}
            onComplete={handleResumeEditComplete}
          />
        )}
      </AnimatePresence>

      {company && (
        <CompanyViewModal
          isOpen={showCompanyViewModal}
          onClose={() => setShowCompanyViewModal(false)}
          onComplete={handleCompanySubmit}
          initialData={company}
        />
      )}

      {showResumeWizard && (
        <ResumeWizard
          isOpen={showResumeWizard}
          onClose={() => setShowResumeWizard(false)}
          onComplete={handleResumeCreated}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={handleDeleteConfirm}
        title={deleteModal.title}
        message={deleteModal.message}
        itemType={deleteModal.type}
      />
    </div>
  );
};

export default Profile;
