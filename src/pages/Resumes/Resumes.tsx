import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Briefcase,
  GraduationCap,
  Code,
  ChevronDown,
  MessageCircle,
  UserIcon,
  Clock,
  X,
  Calendar,
  Award,
  Building,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import {
  resumesApi,
  usersApi,
  type Resume,
  type User,
} from "../../services/api";
import ResumeViewModal from "../../pages/Profile/ResumeViewModal";
import ResumeContactModal from "../../components/Modals/ResumeContactModal";
import { useAuth } from "../../contexts/AuthContext";
import resumeApplicationsService from "../../services/resumeApplicationsService";
import { companiesApi } from "../../services/api";

const formatDateByLanguage = (dateString: string, language: string) => {
  const date = new Date(dateString);

  if (language === "ru") {
    const months = [
      "янв",
      "фев",
      "мар",
      "апр",
      "май",
      "июн",
      "июл",
      "авг",
      "сен",
      "окт",
      "ноя",
      "дек",
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month}, ${year}`;
  } else {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  }
};

interface FilterState {
  gender: string;
  profession: string;
  experience: string;
  education: string;
  institutionName: string;
  graduationYear: string;
  specialization: string;
  skillsQuery: string;
  skills: string[];
  sortBy: string;
  timeFrame: string;
  perPage: number;
}

const Resumes = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [filteredResumes, setFilteredResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfiles, setUserProfiles] = useState<Record<number, User>>({});
  const [userResumeApplications, setUserResumeApplications] = useState<
    number[]
  >([]);

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    gender: "",
    profession: "",
    experience: "",
    education: "",
    institutionName: "",
    graduationYear: "",
    specialization: "",
    skillsQuery: "",
    skills: [],
    sortBy: "relevance",
    timeFrame: "all",
    perPage: 10,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);
  const skillsInputRef = useRef<HTMLInputElement>(null);

  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);

  const [filterOptions, setFilterOptions] = useState({
    genders: [] as string[],
    professions: [] as string[],
    educations: [] as string[],
    institutions: [] as string[],
    graduationYears: [] as string[],
    specializations: [] as string[],
    skillsList: [] as string[],
  });

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1500);
      if (window.innerWidth >= 1500) {
        setIsFiltersOpen(true);
        setIsMobileFiltersOpen(false);
      } else {
        setIsFiltersOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const sortOptions = [
    { value: "relevance", label: t("resumes.sort.relevance") },
    { value: "newest", label: t("resumes.sort.newest") },
    { value: "oldest", label: t("resumes.sort.oldest") },
    { value: "experience-desc", label: t("resumes.sort.experienceDesc") },
    { value: "experience-asc", label: t("resumes.sort.experienceAsc") },
  ];

  const timeFrameOptions = [
    { value: "all", label: t("resumes.timeFrame.all") },
    { value: "today", label: t("resumes.timeFrame.today") },
    { value: "week", label: t("resumes.timeFrame.week") },
    { value: "month", label: t("resumes.timeFrame.month") },
  ];

  const perPageOptions = [
    { value: 5, label: t("resumes.perPage.resumes", { count: 5 }) },
    { value: 10, label: t("resumes.perPage.resumes", { count: 10 }) },
    { value: 15, label: t("resumes.perPage.resumes", { count: 15 }) },
  ];

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        setIsLoading(true);
        const data = await resumesApi.getAll();
        setResumes(data);
        setFilteredResumes(data);

        extractFilterOptions(data);

        const userIds = [...new Set(data.map((resume) => resume.user))];
        const userProfilesData: Record<number, User> = {};

        for (const userId of userIds) {
          try {
            const userData = await usersApi.getById(userId);
            userProfilesData[userId] = userData;
          } catch (error) {
            console.error(`Error fetching user ${userId}:`, error);
          }
        }

        setUserProfiles(userProfilesData);
        setError(null);
      } catch (err) {
        console.error("Error fetching resumes:", err);
        setError(t("resumes.errors.failedToLoad"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchResumes();
  }, [t]);

  useEffect(() => {
    const fetchApplications = async () => {
      if (!user) return;

      try {
        console.log("Current user:", user);

        if (user.role === "company") {
          const allCompanies = await companiesApi.getAll();
          const userCompany = allCompanies.find(
            (company) => company.user === Number.parseInt(user.id)
          );

          console.log("User company:", userCompany);

          if (userCompany) {
            const allApplications = await resumeApplicationsService.getAll();
            console.log("All applications:", allApplications);

            const companyApplications = allApplications.filter(
              (app) => app.company === userCompany.id
            );
            console.log("Company applications:", companyApplications);

            const contactedResumeIds = companyApplications.map(
              (app) => app.resume
            );
            console.log("Contacted resume IDs:", contactedResumeIds);

            setUserResumeApplications(contactedResumeIds);
          } else {
            console.log("No company found for user:", user.id);
            setUserResumeApplications([]);
          }
        } else if (user.role === "student") {
          const userResumes = resumes.filter(
            (resume) => resume.user === user.id
          );
          const allApplications = await resumeApplicationsService.getAll();
          const studentApplications = allApplications.filter((app) =>
            userResumes.some((resume) => resume.id === app.resume)
          );
          setUserResumeApplications(
            studentApplications.map((app) => app.resume)
          );
        }
      } catch (err) {
        console.error("Error fetching applications:", err);
      }
    };

    if (resumes.length > 0) {
      fetchApplications();
    }
  }, [user, resumes]);

  const extractFilterOptions = (data: Resume[]) => {
    const options = {
      genders: Array.from(
        new Set(data.map((resume) => resume.gender).filter(Boolean))
      ),
      professions: Array.from(
        new Set(data.map((resume) => resume.profession).filter(Boolean))
      ),
      educations: Array.from(
        new Set(data.map((resume) => resume.education).filter(Boolean))
      ),
      institutions: Array.from(
        new Set(data.map((resume) => resume.institutionName).filter(Boolean))
      ),
      graduationYears: Array.from(
        new Set(data.map((resume) => resume.graduationYear).filter(Boolean))
      ),
      specializations: Array.from(
        new Set(data.map((resume) => resume.specialization).filter(Boolean))
      ),
      skillsList: Array.from(
        new Set(
          data.flatMap((resume) =>
            typeof resume.skills === "string"
              ? resume.skills.split(",").map((skill) => skill.trim())
              : Object.keys(resume.skills || {})
          )
        )
      ),
    };

    setFilterOptions(options);
  };

  useEffect(() => {
    applyFilters();
  }, [filters, searchQuery, resumes]);

  useEffect(() => {
    if (filters.skillsQuery) {
      const query = filters.skillsQuery.toLowerCase();
      const suggestions = filterOptions.skillsList
        .filter(
          (skill) =>
            skill.toLowerCase().startsWith(query) &&
            !filters.skills.includes(skill)
        )
        .slice(0, 5);

      setSkillSuggestions(suggestions);
      setShowSkillSuggestions(suggestions.length > 0);
    } else {
      setSkillSuggestions([]);
      setShowSkillSuggestions(false);
    }
  }, [filters.skillsQuery, filterOptions.skillsList, filters.skills]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        skillsInputRef.current &&
        !skillsInputRef.current.contains(event.target as Node)
      ) {
        setShowSkillSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const applyFilters = () => {
    let filtered = [...resumes];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (resume) =>
          resume.profession?.toLowerCase().includes(query) ||
          resume.specialization?.toLowerCase().includes(query) ||
          (typeof resume.skills === "string" &&
            resume.skills.toLowerCase().includes(query))
      );
    }

    if (filters.gender) {
      filtered = filtered.filter((resume) => resume.gender === filters.gender);
    }

    if (filters.profession) {
      filtered = filtered.filter(
        (resume) => resume.profession === filters.profession
      );
    }

    if (filters.education) {
      filtered = filtered.filter(
        (resume) => resume.education === filters.education
      );
    }

    if (filters.institutionName) {
      filtered = filtered.filter((resume) =>
        resume.institutionName
          ?.toLowerCase()
          .includes(filters.institutionName.toLowerCase())
      );
    }

    if (filters.graduationYear) {
      filtered = filtered.filter((resume) =>
        resume.graduationYear
          ?.toLowerCase()
          .includes(filters.graduationYear.toLowerCase())
      );
    }

    if (filters.specialization) {
      filtered = filtered.filter((resume) =>
        resume.specialization
          ?.toLowerCase()
          .includes(filters.specialization.toLowerCase())
      );
    }

    if (filters.experience) {
      filtered = filtered.filter((resume) =>
        resume.experience
          ?.toLowerCase()
          .includes(filters.experience.toLowerCase())
      );
    }

    if (filters.skills.length > 0) {
      filtered = filtered.filter((resume) => {
        const resumeSkills =
          typeof resume.skills === "string"
            ? resume.skills.split(",").map((s) => s.trim())
            : Object.keys(resume.skills || {});

        return filters.skills.some((skill) => resumeSkills.includes(skill));
      });
    }

    if (filters.timeFrame !== "all") {
      const now = new Date();
      const cutoffDate = new Date();

      switch (filters.timeFrame) {
        case "today":
          cutoffDate.setDate(now.getDate() - 1);
          break;
        case "week":
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case "month":
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter(
        (resume) => new Date(resume.created_at) >= cutoffDate
      );
    }

    filtered = sortResumes(filtered, filters.sortBy);

    setFilteredResumes(filtered);
    setCurrentPage(1);
  };

  const sortResumes = (resumes: Resume[], sortBy: string) => {
    switch (sortBy) {
      case "newest":
        return [...resumes].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case "oldest":
        return [...resumes].sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      case "experience-desc":
        return [...resumes].sort((a, b) => {
          const aExp = a.experience || "";
          const bExp = b.experience || "";
          return bExp.localeCompare(aExp);
        });
      case "experience-asc":
        return [...resumes].sort((a, b) => {
          const aExp = a.experience || "";
          const bExp = b.experience || "";
          return aExp.localeCompare(bExp);
        });
      case "relevance":
      default:
        return resumes;
    }
  };

  const addSkill = (skill: string) => {
    if (!filters.skills.includes(skill)) {
      setFilters((prev) => ({
        ...prev,
        skills: [...prev.skills, skill],
        skillsQuery: "",
      }));
    }
    setShowSkillSuggestions(false);
  };

  const removeSkill = (skill: string) => {
    setFilters((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const isAnyFilterActive = () => {
    return (
      filters.gender !== "" ||
      filters.profession !== "" ||
      filters.education !== "" ||
      filters.institutionName !== "" ||
      filters.graduationYear !== "" ||
      filters.specialization !== "" ||
      filters.experience !== "" ||
      filters.skills.length > 0
    );
  };

  const clearAllFilters = () => {
    setFilters({
      gender: "",
      profession: "",
      experience: "",
      education: "",
      institutionName: "",
      graduationYear: "",
      specialization: "",
      skillsQuery: "",
      skills: [],
      sortBy: filters.sortBy,
      timeFrame: filters.timeFrame,
      perPage: filters.perPage,
    });
    setSearchQuery("");
  };

  const handleViewProfile = (resume: Resume) => {
    setSelectedResume(resume);
    setShowResumeModal(true);
  };

  const handleContact = (resume: Resume) => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role !== "company") {
      alert(t("resumes.errors.onlyCompaniesCanContact"));
      return;
    }

    setSelectedResume(resume);
    setShowContactModal(true);
  };

  const handleContactSuccess = (chatId: string) => {
    if (selectedResume && user) {
      setUserResumeApplications((prev) => {
        const updated = [...prev, selectedResume.id];
        console.log("Updated applications after contact:", updated);
        return updated;
      });
    }

    setTimeout(async () => {
      if (user && user.role === "company") {
        try {
          const allCompanies = await companiesApi.getAll();
          const userCompany = allCompanies.find(
            (company) => company.user === Number.parseInt(user.id)
          );

          if (userCompany) {
            const allApplications = await resumeApplicationsService.getAll();
            const companyApplications = allApplications.filter(
              (app) => app.company === userCompany.id
            );
            const contactedResumeIds = companyApplications.map(
              (app) => app.resume
            );
            setUserResumeApplications(contactedResumeIds);
          }
        } catch (error) {
          console.error("Error refreshing applications:", error);
        }
      }
    }, 1000);

    navigate(`/chat/${chatId}`);
  };

  const formatDate = useCallback(
    (dateString: string) => {
      return formatDateByLanguage(dateString, i18n.language);
    },
    [i18n.language]
  );

  const getPaginatedResumes = () => {
    const startIndex = (currentPage - 1) * filters.perPage;
    return filteredResumes.slice(startIndex, startIndex + filters.perPage);
  };

  const totalPages = Math.ceil(filteredResumes.length / filters.perPage);

  const parseSkills = (skills: any): string[] => {
    if (!skills) return [];

    if (typeof skills === "string") {
      return skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);
    }

    if (typeof skills === "object") {
      return Object.keys(skills).filter(Boolean);
    }

    return [];
  };

  const getUserAvatar = (userId: number) => {
    if (userProfiles[userId] && userProfiles[userId].avatar) {
      return userProfiles[userId].avatar;
    }
    return `/placeholder.svg?height=100&width=100`;
  };

  const hasContactedResume = (resumeId: number) => {
    const result = userResumeApplications.includes(resumeId);
    console.log(
      `Checking resume ${resumeId}, contacted: ${result}`,
      userResumeApplications
    );
    return result;
  };

  const getActiveFilters = () => {
    const activeFilters = [];

    if (filters.gender) {
      activeFilters.push({
        label: t("resumes.activeFilters.gender", { gender: filters.gender }),
        clear: () => updateFilter("gender", ""),
      });
    }

    if (filters.profession) {
      activeFilters.push({
        label: t("resumes.activeFilters.profession", {
          profession: filters.profession,
        }),
        clear: () => updateFilter("profession", ""),
      });
    }

    if (filters.education) {
      activeFilters.push({
        label: t("resumes.activeFilters.education", {
          education: filters.education,
        }),
        clear: () => updateFilter("education", ""),
      });
    }

    if (filters.experience) {
      activeFilters.push({
        label: t("resumes.activeFilters.experience", {
          experience: filters.experience,
        }),
        clear: () => updateFilter("experience", ""),
      });
    }

    if (filters.institutionName) {
      activeFilters.push({
        label: t("resumes.activeFilters.institution", {
          institution: filters.institutionName,
        }),
        clear: () => updateFilter("institutionName", ""),
      });
    }

    if (filters.graduationYear) {
      activeFilters.push({
        label: t("resumes.activeFilters.graduationYear", {
          year: filters.graduationYear,
        }),
        clear: () => updateFilter("graduationYear", ""),
      });
    }

    if (filters.specialization) {
      activeFilters.push({
        label: t("resumes.activeFilters.specialization", {
          specialization: filters.specialization,
        }),
        clear: () => updateFilter("specialization", ""),
      });
    }

    filters.skills.forEach((skill) => {
      activeFilters.push({
        label: t("resumes.activeFilters.skill", { skill }),
        clear: () => removeSkill(skill),
      });
    });

    return activeFilters;
  };

  const activeFilters = getActiveFilters();

  // Filter Component
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Gender Filter */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-emerald-400" />
          {t("resumes.filters.gender.title")}
        </h3>
        <div className="relative">
          <select
            value={filters.gender}
            onChange={(e) => updateFilter("gender", e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">{t("resumes.filters.gender.all")}</option>
            {filterOptions.genders.map((gender) => (
              <option key={gender} value={gender}>
                {gender}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Profession Filter */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-emerald-400" />
          {t("resumes.filters.profession.title")}
        </h3>
        <div className="relative">
          <select
            value={filters.profession}
            onChange={(e) => updateFilter("profession", e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">{t("resumes.filters.profession.all")}</option>
            {filterOptions.professions.map((profession) => (
              <option key={profession} value={profession}>
                {profession}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Experience Filter */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-400" />
          {t("resumes.filters.experience.title")}
        </h3>
        <input
          type="text"
          value={filters.experience}
          onChange={(e) => updateFilter("experience", e.target.value)}
          placeholder={t("resumes.filters.experience.placeholder")}
          className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Education Filter */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-emerald-400" />
          {t("resumes.filters.education.title")}
        </h3>
        <div className="relative">
          <select
            value={filters.education}
            onChange={(e) => updateFilter("education", e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">{t("resumes.filters.education.all")}</option>
            {filterOptions.educations.map((education) => (
              <option key={education} value={education}>
                {education}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Institution Name Filter */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Building className="w-5 h-5 text-emerald-400" />
          {t("resumes.filters.institution.title")}
        </h3>
        <input
          type="text"
          value={filters.institutionName}
          onChange={(e) => updateFilter("institutionName", e.target.value)}
          placeholder={t("resumes.filters.institution.placeholder")}
          className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Graduation Year Filter */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-400" />
          {t("resumes.filters.graduationYear.title")}
        </h3>
        <input
          type="text"
          value={filters.graduationYear}
          onChange={(e) => updateFilter("graduationYear", e.target.value)}
          placeholder={t("resumes.filters.graduationYear.placeholder")}
          className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Specialization Filter */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          {t("resumes.filters.specialization.title")}
        </h3>
        <input
          type="text"
          value={filters.specialization}
          onChange={(e) => updateFilter("specialization", e.target.value)}
          placeholder={t("resumes.filters.specialization.placeholder")}
          className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Skills Filter */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Code className="w-5 h-5 text-emerald-400" />
          {t("resumes.filters.skills.title")}
        </h3>
        <div className="relative" ref={skillsInputRef}>
          <input
            type="text"
            value={filters.skillsQuery}
            onChange={(e) => updateFilter("skillsQuery", e.target.value)}
            placeholder={t("resumes.filters.skills.placeholder")}
            className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            onFocus={() => setShowSkillSuggestions(skillSuggestions.length > 0)}
          />

          {/* Skills suggestions dropdown */}
          {showSkillSuggestions && (
            <div className="absolute z-10 mt-1 w-full bg-gray-700 rounded-lg shadow-lg max-h-40 overflow-y-auto">
              {skillSuggestions.map((skill, index) => (
                <div
                  key={index}
                  className="px-3 py-2 hover:bg-gray-600 cursor-pointer text-white"
                  onClick={() => addSkill(skill)}
                >
                  {skill}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected skills */}
        {filters.skills.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {filters.skills.map((skill, index) => (
              <div
                key={index}
                className="flex items-center gap-1 bg-gray-700 text-white px-3 py-1 rounded-full text-sm"
              >
                <span>{skill}</span>
                <button
                  onClick={() => removeSkill(skill)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="pt-16 sm:pt-20 bg-gray-900 min-h-screen">
      {/* Search Header */}
      <div className="bg-gray-800 border-b border-gray-700 mt-5 sm:mt-0">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-4">
            <div className="flex items-center gap-4 bg-gray-900/50 rounded-lg p-3 flex-1">
              <Search className="w-5 h-5 sm:w-5 sm:h-5 text-gray-400 ml-1" />
              <input
                type="text"
                placeholder={t("resumes.search.placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-400 text-base sm:text-lg"
              />
            </div>
            <button
              onClick={() => {
                if (isMobile) {
                  setIsMobileFiltersOpen(true);
                } else {
                  setIsFiltersOpen(!isFiltersOpen);
                }
              }}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors whitespace-nowrap"
            >
              <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">
                {t("resumes.search.filters")}
              </span>
              <span className="sm:hidden">Фильтры</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notification for resume responses - only show for students */}
      {user && user.role === "student" && userResumeApplications.length > 0 && (
        <div className="bg-emerald-600/20 border border-emerald-600/30 rounded-lg p-4 mx-4 mt-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium text-sm sm:text-base">
              {t("resumes.notifications.resumeResponses", {
                count: userResumeApplications.length,
              })}
            </span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex gap-6 lg:gap-8">
          {/* Desktop Filters Sidebar */}
          {!isMobile && (
            <motion.div
              initial={false}
              animate={{ width: isFiltersOpen ? "400px" : 0 }}
              className="flex-shrink-0 overflow-hidden"
            >
              <div className="bg-gray-800 rounded-lg p-6 min-w-[400px]">
                <FilterContent />
              </div>
            </motion.div>
          )}

          {/* Mobile Filters Modal */}
          <AnimatePresence>
            {isMobileFiltersOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 z-40"
                  style={{ display: isMobile ? "block" : "none" }}
                  onClick={() => setIsMobileFiltersOpen(false)}
                />
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="fixed left-0 top-0 bottom-0 w-80 max-w-[90vw] bg-gray-800 z-50 overflow-y-auto"
                  style={{ display: isMobile ? "block" : "none" }}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-white">Фильтры</h2>
                      <button
                        onClick={() => setIsMobileFiltersOpen(false)}
                        className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    <FilterContent />
                    <div className="mt-6 pt-6 border-t border-gray-700 bottom-0 bg-gray-800 -mx-6 px-6">
                      <button
                        onClick={() => setIsMobileFiltersOpen(false)}
                        className="w-full px-4 py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors font-medium text-base"
                      >
                        Применить фильтры
                      </button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Top Filters */}
            <div className="bg-gray-800 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                {/* Left group - Sort and Time filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                  {/* Sort Dropdown */}
                  <div className="relative min-w-[200px]">
                    <select
                      value={filters.sortBy}
                      onChange={(e) => updateFilter("sortBy", e.target.value)}
                      className="appearance-none bg-gray-700 text-white px-3 sm:px-4 py-2 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full text-sm sm:text-base cursor-pointer"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Time Frame Dropdown */}
                  <div className="relative min-w-[180px]">
                    <select
                      value={filters.timeFrame}
                      onChange={(e) =>
                        updateFilter("timeFrame", e.target.value)
                      }
                      className="appearance-none bg-gray-700 text-white px-3 sm:px-4 py-2 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full text-sm sm:text-base cursor-pointer"
                    >
                      {timeFrameOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Right filter (Per Page) */}
                <div className="relative min-w-[140px]">
                  <select
                    value={filters.perPage}
                    onChange={(e) =>
                      updateFilter("perPage", Number.parseInt(e.target.value))
                    }
                    className="appearance-none bg-gray-700 text-white px-3 sm:px-4 py-2 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full text-sm sm:text-base cursor-pointer"
                  >
                    {perPageOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {activeFilters.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-4 mb-4 sm:mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base sm:text-lg font-semibold text-white">
                    {t("resumes.activeFilters.title")}
                  </h3>
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-emerald-400 hover:text-emerald-300"
                  >
                    {t("resumes.activeFilters.clearAll")}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeFilters.map((filter, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-gray-700 text-white px-3 py-1 rounded-full text-sm"
                    >
                      <span className="truncate max-w-[200px] sm:max-w-none">
                        {filter.label}
                      </span>
                      <button
                        onClick={filter.clear}
                        className="text-gray-400 hover:text-white flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-12 bg-gray-800 rounded-lg">
                <p className="text-gray-400 text-lg">
                  {t("resumes.errors.loading")}
                </p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-12 bg-gray-800 rounded-lg">
                <p className="text-red-400 text-lg">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
                >
                  {t("resumes.errors.tryAgain")}
                </button>
              </div>
            )}

            {/* Resume Cards */}
            {!isLoading && !error && (
              <div className="space-y-4 sm:space-y-6">
                {getPaginatedResumes().map((resume) => {
                  const resumeContacted = hasContactedResume(resume.id);

                  return (
                    <div
                      key={resume.id}
                      className={`bg-gray-800 rounded-lg p-4 sm:p-6 hover:bg-gray-750 transition-colors overflow-hidden ${
                        resumeContacted ? "opacity-70" : ""
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex items-start gap-3 sm:gap-4 flex-1">
                          {/* Profile Photo */}
                          <div
                            className={`flex-shrink-0 ${
                              resumeContacted ? "opacity-70" : ""
                            }`}
                          >
                            {getUserAvatar(resume.user) &&
                            getUserAvatar(resume.user) !==
                              "/placeholder.svg?height=100&width=100" ? (
                              <img
                                src={
                                  getUserAvatar(resume.user) ||
                                  "/placeholder.svg"
                                }
                                alt={
                                  resume.profession ||
                                  t("resumes.card.profileAlt")
                                }
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover bg-gray-700"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = `/placeholder.svg?height=100&width=100`;
                                }}
                              />
                            ) : (
                              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-700 rounded-lg flex items-center justify-center">
                                <UserIcon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-500" />
                              </div>
                            )}
                          </div>

                          {/* Main Content */}
                          <div
                            className={`flex-1 min-w-0 ${
                              resumeContacted ? "opacity-70" : ""
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 break-words">
                                  {resume.profession ||
                                    t("resumes.card.untitledResume")}
                                </h3>
                                <div className="flex items-center gap-2 text-gray-400 text-sm sm:text-base">
                                  <UserIcon className="w-4 h-4 flex-shrink-0" />
                                  <span className="truncate">
                                    {resume.gender ||
                                      t("resumes.card.notSpecified")}
                                  </span>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                {user && user.role === "company" && (
                                  <>
                                    {resumeContacted ? (
                                      <div className="flex items-center justify-center gap-2 text-emerald-400 px-4 py-2 bg-emerald-600/20 rounded-lg w-full sm:w-auto">
                                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                                        <span className="text-sm sm:text-base">
                                          {t("resumes.card.alreadyContacted")}
                                        </span>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => handleContact(resume)}
                                        className="w-full sm:w-auto px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                                      >
                                        <MessageCircle className="w-4 h-4" />
                                        {t("resumes.actions.contact")}
                                      </button>
                                    )}
                                  </>
                                )}
                                {/* View Profile button - always normal styling */}
                                <button
                                  onClick={() => handleViewProfile(resume)}
                                  className="w-full sm:w-auto px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                                >
                                  <UserIcon className="w-4 h-4" />
                                  {t("resumes.actions.viewProfile")}
                                </button>
                              </div>
                            </div>

                            {/* Skills */}
                            <div className="mb-4">
                              <div className="flex flex-wrap gap-2">
                                {parseSkills(resume.skills)
                                  .slice(0, isMobile ? 4 : 8)
                                  .map((skill, index) => (
                                    <span
                                      key={index}
                                      className="px-2 sm:px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-xs sm:text-sm"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                {parseSkills(resume.skills).length >
                                  (isMobile ? 4 : 8) && (
                                  <span className="px-2 sm:px-3 py-1 bg-gray-700 text-gray-400 rounded-full text-xs sm:text-sm">
                                    +
                                    {parseSkills(resume.skills).length -
                                      (isMobile ? 4 : 8)}{" "}
                                    еще
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 sm:mt-8 space-y-3 sm:space-y-4">
                              {/* Experience */}
                              <div className="flex gap-2">
                                <div className="w-6 flex justify-center pt-1">
                                  <Award className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm sm:text-base">
                                    {t("resumes.card.experience")}:
                                  </div>
                                  <div className="text-sm sm:text-base break-words">
                                    {resume.experience ||
                                      t("resumes.card.noExperience")}
                                  </div>
                                </div>
                              </div>

                              {/* Education */}
                              <div className="flex gap-2">
                                <div className="w-6 flex justify-center pt-1">
                                  <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm sm:text-base">
                                    {t("resumes.card.education")}:
                                  </div>
                                  <div className="text-sm sm:text-base break-words">
                                    {resume.education ||
                                      t("resumes.card.notSpecified")}
                                  </div>
                                </div>
                              </div>

                              {/* Specialization */}
                              <div className="flex gap-2">
                                <div className="w-6 flex justify-center pt-1">
                                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm sm:text-base">
                                    {t("resumes.card.specialization")}:
                                  </div>
                                  <div className="text-sm sm:text-base break-words">
                                    {resume.specialization ||
                                      t("resumes.card.notSpecified")}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Date */}
                            <div className="mt-4 flex justify-end items-center text-xs sm:text-sm">
                              <div className="flex items-center gap-2 text-gray-500">
                                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>
                                  {t("resumes.card.created")}:{" "}
                                  {formatDate(resume.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {!isLoading && !error && filteredResumes.length > 0 && (
              <div className="flex justify-center mt-6 sm:mt-8">
                <nav className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 sm:px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    {t("resumes.pagination.previous")}
                  </button>

                  {/* Mobile: Show only current page and total */}
                  {isMobile ? (
                    <span className="px-3 py-2 text-gray-400 text-sm">
                      {currentPage} / {totalPages}
                    </span>
                  ) : (
                    /* Desktop: Show all pages */
                    Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      // Show pages around current page
                      let pageNum = i + 1;
                      if (totalPages > 5) {
                        if (currentPage > 3) {
                          pageNum = currentPage - 3 + i;
                        }
                        if (
                          pageNum > totalPages - 4 &&
                          currentPage > totalPages - 2
                        ) {
                          pageNum = totalPages - 4 + i;
                        }
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            pageNum === currentPage
                              ? "bg-emerald-600 text-white"
                              : "bg-gray-800 text-white hover:bg-gray-700"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })
                  )}

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 sm:px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    {t("resumes.pagination.next")}
                  </button>
                </nav>
              </div>
            )}

            {/* No Results */}
            {!isLoading && !error && filteredResumes.length === 0 && (
              <div className="text-center py-12 bg-gray-800 rounded-lg">
                <p className="text-gray-400 text-base sm:text-lg">
                  {t("resumes.noResults.message")}
                </p>
                <button
                  onClick={clearAllFilters}
                  className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors text-sm sm:text-base"
                >
                  {t("resumes.noResults.clearFilters")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Filter Button for Mobile */}
      {isMobile && !isMobileFiltersOpen && (
        <button
          onClick={() => setIsMobileFiltersOpen(true)}
          className="fixed bottom-6 right-6 z-30 w-14 h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
        >
          <Filter className="w-6 h-6" />
        </button>
      )}

      {/* Resume View Modal */}
      {selectedResume && (
        <ResumeViewModal
          isOpen={showResumeModal}
          onClose={() => setShowResumeModal(false)}
          resume={selectedResume}
        />
      )}

      {/* Resume Contact Modal */}
      {selectedResume && (
        <ResumeContactModal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          onSuccess={handleContactSuccess}
          resume={selectedResume}
          resumeUser={userProfiles[selectedResume.user]}
        />
      )}

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #374151;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default Resumes;
