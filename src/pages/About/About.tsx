"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Shield,
  Users,
  Target,
  Clock,
  CheckCircle2,
  Tag,
  Calendar,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import {
  issuesApi,
  companiesApi,
  usersApi,
  commentsApi,
} from "../../services/api";

interface Issue {
  id: number;
  user: number;
  issue: string;
  solution: string | null;
  created_at: string;
  updated_at: string;
}

const About = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    issue: "",
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [showMoreIssues, setShowMoreIssues] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(true);
  const [issuesError, setIssuesError] = useState<string | null>(null);

  const [stats, setStats] = useState({
    userCount: 0,
    companyCount: 0,
    dailyVisits: 0,
    fiveStarReviews: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const users = await usersApi.getAll();
        const userCount = users.length;

        const companies = await companiesApi.getAll();
        const companyCount = companies.length;

        const dailyVisits = await estimateDailyLoginsSignups();

        const comments = await commentsApi.getAll();
        const fiveStarReviews = comments.filter(
          (comment) => comment.stars === 5
        ).length;

        setStats({
          userCount,
          companyCount,
          dailyVisits,
          fiveStarReviews,
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
        setStats({
          userCount: 0,
          companyCount: 0,
          dailyVisits: 0,
          fiveStarReviews: 0,
        });
      }
    };

    fetchStats();
    const resetDailyVisits = () => {
      const now = new Date();
      const midnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        0
      );
      const timeUntilMidnight = midnight.getTime() - now.getTime();

      setTimeout(() => {
        setStats((prevStats) => ({ ...prevStats, dailyVisits: 0 }));
        setInterval(() => {
          setStats((prevStats) => ({ ...prevStats, dailyVisits: 0 }));
        }, 24 * 60 * 60 * 1000);
      }, timeUntilMidnight);
    };

    resetDailyVisits();
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData((prevData) => ({
        ...prevData,
        name: user.first_name
          ? `${user.first_name} ${user.last_name || ""}`.trim()
          : "",
        email: user.email || "",
      }));
    }
  }, [isAuthenticated, user]);

  const statsDisplay = [
    { value: stats.userCount, label: t("about.stats.users_stats") },
    { value: stats.companyCount, label: t("about.stats.companies") },
    { value: stats.dailyVisits, label: t("about.stats.dailyVisits") },
    { value: stats.fiveStarReviews, label: t("about.stats.fiveStarReviews") },
  ];

  const values = [
    {
      icon: <Lightbulb className="w-8 h-8" />,
      title: t("about.values.innovation.title"),
      description: t("about.values.innovation.description"),
      id: "innovation",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: t("about.values.integrity.title"),
      description: t("about.values.integrity.description"),
      id: "integrity",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: t("about.values.inclusion.title"),
      description: t("about.values.inclusion.description"),
      id: "inclusion",
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: t("about.values.impact.title"),
      description: t("about.values.impact.description"),
      id: "impact",
    },
  ];

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        setLoadingIssues(true);
        const data = await issuesApi.getResolved();
        setIssues(data);
        setIssuesError(null);
      } catch (error) {
        console.error("Failed to fetch issues:", error);
        setIssuesError("Failed to load issues. Please try again later.");
      } finally {
        setLoadingIssues(false);
      }
    };

    fetchIssues();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated || !user) {
      alert("You must be logged in to submit an issue");
      return;
    }

    if (!formData.issue.trim()) {
      alert("Please describe your issue");
      return;
    }

    try {
      setIsSubmitting(true);

      await issuesApi.create({
        user: user.id,
        issue: formData.issue,
      });

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);

      setFormData((prevData) => ({
        ...prevData,
        issue: "",
      }));
    } catch (error) {
      console.error("Failed to submit issue:", error);
      alert("Failed to submit your issue. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Recent";

    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const resolvedIssues = issues.filter((issue) => issue.solution);
  const initialIssues = resolvedIssues.slice(0, 6);
  const additionalIssues = resolvedIssues.slice(6, 9);

  const estimateDailyLoginsSignups = async (): Promise<number> => {
    try {
      const users = await usersApi.getAll();

      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      let recentActivityCount = 0;

      for (const user of users) {
        const createdAt = new Date(user.created_at);
        const lastLogin = user.last_login ? new Date(user.last_login) : null;

        if (createdAt >= twentyFourHoursAgo && createdAt <= now) {
          recentActivityCount++;
        }
        if (lastLogin && lastLogin >= twentyFourHoursAgo && lastLogin <= now) {
          recentActivityCount++;
        }
      }

      return recentActivityCount;
    } catch (error) {
      console.error("Ошибка при оценке посещений и регистраций:", error);
      return 0;
    }
  };

  return (
    <div className="pt-20 min-h-screen bg-gray-900">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-blue-600 opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl font-bold text-white mb-6">
              {t("about.hero.title")}
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {t("about.hero.subtitle")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission & Stats Section */}
      <section className="py-24 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2
                id="mission"
                className="text-4xl font-bold text-white mb-6 scroll-mt-24"
              >
                {t("about.mission.title")}
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                {t("about.mission.description")}
              </p>
            </motion.div>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid gap-8"
            >
              <div
                id="stats"
                className="grid md:grid-cols-2 gap-8 scroll-mt-24"
              >
                {statsDisplay.map((stat, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    className="text-center p-6 bg-gray-900 rounded-xl w-full max-w-screen-lg mx-auto"
                  >
                    <div className="text-3xl font-bold text-emerald-400 mb-2">
                      {stat.value}
                    </div>
                    <div className="text-gray-400">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <motion.h2
            id="values"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center text-white mb-16 scroll-mt-24"
          >
            {t("about.values.title")}
          </motion.h2>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {values.map((value, index) => (
              <motion.div
                key={index}
                id={value.id}
                variants={itemVariants}
                className="bg-gray-800 p-8 rounded-xl text-center scroll-mt-24"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-600/10 text-emerald-400 mb-6">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">
                  {value.title}
                </h3>
                <p className="text-gray-400">{value.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-gray-800">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2
              id="faq"
              className="text-4xl font-bold text-white mb-4 scroll-mt-24"
            >
              {t("about.faq.title")}
            </h2>
            <p className="text-gray-300">{t("about.faq.subtitle")}</p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {t("about.faq.questions", { returnObjects: true }).map(
              (faq: any, index: number) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="bg-gray-900 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setOpenFaqIndex(openFaqIndex === index ? null : index)
                    }
                    className="w-full px-6 py-4 flex items-center justify-between text-left"
                  >
                    <span className="text-lg font-medium text-white">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        openFaqIndex === index ? "transform rotate-180" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {openFaqIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="px-6 pb-4"
                      >
                        <div className="text-gray-400">{faq.answer}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            )}
          </motion.div>
        </div>
      </section>

      {/* Bug Report Form Section */}
      <section className="py-24 bg-gray-900">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2
              id="bugReport"
              className="text-4xl font-bold text-white mb-4 scroll-mt-24"
            >
              {t("about.bugReport.title")}
            </h2>
            <p className="text-gray-300">{t("about.bugReport.subtitle")}</p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onSubmit={handleSubmit}
            className="bg-gray-800 p-8 rounded-xl space-y-6"
          >
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                {t("about.bugReport.form.name")}
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder={t("about.bugReport.form.namePlaceholder")}
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                {t("about.bugReport.form.email")}
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                readOnly
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-400 focus:outline-none cursor-not-allowed"
              />
              {isAuthenticated && (
                <p className="text-xs text-gray-500 mt-1">
                  {t("home.cta.emailauto")}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="issue"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                {t("about.bugReport.form.issue")}
              </label>
              <textarea
                id="issue"
                value={formData.issue}
                onChange={(e) =>
                  setFormData({ ...formData, issue: e.target.value })
                }
                rows={5}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder={t("about.bugReport.form.issuePlaceholder")}
                required
              />
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isSubmitting || !isAuthenticated}
                className={`px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors flex items-center gap-2 ${
                  isSubmitting || !isAuthenticated
                    ? "opacity-70 cursor-not-allowed"
                    : ""
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {t("about.bugReport.form.submit")}
                  </>
                )}
              </button>
            </div>

            {!isAuthenticated && (
              <div className="text-center text-amber-400 text-sm">
                <span>{t("about.issues.notif")}</span>
              </div>
            )}

            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 text-emerald-400"
              >
                <CheckCircle className="w-5 h-5" />
                <span>{t("about.bugReport.form.success")}</span>
              </motion.div>
            )}
          </motion.form>
        </div>
      </section>

      {/* Recent Resolved Issues Section */}
      <section className="py-24 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2
              id="recentQuestions"
              className="text-4xl font-bold text-white mb-4 scroll-mt-24"
            >
              {t("about.recentQuestions.title")}
            </h2>
            <p className="text-gray-300">{t("home.cta.track")}</p>
          </motion.div>

          {loadingIssues ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent"></div>
              <p className="mt-4 text-gray-400">Loading issues...</p>
            </div>
          ) : issuesError ? (
            <div className="text-center py-12">
              <p className="text-red-400">{issuesError}</p>
            </div>
          ) : resolvedIssues.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No resolved issues found.</p>
            </div>
          ) : (
            <>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {initialIssues.map((issue, index) => (
                  <motion.div
                    key={issue.id}
                    variants={itemVariants}
                    className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-emerald-500/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <h3 className="text-lg font-semibold text-white">
                          Issue #{index + 1}
                        </h3>
                      </div>
                    </div>
                    <div className="mb-4">
                      <p className="text-gray-400">{issue.issue}</p>
                      <div className="flex items-center gap-2 text-gray-500 text-sm mt-2">
                        <Clock className="w-4 h-4" />
                        <span>Reported: {formatDate(issue.created_at)}</span>
                      </div>
                    </div>
                    {issue.solution && (
                      <div className="bg-gray-800 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between gap-2 text-emerald-400 mb-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            <span className="font-medium">Solution</span>
                          </div>
                        </div>
                        <p className="text-gray-300">{issue.solution}</p>
                        <div className="flex items-center gap-2 text-gray-400 text-sm mt-2">
                          <Calendar className="w-4 h-4" />
                          <span>Solved: {formatDate(issue.updated_at)}</span>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end text-sm">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Tag className="w-4 h-4" />
                        <span>Problem id: #{issue.id}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}

                <AnimatePresence>
                  {showMoreIssues &&
                    additionalIssues.map((issue, index) => (
                      <motion.div
                        key={issue.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-emerald-500/30 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            <h3 className="text-lg font-semibold text-white">
                              Issue #{index + 7}
                            </h3>
                          </div>
                        </div>
                        <div className="mb-4">
                          <p className="text-gray-400">{issue.issue}</p>
                          <div className="flex items-center gap-2 text-gray-500 text-sm mt-2">
                            <Clock className="w-4 h-4" />
                            <span>
                              Reported: {formatDate(issue.created_at)}
                            </span>
                          </div>
                        </div>
                        {issue.solution && (
                          <div className="bg-gray-800 rounded-lg p-4 mb-4">
                            <div className="flex items-center justify-between gap-2 text-emerald-400 mb-2">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                <span className="font-medium">Solution</span>
                              </div>
                            </div>
                            <p className="text-gray-300">{issue.solution}</p>
                            <div className="flex items-center gap-2 text-gray-400 text-sm mt-2">
                              <Calendar className="w-4 h-4" />
                              <span>
                                Solved: {formatDate(issue.updated_at)}
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="flex justify-end text-sm">
                          <div className="flex items-center gap-2 text-gray-500">
                            <Tag className="w-4 h-4" />
                            <span>#</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </AnimatePresence>
              </motion.div>

              {resolvedIssues.length > 6 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="text-center mt-12"
                >
                  <button
                    onClick={() => setShowMoreIssues(!showMoreIssues)}
                    className="px-8 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors inline-flex items-center gap-2"
                  >
                    {showMoreIssues ? (
                      <>
                        {t("home.cta.showless")}
                        <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        {t("about.recentQuestions.viewAll")}
                        <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default About;
