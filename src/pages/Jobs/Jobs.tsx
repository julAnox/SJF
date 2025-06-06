"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  SearchIcon,
  FilterIcon,
  MapPinIcon,
  TrainIcon,
  BriefcaseIcon,
  ClockIcon,
  BanknoteIcon,
  ChevronDownIcon,
  XIcon,
  CalendarIcon,
  Building2,
  CheckCircle,
} from "lucide-react";
import ApplicationModal from "../../components/Modals/ApplicationModal";
import {
  jobsApi,
  companiesApi,
  type Job,
  type Company,
} from "../../services/api";
import applicationsService from "../../services/applicationsService";
import { useAuth } from "../../contexts/AuthContext";

interface FilterState {
  city: string;
  metro: string;
  experiense: number;
  salary_min: number;
  salary_max: number;
  type: string;
  schedule: string;
  currency: string;
  sortBy: string;
  timeFrame: string;
  perPage: number;
}

const getMonthsDifference = (dateString: string): number => {
  const date = new Date(dateString);
  const now = new Date();

  const yearDiff = now.getFullYear() - date.getFullYear();
  const monthDiff = now.getMonth() - date.getMonth();

  return yearDiff * 12 + monthDiff;
};

const formatDate = (dateString: string, t: any) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return t("jobs.card.today");
  if (days === 1) return t("jobs.card.yesterday");
  if (days < 7) return t("jobs.card.daysAgo", { days: days });
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return t("jobs.card.weeksAgo", { weeks: weeks });
  }
  if (days < 365) {
    const months = getMonthsDifference(dateString);
    return t("jobs.card.monthsAgo", { months: months });
  }
  const years = Math.floor(days / 365);
  return t("jobs.card.yearsAgo", { years: years });
};

const Jobs = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    city: "",
    metro: "",
    experiense: 10,
    salary_min: 0,
    salary_max: 10000000,
    type: "",
    schedule: "",
    currency: "",
    sortBy: "relevance",
    timeFrame: "all",
    perPage: 6,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedDescriptions, setExpandedDescriptions] = useState<
    Record<number, boolean>
  >({});
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null
  );
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Record<number, Company>>({});
  const [imageError, setImageError] = useState<Record<number, boolean>>({});
  const [userApplications, setUserApplications] = useState<number[]>([]);
  const { user } = useAuth();

  const [isMobile, setIsMobile] = useState(false);

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

  useEffect(() => {
    console.log("Jobs page loaded, checking URL params");
    const urlParams = new URLSearchParams(location.search);
    const searchParam = urlParams.get("search");
    console.log("Search param from URL:", searchParam);

    if (searchParam) {
      const decodedSearch = decodeURIComponent(searchParam);
      console.log("Setting search query to:", decodedSearch);
      setSearchQuery(decodedSearch);
    }
  }, [location.search]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setIsLoading(true);
        const [jobsData, companiesData] = await Promise.all([
          jobsApi.getAll(),
          companiesApi.getAll(),
        ]);

        const companiesMap = companiesData.reduce(
          (acc: Record<number, Company>, company: Company) => {
            acc[company.id] = company;
            return acc;
          },
          {}
        );
        setCompanies(companiesMap);

        const transformedJobs = jobsData.map((job: any) => ({
          ...job,
          company: companiesMap[job.company] || { name: "Unknown Company" },
          requirements: (() => {
            if (!job.requirements) return "";

            if (typeof job.requirements === "string") {
              try {
                const parsed = JSON.parse(job.requirements);
                if (typeof parsed === "object" && parsed !== null) {
                  return Object.values(parsed).join(", ");
                }
                return job.requirements;
              } catch {
                return job.requirements;
              }
            }

            if (typeof job.requirements === "object") {
              return Object.values(job.requirements).join(", ");
            }

            return "";
          })(),
          salary_min: Number.parseFloat(job.salary_min) || 0,
          salary_max: Number.parseFloat(job.salary_max) || 0,
          experiense: Number.parseInt(job.experiense) || 0,
          city: job.city || "",
          metro: job.metro || "",
          type: job.type || "",
          schedule: job.schedule || "",
          created_at: job.created_at || new Date().toISOString(),
        }));

        setJobs(transformedJobs);
        setError(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load jobs. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const toggleDescription = (jobId: number) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [jobId]: !prev[jobId],
    }));
  };

  useEffect(() => {
    const fetchUserApplications = async () => {
      if (!user) return;

      try {
        const applications = await applicationsService.getByUserId(user.id);
        const appliedJobIds = applications.map((app) => app.job);
        setUserApplications(appliedJobIds);
      } catch (err) {
        console.error("Error fetching user applications:", err);
      }
    };

    fetchUserApplications();
  }, [user]);

  const handleImageError = (jobId: number) => {
    setImageError((prev) => ({
      ...prev,
      [jobId]: true,
    }));
  };

  const sortOptions = [
    { value: "relevance", label: t("jobs.card.mostRelevant") },
    { value: "date", label: t("jobs.card.newest") },
    { value: "salary-desc", label: t("jobs.card.highestSalary") },
    { value: "salary-asc", label: t("jobs.card.lowestSalary") },
  ];

  const timeFrameOptions = [
    { value: "all", label: t("jobs.card.allTime") },
    { value: "month", label: t("jobs.card.pastMonth") },
    { value: "week", label: t("jobs.card.pastWeek") },
    { value: "threeDays", label: t("jobs.card.past3Days") },
    { value: "day", label: t("jobs.card.past24Hours") },
  ];

  const perPageOptions = [
    { value: 3, label: `3 ${t("jobs.perPage.vacancies")}` },
    { value: 6, label: `6 ${t("jobs.perPage.vacancies")}` },
    { value: 9, label: `9 ${t("jobs.perPage.vacancies")}` },
  ];

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    if (key === "currency") {
      value = value.toUpperCase().slice(0, 3);
    }
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1);
  };

  const clearFilter = (key: keyof FilterState) => {
    setFilters((prev) => ({
      ...prev,
      [key]: typeof prev[key] === "number" ? 0 : "",
    }));
  };

  const formatSalary = (value: number) => {
    return new Intl.NumberFormat("ru-RU").format(value);
  };

  const hasApplied = (jobId: number) => {
    return userApplications.includes(jobId);
  };

  const handleApplicationSubmitted = async (jobId: number) => {
    setUserApplications((prev) => [...prev, jobId]);
  };

  const filteredJobs = jobs
    .filter((job) => {
      if (!job) return false;

      if (job.status !== "active") return false;

      const matchesSearch =
        searchQuery.trim() === "" ||
        (job.title || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCity =
        !filters.city ||
        (job.city || "").toLowerCase().includes(filters.city.toLowerCase());

      const matchesMetro =
        !filters.metro ||
        (job.metro || "").toLowerCase().includes(filters.metro.toLowerCase());

      const matchesSalary =
        job.salary_min >= filters.salary_min &&
        job.salary_max <= filters.salary_max;

      const matchesExperience = job.experiense <= filters.experiense;

      const matchesType = !filters.type || job.type === filters.type;
      const matchesSchedule =
        !filters.schedule || job.schedule === filters.schedule;

      const matchesCurrency =
        !filters.currency || job.type_of_money === filters.currency;

      return (
        matchesSearch &&
        matchesCity &&
        matchesMetro &&
        matchesSalary &&
        matchesExperience &&
        matchesType &&
        matchesSchedule &&
        matchesCurrency
      );
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case "date":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "salary-desc":
          return b.salary_max - a.salary_max;
        case "salary-asc":
          return a.salary_min - b.salary_min;
        default:
          return 0;
      }
    });

  const totalPages = Math.ceil(filteredJobs.length / filters.perPage);
  const startIndex = (currentPage - 1) * filters.perPage;
  const paginatedJobs = filteredJobs.slice(
    startIndex,
    startIndex + filters.perPage
  );

  const getActiveFilters = () => {
    const active = [];

    if (filters.city) {
      active.push({
        type: "city",
        label: t("jobs.activeFilters.city", { city: filters.city }),
        icon: <MapPinIcon className="w-4 h-4" />,
      });
    }

    if (filters.metro) {
      active.push({
        type: "metro",
        label: t("jobs.activeFilters.metro", { metro: filters.metro }),
        icon: <TrainIcon className="w-4 h-4" />,
      });
    }

    if (filters.experiense > 0 && filters.experiense < 10) {
      active.push({
        type: "experiense",
        label: t("jobs.activeFilters.experience", {
          years: filters.experiense,
        }),
        icon: <BriefcaseIcon className="w-4 h-4" />,
      });
    }

    if (filters.salary_min > 0 || filters.salary_max < 1000000) {
      active.push({
        type: "salary",
        label: `${t("home.cta.filterssalary")}: ${formatSalary(
          filters.salary_min
        )} - ${formatSalary(filters.salary_max)}`,
        icon: <BanknoteIcon className="w-4 h-4" />,
      });
    }

    if (filters.currency) {
      active.push({
        type: "currency",
        label: `${t("home.cta.filterscurrency")}: ${filters.currency}`,
        icon: <BanknoteIcon className="w-4 h-4" />,
      });
    }

    return active;
  };

  const activeFilters = getActiveFilters();

  // Filter Component
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Location Filters */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          {t("home.cta.filterslocation")}
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <MapPinIcon className="w-4 h-4" />
              <span>{t("home.cta.filterscity")}</span>
            </div>
            <input
              type="text"
              value={filters.city}
              onChange={(e) => handleFilterChange("city", e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder={t("home.cta.filterscityinput")}
            />
          </div>
          <div>
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <TrainIcon className="w-4 h-4" />
              <span>{t("home.cta.filtersmetro")}</span>
            </div>
            <input
              type="text"
              value={filters.metro}
              onChange={(e) => handleFilterChange("metro", e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder={t("home.cta.filtersmetroinput")}
            />
          </div>
        </div>
      </div>

      {/* Experience Range */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          {t("home.cta.filtersexp")}
        </h3>
        <div className="space-y-4">
          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={filters.experiense}
            onChange={(e) =>
              handleFilterChange("experiense", Number.parseInt(e.target.value))
            }
            className="w-full accent-emerald-500"
          />
          <div className="flex justify-between text-gray-400">
            <span>0 {t("home.cta.filtersyears")}</span>
            <span>
              {filters.experiense} {t("home.cta.filtersyears")}
            </span>
          </div>
        </div>
      </div>

      {/* Currency */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          {t("home.cta.filterscurrency")}
        </h3>
        <input
          type="text"
          value={filters.currency}
          onChange={(e) => handleFilterChange("currency", e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder={t("home.cta.filterscurrencyinput")}
          maxLength={3}
        />
      </div>

      {/* Salary Range */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          {t("home.cta.filterssalary")}
        </h3>
        <div className="space-y-4">
          <div className="flex gap-4 items-center">
            <input
              type="number"
              min="0"
              max={filters.salary_max}
              value={filters.salary_min}
              onChange={(e) =>
                handleFilterChange(
                  "salary_min",
                  Number.parseInt(e.target.value)
                )
              }
              className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-gray-400">{t("home.cta.do")}</span>
            <input
              type="number"
              min={filters.salary_min}
              value={filters.salary_max}
              onChange={(e) =>
                handleFilterChange(
                  "salary_max",
                  Number.parseInt(e.target.value)
                )
              }
              className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <input
            type="range"
            min="0"
            max="1000000"
            step="10000"
            value={filters.salary_max}
            onChange={(e) =>
              handleFilterChange("salary_max", Number.parseInt(e.target.value))
            }
            className="w-full accent-emerald-500"
          />
          <div className="flex justify-between text-gray-400">
            <span>{formatSalary(filters.salary_min)}</span>
            <span>{formatSalary(filters.salary_max)}</span>
          </div>
        </div>
      </div>

      {/* Type */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          {t("jobs.card.type")}
        </h3>
        <div className="relative">
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange("type", e.target.value)}
            className="appearance-none w-full px-3 py-2 pr-10 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="">{t("jobs.card.allTypes")}</option>
            {Array.from(new Set(jobs.map((job) => job.type))).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Schedule */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          {t("jobs.card.schedule")}
        </h3>
        <div className="relative">
          <select
            value={filters.schedule}
            onChange={(e) => handleFilterChange("schedule", e.target.value)}
            className="appearance-none w-full px-3 py-2 pr-10 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="">{t("jobs.card.allSchedules")}</option>
            {Array.from(new Set(jobs.map((job) => job.schedule))).map(
              (schedule) => (
                <option key={schedule} value={schedule}>
                  {schedule}
                </option>
              )
            )}
          </select>
          <ChevronDownIcon className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
        </div>
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
              <SearchIcon className="w-5 h-5 sm:w-5 sm:h-5 text-gray-400 ml-1" />
              <input
                type="text"
                placeholder={t("home.cta.searchforjobs")}
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
              <FilterIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">
                {t("home.cta.searchforjobsfilters")}
              </span>
              <span className="sm:hidden">Фильтры</span>
            </button>
          </div>
        </div>
      </div>

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
                        <XIcon className="w-6 h-6" />
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
            {/* Sort and View Options */}
            <div className="bg-gray-800 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                {/* Left group - Sort and Time filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                  {/* Sort Dropdown */}
                  <div className="relative min-w-[200px]">
                    <select
                      value={filters.sortBy}
                      onChange={(e) =>
                        handleFilterChange("sortBy", e.target.value)
                      }
                      className="appearance-none bg-gray-700 text-white px-3 sm:px-4 py-2 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full text-sm sm:text-base cursor-pointer"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Time Frame Dropdown */}
                  <div className="relative min-w-[180px]">
                    <select
                      value={filters.timeFrame}
                      onChange={(e) =>
                        handleFilterChange("timeFrame", e.target.value)
                      }
                      className="appearance-none bg-gray-700 text-white px-3 sm:px-4 py-2 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full text-sm sm:text-base cursor-pointer"
                    >
                      {timeFrameOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Right filter (Per Page) */}
                <div className="relative min-w-[140px]">
                  <select
                    value={filters.perPage}
                    onChange={(e) =>
                      handleFilterChange(
                        "perPage",
                        Number.parseInt(e.target.value)
                      )
                    }
                    className="appearance-none bg-gray-700 text-white px-3 sm:px-4 py-2 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full text-sm sm:text-base cursor-pointer"
                  >
                    {perPageOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {activeFilters.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-4 mb-4 sm:mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base sm:text-lg font-semibold text-white">
                    {t("jobs.activeFilters.title")}
                  </h3>
                  <button
                    onClick={() => {
                      setFilters({
                        ...filters,
                        city: "",
                        metro: "",
                        experiense: 0,
                        salary_min: 0,
                        salary_max: 1000000,
                        type: "",
                        schedule: "",
                        currency: "",
                      });
                    }}
                    className="text-sm text-emerald-400 hover:text-emerald-300"
                  >
                    {t("jobs.card.clearAll")}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeFilters.map((filter, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-gray-700 text-white px-3 py-1 rounded-full text-sm"
                    >
                      {filter.icon}
                      <span className="truncate max-w-[200px] sm:max-w-none">
                        {filter.label}
                      </span>
                      <button
                        onClick={() =>
                          clearFilter(filter.type as keyof FilterState)
                        }
                        className="text-gray-400 hover:text-white flex-shrink-0"
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
                <p className="text-gray-400 text-lg">
                  {t("jobs.card.loading")}
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
                  {t("jobs.card.retry")}
                </button>
              </div>
            )}

            {/* Jobs List */}
            {!isLoading && !error && (
              <div className="space-y-4 sm:space-y-6">
                {paginatedJobs.map((job) => {
                  const jobApplied = hasApplied(job.id);
                  const companyId =
                    typeof job.company === "object"
                      ? job.company.id
                      : job.company;

                  return (
                    <div
                      key={job.id}
                      className={`bg-gray-800 rounded-lg p-4 sm:p-6 hover:bg-gray-750 transition-colors overflow-hidden ${
                        jobApplied ? "opacity-70" : ""
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex items-start gap-3 sm:gap-4 flex-1">
                          {/* Company Logo */}
                          {job.company && (job.company as Company).logo ? (
                            <img
                              src={
                                (job.company as Company).logo ||
                                "/placeholder.svg?height=80&width=80" ||
                                "/placeholder.svg" ||
                                "/placeholder.svg" ||
                                "/placeholder.svg" ||
                                "/placeholder.svg" ||
                                "/placeholder.svg" ||
                                "/placeholder.svg"
                              }
                              alt={(job.company as Company).name}
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover flex-shrink-0"
                              onError={() => handleImageError(job.id)}
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-600 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                              <Building2 className="w-6 h-6 sm:w-8 sm:h-8" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 break-words word-break">
                              {job.title}
                            </h3>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-gray-400 text-sm sm:text-base">
                              <div className="flex items-center gap-2">
                                <MapPinIcon className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate max-w-[200px] sm:max-w-none">
                                  {job.city || t("jobs.card.noLocation")} •{" "}
                                  {job.metro || t("jobs.card.noMetro")}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <BriefcaseIcon className="w-4 h-4 flex-shrink-0" />
                                <span>
                                  {job.experiense || 0}{" "}
                                  {t("jobs.card.yearsExperience")}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Apply Button */}
                        <div className="w-full sm:w-auto flex-shrink-0">
                          {jobApplied ? (
                            <div className="flex items-center justify-center gap-2 text-emerald-400 px-4 py-2 bg-emerald-600/20 rounded-lg w-full sm:w-auto">
                              <CheckCircle className="w-5 h-5" />
                              <span className="text-sm sm:text-base">
                                {t("jobs.card.appliedAlready")}
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedJobId(job.id);
                                setSelectedCompanyId(companyId.toString());
                                setShowApplicationModal(true);
                              }}
                              className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors text-sm sm:text-base"
                            >
                              {t("home.cta.vacapply")}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-4">
                        <h4 className="text-base sm:text-lg font-semibold text-white mb-2">
                          {t("jobs.card.description")}
                        </h4>
                        <p className="text-gray-300 text-sm sm:text-base">
                          {expandedDescriptions[job.id]
                            ? job.description
                            : `${job.description.substring(
                                0,
                                isMobile ? 200 : 350
                              )}${
                                job.description.length > (isMobile ? 200 : 350)
                                  ? "..."
                                  : ""
                              }`}
                        </p>
                        {job.description.length > (isMobile ? 200 : 350) && (
                          <button
                            onClick={() => toggleDescription(job.id)}
                            className="mt-2 text-emerald-400 hover:text-emerald-300 text-sm"
                          >
                            {expandedDescriptions[job.id]
                              ? t("jobs.card.collapse")
                              : t("jobs.card.expand")}
                          </button>
                        )}

                        {job.requirements && job.requirements.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-base sm:text-lg font-semibold text-white mb-2">
                              {t("jobs.card.requirements")}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {job.requirements
                                .split(", ")
                                .slice(0, isMobile ? 4 : 8)
                                .map((req, index) => (
                                  <span
                                    key={index}
                                    className="px-2 sm:px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-xs sm:text-sm"
                                  >
                                    {req.trim()}
                                  </span>
                                ))}
                              {job.requirements.split(", ").length >
                                (isMobile ? 4 : 8) && (
                                <span className="px-2 sm:px-3 py-1 bg-gray-700 text-gray-400 rounded-full text-xs sm:text-sm">
                                  +
                                  {job.requirements.split(", ").length -
                                    (isMobile ? 4 : 8)}{" "}
                                  еще
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-gray-400 text-sm sm:text-base">
                          <div className="flex items-center gap-2">
                            <BanknoteIcon className="w-4 h-4 flex-shrink-0" />
                            <span>
                              {formatSalary(job.salary_min || 0)} -{" "}
                              {formatSalary(job.salary_max || 0)}{" "}
                              {job.type_of_money}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ClockIcon className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">
                              {job.type || "Full-time"} •{" "}
                              {job.schedule || "Standard"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                          <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                          <span>
                            {t("jobs.card.posted")}{" "}
                            {formatDate(job.created_at, t)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {!isLoading && !error && paginatedJobs.length > 0 && (
              <div className="flex justify-center mt-6 sm:mt-8">
                <nav className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 sm:px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    {t("jobs.pagination.previous")}
                  </button>

                  {/* Mobile: Show only current page and total */}
                  {isMobile ? (
                    <span className="px-3 py-2 text-gray-400 text-sm">
                      {currentPage} / {totalPages}
                    </span>
                  ) : (
                    /* Desktop: Show all pages */
                    Array.from({ length: totalPages }, (_, i) => i + 1).map(
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
                    )
                  )}

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 sm:px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    {t("jobs.pagination.next")}
                  </button>
                </nav>
              </div>
            )}

            {/* No Results */}
            {!isLoading && !error && paginatedJobs.length === 0 && (
              <div className="text-center py-12 bg-gray-800 rounded-lg">
                <p className="text-gray-400 text-lg">{t("jobs.card.noJobs")}</p>
                <p className="text-gray-500 mt-2">
                  {t("jobs.card.adjustFilters")}
                </p>
                <button
                  onClick={() => {
                    setFilters({
                      ...filters,
                      city: "",
                      metro: "",
                      experiense: 10,
                      salary_min: 0,
                      salary_max: 1000000,
                      type: "",
                      schedule: "",
                      currency: "",
                    });
                    setSearchQuery("");
                  }}
                  className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
                >
                  {t("jobs.card.resetFilters")}
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
          <FilterIcon className="w-6 h-6" />
        </button>
      )}

      {/* Application Modal */}
      {showApplicationModal && selectedJobId && (
        <ApplicationModal
          isOpen={showApplicationModal}
          onClose={() => {
            setShowApplicationModal(false);
            setSelectedJobId(null);
            setSelectedCompanyId(null);
          }}
          jobId={selectedJobId.toString()}
          jobTitle={jobs.find((j) => j.id === selectedJobId)?.title || ""}
          companyName={
            (jobs.find((j) => j.id === selectedJobId)?.company as Company)
              ?.name || "Unknown Company"
          }
          companyId={selectedCompanyId || ""}
          onApplicationSubmitted={() =>
            handleApplicationSubmitted(selectedJobId)
          }
        />
      )}
    </div>
  );
};

export default Jobs;
