"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  StarIcon,
  TrophyIcon,
  BuildingIcon,
  CalendarIcon,
  UsersIcon,
  GlobeIcon,
  AwardIcon,
  TrendingUpIcon,
  LoaderIcon,
  BriefcaseIcon,
  MapPinIcon,
  ClockIcon,
  InfoIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "lucide-react";
import { companiesApi, commentsApi, jobsApi } from "../../services/api";
import type {
  CompanyWithRating,
  ComparisonMetric,
  JobWithCompany,
} from "../../services/auctionTypes";

const Auction = () => {
  const { t } = useTranslation();
  const [companies, setCompanies] = useState<CompanyWithRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topJobs, setTopJobs] = useState<JobWithCompany[]>([]);
  const [showCriteria, setShowCriteria] = useState(false);
  const [activeTab, setActiveTab] = useState<"companies" | "jobs">("companies");

  const metrics: ComparisonMetric[] = [
    {
      key: "founded_year",
      label: "Год основания",
      icon: <CalendarIcon className="w-4 h-4" />,
      format: (value) => value?.toString() || "Не указан",
      isNumeric: true,
    },
    {
      key: "size",
      label: "Размер компании",
      icon: <UsersIcon className="w-4 h-4" />,
      format: (value) => value || "Не указан",
      isNumeric: false,
    },
    {
      key: "industry",
      label: "Отрасль",
      icon: <BuildingIcon className="w-4 h-4" />,
      format: (value) => value || "Не указана",
      isNumeric: false,
    },
    {
      key: "website",
      label: "Веб-сайт",
      icon: <GlobeIcon className="w-4 h-4" />,
      format: (value) => (value ? "Есть" : "Нет"),
      isNumeric: false,
    },
  ];

  const evaluationCriteria = [
    {
      title: "Рейтинг пользователей",
      description: "Средняя оценка на основе отзывов студентов и сотрудников",
      weight: "40%",
      icon: <StarIcon className="w-5 h-5 text-yellow-400" />,
    },
    {
      title: "Опыт и стабильность",
      description: "Год основания компании - показатель надежности и опыта",
      weight: "20%",
      icon: <CalendarIcon className="w-5 h-5 text-blue-400" />,
    },
    {
      title: "Масштаб деятельности",
      description: "Размер компании и количество сотрудников",
      weight: "15%",
      icon: <UsersIcon className="w-5 h-5 text-purple-400" />,
    },
    {
      title: "Качество вакансий",
      description: "Средний уровень зарплат и условий работы",
      weight: "15%",
      icon: <BriefcaseIcon className="w-5 h-5 text-emerald-400" />,
    },
    {
      title: "Цифровое присутствие",
      description: "Наличие корпоративного сайта и онлайн-активность",
      weight: "10%",
      icon: <GlobeIcon className="w-5 h-5 text-cyan-400" />,
    },
  ];

  useEffect(() => {
    fetchCompaniesData();
  }, []);

  const fetchCompaniesData = async () => {
    try {
      setLoading(true);
      const [companiesData, commentsData, jobsData] = await Promise.all([
        companiesApi.getAll(),
        commentsApi.getAll(),
        jobsApi.getAll(),
      ]);

      const companiesWithRatings = companiesData.map((company) => {
        const companyComments = commentsData.filter(
          (comment) => comment.user === company.user
        );

        const rating =
          companyComments.length > 0
            ? companyComments.reduce((sum, comment) => sum + comment.stars, 0) /
              companyComments.length
            : 0;

        return {
          ...company,
          rating: Math.round(rating * 10) / 10,
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

      setCompanies(topCompanies);
      setTopJobs(bestJobs);
    } catch (err) {
      console.error("Error fetching companies data:", err);
      setError("Не удалось загрузить данные компаний");
    } finally {
      setLoading(false);
    }
  };

  const getBestValueForMetric = (metric: ComparisonMetric) => {
    if (companies.length === 0) return null;

    if (metric.isNumeric) {
      if (metric.key === "founded_year") {
        return Math.min(
          ...companies.map((c) => c[metric.key] as number).filter((v) => v)
        );
      }
      return Math.max(
        ...companies.map((c) => c[metric.key] as number).filter((v) => v)
      );
    }

    if (metric.key === "website") {
      return true;
    }

    return null;
  };

  const isHighlighted = (
    company: CompanyWithRating,
    metric: ComparisonMetric
  ) => {
    const bestValue = getBestValueForMetric(metric);
    if (bestValue === null) return false;

    const companyValue = company[metric.key];

    if (metric.isNumeric) {
      return companyValue === bestValue;
    }

    if (metric.key === "website") {
      return !!companyValue;
    }

    return false;
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <StarIcon
            key={i}
            className="w-4 h-4 fill-yellow-400 text-yellow-400"
          />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative w-4 h-4">
            <StarIcon className="w-4 h-4 text-gray-600 absolute" />
            <div className="overflow-hidden w-1/2">
              <StarIcon className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        );
      } else {
        stars.push(<StarIcon key={i} className="w-4 h-4 text-gray-600" />);
      }
    }

    return stars;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <LoaderIcon className="w-8 h-8 animate-spin text-emerald-400 mx-auto mb-4" />
          <p className="text-gray-300">Загрузка данных компаний...</p>
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
            onClick={fetchCompaniesData}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-300 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <TrophyIcon className="w-8 h-8 text-emerald-400" />
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Рейтинг Лучших Компаний
            </h1>
            <TrophyIcon className="w-8 h-8 text-emerald-400" />
          </div>
          <p className="text-lg md:text-xl text-gray-400 max-w-4xl mx-auto leading-relaxed">
            Объективное сравнение топ-5 компаний на платформе Student's Job на
            основе отзывов пользователей, качества вакансий и ключевых
            показателей деятельности
          </p>
        </div>

        {/* Evaluation Criteria */}
        <div className="mb-8">
          <button
            onClick={() => setShowCriteria(!showCriteria)}
            className="flex items-center gap-2 mx-auto px-4 py-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-lg transition-colors"
          >
            <InfoIcon className="w-4 h-4 text-emerald-400" />
            <span className="text-white font-medium">Критерии оценки</span>
            {showCriteria ? (
              <ChevronUpIcon className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDownIcon className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {showCriteria && (
            <div className="mt-4 bg-gray-800/30 rounded-xl border border-gray-700 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {evaluationCriteria.map((criteria, index) => (
                  <div
                    key={index}
                    className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
                  >
                    <div className="flex items-start gap-3">
                      {criteria.icon}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-medium">
                            {criteria.title}
                          </h4>
                          <span className="text-emerald-400 text-sm font-medium">
                            {criteria.weight}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm">
                          {criteria.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {companies.length === 0 ? (
          <div className="text-center py-12">
            <BuildingIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-400">Компании не найдены</p>
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="flex justify-center mb-8">
              <div className="bg-gray-800/50 rounded-lg p-1 border border-gray-700">
                <button
                  onClick={() => setActiveTab("companies")}
                  className={`px-6 py-2 rounded-md font-medium transition-colors ${
                    activeTab === "companies"
                      ? "bg-emerald-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Компании
                </button>
                <button
                  onClick={() => setActiveTab("jobs")}
                  className={`px-6 py-2 rounded-md font-medium transition-colors ${
                    activeTab === "jobs"
                      ? "bg-emerald-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Лучшие вакансии
                </button>
              </div>
            </div>

            {activeTab === "companies" && (
              <>
                {/* Companies Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                  {companies.map((company, index) => (
                    <div
                      key={company.id}
                      className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-emerald-500/50 transition-all duration-300 relative"
                    >
                      {/* Rank Badge */}
                      <div className="absolute -top-3 -right-3 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>

                      {/* Company Logo */}
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                        {company.logo ? (
                          <img
                            src={company.logo || "/placeholder.svg"}
                            alt={company.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <BuildingIcon className="w-8 h-8 text-gray-400" />
                        )}
                      </div>

                      {/* Company Name */}
                      <h3 className="text-lg font-semibold text-white text-center mb-2 truncate">
                        {company.name}
                      </h3>

                      {/* Rating */}
                      <div className="text-center mb-4">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          {renderStars(company.rating)}
                        </div>
                        <p className="text-sm text-gray-400">
                          {company.rating.toFixed(1)} ({company.reviewCount}{" "}
                          отзыв
                          {company.reviewCount !== 1 ? "ов" : ""})
                        </p>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-400 text-center line-clamp-3">
                        {company.description || "Описание не указано"}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Comparison Table */}
                <div className="bg-gray-800/30 rounded-xl border border-gray-700 overflow-hidden">
                  <div className="p-6 border-b border-gray-700">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <AwardIcon className="w-6 h-6 text-emerald-400" />
                      Детальное сравнение
                    </h2>
                    <p className="text-gray-400 mt-2">
                      Лучшие показатели выделены зеленым цветом
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left p-4 text-emerald-400 font-semibold">
                            Показатель
                          </th>
                          {companies.map((company) => (
                            <th
                              key={company.id}
                              className="text-center p-4 text-white font-semibold min-w-[150px]"
                            >
                              {company.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {/* Rating Row */}
                        <tr className="border-b border-gray-700/50">
                          <td className="p-4 text-gray-300 font-medium flex items-center gap-2">
                            <TrendingUpIcon className="w-4 h-4" />
                            Рейтинг
                          </td>
                          {companies.map((company) => {
                            const isHighest =
                              company.rating ===
                              Math.max(...companies.map((c) => c.rating));
                            return (
                              <td key={company.id} className="text-center p-4">
                                <div
                                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${
                                    isHighest
                                      ? "bg-emerald-500/20 text-emerald-400"
                                      : "text-gray-300"
                                  }`}
                                >
                                  <StarIcon className="w-4 h-4 fill-current" />
                                  {company.rating.toFixed(1)}
                                </div>
                              </td>
                            );
                          })}
                        </tr>

                        {/* Other Metrics */}
                        {metrics.map((metric) => (
                          <tr
                            key={metric.key}
                            className="border-b border-gray-700/50"
                          >
                            <td className="p-4 text-gray-300 font-medium flex items-center gap-2">
                              {metric.icon}
                              {metric.label}
                            </td>
                            {companies.map((company) => {
                              const highlighted = isHighlighted(
                                company,
                                metric
                              );
                              return (
                                <td
                                  key={company.id}
                                  className="text-center p-4"
                                >
                                  <span
                                    className={`inline-block px-3 py-1 rounded-full ${
                                      highlighted
                                        ? "bg-emerald-500/20 text-emerald-400 font-medium"
                                        : "text-gray-300"
                                    }`}
                                  >
                                    {metric.format(company[metric.key])}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {activeTab === "jobs" && topJobs.length > 0 && (
              <div className="bg-gray-800/30 rounded-xl border border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-700">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <BriefcaseIcon className="w-6 h-6 text-emerald-400" />
                    Лучшие вакансии от топ компаний
                  </h2>
                  <p className="text-gray-400 mt-2">
                    Самые привлекательные предложения от каждой компании
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                  {topJobs.map((job, index) => (
                    <div
                      key={job.id}
                      className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 hover:border-emerald-500/50 transition-all duration-300"
                    >
                      {/* Company Info */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                          {job.companyData.logo ? (
                            <img
                              src={job.companyData.logo || "/placeholder.svg"}
                              alt={job.companyData.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <BuildingIcon className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-medium truncate">
                            {job.companyData.name}
                          </h4>
                          <div className="flex items-center gap-1">
                            {renderStars(job.companyData.rating).slice(0, 3)}
                            <span className="text-sm text-gray-400 ml-1">
                              {job.companyData.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Job Info */}
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-white line-clamp-2">
                          {job.title}
                        </h3>

                        {/* Salary */}
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                          <span className="text-emerald-400 font-medium text-lg">
                            {job.salary_min && job.salary_max
                              ? `${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()} ₽`
                              : job.salary_min
                              ? `от ${job.salary_min.toLocaleString()} ₽`
                              : job.salary_max
                              ? `до ${job.salary_max.toLocaleString()} ₽`
                              : "Зарплата не указана"}
                          </span>
                        </div>

                        {/* Location */}
                        {job.city && (
                          <div className="flex items-center gap-2 text-gray-400">
                            <MapPinIcon className="w-4 h-4" />
                            <span>{job.city}</span>
                          </div>
                        )}

                        {/* Job Type */}
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 bg-gray-700 text-gray-300 text-sm rounded-full">
                            {job.type || "Полная занятость"}
                          </span>
                          {job.schedule && (
                            <span className="px-3 py-1 bg-gray-700 text-gray-300 text-sm rounded-full">
                              {job.schedule}
                            </span>
                          )}
                        </div>

                        {/* Experience */}
                        {job.experiense && (
                          <div className="flex items-center gap-2 text-gray-400">
                            <ClockIcon className="w-4 h-4" />
                            <span>{job.experiense} лет опыта</span>
                          </div>
                        )}

                        {/* Description Preview */}
                        <p className="text-gray-400 line-clamp-3">
                          {job.description || "Описание не указано"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                <span className="text-emerald-400 text-sm font-medium">
                  Лучший показатель в категории
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
