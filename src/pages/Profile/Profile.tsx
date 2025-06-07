"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  User,
  Mail,
  Calendar,
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
  MapPin,
  Globe,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { companiesApi, jobsApi, resumesApi } from "../../services/api";
import PhoneInputWithFlag from "../../components/PhoneRegionSelector/PhoneRegionSelector";
import ResumeViewModal from "./ResumeViewModal";
import ResumeEditModal from "./ResumeEditModal";
import CreateCompanyModal from "../../components/Modals/CreateCompanyModal";
import CreateJobModal from "../../components/Modals/CreateJobModal";
import CompanyViewModal from "../../components/Modals/CompanyViewModal";
import ResumeWizard from "./ResumeWizard";
import DeleteConfirmationModal from "../../components/Modals/DeleteConfirmationModal";
import { Country, State, City } from "country-state-city";

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string;
  phone: string;
  country: string;
  region: string;
  district: string;
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

interface LocationData {
  country: string;
  region: string;
  district: string;
}

const Profile = () => {
  const { t } = useTranslation();
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
    phone: "+",
    country: "",
    region: "",
    district: "",
    role: "student",
    avatar: "",
  });
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [userResumes, setUserResumes] = useState([]);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const [countries, setCountries] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [countryObj, setCountryObj] = useState<any>(null);
  const [regionObj, setRegionObj] = useState<any>(null);

  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCompanyViewModal, setShowCompanyViewModal] = useState(false);

  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false,
    type: "resume",
    id: null,
    title: "",
    message: "",
  });

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      navigate("/login");
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        date_of_birth: user.date_of_birth || "",
        phone: user.phone || "+",
        country: user.country || "",
        region: user.region || "",
        district: user.district || "",
        role: user.role || "student",
        avatar: user.avatar || "",
      });

      if (user.role === "company") {
        fetchCompanyData();
      }

      if (user.role === "student") {
        fetchUserResumes();
      }
    }
  }, [user]);

  useEffect(() => {
    try {
      const allCountries = Country.getAllCountries();
      setCountries(allCountries);

      if (formData.country) {
        const foundCountry = allCountries.find(
          (country) =>
            country.name.toLowerCase() === formData.country.toLowerCase()
        );
        if (foundCountry) {
          setCountryObj(foundCountry);
        }
      }
    } catch (error) {
      console.error("Error loading countries:", error);
    }
  }, [formData.country]);

  useEffect(() => {
    if (countryObj) {
      try {
        const countryRegions = State.getStatesOfCountry(countryObj.isoCode);
        setRegions(countryRegions);

        if (formData.region) {
          const foundRegion = countryRegions.find(
            (region) =>
              region.name.toLowerCase() === formData.region.toLowerCase()
          );
          if (foundRegion) {
            setRegionObj(foundRegion);
          } else {
            setFormData((prev) => ({ ...prev, region: "", district: "" }));
          }
        }
      } catch (error) {
        console.error("Error loading regions:", error);
        setRegions([]);
      }
    } else {
      setRegions([]);
      setRegionObj(null);
    }
  }, [countryObj, formData.region]);

  useEffect(() => {
    if (countryObj && regionObj) {
      try {
        const regionCities = City.getCitiesOfState(
          countryObj.isoCode,
          regionObj.isoCode
        );
        setCities(regionCities);

        if (formData.district) {
          const foundCity = regionCities.find(
            (city) =>
              city.name.toLowerCase() === formData.district.toLowerCase()
          );
          if (!foundCity) {
            setFormData((prev) => ({ ...prev, district: "" }));
          }
        }
      } catch (error) {
        console.error("Error loading cities:", error);
        setCities([]);
      }
    } else {
      setCities([]);
    }
  }, [regionObj, countryObj, formData.district]);

  const fetchCompanyData = async () => {
    try {
      setIsLoading(true);
      const companies = await companiesApi.getAll();
      const userCompany = companies.find((c) => c.user === Number(user?.id));

      if (userCompany) {
        setCompany(userCompany);
        fetchCompanyJobs(userCompany.id);
      }
    } catch (error) {
      console.error("Error fetching company data:", error);
      setNotification({
        type: "error",
        message: t("profile.notifications.failedToLoadCompany"),
      });
    } finally {
      setIsLoading(false);
    }
  };

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
        message: t("profile.notifications.failedToLoadJobs"),
      });
    } finally {
      setIsLoading(false);
    }
  };

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
        message: t("profile.notifications.failedToLoadResumes"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (name === "country") {
      const selectedCountryObj = countries.find(
        (country) => country.name === value
      );
      setCountryObj(selectedCountryObj || null);

      setFormData((prev) => ({
        ...prev,
        [name]: value,
        region: "",
        district: "",
      }));

      setRegionObj(null);
    } else if (name === "region") {
      const selectedRegionObj = regions.find((region) => region.name === value);
      setRegionObj(selectedRegionObj || null);

      setFormData((prev) => ({
        ...prev,
        [name]: value,
        district: "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]:
          type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
      }));
    }
  };

  const handleLocationChange = (locationData: LocationData) => {
    setFormData((prev) => ({
      ...prev,
      country: locationData.country,
      region: locationData.region,
      district: locationData.district,
    }));
  };

  const handlePhoneChange = (phoneNumber: string) => {
    setFormData((prev) => ({
      ...prev,
      phone: phoneNumber,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateProfile(formData);
      setNotification({
        type: "success",
        message: t("profile.notifications.profileUpdated"),
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setNotification({
        type: "error",
        message: t("profile.notifications.failedToUpdateProfile"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompanySubmit = async (companyData: any) => {
    try {
      setIsLoading(true);
      if (company) {
        await companiesApi.update(company.id.toString(), {
          ...companyData,
          user: Number(user?.id),
        });
        setNotification({
          type: "success",
          message: t("profile.notifications.companyUpdated"),
        });
      } else {
        const newCompany = await companiesApi.create({
          ...companyData,
          user: Number(user?.id),
        });
        setCompany(newCompany);
        setNotification({
          type: "success",
          message: t("profile.notifications.companyCreated"),
        });
      }
      fetchCompanyData();
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error("Error saving company data:", error);
      setNotification({
        type: "error",
        message: t("profile.notifications.failedToSaveCompany"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompanyCreated = (newCompany: Company) => {
    setCompany(newCompany);
    setNotification({
      type: "success",
      message: t("profile.notifications.companyCreated"),
    });
    setTimeout(() => setNotification(null), 3000);
    fetchCompanyData();
  };

  const handleJobCreated = (job: Job) => {
    setNotification({
      type: "success",
      message: editingJob
        ? t("profile.notifications.jobUpdated")
        : t("profile.notifications.jobCreated"),
    });
    setTimeout(() => setNotification(null), 3000);
    setEditingJob(null);
    if (company) {
      fetchCompanyJobs(company.id);
    }
  };

  const handleResumeCreated = (resume: any) => {
    setNotification({
      type: "success",
      message: t("profile.notifications.resumeCreated"),
    });
    setTimeout(() => setNotification(null), 3000);
    fetchUserResumes();
  };

  const openDeleteCompanyModal = () => {
    if (!company) return;

    setDeleteModal({
      isOpen: true,
      type: "company",
      id: company.id.toString(),
      title: t("profile.deleteModals.company.title"),
      message: t("profile.deleteModals.company.message", {
        name: company.name,
      }),
    });
  };

  const openDeleteJobModal = (jobId: string, jobTitle: string) => {
    setDeleteModal({
      isOpen: true,
      type: "job",
      id: jobId,
      title: t("profile.deleteModals.job.title"),
      message: t("profile.deleteModals.job.message", { title: jobTitle }),
    });
  };

  const openDeleteResumeModal = (resumeId: string, resumeTitle: string) => {
    setDeleteModal({
      isOpen: true,
      type: "resume",
      id: resumeId,
      title: t("profile.deleteModals.resume.title"),
      message: t("profile.deleteModals.resume.message", { title: resumeTitle }),
    });
  };

  const handleDeleteConfirm = async (password: string) => {
    if (!deleteModal.id) return;

    try {
      const isPasswordValid = await verifyPassword(password);

      if (!isPasswordValid) {
        throw new Error(t("profile.errors.incorrectPassword"));
      }

      setIsLoading(true);

      switch (deleteModal.type) {
        case "company":
          await companiesApi.delete(deleteModal.id);
          setCompany(null);
          setJobs([]);
          setNotification({
            type: "success",
            message: t("profile.notifications.companyDeleted"),
          });
          break;

        case "job":
          await jobsApi.delete(deleteModal.id);
          if (company) {
            fetchCompanyJobs(company.id);
          }
          setNotification({
            type: "success",
            message: t("profile.notifications.jobDeleted"),
          });
          break;

        case "resume":
          await resumesApi.delete(deleteModal.id);
          fetchUserResumes();
          setNotification({
            type: "success",
            message: t("profile.notifications.resumeDeleted"),
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
        message:
          newStatus === "active"
            ? t("profile.notifications.jobActivated")
            : t("profile.notifications.jobHidden"),
      });
      if (company) {
        fetchCompanyJobs(company.id);
      }
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error("Error updating job status:", error);
      setNotification({
        type: "error",
        message: t("profile.notifications.failedToUpdateJobStatus"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    setShowCreateJobModal(true);
  };

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

  const handleViewResume = (resumeId: string) => {
    setSelectedResumeId(resumeId);
    setShowViewModal(true);
  };

  const handleEditResume = (resumeId: string) => {
    setSelectedResumeId(resumeId);
    setShowEditModal(true);
  };

  const handleResumeEditComplete = (resumeData: any) => {
    fetchUserResumes();
    setNotification({
      type: "success",
      message: t("profile.notifications.resumeUpdated"),
    });
    setTimeout(() => setNotification(null), 3000);
  };

  if (!isAuthenticated && !authLoading) {
    return null;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="pt-20">
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
                      {t("profile.personalInfo.firstName")}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder={t("profile.placeholders.firstName")}
                      />
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    </div>
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      {t("profile.personalInfo.lastName")}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder={t("profile.placeholders.lastName")}
                      />
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      {t("profile.personalInfo.email")}
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                        placeholder={t("profile.placeholders.email")}
                        disabled
                      />
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      {t("profile.personalInfo.dateOfBirth")}
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

                  {/* Phone Number Row */}
                  <div className="md:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Phone Number - Half Width */}
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          {t("profile.personalInfo.phone")}
                        </label>
                        <PhoneInputWithFlag
                          value={formData.phone}
                          onChange={handlePhoneChange}
                        />
                      </div>

                      {/* Country Selector - Half Width */}
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          {t("profile.personalInfo.country")}
                        </label>
                        <div className="relative">
                          <select
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none h-10"
                          >
                            <option value="">
                              {t("profile.placeholders.selectCountry")}
                            </option>
                            {countries.map((country) => (
                              <option
                                key={country.isoCode}
                                value={country.name}
                              >
                                {country.name}
                              </option>
                            ))}
                          </select>
                          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                            <svg
                              className="fill-current h-4 w-4"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Region and District Row */}
                  <div className="md:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Region Selector */}
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          {t("profile.personalInfo.region")}
                        </label>
                        <div className="relative">
                          <select
                            name="region"
                            value={formData.region}
                            onChange={handleChange}
                            disabled={!countryObj}
                            className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none disabled:opacity-50 disabled:cursor-not-allowed h-10"
                          >
                            <option value="">
                              {t("profile.placeholders.selectRegion")}
                            </option>
                            {regions.map((region) => (
                              <option key={region.isoCode} value={region.name}>
                                {region.name}
                              </option>
                            ))}
                          </select>
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                            <svg
                              className="fill-current h-4 w-4"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* District/City Selector */}
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          {t("profile.personalInfo.district")}
                        </label>
                        <div className="relative">
                          <select
                            name="district"
                            value={formData.district}
                            onChange={handleChange}
                            disabled={!regionObj}
                            className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none disabled:opacity-50 disabled:cursor-not-allowed h-10"
                          >
                            <option value="">
                              {t("profile.placeholders.selectDistrict")}
                            </option>
                            {cities.map((city) => (
                              <option
                                key={city.id || city.name}
                                value={city.name}
                              >
                                {city.name}
                              </option>
                            ))}
                          </select>
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                            <svg
                              className="fill-current h-4 w-4"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
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
                    {t("profile.buttons.saveChanges")}
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
                        {t("profile.resume.title")}
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
                                {new Date(
                                  resume.created_at
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => handleViewResume(resume.id)}
                                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-500 transition-colors"
                              >
                                {t("profile.buttons.view")}
                              </button>
                              <button
                                onClick={() => handleEditResume(resume.id)}
                                className="px-3 py-1 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-500 transition-colors"
                              >
                                {t("profile.buttons.edit")}
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
                                {t("profile.buttons.delete")}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-center py-4">
                        {t("profile.resume.noResumes")}
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
                          {t("profile.company.title")}
                        </h2>
                      </div>
                      {company ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowCompanyViewModal(true)}
                            className="p-2 text-gray-400 hover:text-emerald-500 transition-colors"
                            title={t("profile.buttons.editCompany")}
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={openDeleteCompanyModal}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            title={t("profile.buttons.deleteCompany")}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowCreateCompanyModal(true)}
                          className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center hover:bg-emerald-500 transition-colors"
                          title={t("profile.buttons.createCompany")}
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
                            <p className="text-gray-400">
                              {t("profile.company.founded")}
                            </p>
                            <p className="text-white">{company.founded_year}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">
                              {t("profile.company.size")}
                            </p>
                            <p className="text-white">{company.size}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-gray-400">
                              {t("profile.company.website")}
                            </p>
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
                          {t("profile.buttons.viewEditDetails")}
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-400 mb-4">
                          {t("profile.company.noCompany")}
                        </p>
                        <button
                          onClick={() => setShowCreateCompanyModal(true)}
                          className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
                        >
                          {t("profile.buttons.createCompany")}
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
                          {t("profile.jobs.title")}
                        </h2>
                      </div>
                      <button
                        onClick={() => {
                          setEditingJob(null);
                          setShowCreateJobModal(true);
                        }}
                        className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center hover:bg-emerald-500 transition-colors"
                        title={t("profile.buttons.addNewJob")}
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
                        <p>{t("profile.jobs.noJobs")}</p>
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
                                        ? t("profile.jobs.statusActive")
                                        : t("profile.jobs.statusHidden")}
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
                                    title={t("profile.buttons.editJob")}
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
                                        ? t("profile.buttons.hideJob")
                                        : t("profile.buttons.showJob")
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
                                    title={t("profile.buttons.deleteJob")}
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
      </div>

      {/* Modals */}
      {showCreateCompanyModal && (
        <CreateCompanyModal
          isOpen={showCreateCompanyModal}
          onClose={() => setShowCreateCompanyModal(false)}
          onComplete={handleCompanyCreated}
        />
      )}

      {company && showCreateJobModal && (
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

      {company && showCompanyViewModal && (
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
      {deleteModal.isOpen && (
        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
          onConfirm={handleDeleteConfirm}
          title={deleteModal.title}
          message={deleteModal.message}
          itemType={deleteModal.type}
        />
      )}
    </div>
  );
};

export default Profile;
