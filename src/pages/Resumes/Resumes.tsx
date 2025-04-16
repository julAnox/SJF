"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
} from "lucide-react";
import {
  resumesApi,
  usersApi,
  type Resume,
  type User,
} from "../../services/api";
import ResumeViewModal from "../../pages/Profile/ResumeViewModal";
import ContactModal from "../../components/Modals/ContactModal";
import { useAuth } from "../../contexts/AuthContext";

// Define filter state interface
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State for resumes and loading
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [filteredResumes, setFilteredResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfiles, setUserProfiles] = useState<Record<number, User>>({});

  // State for filters
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
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

  // State for search and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);
  const skillsInputRef = useRef<HTMLInputElement>(null);

  // State for modals
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);

  // Filter options (will be populated from data)
  const [filterOptions, setFilterOptions] = useState({
    genders: [] as string[],
    professions: [] as string[],
    educations: [] as string[],
    institutions: [] as string[],
    graduationYears: [] as string[],
    specializations: [] as string[],
    skillsList: [] as string[],
  });

  // Sort and time frame options
  const sortOptions = [
    { value: "relevance", label: "Most Relevant" },
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
    { value: "experience-desc", label: "Most Experience" },
    { value: "experience-asc", label: "Least Experience" },
  ];

  const timeFrameOptions = [
    { value: "all", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
  ];

  const perPageOptions = [
    { value: 10, label: "10 Resumes" },
    { value: 20, label: "20 Resumes" },
    { value: 50, label: "50 Resumes" },
  ];

  // Fetch resumes from API
  useEffect(() => {
    const fetchResumes = async () => {
      try {
        setIsLoading(true);
        const data = await resumesApi.getAll();
        setResumes(data);
        setFilteredResumes(data);

        // Extract unique filter options from data
        extractFilterOptions(data);

        // Fetch user profiles for all resumes
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
        setError("Failed to load resumes. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchResumes();
  }, []);

  // Extract filter options from resume data
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

  // Apply filters when filters or search query changes
  useEffect(() => {
    applyFilters();
  }, [filters, searchQuery, resumes]);

  // Update skill suggestions when skillsQuery changes
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

  // Handle click outside skill suggestions
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

  // Apply all filters to resumes
  const applyFilters = () => {
    let filtered = [...resumes];

    // Apply search filter
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

    // Apply category filters
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

    // Apply time frame filter
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

    // Apply sorting
    filtered = sortResumes(filtered, filters.sortBy);

    setFilteredResumes(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Sort resumes based on selected sort option
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

  // Add a skill from suggestions
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

  // Remove a skill
  const removeSkill = (skill: string) => {
    setFilters((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  // Update a filter value
  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Check if any filter is active
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

  // Clear all filters
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

  // Handle view profile button click
  const handleViewProfile = (resume: Resume) => {
    setSelectedResume(resume);
    setShowResumeModal(true);
  };

  // Handle contact button click
  const handleContact = (resume: Resume) => {
    setSelectedResume(resume);
    setShowContactModal(true);
  };

  // Handle contact form submission
  const handleContactSubmit = (message: string) => {
    if (!selectedResume) return;

    // Create a new chat
    const chats = JSON.parse(localStorage.getItem("chats") || "{}");
    const chatId = `chat_${Date.now()}`;

    const newChat = {
      id: chatId,
      companyId: selectedResume.user.toString(),
      companyName: selectedResume.profession || "User",
      messages: [
        {
          id: Date.now().toString(),
          senderId: "currentUser",
          type: "text",
          content: message,
          timestamp: new Date().toISOString(),
        },
      ],
      lastMessage: message,
      timestamp: new Date().toISOString(),
      status: "active",
    };

    chats[chatId] = newChat;
    localStorage.setItem("chats", JSON.stringify(chats));

    // Navigate to the new chat
    navigate(`/chat/${chatId}`);
    setShowContactModal(false);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  // Get paginated resumes
  const getPaginatedResumes = () => {
    const startIndex = (currentPage - 1) * filters.perPage;
    return filteredResumes.slice(startIndex, startIndex + filters.perPage);
  };

  // Calculate total pages
  const totalPages = Math.ceil(filteredResumes.length / filters.perPage);

  // Parse skills from string or object
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

  // Get user avatar URL
  const getUserAvatar = (userId: number) => {
    if (userProfiles[userId] && userProfiles[userId].avatar) {
      return userProfiles[userId].avatar;
    }
    return `/placeholder.svg?height=100&width=100`;
  };

  // Get active filters for display
  const getActiveFilters = () => {
    const activeFilters = [];

    if (filters.gender) {
      activeFilters.push({
        label: `Gender: ${filters.gender}`,
        clear: () => updateFilter("gender", ""),
      });
    }

    if (filters.profession) {
      activeFilters.push({
        label: `Profession: ${filters.profession}`,
        clear: () => updateFilter("profession", ""),
      });
    }

    if (filters.education) {
      activeFilters.push({
        label: `Education: ${filters.education}`,
        clear: () => updateFilter("education", ""),
      });
    }

    if (filters.experience) {
      activeFilters.push({
        label: `Experience: ${filters.experience}`,
        clear: () => updateFilter("experience", ""),
      });
    }

    if (filters.institutionName) {
      activeFilters.push({
        label: `Institution: ${filters.institutionName}`,
        clear: () => updateFilter("institutionName", ""),
      });
    }

    if (filters.graduationYear) {
      activeFilters.push({
        label: `Graduation Year: ${filters.graduationYear}`,
        clear: () => updateFilter("graduationYear", ""),
      });
    }

    if (filters.specialization) {
      activeFilters.push({
        label: `Specialization: ${filters.specialization}`,
        clear: () => updateFilter("specialization", ""),
      });
    }

    filters.skills.forEach((skill) => {
      activeFilters.push({
        label: `Skill: ${skill}`,
        clear: () => removeSkill(skill),
      });
    });

    return activeFilters;
  };

  const activeFilters = getActiveFilters();

  return (
    <div className="pt-20 min-h-screen bg-gray-900">
      {/* Search Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 bg-gray-900/50 rounded-lg p-2">
            <Search className="w-6 h-6 text-gray-400 ml-2" />
            <input
              type="text"
              placeholder="Search for resumes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-400 text-lg"
            />
            <button
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <motion.div
            initial={false}
            animate={{ width: isFiltersOpen ? "auto" : 0 }}
            className={`${
              isFiltersOpen ? "w-80" : "w-0"
            } flex-shrink-0 overflow-hidden`}
          >
            <div className="bg-gray-800 rounded-lg p-6 space-y-7">
              {/* Gender Filter */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-emerald-400" />
                  Gender
                </h3>
                <div className="relative">
                  <select
                    value={filters.gender}
                    onChange={(e) => updateFilter("gender", e.target.value)}
                    className="w-[400px] px-3 py-2 bg-gray-700 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">All Genders</option>
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
                  Profession
                </h3>
                <div className="relative">
                  <select
                    value={filters.profession}
                    onChange={(e) => updateFilter("profession", e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">All Professions</option>
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
                  Experience
                </h3>
                <input
                  type="text"
                  value={filters.experience}
                  onChange={(e) => updateFilter("experience", e.target.value)}
                  placeholder="Enter experience"
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Education Filter */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-emerald-400" />
                  Education
                </h3>
                <div className="relative">
                  <select
                    value={filters.education}
                    onChange={(e) => updateFilter("education", e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">All Education Levels</option>
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
                  Institution
                </h3>
                <input
                  type="text"
                  value={filters.institutionName}
                  onChange={(e) =>
                    updateFilter("institutionName", e.target.value)
                  }
                  placeholder="Enter institution name"
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Graduation Year Filter */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                  Graduation Year
                </h3>
                <input
                  type="text"
                  value={filters.graduationYear}
                  onChange={(e) =>
                    updateFilter("graduationYear", e.target.value)
                  }
                  placeholder="Enter graduation year"
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Specialization Filter */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  Specialization
                </h3>
                <input
                  type="text"
                  value={filters.specialization}
                  onChange={(e) =>
                    updateFilter("specialization", e.target.value)
                  }
                  placeholder="Enter specialization"
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Skills Filter */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Code className="w-5 h-5 text-emerald-400" />
                  Skills
                </h3>
                <div className="relative" ref={skillsInputRef}>
                  <input
                    type="text"
                    value={filters.skillsQuery}
                    onChange={(e) =>
                      updateFilter("skillsQuery", e.target.value)
                    }
                    placeholder="Search for skills..."
                    className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    onFocus={() =>
                      setShowSkillSuggestions(skillSuggestions.length > 0)
                    }
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
                        className="flex items-center gap-1 bg-gray-700 text-white px-2 py-1 rounded-full text-sm"
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
          </motion.div>

          {/* Main Content */}
          <div className="flex-grow">
            {/* Top Filters */}
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4 bg-gray-800 rounded-lg p-4">
              <div className="flex flex-wrap gap-4">
                {/* Sort Dropdown */}
                <div className="relative">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => updateFilter("sortBy", e.target.value)}
                    className="appearance-none bg-gray-700 text-white px-4 py-2 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="relevance">Most Relevant</option>
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="experience-desc">Most Experience</option>
                    <option value="experience-asc">Least Experience</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-4 h-4" />
                </div>

                {/* Time Frame Dropdown */}
                <div className="relative">
                  <select
                    value={filters.timeFrame}
                    onChange={(e) => updateFilter("timeFrame", e.target.value)}
                    className="appearance-none bg-gray-700 text-white px-4 py-2 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-4 h-4" />
                </div>
              </div>

              {/* Per Page Dropdown */}
              <div className="relative">
                <select
                  value={filters.perPage}
                  onChange={(e) =>
                    updateFilter("perPage", Number.parseInt(e.target.value))
                  }
                  className="appearance-none bg-gray-700 text-white px-4 py-2 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={10}>10 Resumes</option>
                  <option value={20}>20 Resumes</option>
                  <option value={50}>50 Resumes</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-4 h-4" />
              </div>
            </div>

            {/* Active Filters */}
            {activeFilters.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">
                    Active Filters
                  </h3>
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-emerald-400 hover:text-emerald-300"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeFilters.map((filter, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-gray-700 text-white px-3 py-1 rounded-full"
                    >
                      <span>{filter.label}</span>
                      <button
                        onClick={filter.clear}
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resume Cards - Update the layout */}
            {!isLoading && !error && (
              <div className="space-y-6">
                {getPaginatedResumes().map((resume) => (
                  <div
                    key={resume.id}
                    className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex gap-6">
                      {/* Profile Photo */}
                      <div className="flex-shrink-0">
                        {getUserAvatar(resume.user) &&
                        getUserAvatar(resume.user) !==
                          "/placeholder.svg?height=100&width=100" ? (
                          <img
                            src={
                              getUserAvatar(resume.user) || "/placeholder.svg"
                            }
                            alt={resume.profession || "Profile"}
                            className="w-24 h-24 rounded-lg object-cover bg-gray-700"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `/placeholder.svg?height=100&width=100`;
                            }}
                          />
                        ) : (
                          <div className="w-24 h-24 bg-gray-700 rounded-lg flex items-center justify-center">
                            <UserIcon className="w-12 h-12 text-gray-500" />
                          </div>
                        )}
                      </div>

                      {/* Main Content */}
                      <div className="flex-grow">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-white mb-2">
                              {resume.profession || "Untitled Resume"}
                            </h3>
                            <div className="flex items-center gap-2 text-gray-400">
                              <UserIcon className="w-4 h-4" />
                              <span>{resume.gender || "Not specified"}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleContact(resume)}
                              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors flex items-center gap-2"
                            >
                              <MessageCircle className="w-4 h-4" />
                              Contact
                            </button>
                            <button
                              onClick={() => handleViewProfile(resume)}
                              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                            >
                              <UserIcon className="w-4 h-4" />
                              View Profile
                            </button>
                          </div>
                        </div>

                        {/* Skills */}
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-2">
                            {parseSkills(resume.skills).map((skill, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="mt-4 space-y-4">
                          {/* Experience */}
                          <div className="flex gap-2 ">
                            <div className="w-6 flex justify-center pt-1">
                              <Award className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                              <div className="font-semibold">Experience:</div>
                              <div>
                                {resume.experience ||
                                  "No experience information provided"}
                              </div>
                            </div>
                          </div>

                          {/* Education */}
                          <div className="flex gap-2">
                            <div className="w-6 flex justify-center pt-1">
                              <GraduationCap className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                              <div className="font-semibold">Education:</div>
                              <div>{resume.education || "Not specified"}</div>
                            </div>
                          </div>

                          {/* Specialization */}
                          <div className="flex gap-2">
                            <div className="w-6 flex justify-center pt-1">
                              <Sparkles className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                              <div className="font-semibold">
                                Specialization:
                              </div>
                              <div>
                                {resume.specialization || "Not specified"}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Date */}
                        <div className="mt-4 flex justify-end items-center text-sm">
                          <div className="flex items-center gap-2 text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span>
                              Created: {formatDate(resume.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!isLoading && !error && filteredResumes.length > 0 && (
              <div className="flex justify-center mt-8">
                <nav className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
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
                  })}
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}

            {/* No Results */}
            {!isLoading && !error && filteredResumes.length === 0 && (
              <div className="text-center py-12 bg-gray-800 rounded-lg">
                <p className="text-gray-400 text-lg">
                  No resumes found matching your filters.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resume View Modal */}
      {selectedResume && (
        <ResumeViewModal
          isOpen={showResumeModal}
          onClose={() => setShowResumeModal(false)}
          resume={selectedResume}
        />
      )}

      {/* Contact Modal */}
      {selectedResume && (
        <ContactModal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          onSubmit={handleContactSubmit}
          recipientName={selectedResume.profession || "User"}
          recipientId={selectedResume.user.toString()}
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
