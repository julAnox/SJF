"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
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
    perPage: 3,
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

      console.log(
        `Job "${job.title}" matches search "${searchQuery}":`,
        matchesSearch
      );

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

  return (
    <div className="pt-20 bg-gray-900">
      {/* Search Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 bg-gray-900/50 rounded-lg p-2">
            <SearchIcon className="w-6 h-6 text-gray-400 ml-2" />
            <input
              type="text"
              placeholder={t("home.cta.searchforjobs")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-400 text-lg"
            />
            <button
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
            >
              <FilterIcon className="w-5 h-5" />
              {t("home.cta.searchforjobsfilters")}
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
                      onChange={(e) =>
                        handleFilterChange("city", e.target.value)
                      }
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
                      onChange={(e) =>
                        handleFilterChange("metro", e.target.value)
                      }
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
                      handleFilterChange(
                        "experiense",
                        Number.parseInt(e.target.value)
                      )
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
                  onChange={(e) =>
                    handleFilterChange("currency", e.target.value)
                  }
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
                      handleFilterChange(
                        "salary_max",
                        Number.parseInt(e.target.value)
                      )
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
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange("type", e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">{t("jobs.card.allTypes")}</option>
                  {Array.from(new Set(jobs.map((job) => job.type))).map(
                    (type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Schedule */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  {t("jobs.card.schedule")}
                </h3>
                <select
                  value={filters.schedule}
                  onChange={(e) =>
                    handleFilterChange("schedule", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="flex-grow">
            {/* Sort and View Options */}
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                {" "}
                {/* Главный контейнер с выравниванием по краям */}
                {/* Левая группа - первые два фильтра */}
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
                {/* Правый фильтр (Per Page) */}
                <div className="relative">
                  <select
                    value={filters.perPage}
                    onChange={(e) =>
                      handleFilterChange(
                        "perPage",
                        Number.parseInt(e.target.value)
                      )
                    }
                    className="appearance-none bg-gray-700 text-white px-4 py-2 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {perPageOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
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
              <div className="space-y-6">
                {paginatedJobs.map((job) => {
                  const jobApplied = hasApplied(job.id);
                  const companyId =
                    typeof job.company === "object"
                      ? job.company.id
                      : job.company;

                  return (
                    <div
                      key={job.id}
                      className={`bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors ${
                        jobApplied ? "opacity-70" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                          {/* Company Logo */}
                          {job.company && (job.company as Company).logo ? (
                            <img
                              src={
                                (job.company as Company).logo ||
                                "/placeholder.svg?height=80&width=80" ||
                                "/placeholder.svg"
                              }
                              alt={(job.company as Company).name}
                              className="w-20 h-20 rounded-lg object-cover"
                              onError={() => handleImageError(job.id)}
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
                              <Building2 className="w-6 h-6" />
                            </div>
                          )}
                          <div>
                            <h3 className="text-xl font-semibold text-white mb-2">
                              {job.title}
                            </h3>
                            <div className="flex items-center gap-4 text-gray-400">
                              <div className="flex items-center gap-2">
                                <MapPinIcon className="w-4 h-4" />
                                <span>
                                  {job.city || t("jobs.card.noLocation")} •{" "}
                                  {job.metro || t("jobs.card.noMetro")}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <BriefcaseIcon className="w-4 h-4" />
                                <span>
                                  {job.experiense || 0}{" "}
                                  {t("jobs.card.yearsExperience")}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {jobApplied ? (
                          <div className="flex items-center gap-2 text-emerald-400 px-4 py-2 bg-emerald-600/20 rounded-lg">
                            <CheckCircle className="w-5 h-5" />
                            <span>{t("jobs.card.appliedAlready")}</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedJobId(job.id);
                              setSelectedCompanyId(companyId.toString());
                              setShowApplicationModal(true);
                            }}
                            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
                          >
                            {t("home.cta.vacapply")}
                          </button>
                        )}
                      </div>

                      <div className="mt-4">
                        <p className="text-gray-300">
                          <h4 className="text-lg font-semibold text-white mb-2">
                            {t("jobs.card.description")}
                          </h4>
                          {expandedDescriptions[job.id]
                            ? job.description
                            : `${job.description.substring(0, 350)}${
                                job.description.length > 350 ? "..." : ""
                              }`}
                        </p>
                        {job.description.length > 350 && (
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
                            <h4 className="text-lg font-semibold text-white mb-2">
                              {t("jobs.card.requirements")}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {job.requirements
                                .split(", ")
                                .map((req, index) => (
                                  <span
                                    key={index}
                                    className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm"
                                  >
                                    {req.trim()}
                                  </span>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-gray-400">
                          <div className="flex items-center gap-2">
                            <BanknoteIcon className="w-4 h-4" />
                            <span>
                              {formatSalary(job.salary_min || 0)} -{" "}
                              {formatSalary(job.salary_max || 0)}{" "}
                              {job.type_of_money}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ClockIcon className="w-4 h-4" />
                            <span>
                              {job.type || "Full-time"} •{" "}
                              {job.schedule || "Standard"}
                            </span>
                          </div>
                        </div>
                        {/* Пример использования в карточке вакансии */}
                        <div className="flex items-center gap-2 text-gray-500">
                          <CalendarIcon className="w-4 h-4" />
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
              <div className="flex justify-center mt-8">
                <nav className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t("jobs.pagination.previous")}
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
