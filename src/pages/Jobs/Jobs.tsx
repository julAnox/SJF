"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import ApplicationModal from "../../components/Modals/ApplicationModal";
import {
  jobsApi,
  companiesApi,
  type Job,
  type Company,
} from "../../services/api";

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

const Jobs = () => {
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
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Record<number, Company>>({});
  const [imageError, setImageError] = useState<Record<number, boolean>>({});

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
          requirements:
            typeof job.requirements === "string"
              ? JSON.parse(job.requirements)
              : job.requirements || {},
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

  const handleImageError = (jobId: number) => {
    setImageError((prev) => ({
      ...prev,
      [jobId]: true,
    }));
  };

  const sortOptions = [
    { value: "relevance", label: "Most Relevant" },
    { value: "date", label: "Newest" },
    { value: "salary-desc", label: "Highest Salary" },
    { value: "salary-asc", label: "Lowest Salary" },
  ];

  const timeFrameOptions = [
    { value: "all", label: "All Time" },
    { value: "month", label: "Past Month" },
    { value: "week", label: "Past Week" },
    { value: "threeDays", label: "Past 3 Days" },
    { value: "day", label: "Past 24 Hours" },
  ];

  const perPageOptions = [3, 6, 9];

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  const filteredJobs = jobs
    .filter((job) => {
      if (!job) return false;

      if (job.status !== "active") return false;

      const matchesSearch =
        (job.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.description || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

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
        label: `City: ${filters.city}`,
        icon: <MapPinIcon className="w-4 h-4" />,
      });
    }

    if (filters.metro) {
      active.push({
        type: "metro",
        label: `Metro: ${filters.metro}`,
        icon: <TrainIcon className="w-4 h-4" />,
      });
    }

    if (filters.experiense > 0) {
      active.push({
        type: "experiense",
        label: `Experience: ${filters.experiense} years`,
        icon: <BriefcaseIcon className="w-4 h-4" />,
      });
    }

    if (filters.salary_min > 0 || filters.salary_max < 1000000) {
      active.push({
        type: "salary",
        label: `Salary: ${formatSalary(filters.salary_min)} - ${formatSalary(
          filters.salary_max
        )}`,
        icon: <BanknoteIcon className="w-4 h-4" />,
      });
    }

    if (filters.currency) {
      active.push({
        type: "currency",
        label: `Currency: ${filters.currency}`,
        icon: <BanknoteIcon className="w-4 h-4" />,
      });
    }

    return active;
  };

  const activeFilters = getActiveFilters();

  const handleApplicationSubmit = async (data: {
    resumeId: string;
    coverLetter: string;
    resumeFile?: File;
  }) => {
    if (!selectedJobId) return;

    try {
      // Store application in localStorage
      const applications = JSON.parse(
        localStorage.getItem("applications") || "[]"
      );
      applications.push({
        jobId: selectedJobId,
        ...data,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem("applications", JSON.stringify(applications));

      setShowApplicationModal(false);
    } catch (err) {
      console.error("Failed to submit application:", err);
      alert("Failed to submit application. Please try again.");
    }
  };

  return (
    <div className="pt-20 bg-gray-900">
      {/* Search Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 bg-gray-900/50 rounded-lg p-2">
            <SearchIcon className="w-6 h-6 text-gray-400 ml-2" />
            <input
              type="text"
              placeholder="Search for jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-400 text-lg"
            />
            <button
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
            >
              <FilterIcon className="w-5 h-5" />
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
            <div className="bg-gray-800 rounded-lg p-6 space-y-6">
              {/* Location Filters */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Location
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <MapPinIcon className="w-4 h-4" />
                      <span>City</span>
                    </div>
                    <input
                      type="text"
                      value={filters.city}
                      onChange={(e) =>
                        handleFilterChange("city", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Enter city name"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <TrainIcon className="w-4 h-4" />
                      <span>Metro</span>
                    </div>
                    <input
                      type="text"
                      value={filters.metro}
                      onChange={(e) =>
                        handleFilterChange("metro", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Enter metro station"
                    />
                  </div>
                </div>
              </div>

              {/* Experience Range */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Experience
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
                    <span>0 years</span>
                    <span>{filters.experiense} years</span>
                  </div>
                </div>
              </div>

              {/* Currency */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Currency
                </h3>
                <input
                  type="text"
                  value={filters.currency}
                  onChange={(e) =>
                    handleFilterChange("currency", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter currency (e.g. USD)"
                  maxLength={3}
                />
              </div>

              {/* Salary Range */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Salary
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
                    <span className="text-gray-400">to</span>
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
                <h3 className="text-lg font-semibold text-white mb-4">Type</h3>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange("type", e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Types</option>
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
                  Schedule
                </h3>
                <select
                  value={filters.schedule}
                  onChange={(e) =>
                    handleFilterChange("schedule", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Schedules</option>
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
                      handleFilterChange(
                        "perPage",
                        Number.parseInt(e.target.value)
                      )
                    }
                    className="appearance-none bg-gray-700 text-white px-4 py-2 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {perPageOptions.map((option) => (
                      <option key={option} value={option}>
                        {option} vacancies
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
                    Active Filters
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
                    Clear All
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
                <p className="text-gray-400 text-lg">Loading jobs...</p>
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

            {/* Jobs List */}
            {!isLoading && !error && (
              <div className="space-y-6">
                {paginatedJobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        {/* Company Logo */}
                        {job.company && (job.company as Company).logo ? (
                          <img
                            src={
                              (job.company as Company).logo ||
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
                                {job.city || "No location"} •{" "}
                                {job.metro || "No metro"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <BriefcaseIcon className="w-4 h-4" />
                              <span>
                                {job.experiense || 0} years experience
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedJobId(job.id);
                          setShowApplicationModal(true);
                        }}
                        className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
                      >
                        Apply Now
                      </button>
                    </div>

                    <div className="mt-4">
                      <p className="text-gray-300">{job.description}</p>
                      {typeof job.requirements === "object" &&
                        Object.keys(job.requirements).length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-lg font-semibold text-white mb-2">
                              Requirements
                            </h4>
                            <ul className="list-disc list-inside text-gray-300 space-y-1">
                              {Object.entries(job.requirements).map(
                                ([key, value]) => (
                                  <li key={key}>{`${key}: ${value}`}</li>
                                )
                              )}
                            </ul>
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
                      <div className="flex items-center gap-2 text-gray-500">
                        <CalendarIcon className="w-4 h-4" />
                        <span>Posted {formatDate(job.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
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
                    Previous
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
                    Next
                  </button>
                </nav>
              </div>
            )}

            {/* No Results */}
            {!isLoading && !error && paginatedJobs.length === 0 && (
              <div className="text-center py-12 bg-gray-800 rounded-lg">
                <p className="text-gray-400 text-lg">No jobs found</p>
                <p className="text-gray-500 mt-2">
                  Try adjusting your filters or search query
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
                  Reset All Filters
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
          }}
          onSubmit={handleApplicationSubmit}
          jobId={selectedJobId.toString()}
          jobTitle={jobs.find((j) => j.id === selectedJobId)?.title || ""}
          companyName={
            (jobs.find((j) => j.id === selectedJobId)?.company as Company)
              ?.name || "Unknown Company"
          }
        />
      )}
    </div>
  );
};

export default Jobs;
