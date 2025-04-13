import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { resumesApi, Resume } from "../../services/api";
import {
  SearchIcon,
  FilterIcon,
  MapPinIcon,
  TrainIcon,
  BriefcaseIcon,
  GraduationCapIcon,
  LanguagesIcon,
  TagIcon,
  ClockIcon,
  ChevronDownIcon,
  XIcon,
  BanknoteIcon,
  MessageCircleIcon,
  UserIcon,
} from "lucide-react";
import ProfileModal from "../../components/Modals/ProfileModal";
import ContactModal from "../../components/Modals/ContactModal";

interface FilterState {
  city: string;
  metro: string;
  experienceRange: [number, number];
  salaryRange: [number, number];
  availability: string[];
  skills: string[];
  languages: string[];
  education: string[];
  sortBy: string;
  timeFrame: string;
  perPage: number;
}

const Resumes = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    city: "",
    metro: "",
    experienceRange: [0, 10],
    salaryRange: [50000, 300000],
    availability: [],
    skills: [],
    languages: [],
    education: [],
    sortBy: "relevance",
    timeFrame: "all",
    perPage: 20,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        setIsLoading(true);
        const data = await resumesApi.getAll();

        // Transform the skills and languages from string to array if needed
        const transformedResumes = data.map((resume) => ({
          ...resume,
          skills:
            typeof resume.skills === "string"
              ? JSON.parse(resume.skills)
              : resume.skills,
          languages:
            typeof resume.languages === "string"
              ? JSON.parse(resume.languages)
              : resume.languages,
        }));

        setResumes(transformedResumes);
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

  // Extract unique values from resumes data
  const availabilityOptions = Array.from(
    new Set(resumes.map((resume) => resume.availability))
  );
  const skillsOptions = Array.from(
    new Set(resumes.flatMap((resume) => resume.skills))
  );
  const languageOptions = Array.from(
    new Set(resumes.flatMap((resume) => resume.languages))
  );
  const educationOptions = Array.from(
    new Set(resumes.map((resume) => resume.degree))
  );

  const sortOptions = [
    { value: "relevance", label: t("resumes.sort.relevance") },
    { value: "lastActive", label: t("resumes.sort.lastActive") },
    { value: "experience-desc", label: t("resumes.sort.experienceDesc") },
    { value: "experience-asc", label: t("resumes.sort.experienceAsc") },
    { value: "salary-desc", label: t("resumes.sort.salaryDesc") },
    { value: "salary-asc", label: t("resumes.sort.salaryAsc") },
  ];

  const timeFrameOptions = [
    { value: "all", label: t("resumes.timeFrame.all") },
    { value: "today", label: t("resumes.timeFrame.today") },
    { value: "week", label: t("resumes.timeFrame.week") },
    { value: "month", label: t("resumes.timeFrame.month") },
  ];

  const perPageOptions = [10, 20, 50];

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1);
  };

  const toggleFilter = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((item: string) => item !== value)
        : [...prev[key], value],
    }));
    setCurrentPage(1);
  };

  const clearFilter = (key: keyof FilterState) => {
    setFilters((prev) => ({
      ...prev,
      [key]: Array.isArray(prev[key]) ? [] : "",
    }));
  };

  const formatSalary = (value: number) => {
    return new Intl.NumberFormat("ru-RU").format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return t("resumes.date.today");
    } else if (days === 1) {
      return t("resumes.date.yesterday");
    } else if (days < 7) {
      return t("resumes.date.daysAgo", { days });
    } else {
      return new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date);
    }
  };

  const handleContact = (resume: Resume) => {
    setSelectedResume(resume);
    setShowContactModal(true);
  };

  const handleViewProfile = (resume: Resume) => {
    setSelectedResume(resume);
    setShowProfileModal(true);
  };

  const handleContactSubmit = async (message: string) => {
    if (!selectedResume) return;

    try {
      // Create a new chat
      const chats = JSON.parse(localStorage.getItem("chats") || "{}");
      const chatId = `chat_${Date.now()}`;

      const newChat = {
        id: chatId,
        userId: selectedResume.user,
        userName: selectedResume.title,
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

      // Navigate to chat
      navigate(`/chat/${chatId}`);
      setShowContactModal(false);
    } catch (error) {
      console.error("Error creating chat:", error);
      alert("Failed to send message. Please try again.");
    }
  };

  // Filter and sort resumes
  const filteredResumes = resumes
    .filter((resume) => {
      const matchesSearch =
        resume.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resume.skills.some((skill) =>
          skill.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesCity =
        !filters.city ||
        resume.city.toLowerCase().includes(filters.city.toLowerCase());
      const matchesMetro =
        !filters.metro ||
        resume.metro.toLowerCase().includes(filters.metro.toLowerCase());
      const matchesSalary =
        resume.expected_salary >= filters.salaryRange[0] &&
        resume.expected_salary <= filters.salaryRange[1];
      const matchesExperience =
        resume.experience_years >= filters.experienceRange[0] &&
        resume.experience_years <= filters.experienceRange[1];
      const matchesAvailability =
        filters.availability.length === 0 ||
        filters.availability.includes(resume.availability);
      const matchesSkills =
        filters.skills.length === 0 ||
        filters.skills.every((skill) => resume.skills.includes(skill));
      const matchesLanguages =
        filters.languages.length === 0 ||
        filters.languages.every((lang) => resume.languages.includes(lang));
      const matchesEducation =
        filters.education.length === 0 ||
        filters.education.includes(resume.degree);

      return (
        matchesSearch &&
        matchesCity &&
        matchesMetro &&
        matchesSalary &&
        matchesExperience &&
        matchesAvailability &&
        matchesSkills &&
        matchesLanguages &&
        matchesEducation
      );
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case "lastActive":
          return (
            new Date(b.last_active).getTime() -
            new Date(a.last_active).getTime()
          );
        case "experience-desc":
          return b.experience_years - a.experience_years;
        case "experience-asc":
          return a.experience_years - b.experience_years;
        case "salary-desc":
          return b.expected_salary - a.expected_salary;
        case "salary-asc":
          return a.expected_salary - b.expected_salary;
        default:
          return 0;
      }
    });

  // Pagination
  const totalPages = Math.ceil(filteredResumes.length / filters.perPage);
  const startIndex = (currentPage - 1) * filters.perPage;
  const paginatedResumes = filteredResumes.slice(
    startIndex,
    startIndex + filters.perPage
  );

  // Get active filters for display
  const getActiveFilters = () => {
    const active = [];

    if (filters.city) {
      active.push({
        type: "city",
        label: t("resumes.activeFilters.city", { city: filters.city }),
        icon: <MapPinIcon className="w-4 h-4" />,
      });
    }

    if (filters.metro) {
      active.push({
        type: "metro",
        label: t("resumes.activeFilters.metro", { metro: filters.metro }),
        icon: <TrainIcon className="w-4 h-4" />,
      });
    }

    if (filters.experienceRange[1] < 10) {
      active.push({
        type: "experience",
        label: t("resumes.activeFilters.experience", {
          years: filters.experienceRange[1],
        }),
        icon: <BriefcaseIcon className="w-4 h-4" />,
      });
    }

    if (filters.salaryRange[1] < 300000) {
      active.push({
        type: "salary",
        label: t("resumes.activeFilters.salary", {
          salary: formatSalary(filters.salaryRange[1]),
        }),
        icon: <BanknoteIcon className="w-4 h-4" />,
      });
    }

    return active;
  };

  const activeFilters = getActiveFilters();

  return (
    <div className="pt-20 min-h-screen bg-gray-900">
      {/* Search Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 bg-gray-900/50 rounded-lg p-2">
            <SearchIcon className="w-6 h-6 text-gray-400 ml-2" />
            <input
              type="text"
              placeholder={t("resumes.search.placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-400 text-lg"
            />
            <button
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
            >
              <FilterIcon className="w-5 h-5" />
              {t("resumes.search.filters")}
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
            <div className="bg-gray-800 rounded-lg p-6 space-y-6">
              {/* Location Filters */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  {t("resumes.filters.location.title")}
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <MapPinIcon className="w-4 h-4" />
                      <span>{t("resumes.filters.location.city")}</span>
                    </div>
                    <input
                      type="text"
                      value={filters.city}
                      onChange={(e) =>
                        handleFilterChange("city", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder={t(
                        "resumes.filters.location.cityPlaceholder"
                      )}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <TrainIcon className="w-4 h-4" />
                      <span>{t("resumes.filters.location.metro")}</span>
                    </div>
                    <input
                      type="text"
                      value={filters.metro}
                      onChange={(e) =>
                        handleFilterChange("metro", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder={t(
                        "resumes.filters.location.metroPlaceholder"
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Experience Range */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  {t("resumes.filters.experience.title")}
                </h3>
                <div className="space-y-4">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={filters.experienceRange[1]}
                    onChange={(e) =>
                      handleFilterChange("experienceRange", [
                        filters.experienceRange[0],
                        parseFloat(e.target.value),
                      ])
                    }
                    className="w-full accent-emerald-500"
                  />
                  <div className="flex justify-between text-gray-400">
                    <span>{filters.experienceRange[0]}</span>
                    <span>{filters.experienceRange[1]}</span>
                  </div>
                </div>
              </div>

              {/* Expected Salary Range */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  {t("resumes.filters.salary.title")}
                </h3>
                <div className="space-y-4">
                  <input
                    type="range"
                    min="50000"
                    max="300000"
                    step="10000"
                    value={filters.salaryRange[1]}
                    onChange={(e) =>
                      handleFilterChange("salaryRange", [
                        filters.salaryRange[0],
                        parseInt(e.target.value),
                      ])
                    }
                    className="w-full accent-emerald-500"
                  />
                  <div className="flex justify-between text-gray-400">
                    <span>{formatSalary(filters.salaryRange[0])}</span>
                    <span>{formatSalary(filters.salaryRange[1])}</span>
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  {t("resumes.filters.availability.title")}
                </h3>
                <div className="space-y-2">
                  {availabilityOptions.map((type) => (
                    <label
                      key={type}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.availability.includes(type)}
                        onChange={() => toggleFilter("availability", type)}
                        className="rounded border-gray-600 text-emerald-500 focus:ring-emerald-500 bg-gray-700"
                      />
                      <span className="text-gray-300">
                        {t(
                          `resumes.filters.availability.${type.toLowerCase()}`
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  {t("resumes.filters.skills.title")}
                </h3>
                <div className="space-y-2">
                  {skillsOptions.map((skill) => (
                    <label
                      key={skill}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.skills.includes(skill)}
                        onChange={() => toggleFilter("skills", skill)}
                        className="rounded border-gray-600 text-emerald-500 focus:ring-emerald-500 bg-gray-700"
                      />
                      <span className="text-gray-300">{skill}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  {t("resumes.filters.languages.title")}
                </h3>
                <div className="space-y-2">
                  {languageOptions.map((language) => (
                    <label
                      key={language}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.languages.includes(language)}
                        onChange={() => toggleFilter("languages", language)}
                        className="rounded border-gray-600 text-emerald-500 focus:ring-emerald-500 bg-gray-700"
                      />
                      <span className="text-gray-300">{language}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  {t("resumes.filters.education.title")}
                </h3>
                <div className="space-y-2">
                  {educationOptions.map((degree) => (
                    <label
                      key={degree}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.education.includes(degree)}
                        onChange={() => toggleFilter("education", degree)}
                        className="rounded border-gray-600 text-emerald-500 focus:ring-emerald-500 bg-gray-700"
                      />
                      <span className="text-gray-300">{degree}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="flex-grow">
            {/* Sort and View Options */}
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Sort Dropdown */}
                  <div className="relative">
                    <select
                      value={filters.sortBy}
                      onChange={(e) =>
                        handleFilterChange("sortBy", e.target.value)
                      }
                      className="appearance-none bg-gray-700 text-white px-4 py-2 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Time Frame Dropdown */}
                  <div className="relative">
                    <select
                      value={filters.timeFrame}
                      onChange={(e) =>
                        handleFilterChange("timeFrame", e.target.value)
                      }
                      className="appearance-none bg-gray-700 text-white px-4 py-2 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {timeFrameOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Per Page Dropdown */}
                <div className="relative">
                  <select
                    value={filters.perPage}
                    onChange={(e) =>
                      handleFilterChange("perPage", parseInt(e.target.value))
                    }
                    className="appearance-none bg-gray-700 text-white px-4 py-2 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {perPageOptions.map((option) => (
                      <option key={option} value={option}>
                        {option} {t("resumes.perPage.resumes")}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {activeFilters.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">
                    {t("resumes.activeFilters.title")}
                  </h3>
                  <button
                    onClick={() => {
                      setFilters({
                        ...filters,
                        city: "",
                        metro: "",
                        experienceRange: [0, 10],
                        salaryRange: [50000, 300000],
                        availability: [],
                        skills: [],
                        languages: [],
                        education: [],
                      });
                    }}
                    className="text-sm text-emerald-400 hover:text-emerald-300"
                  >
                    {t("resumes.activeFilters.clearAll")}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeFilters.map((filter, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-gray-700 text-white px-3 py-1 rounded-full"
                    >
                      {filter.icon}
                      <span>{filter.label}</span>
                      <button
                        onClick={() =>
                          clearFilter(filter.type as keyof FilterState)
                        }
                        className="text-gray-400 hover:text-white"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-12 bg-gray-800 rounded-lg">
                <p className="text-gray-400 text-lg">Loading resumes...</p>
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
                  Retry
                </button>
              </div>
            )}

            {/* Resume Cards */}
            {!isLoading && !error && (
              <div className="space-y-6">
                {paginatedResumes.map((resume) => (
                  <div
                    key={resume.id}
                    className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex gap-6">
                      {/* Profile Photo */}
                      <div className="flex-shrink-0">
                        <img
                          src={resume.photo}
                          alt={resume.title}
                          className="w-24 h-24 rounded-lg object-cover"
                        />
                      </div>

                      {/* Main Content */}
                      <div className="flex-grow">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-white mb-2">
                              {resume.title}
                            </h3>
                            <div className="flex items-center gap-2 text-gray-400">
                              <MapPinIcon className="w-4 h-4" />
                              <span>
                                {resume.city} • {resume.metro}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleContact(resume)}
                              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors flex items-center gap-2"
                            >
                              <MessageCircleIcon className="w-4 h-4" />
                              {t("resumes.actions.contact")}
                            </button>
                            <button
                              onClick={() => handleViewProfile(resume)}
                              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                            >
                              <UserIcon className="w-4 h-4" />
                              {t("resumes.actions.viewProfile")}
                            </button>
                          </div>
                        </div>

                        {/* Skills */}
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-2">
                            {resume.skills.map((skill, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-400">
                            <BriefcaseIcon className="w-4 h-4" />
                            <span>
                              {t("resumes.details.experience", {
                                years: resume.experience_years,
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                            <BanknoteIcon className="w-4 h-4" />
                            <span>
                              {t("resumes.details.expectedSalary", {
                                salary: formatSalary(resume.expected_salary),
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                            <GraduationCapIcon className="w-4 h-4" />
                            <span>{resume.degree}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                            <LanguagesIcon className="w-4 h-4" />
                            <span>
                              {Array.isArray(resume.languages)
                                ? resume.languages.join(", ")
                                : typeof resume.languages === "object"
                                ? Object.values(resume.languages).join(", ")
                                : ""}
                            </span>
                          </div>
                        </div>

                        {/* Current Position & Activity */}
                        <div className="mt-4 flex justify-between items-center text-sm">
                          <div className="text-gray-400">
                            {resume.current_position}
                          </div>
                          <div className="flex items-center gap-2 text-gray-500">
                            <ClockIcon className="w-4 h-4" />
                            <span>
                              {t("resumes.details.lastActive", {
                                date: formatDate(resume.last_active),
                              })}
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
            {!isLoading && !error && paginatedResumes.length > 0 && (
              <div className="flex justify-center mt-8">
                <nav className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t("resumes.pagination.previous")}
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          page === currentPage
                            ? "bg-emerald-600 text-white"
                            : "bg-gray-800 text-white hover:bg-gray-700"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t("resumes.pagination.next")}
                  </button>
                </nav>
              </div>
            )}

            {/* No Results */}
            {!isLoading && !error && paginatedResumes.length === 0 && (
              <div className="text-center py-12 bg-gray-800 rounded-lg">
                <p className="text-gray-400 text-lg">
                  {t("resumes.activeFilters.noResults")}
                </p>
                <button
                  onClick={() => {
                    setFilters({
                      ...filters,
                      city: "",
                      metro: "",
                      experienceRange: [0, 10],
                      salaryRange: [50000, 300000],
                      availability: [],
                      skills: [],
                      languages: [],
                      education: [],
                    });
                    setSearchQuery("");
                  }}
                  className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {selectedResume && (
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedResume(null);
          }}
          resume={selectedResume}
        />
      )}

      {/* Contact Modal */}
      {selectedResume && (
        <ContactModal
          isOpen={showContactModal}
          onClose={() => {
            setShowContactModal(false);
            setSelectedResume(null);
          }}
          onSubmit={handleContactSubmit}
          recipientName={selectedResume.title}
          recipientId={selectedResume.user.toString()}
        />
      )}
    </div>
  );
};

export default Resumes;
