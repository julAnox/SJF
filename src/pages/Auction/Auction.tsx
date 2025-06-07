"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  TrophyIcon,
  BuildingIcon,
  CalendarIcon,
  UsersIcon,
  GlobeIcon,
  LoaderIcon,
  BriefcaseIcon,
  MapPinIcon,
  ClockIcon,
  InfoIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserIcon,
  GraduationCapIcon,
  CurrencyIcon,
  StarIcon,
  CalculatorIcon,
} from "lucide-react";
import {
  companiesApi,
  commentsApi,
  jobsApi,
  resumesApi,
  usersApi,
} from "../../services/api";
import type {
  CompanyWithRating,
  JobWithCompany,
  ResumeWithRating,
} from "../../services/auctionTypes";

const Auction = () => {
  const { t, i18n } = useTranslation();
  const [companies, setCompanies] = useState<CompanyWithRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topJobs, setTopJobs] = useState<JobWithCompany[]>([]);
  const [topResumes, setTopResumes] = useState<ResumeWithRating[]>([]);
  const [showCriteria, setShowCriteria] = useState(false);
  const [activeTab, setActiveTab] = useState<"companies" | "jobs" | "resumes">(
    "companies"
  );
  const [userProfiles, setUserProfiles] = useState<Record<number, any>>({});

  useEffect(() => {
    i18n.changeLanguage("en");
  }, [i18n]);

  const companyCriteria = [
    {
      title: t("auction.criteria.userScore"),
      description: t("auction.criteria.userScoreDesc"),
      weight: "40%",
      icon: <StarIcon className="w-5 h-5 text-yellow-400" />,
    },
    {
      title: t("auction.criteria.experience"),
      description: t("auction.criteria.experienceDesc"),
      weight: "25%",
      icon: <CalendarIcon className="w-5 h-5 text-blue-400" />,
    },
    {
      title: t("auction.criteria.scale"),
      description: t("auction.criteria.scaleDesc"),
      weight: "20%",
      icon: <UsersIcon className="w-5 h-5 text-purple-400" />,
    },
    {
      title: t("auction.criteria.jobQuality"),
      description: t("auction.criteria.jobQualityDesc"),
      weight: "10%",
      icon: <BriefcaseIcon className="w-5 h-5 text-emerald-400" />,
    },
    {
      title: t("auction.criteria.digitalPresence"),
      description: t("auction.criteria.digitalPresenceDesc"),
      weight: "5%",
      icon: <GlobeIcon className="w-5 h-5 text-cyan-400" />,
    },
  ];

  const jobCriteria = [
    {
      title: t("auction.criteria.salaryLevel"),
      description: t("auction.criteria.salaryLevelDesc"),
      weight: "35%",
      icon: <CurrencyIcon className="w-5 h-5 text-green-400" />,
    },
    {
      title: t("auction.criteria.companyRating"),
      description: t("auction.criteria.companyRatingDesc"),
      weight: "30%",
      icon: <StarIcon className="w-5 h-5 text-yellow-400" />,
    },
    {
      title: t("auction.criteria.jobRequirements"),
      description: t("auction.criteria.jobRequirementsDesc"),
      weight: "20%",
      icon: <BriefcaseIcon className="w-5 h-5 text-orange-400" />,
    },
    {
      title: t("auction.criteria.locationAppeal"),
      description: t("auction.criteria.locationAppealDesc"),
      weight: "15%",
      icon: <MapPinIcon className="w-5 h-5 text-red-400" />,
    },
  ];

  const resumeCriteria = [
    {
      title: t("auction.criteria.educationLevel"),
      description: t("auction.criteria.educationLevelDesc"),
      weight: "25%",
      icon: <GraduationCapIcon className="w-5 h-5 text-indigo-400" />,
    },
    {
      title: t("auction.criteria.workExperience"),
      description: t("auction.criteria.workExperienceDesc"),
      weight: "35%",
      icon: <ClockIcon className="w-5 h-5 text-blue-400" />,
    },
    {
      title: t("auction.criteria.technicalSkills"),
      description: t("auction.criteria.technicalSkillsDesc"),
      weight: "25%",
      icon: <BriefcaseIcon className="w-5 h-5 text-purple-400" />,
    },
    {
      title: t("auction.criteria.portfolioQuality"),
      description: t("auction.criteria.portfolioQualityDesc"),
      weight: "15%",
      icon: <UserIcon className="w-5 h-5 text-pink-400" />,
    },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [companiesData, commentsData, jobsData, resumesData] =
        await Promise.all([
          companiesApi.getAll(),
          commentsApi.getAll(),
          jobsApi.getAll(),
          resumesApi.getAll(),
        ]);

      const userIds = [...new Set(resumesData.map((resume) => resume.user))];
      const userProfilesData: Record<number, any> = {};

      for (const userId of userIds) {
        try {
          const userData = await usersApi.getById(userId);
          userProfilesData[userId] = userData;
        } catch (error) {
          console.error(`Error fetching user ${userId}:`, error);
        }
      }
      setUserProfiles(userProfilesData);

      const companiesWithRatings = companiesData.map((company) => {
        const companyComments = commentsData.filter(
          (comment) => comment.user === company.user
        );

        const userScore =
          companyComments.length > 0
            ? companyComments.reduce((sum, comment) => sum + comment.stars, 0) /
              companyComments.length
            : 0;

        const currentYear = new Date().getFullYear();
        const yearsInBusiness = company.founded_year
          ? currentYear - company.founded_year
          : 0;
        const experienceScore = Math.min((yearsInBusiness / 20) * 5, 5);

        const sizeScore = (() => {
          const size = company.size?.toLowerCase() || "";
          if (size.includes("1000+") || size.includes("large")) return 5;
          if (size.includes("500") || size.includes("medium")) return 4;
          if (size.includes("100")) return 3;
          if (size.includes("50")) return 2;
          return 1;
        })();

        const companyJobs = jobsData.filter((job) =>
          typeof job.company === "object"
            ? job.company.id === company.id
            : job.company === company.id
        );
        const avgSalary =
          companyJobs.length > 0
            ? companyJobs.reduce(
                (sum, job) => sum + (job.salary_max || job.salary_min || 0),
                0
              ) / companyJobs.length
            : 0;
        const jobQualityScore = Math.min((avgSalary / 100000) * 5, 5);

        const digitalScore = company.website ? 5 : 1;

        const totalScore =
          userScore * 0.4 +
          experienceScore * 0.2 +
          sizeScore * 0.15 +
          jobQualityScore * 0.15 +
          digitalScore * 0.1;

        return {
          ...company,
          rating: Math.round(totalScore * 10) / 10,
          userScore: Math.round(userScore * 10) / 10,
          experienceScore: Math.round(experienceScore * 10) / 10,
          scaleScore: Math.round(sizeScore * 10) / 10,
          jobQualityScore: Math.round(jobQualityScore * 10) / 10,
          digitalScore: Math.round(digitalScore * 10) / 10,
          reviewCount: companyComments.length,
        };
      });

      const topCompanies = companiesWithRatings
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 5);

      const bestJobs = topCompanies
        .map((company) => {
          const companyJobs = jobsData.filter((job) =>
            typeof job.company === "object"
              ? job.company.id === company.id
              : job.company === company.id
          );

          if (companyJobs.length === 0) return null;

          const bestJob = companyJobs.reduce((best, current) => {
            const bestSalary = best.salary_max || best.salary_min || 0;
            const currentSalary = current.salary_max || current.salary_min || 0;
            return currentSalary > bestSalary ? current : best;
          });

          return {
            ...bestJob,
            companyData: company,
          };
        })
        .filter(Boolean);

      const resumesWithRatings = resumesData.map((resume) => {
        const educationLevels = {
          highSchool: 2,
          vocational: 2.5,
          incompleteHigher: 3,
          higher: 3.5,
          bachelor: 4,
          master: 4.5,
          phd: 5,
          doctorOfSciences: 5,
        };
        const educationScore = educationLevels[resume.education] || 2;

        const expText = resume.experience || "";
        const expYears = Number.parseInt(expText.match(/\d+/)?.[0] || "0");
        const experienceScore = Math.min((expYears / 10) * 5, 5);

        const skillsCount = resume.skills
          ? Object.keys(resume.skills).length
          : 0;
        const skillsScore = Math.min((skillsCount / 20) * 5, 5);

        const portfolioScore = expText.toLowerCase().includes("projects")
          ? 4
          : 2;

        const totalScore =
          educationScore * 0.3 +
          experienceScore * 0.4 +
          skillsScore * 0.2 +
          portfolioScore * 0.1;

        return {
          ...resume,
          rating: Math.round(totalScore * 10) / 10,
          educationScore: Math.round(educationScore * 10) / 10,
          experienceScore: Math.round(experienceScore * 10) / 10,
          skillsScore: Math.round(skillsScore * 10) / 10,
          portfolioScore: Math.round(portfolioScore * 10) / 10,
          reviewCount: 0,
        };
      });

      const topResumes = resumesWithRatings
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 5);

      setCompanies(topCompanies);
      setTopJobs(bestJobs);
      setTopResumes(topResumes);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(t("auction.errors.failedToLoad"));
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number, maxRating = 5) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= maxRating; i++) {
      if (i <= fullStars) {
        stars.push(
          <StarIcon
            key={i}
            className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-current"
          />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <StarIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 fill-current" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <StarIcon className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-current" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <StarIcon
            key={i}
            className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 fill-current"
          />
        );
      }
    }

    return (
      <div className="flex items-center gap-1">
        {stars}
        <span className="text-xs sm:text-sm text-gray-400 ml-1 sm:ml-2">
          ({rating.toFixed(1)})
        </span>
      </div>
    );
  };

  const getUserAvatar = (userId: number) => {
    if (userProfiles[userId] && userProfiles[userId].avatar) {
      return userProfiles[userId].avatar;
    }
    return "/placeholder.svg?height=48&width=48";
  };

  const formatExperience = (experience: string) => {
    if (!experience) return t("auction.notSpecified");

    const formatted = experience.replace(/\s*лет\s*$/i, "").trim();

    if (
      formatted.toLowerCase().includes("year") ||
      formatted.toLowerCase().includes("год") ||
      formatted.toLowerCase().includes("лет")
    ) {
      return formatted;
    }

    return formatted;
  };

  const getBestValue = (values: number[], currentValue: number) => {
    const maxValue = Math.max(...values);
    return currentValue === maxValue;
  };

  const getBestSalary = (jobs: any[], currentJob: any) => {
    const salaries = jobs.map((job) => job.salary_max || job.salary_min || 0);
    const maxSalary = Math.max(...salaries);
    const currentSalary = currentJob.salary_max || currentJob.salary_min || 0;
    return currentSalary === maxSalary;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <LoaderIcon className="w-8 h-8 animate-spin text-emerald-400 mx-auto mb-4" />
          <p className="text-gray-300">{t("auction.loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
          >
            {t("auction.tryAgain")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-300 pt-16 sm:pt-20">
      <div className="max-w-[1400px] mx-auto px-2 sm:px-4 py-8 sm:py-8 pt-8 sm:pt-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <TrophyIcon className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
              {t("auction.title")}
            </h1>
            <TrophyIcon className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400" />
          </div>
          <p className="text-sm sm:text-lg md:text-xl text-gray-400 max-w-4xl mx-auto leading-relaxed px-2">
            {t("auction.subtitle")}
          </p>
        </div>

        {/* Evaluation Criteria */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => setShowCriteria(!showCriteria)}
            className="flex items-center gap-2 mx-auto px-3 sm:px-4 py-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-lg transition-colors text-sm sm:text-base"
          >
            <InfoIcon className="w-4 h-4 text-emerald-400" />
            <span className="text-white font-medium">
              {t("auction.evaluationCriteria")}
            </span>
            {showCriteria ? (
              <ChevronUpIcon className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDownIcon className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {showCriteria && (
            <div className="mt-4 bg-gray-800/30 rounded-xl border border-gray-700 p-3 sm:p-6">
              {/* Criteria Cards - Centered with increased width */}
              <div className="flex justify-center mb-4 sm:mb-6">
                <div
                  className={`grid gap-3 sm:gap-4 max-w-[1352px] w-full ${
                    activeTab === "companies"
                      ? "grid-cols-1 lg:grid-cols-5"
                      : "grid-cols-1 lg:grid-cols-4"
                  }`}
                >
                  {(activeTab === "companies"
                    ? companyCriteria
                    : activeTab === "jobs"
                    ? jobCriteria
                    : resumeCriteria
                  ).map((criteria, index) => (
                    <div
                      key={index}
                      className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-700"
                    >
                      <div className="flex items-start gap-2 sm:gap-3">
                        {criteria.icon}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-white font-medium text-xs sm:text-sm">
                              {criteria.title}
                            </h4>
                            <span className="text-emerald-400 text-xs sm:text-sm font-bold">
                              {criteria.weight}
                            </span>
                          </div>
                          <p className="text-gray-400 text-xs leading-relaxed">
                            {criteria.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calculation Example */}
              <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <CalculatorIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                  <h4 className="text-white font-medium text-sm sm:text-base">
                    {t(`auction.calculations.${activeTab}.title`)}
                  </h4>
                </div>
                <p className="text-gray-300 text-xs sm:text-sm mb-2">
                  {t(`auction.calculations.${activeTab}.example`)}
                </p>
                <p className="text-emerald-400 text-xs sm:text-sm font-mono">
                  {t(`auction.calculations.${activeTab}.breakdown`)}
                </p>
              </div>
            </div>
          )}
        </div>

        {companies.length === 0 ? (
          <div className="text-center py-12">
            <BuildingIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-lg sm:text-xl text-gray-400">
              {t("auction.noCompanies")}
            </p>
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="flex justify-center mb-6 sm:mb-8">
              <div className="bg-gray-800/50 rounded-lg p-1 border border-gray-700">
                <button
                  onClick={() => setActiveTab("companies")}
                  className={`px-3 sm:px-6 py-2 rounded-md font-medium transition-colors text-xs sm:text-sm ${
                    activeTab === "companies"
                      ? "bg-emerald-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {t("auction.tabs.companies")}
                </button>
                <button
                  onClick={() => setActiveTab("jobs")}
                  className={`px-3 sm:px-6 py-2 rounded-md font-medium transition-colors text-xs sm:text-sm ${
                    activeTab === "jobs"
                      ? "bg-emerald-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {t("auction.tabs.jobs")}
                </button>
                <button
                  onClick={() => setActiveTab("resumes")}
                  className={`px-3 sm:px-6 py-2 rounded-md font-medium transition-colors text-xs sm:text-sm ${
                    activeTab === "resumes"
                      ? "bg-emerald-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {t("auction.tabs.resumes")}
                </button>
              </div>
            </div>

            {activeTab === "companies" && (
              <div className="bg-gray-800/30 rounded-xl border border-gray-700 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-700">
                  <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3">
                    <TrophyIcon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                    {t("auction.title")}
                  </h2>
                  <p className="text-gray-400 mt-2 text-sm sm:text-base">
                    {t("auction.subtitle")}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1200px]">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left p-2 sm:p-4 text-gray-300 font-semibold text-xs sm:text-sm w-16">
                          {t("auction.rank")}
                        </th>
                        <th className="text-left p-2 sm:p-4 text-gray-300 font-semibold text-xs sm:text-sm w-1/4">
                          {t("auction.company")}
                        </th>
                        <th className="text-center p-2 sm:p-4 text-gray-300 font-semibold text-xs sm:text-sm w-1/8">
                          {t("auction.overallScore")}
                        </th>
                        <th className="text-center p-2 sm:p-4 text-gray-300 font-semibold text-xs sm:text-sm w-1/12">
                          {t("auction.userScore")}
                        </th>
                        <th className="text-center p-2 sm:p-4 text-gray-300 font-semibold text-xs sm:text-sm w-1/12">
                          {t("auction.experience")}
                        </th>
                        <th className="text-center p-2 sm:p-4 text-gray-300 font-semibold text-xs sm:text-sm w-1/12">
                          {t("auction.scale")}
                        </th>
                        <th className="text-center p-2 sm:p-4 text-gray-300 font-semibold text-xs sm:text-sm w-1/12">
                          {t("auction.jobQuality")}
                        </th>
                        <th className="text-center p-2 sm:p-4 text-gray-300 font-semibold text-xs sm:text-sm w-1/12">
                          {t("auction.digital")}
                        </th>
                        <th className="text-center p-2 sm:p-4 text-gray-300 font-semibold text-xs sm:text-sm w-1/12">
                          {t("auction.reviews")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {companies.map((company, index) => {
                        const userScores = companies.map((c) => c.userScore);
                        const experienceScores = companies.map(
                          (c) => c.experienceScore
                        );
                        const scaleScores = companies.map((c) => c.scaleScore);
                        const jobQualityScores = companies.map(
                          (c) => c.jobQualityScore
                        );
                        const digitalScores = companies.map(
                          (c) => c.digitalScore
                        );
                        const reviewCounts = companies.map(
                          (c) => c.reviewCount
                        );

                        return (
                          <tr
                            key={company.id}
                            className="border-b border-gray-700/50 hover:bg-gray-800/30"
                          >
                            <td className="p-2 sm:p-4">
                              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                                {index + 1}
                              </div>
                            </td>
                            <td className="p-2 sm:p-4">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                                  {company.logo ? (
                                    <img
                                      src={company.logo || "/placeholder.svg"}
                                      alt={company.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        const target =
                                          e.target as HTMLImageElement;
                                        target.src =
                                          "/placeholder.svg?height=48&width=48";
                                      }}
                                    />
                                  ) : (
                                    <BuildingIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="text-white font-semibold text-sm sm:text-base truncate">
                                    {company.name}
                                  </h3>
                                  <p className="text-gray-400 text-xs truncate max-w-[120px]">
                                    {company.description ||
                                      t("auction.noDescription")}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="text-center p-2 sm:p-4">
                              <div className="flex flex-col items-center">
                                {renderStars(company.rating)}
                              </div>
                            </td>
                            <td className="text-center p-2 sm:p-4">
                              <span
                                className={`font-medium text-xs sm:text-sm ${
                                  getBestValue(userScores, company.userScore)
                                    ? "text-green-400 bg-green-400/10 px-1 sm:px-2 py-1 rounded"
                                    : "text-white"
                                }`}
                              >
                                {company.userScore}
                              </span>
                            </td>
                            <td className="text-center p-2 sm:p-4">
                              <span
                                className={`font-medium text-xs sm:text-sm ${
                                  getBestValue(
                                    experienceScores,
                                    company.experienceScore
                                  )
                                    ? "text-green-400 bg-green-400/10 px-1 sm:px-2 py-1 rounded"
                                    : "text-white"
                                }`}
                              >
                                {company.experienceScore}
                              </span>
                            </td>
                            <td className="text-center p-2 sm:p-4">
                              <span
                                className={`font-medium text-xs sm:text-sm ${
                                  getBestValue(scaleScores, company.scaleScore)
                                    ? "text-green-400 bg-green-400/10 px-1 sm:px-2 py-1 rounded"
                                    : "text-white"
                                }`}
                              >
                                {company.scaleScore}
                              </span>
                            </td>
                            <td className="text-center p-2 sm:p-4">
                              <span
                                className={`font-medium text-xs sm:text-sm ${
                                  getBestValue(
                                    jobQualityScores,
                                    company.jobQualityScore
                                  )
                                    ? "text-green-400 bg-green-400/10 px-1 sm:px-2 py-1 rounded"
                                    : "text-white"
                                }`}
                              >
                                {company.jobQualityScore}
                              </span>
                            </td>
                            <td className="text-center p-2 sm:p-4">
                              <span
                                className={`font-medium text-xs sm:text-sm ${
                                  getBestValue(
                                    digitalScores,
                                    company.digitalScore
                                  )
                                    ? "text-green-400 bg-green-400/10 px-1 sm:px-2 py-1 rounded"
                                    : "text-white"
                                }`}
                              >
                                {company.digitalScore}
                              </span>
                            </td>
                            <td className="text-center p-2 sm:p-4">
                              <span
                                className={`text-xs sm:text-sm ${
                                  getBestValue(
                                    reviewCounts,
                                    company.reviewCount
                                  )
                                    ? "text-green-400 bg-green-400/10 px-1 sm:px-2 py-1 rounded"
                                    : "text-gray-400"
                                }`}
                              >
                                {company.reviewCount}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "jobs" && topJobs.length > 0 && (
              <div className="bg-gray-800/30 rounded-xl border border-gray-700 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-700">
                  <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3">
                    <BriefcaseIcon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                    {t("auction.bestJobs")}
                  </h2>
                  <p className="text-gray-400 mt-2 text-sm sm:text-base">
                    {t("auction.bestJobsDesc")}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px]">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left p-2 sm:p-4 text-gray-300 font-semibold text-xs sm:text-sm w-16">
                          {t("auction.rank")}
                        </th>
                        <th className="text-left p-2 sm:p-4 text-gray-300 font-semibold text-xs sm:text-sm w-1/4">
                          {t("auction.job")}
                        </th>
                        <th className="text-center p-2 sm:p-4 text-gray-300 font-semibold text-xs sm:text-sm w-1/6">
                          {t("auction.company")}
                        </th>
                        <th className="text-center p-2 sm:p-4 text-gray-300 font-semibold text-xs sm:text-sm w-1/6">
                          {t("auction.salary")}
                        </th>
                        <th className="text-center p-2 sm:p-4 text-gray-300 font-semibold text-xs sm:text-sm w-1/8">
                          {t("auction.location")}
                        </th>
                        <th className="text-center p-2 sm:p-4 text-gray-300 font-semibold text-xs sm:text-sm w-1/8">
                          {t("auction.experience")}
                        </th>
                        <th className="text-center p-2 sm:p-4 text-gray-300 font-semibold text-xs sm:text-sm w-1/8">
                          {t("auction.type")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {topJobs.map((job, index) => (
                        <tr
                          key={job.id}
                          className="border-b border-gray-700/50 hover:bg-gray-800/30"
                        >
                          <td className="p-2 sm:p-4">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                              {index + 1}
                            </div>
                          </td>
                          <td className="p-2 sm:p-4">
                            <div>
                              <h3 className="text-white font-semibold text-sm sm:text-base truncate">
                                {job.title}
                              </h3>
                              <p className="text-gray-400 text-xs sm:text-sm line-clamp-3 max-w-[200px]">
                                {job.description || t("auction.noDescription")}
                              </p>
                            </div>
                          </td>
                          <td className="text-center p-2 sm:p-4">
                            <div className="flex flex-col items-center">
                              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden mb-1">
                                {job.companyData.logo ? (
                                  <img
                                    src={
                                      job.companyData.logo || "/placeholder.svg"
                                    }
                                    alt={job.companyData.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <BuildingIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                                )}
                              </div>
                              <span className="text-white text-xs sm:text-sm truncate max-w-[80px]">
                                {job.companyData.name}
                              </span>
                              {renderStars(job.companyData.rating)}
                            </div>
                          </td>
                          <td className="text-center p-2 sm:p-4">
                            <span
                              className={`font-medium text-xs sm:text-sm ${
                                getBestSalary(topJobs, job)
                                  ? "text-green-400 bg-green-400/10 px-1 sm:px-2 py-1 rounded"
                                  : "text-emerald-400"
                              }`}
                            >
                              {job.salary_min && job.salary_max
                                ? `${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
                                : job.salary_min
                                ? `${t(
                                    "auction.from"
                                  )} ${job.salary_min.toLocaleString()}`
                                : job.salary_max
                                ? `${t(
                                    "auction.to"
                                  )} ${job.salary_max.toLocaleString()}`
                                : t("auction.salaryNotSpecified")}{" "}
                              {job.type_of_money || job.currency || "USD"}
                            </span>
                          </td>
                          <td className="text-center p-2 sm:p-4">
                            <span className="text-gray-300 text-xs sm:text-sm">
                              {job.city || "Remote"}
                            </span>
                          </td>
                          <td className="text-center p-2 sm:p-4">
                            <span className="text-gray-300 text-xs sm:text-sm">
                              {job.experiense
                                ? `${job.experiense} ${t(
                                    "auction.yearsExperience"
                                  )}`
                                : t("auction.any")}
                            </span>
                          </td>
                          <td className="text-center p-2 sm:p-4">
                            <span className="px-1 sm:px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full">
                              {job.type || t("auction.fullTime")}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "resumes" && topResumes.length > 0 && (
              <div className="bg-gray-800/30 rounded-xl border border-gray-700 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-700">
                  <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3">
                    <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                    {t("auction.topCandidates")}
                  </h2>
                  <p className="text-gray-400 mt-2 text-sm sm:text-base">
                    {t("auction.topCandidatesDesc")}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1000px]">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left p-2 sm:p-4 text-gray-300 font-semibold text-xs sm:text-sm">
                          {t("auction.rank")}
                        </th>
                        <th className="text-left p-2 sm:p-4 text-gray-300 font-semibold text-xs sm:text-sm">
                          {t("auction.candidate")}
                        </th>
                        <th className="text-center p-2 sm:p-4 text-gray-300 font-semibold text-xs sm:text-sm">
                          {t("auction.overallScore")}
                        </th>
                        <th className="text-center p-2 sm:p-4 text-gray-300 font-semibold text-xs sm:text-sm">
                          {t("auction.education")}
                        </th>
                        <th className="text-center p-2 sm:p-4 text-gray-300 font-semibold text-xs sm:text-sm">
                          {t("auction.experience")}
                        </th>
                        <th className="text-center p-2 sm:p-4 text-gray-300 font-semibold text-xs sm:text-sm">
                          {t("auction.skills")}
                        </th>
                        <th className="text-center p-2 sm:p-4 text-gray-300 font-semibold text-xs sm:text-sm">
                          {t("auction.portfolio")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {topResumes.map((resume, index) => {
                        const educationScores = topResumes.map(
                          (r) => r.educationScore
                        );
                        const experienceScores = topResumes.map(
                          (r) => r.experienceScore
                        );
                        const skillsScores = topResumes.map(
                          (r) => r.skillsScore
                        );
                        const portfolioScores = topResumes.map(
                          (r) => r.portfolioScore
                        );

                        return (
                          <tr
                            key={resume.id}
                            className="border-b border-gray-700/50 hover:bg-gray-800/30"
                          >
                            <td className="p-2 sm:p-4">
                              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                                {index + 1}
                              </div>
                            </td>
                            <td className="p-2 sm:p-4">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                                  <img
                                    src={
                                      getUserAvatar(resume.user) ||
                                      "/placeholder.svg" ||
                                      "/placeholder.svg"
                                    }
                                    alt={
                                      resume.profession ||
                                      t("auction.candidate")
                                    }
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target =
                                        e.target as HTMLImageElement;
                                      target.src =
                                        "/placeholder.svg?height=48&width=48";
                                    }}
                                  />
                                </div>
                                <div>
                                  <h3 className="text-white font-semibold text-sm sm:text-base">
                                    {resume.profession ||
                                      t("auction.candidate")}
                                  </h3>
                                  <p className="text-gray-400 text-xs sm:text-sm">
                                    {resume.institutionName ||
                                      t("auction.notSpecified")}
                                    {resume.graduationYear
                                      ? `, ${resume.graduationYear}`
                                      : ""}
                                  </p>
                                  <p className="text-gray-400 text-xs">
                                    {formatExperience(resume.experience)}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="text-center p-2 sm:p-4">
                              <div className="flex flex-col items-center">
                                {renderStars(resume.rating)}
                              </div>
                            </td>
                            <td className="text-center p-2 sm:p-4">
                              <span
                                className={`font-medium text-xs sm:text-sm ${
                                  getBestValue(
                                    educationScores,
                                    resume.educationScore
                                  )
                                    ? "text-green-400 bg-green-400/10 px-1 sm:px-2 py-1 rounded"
                                    : "text-white"
                                }`}
                              >
                                {resume.educationScore}
                              </span>
                            </td>
                            <td className="text-center p-2 sm:p-4">
                              <span
                                className={`font-medium text-xs sm:text-sm ${
                                  getBestValue(
                                    experienceScores,
                                    resume.experienceScore
                                  )
                                    ? "text-green-400 bg-green-400/10 px-1 sm:px-2 py-1 rounded"
                                    : "text-white"
                                }`}
                              >
                                {resume.experienceScore}
                              </span>
                            </td>
                            <td className="text-center p-2 sm:p-4">
                              <span
                                className={`font-medium text-xs sm:text-sm ${
                                  getBestValue(skillsScores, resume.skillsScore)
                                    ? "text-green-400 bg-green-400/10 px-1 sm:px-2 py-1 rounded"
                                    : "text-white"
                                }`}
                              >
                                {resume.skillsScore}
                              </span>
                            </td>
                            <td className="text-center p-2 sm:p-4">
                              <span
                                className={`font-medium text-xs sm:text-sm ${
                                  getBestValue(
                                    portfolioScores,
                                    resume.portfolioScore
                                  )
                                    ? "text-green-400 bg-green-400/10 px-1 sm:px-2 py-1 rounded"
                                    : "text-white"
                                }`}
                              >
                                {resume.portfolioScore}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="mt-6 sm:mt-8 text-center">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-green-400 text-xs sm:text-sm font-medium">
                  {t("auction.bestIndicator")}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Auction;
