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
  RefreshCw,
  AlertTriangle,
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
import { ValidatedInput } from "../../components/validated-input";
import {
  locationAPI,
  type Country,
  type Region,
  type City,
} from "../../services/location-api";

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

  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [countryObj, setCountryObj] = useState<Country | null>(null);
  const [regionObj, setRegionObj] = useState<Region | null>(null);

  const [locationLoading, setLocationLoading] = useState({
    countries: false,
    regions: false,
    cities: false,
  });

  const [locationErrors, setLocationErrors] = useState({
    countries: false,
    regions: false,
    cities: false,
  });

  const [isInitialized, setIsInitialized] = useState(false);

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
    loadCountries();
  }, []);

  useEffect(() => {
    if (user && countries.length > 0) {
      console.log("Setting user data to form:", user);

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

      if (user.country) {
        console.log(
          "User has country data, loading regions for:",
          user.country
        );
        const foundCountry = locationAPI.findCountryByName(user.country);
        if (foundCountry) {
          console.log("Found country object:", foundCountry);
          setCountryObj(foundCountry);
          loadRegions(foundCountry.isoCode).then(() => {
            if (user.region) {
              console.log(
                "User has region data, loading cities for:",
                user.region
              );
              const foundRegion = locationAPI.findRegionByName(
                foundCountry.isoCode,
                user.region
              );
              if (foundRegion) {
                console.log("Found region object:", foundRegion);
                setRegionObj(foundRegion);
                loadCities(foundCountry.isoCode, foundRegion.isoCode);
              }
            }
          });
        }
      }

      if (user.role === "company") {
        fetchCompanyData();
      }

      if (user.role === "student") {
        fetchUserResumes();
      }

      setIsInitialized(true);
    }
  }, [user, countries]);

  useEffect(() => {
    if (formData.country && countries.length > 0 && isInitialized) {
      console.log("Country changed:", formData.country);
      const foundCountry = locationAPI.findCountryByName(formData.country);
      if (foundCountry) {
        console.log("Found country object:", foundCountry);
        setCountryObj(foundCountry);
        setRegions([]);
        setCities([]);
        setRegionObj(null);

        if (foundCountry.name !== user?.country) {
          setFormData((prev) => ({ ...prev, region: "", district: "" }));
        }

        loadRegions(foundCountry.isoCode);
      } else {
        console.warn("Country not found in list:", formData.country);
        setCountryObj(null);
        setRegions([]);
        setCities([]);
        setRegionObj(null);
      }
    }
  }, [formData.country, countries, isInitialized]);

  useEffect(() => {
    if (countryObj && formData.region && regions.length > 0 && isInitialized) {
      console.log("Region changed:", formData.region);
      const foundRegion = locationAPI.findRegionByName(
        countryObj.isoCode,
        formData.region
      );
      if (foundRegion) {
        console.log("Found region object:", foundRegion);
        setRegionObj(foundRegion);
        setCities([]);

        if (foundRegion.name !== user?.region) {
          setFormData((prev) => ({ ...prev, district: "" }));
        }

        loadCities(countryObj.isoCode, foundRegion.isoCode);
      } else {
        console.warn("Region not found in list:", formData.region);
        setRegionObj(null);
        setCities([]);
      }
    }
  }, [countryObj, formData.region, regions, isInitialized]);

  useEffect(() => {
    if (countryObj && regionObj && formData.district && cities.length > 0) {
      console.log("District changed:", formData.district);
      const foundCity = locationAPI.findCityByName(
        countryObj.isoCode,
        regionObj.isoCode,
        formData.district
      );
      if (!foundCity) {
        console.warn("City not found in list:", formData.district);
      }
    }
  }, [regionObj, countryObj, formData.district, cities]);

  const loadCountries = async () => {
    setLocationLoading((prev) => ({ ...prev, countries: true }));
    setLocationErrors((prev) => ({ ...prev, countries: false }));
    try {
      console.log("Starting to load countries...");
      const countriesData = await locationAPI.getAllCountries();
      setCountries(countriesData);
      console.log("Countries loaded successfully:", countriesData.length);
    } catch (error) {
      console.error("Error loading countries:", error);
      setLocationErrors((prev) => ({ ...prev, countries: true }));
      setNotification({
        type: "error",
        message: "Failed to load countries. Using offline data.",
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setLocationLoading((prev) => ({ ...prev, countries: false }));
    }
  };

  const loadRegions = async (countryCode: string) => {
    if (!countryCode) {
      console.warn("loadRegions called without countryCode");
      return;
    }

    setLocationLoading((prev) => ({ ...prev, regions: true }));
    setLocationErrors((prev) => ({ ...prev, regions: false }));

    try {
      console.log("Loading regions for:", countryCode);
      const regionsData = await locationAPI.getStatesOfCountry(countryCode);
      console.log("Regions loaded:", regionsData.length);
      setRegions(regionsData);
    } catch (error) {
      console.error("Error loading regions:", error);
      setLocationErrors((prev) => ({ ...prev, regions: true }));
      setRegions([]);
    } finally {
      setLocationLoading((prev) => ({ ...prev, regions: false }));
    }
  };

  const loadCities = async (countryCode: string, regionCode: string) => {
    if (!countryCode || !regionCode) {
      console.warn("loadCities called without required codes");
      return;
    }

    setLocationLoading((prev) => ({ ...prev, cities: true }));
    setLocationErrors((prev) => ({ ...prev, cities: false }));

    try {
      console.log("Loading cities for:", countryCode, regionCode);
      const citiesData = await locationAPI.getCitiesOfState(
        countryCode,
        regionCode
      );
      console.log("Cities loaded:", citiesData.length);
      setCities(citiesData);
    } catch (error) {
      console.error("Error loading cities:", error);
      setLocationErrors((prev) => ({ ...prev, cities: true }));
      setCities([]);
    } finally {
      setLocationLoading((prev) => ({ ...prev, cities: false }));
    }
  };

  const retryLoadCountries = () => {
    console.log("Retrying countries load...");
    loadCountries();
  };

  const retryLoadRegions = () => {
    if (countryObj) {
      console.log("Retrying regions load for:", countryObj.isoCode);
      loadRegions(countryObj.isoCode);
    }
  };

  const retryLoadCities = () => {
    if (countryObj && regionObj) {
      console.log(
        "Retrying cities load for:",
        countryObj.isoCode,
        regionObj.isoCode
      );
      loadCities(countryObj.isoCode, regionObj.isoCode);
    }
  };

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

  const handleChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    console.log(`Field changed: ${name} = ${value}`);

    if (name === "country") {
      const selectedCountryObj = locationAPI.findCountryByName(value);
      console.log("Selected country object:", selectedCountryObj);

      setFormData((prev) => ({
        ...prev,
        [name]: value,
        region: "",
        district: "",
      }));
    } else if (name === "region") {
      console.log("Region selection:", value);
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

  const handleValidatedFieldChange = (fieldName: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
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
      console.log("Submitting form data:", formData);
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

  const LocationSelect = ({
    name,
    value,
    onChange,
    options,
    loading,
    error,
    disabled,
    placeholder,
    icon: Icon,
    onRetry,
  }: {
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: Array<{
      id?: string;
      isoCode?: string;
      name: string;
      flag?: string;
    }>;
    loading: boolean;
    error: boolean;
    disabled: boolean;
    placeholder: string;
    icon: any;
    onRetry?: () => void;
  }) => (
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled || loading}
        className="w-full px-3 py-2 sm:px-4 sm:py-2 pl-8 sm:pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none h-10 sm:h-10 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option
            key={option.isoCode || option.id || option.name}
            value={option.name}
          >
            {option.flag ? `${option.flag} ` : ""}
            {option.name}
          </option>
        ))}
      </select>

      <div className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 flex items-center">
        {loading ? (
          <Loader2 className="text-gray-400 w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
        ) : error ? (
          <AlertTriangle className="text-red-400 w-4 h-4 sm:w-5 sm:h-5" />
        ) : (
          <Icon className="text-gray-400 w-4 h-4 sm:w-5 sm:h-5 pointer-events-none" />
        )}
      </div>

      {error && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="absolute right-6 sm:right-8 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-emerald-400 transition-colors"
          title="Retry loading"
        >
          <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      )}

      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
        <svg
          className="fill-current h-3 w-3 sm:h-4 sm:w-4"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  );

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
      <div className="pt-20 sm:pt-24">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-12">
          {/* Notification Toast */}
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`fixed top-24 sm:top-28 right-2 sm:right-4 px-4 py-2 sm:px-6 sm:py-3 rounded-lg shadow-lg ${
                  notification.type === "success"
                    ? "bg-emerald-500"
                    : "bg-red-500"
                } text-white z-50 text-sm sm:text-base max-w-xs sm:max-w-none`}
              >
                {notification.message}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col lg:flex-row gap-3 sm:gap-8">
            {/* Profile Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 bg-gray-800 rounded-xl shadow-xl overflow-hidden"
            >
              {/* Header */}
              <div className="relative h-32 sm:h-48 bg-gradient-to-r from-emerald-600 to-blue-600">
                <div className="absolute -bottom-8 sm:-bottom-16 left-3 sm:left-8">
                  <div className="relative">
                    <img
                      src={
                        formData.avatar ||
                        `https://ui-avatars.com/api/?name=${
                          formData.first_name || ""
                        }+${formData.last_name || ""}&background=random`
                      }
                      alt={`${formData.first_name} ${formData.last_name}`}
                      className="w-16 h-16 sm:w-32 sm:h-32 rounded-lg sm:rounded-xl object-cover border-2 sm:border-4 border-gray-800"
                    />
                    <label className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-6 h-6 sm:w-8 sm:h-8 bg-gray-800 rounded-md sm:rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors">
                      <Camera className="w-3 h-3 sm:w-5 sm:h-5 text-emerald-400" />
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
              <form
                onSubmit={handleSubmit}
                className="p-3 sm:p-8 pt-12 sm:pt-20"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {/* First Name */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-2">
                      {t("profile.personalInfo.firstName")}
                    </label>
                    <div className="relative">
                      <ValidatedInput
                        modelName="user"
                        fieldName="first_name"
                        value={formData.first_name}
                        onChange={(value) =>
                          handleValidatedFieldChange("first_name", value)
                        }
                        placeholder={t("profile.placeholders.firstName")}
                        className="w-full px-3 py-2 sm:px-4 sm:py-2 pl-8 sm:pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                        icon={
                          <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        }
                      />
                    </div>
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-2">
                      {t("profile.personalInfo.lastName")}
                    </label>
                    <div className="relative">
                      <ValidatedInput
                        modelName="user"
                        fieldName="last_name"
                        value={formData.last_name}
                        onChange={(value) =>
                          handleValidatedFieldChange("last_name", value)
                        }
                        placeholder={t("profile.placeholders.lastName")}
                        className="w-full px-3 py-2 sm:px-4 sm:py-2 pl-8 sm:pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                        icon={
                          <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        }
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-2">
                      {t("profile.personalInfo.email")}
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 sm:px-4 sm:py-2 pl-8 sm:pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 text-sm sm:text-base"
                        placeholder={t("profile.placeholders.email")}
                        disabled
                      />
                      <Mail className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-2">
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
                        className="w-full px-3 py-2 sm:px-4 sm:py-2 pl-8 sm:pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                      />
                      <Calendar className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </div>

                  {/* Phone Number Row */}
                  <div className="md:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {/* Phone Number - Half Width */}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-2">
                          {t("profile.personalInfo.phone")}
                        </label>
                        <PhoneInputWithFlag
                          value={formData.phone}
                          onChange={handlePhoneChange}
                        />
                      </div>

                      {/* Country Selector - Half Width */}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-2">
                          {t("profile.personalInfo.country")}
                        </label>
                        <LocationSelect
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          options={countries}
                          loading={locationLoading.countries}
                          error={locationErrors.countries}
                          disabled={false}
                          placeholder={t("profile.placeholders.selectCountry")}
                          icon={Globe}
                          onRetry={retryLoadCountries}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Region and District Row */}
                  <div className="md:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {/* Region Selector */}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-2">
                          {t("profile.personalInfo.region")}
                        </label>
                        <LocationSelect
                          name="region"
                          value={formData.region}
                          onChange={handleChange}
                          options={regions}
                          loading={locationLoading.regions}
                          error={locationErrors.regions}
                          disabled={!countryObj}
                          placeholder={t("profile.placeholders.selectRegion")}
                          icon={MapPin}
                          onRetry={retryLoadRegions}
                        />
                      </div>

                      {/* District/City Selector */}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-2">
                          {t("profile.personalInfo.district")}
                        </label>
                        <LocationSelect
                          name="district"
                          value={formData.district}
                          onChange={handleChange}
                          options={cities}
                          loading={locationLoading.cities}
                          error={locationErrors.cities}
                          disabled={!regionObj}
                          placeholder={t("profile.placeholders.selectDistrict")}
                          icon={MapPin}
                          onRetry={retryLoadCities}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="mt-4 sm:mt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 sm:px-6 sm:py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 sm:w-5 sm:h-5" />
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
              className="lg:w-[350px] xl:w-[400px] flex-shrink-0 space-y-3 sm:space-y-4"
            >
              {/* Resumes Section (for students) */}
              {formData.role === "student" && (
                <div className="bg-gray-800 rounded-xl shadow-xl">
                  <div className="p-3 sm:p-6 flex items-center justify-between">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                      <h2 className="text-lg sm:text-xl font-bold text-white">
                        {t("profile.resume.title")}
                      </h2>
                    </div>
                    <button
                      onClick={() => setShowResumeWizard(true)}
                      className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-600 rounded-lg flex items-center justify-center hover:bg-emerald-500 transition-colors"
                    >
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </button>
                  </div>

                  {/* Resume List */}
                  <div className="px-3 sm:px-6 pb-3 sm:pb-6">
                    {isLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 animate-spin" />
                      </div>
                    ) : userResumes.length > 0 ? (
                      <div className="space-y-2 sm:space-y-3 mt-2">
                        {userResumes.map((resume: any) => (
                          <div
                            key={resume.id}
                            className="p-3 sm:p-4 bg-gray-700 rounded-lg hover:bg-gray-650 transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div className="min-w-0 flex-1">
                                <h3 className="font-medium text-white text-sm sm:text-base truncate">
                                  {resume.profession}
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-400 mt-1 truncate">
                                  {resume.education} • {resume.specialization}
                                </p>
                              </div>
                              <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                                {new Date(
                                  resume.created_at
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex gap-1 sm:gap-2 mt-2 sm:mt-3">
                              <button
                                onClick={() => handleViewResume(resume.id)}
                                className="px-2 py-1 sm:px-3 sm:py-1 bg-gray-600 text-white text-xs sm:text-sm rounded hover:bg-gray-500 transition-colors"
                              >
                                {t("profile.buttons.view")}
                              </button>
                              <button
                                onClick={() => handleEditResume(resume.id)}
                                className="px-2 py-1 sm:px-3 sm:py-1 bg-emerald-600 text-white text-xs sm:text-sm rounded hover:bg-emerald-500 transition-colors"
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
                                className="px-2 py-1 sm:px-3 sm:py-1 bg-red-600 text-white text-xs sm:text-sm rounded hover:bg-red-500 transition-colors"
                              >
                                {t("profile.buttons.delete")}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-center py-4 text-sm sm:text-base">
                        {t("profile.resume.noResumes")}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Company Section (for companies) */}
              {formData.role === "company" && (
                <div className="bg-gray-800 rounded-xl shadow-xl">
                  <div className="p-3 sm:p-6">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                        <h2 className="text-lg sm:text-xl font-bold text-white">
                          {t("profile.company.title")}
                        </h2>
                      </div>
                      {company ? (
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button
                            onClick={() => setShowCompanyViewModal(true)}
                            className="p-1.5 sm:p-2 text-gray-400 hover:text-emerald-500 transition-colors"
                            title={t("profile.buttons.editCompany")}
                          >
                            <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          <button
                            onClick={openDeleteCompanyModal}
                            className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 transition-colors"
                            title={t("profile.buttons.deleteCompany")}
                          >
                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowCreateCompanyModal(true)}
                          className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-600 rounded-lg flex items-center justify-center hover:bg-emerald-500 transition-colors"
                          title={t("profile.buttons.createCompany")}
                        >
                          <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </button>
                      )}
                    </div>

                    {company ? (
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-3 sm:gap-4">
                          {company.logo ? (
                            <img
                              src={company.logo || "/placeholder.svg"}
                              alt={company.name}
                              className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover bg-gray-700"
                            />
                          ) : (
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-gray-700 flex items-center justify-center">
                              <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-white text-base sm:text-lg truncate">
                              {company.name}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-400 truncate">
                              {company.industry}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
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
                          className="w-full mt-2 px-3 py-2 sm:px-4 sm:py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-xs sm:text-sm"
                        >
                          {t("profile.buttons.viewEditDetails")}
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-6 sm:py-8">
                        <p className="text-gray-400 mb-3 sm:mb-4 text-sm sm:text-base">
                          {t("profile.company.noCompany")}
                        </p>
                        <button
                          onClick={() => setShowCreateCompanyModal(true)}
                          className="px-4 py-2 sm:px-6 sm:py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors text-sm sm:text-base"
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
                  <div className="p-3 sm:p-6">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                        <h2 className="text-lg sm:text-xl font-bold text-white">
                          {t("profile.jobs.title")}
                        </h2>
                      </div>
                      <button
                        onClick={() => {
                          setEditingJob(null);
                          setShowCreateJobModal(true);
                        }}
                        className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-600 rounded-lg flex items-center justify-center hover:bg-emerald-500 transition-colors"
                        title={t("profile.buttons.addNewJob")}
                      >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </button>
                    </div>

                    {/* Job List */}
                    {isLoading ? (
                      <div className="flex justify-center py-6 sm:py-8">
                        <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500 animate-spin" />
                      </div>
                    ) : jobs.length === 0 ? (
                      <div className="text-center py-6 sm:py-8 text-gray-400">
                        <p className="text-sm sm:text-base">
                          {t("profile.jobs.noJobs")}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 sm:space-y-4">
                        {jobs.map((job) => (
                          <div
                            key={job.id}
                            className="bg-gray-700 rounded-lg overflow-hidden"
                          >
                            {/* Job Header */}
                            <div className="p-3 sm:p-4">
                              <div className="flex justify-between items-start">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-medium text-white text-sm sm:text-base truncate">
                                      {job.title}
                                    </h3>
                                    <span
                                      className={`text-xs px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded ${
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
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-400">
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                                      <span className="truncate">
                                        {job.city}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
                                      <span className="truncate">{`${job.salary_min}-${job.salary_max} ${job.type_of_money}`}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                                      <span className="truncate">
                                        {job.type}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 sm:gap-2 ml-2">
                                  <button
                                    onClick={() => handleEditJob(job)}
                                    className="p-1 text-gray-400 hover:text-white transition-colors"
                                    title={t("profile.buttons.editJob")}
                                  >
                                    <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
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
                                      <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                                    ) : (
                                      <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
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
                                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
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
