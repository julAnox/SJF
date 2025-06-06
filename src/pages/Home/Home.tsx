"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  SearchIcon,
  TrendingUpIcon,
  UsersIcon,
  BriefcaseIcon,
  GraduationCapIcon,
  Send,
  MessageSquare,
  ThumbsUp,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import StarRating from "../../components/StarRating/StarRating";
import { commentsApi, usersApi, jobsApi } from "../../services/api";
import { companiesApi } from "../../services/api";

interface CommentWithUser extends Comment {
  first_name: string;
  last_name: string;
  date: string;
  avatar?: string;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  avatar?: string;
}

interface Company {
  id: number;
  name: string;
  logo?: string;
  created_at: string;
  status: string;
}

interface Job {
  id: number;
  status: string;
}

interface Statistics {
  activeJobs: number;
  totalStudents: number;
  activeCompanies: number;
}

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");

  const [statistics, setStatistics] = useState<Statistics>({
    activeJobs: 0,
    totalStudents: 0,
    activeCompanies: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const [allComments, setAllComments] = useState<CommentWithUser[]>([]);
  const [newComment, setNewComment] = useState({
    content: "",
    stars: 5,
  });
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [likedComments, setLikedComments] = useState<Record<number, boolean>>(
    {}
  );
  const [userCache, setUserCache] = useState<Record<number, User>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [commentsPerPage, setCommentsPerPage] = useState(9);
  const [latestCompanies, setLatestCompanies] = useState<Company[]>([]);

  const indexOfLastComment = currentPage * commentsPerPage;
  const indexOfFirstComment = indexOfLastComment - commentsPerPage;
  const currentComments = allComments.slice(
    indexOfFirstComment,
    indexOfLastComment
  );
  const totalPages = Math.ceil(allComments.length / commentsPerPage);

  const fetchStatistics = async () => {
    setIsLoadingStats(true);
    try {
      const [jobsData, usersData, companiesData] = await Promise.all([
        jobsApi.getAll(),
        usersApi.getAll(),
        companiesApi.getAll(),
      ]);

      const activeJobs = jobsData.filter(
        (job: any) => job.status === "active"
      ).length;

      const totalStudents = usersData.length;

      const activeCompanies = companiesData.filter(
        (company: any) => company.status === "active"
      ).length;

      setStatistics({
        activeJobs,
        totalStudents,
        activeCompanies,
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
      setStatistics({
        activeJobs: 0,
        totalStudents: 0,
        activeCompanies: 0,
      });
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleSearch = () => {
    console.log("Search triggered with query:", searchQuery);
    try {
      if (searchQuery.trim()) {
        const searchUrl = `/jobs?search=${encodeURIComponent(
          searchQuery.trim()
        )}`;
        console.log("Navigating to:", searchUrl); // Debug log
        navigate(searchUrl);
      } else {
        console.log("Navigating to jobs page without search");
        navigate("/jobs");
      }
    } catch (error) {
      console.error("Navigation error:", error);
      if (searchQuery.trim()) {
        window.location.href = `/jobs?search=${encodeURIComponent(
          searchQuery.trim()
        )}`;
      } else {
        window.location.href = "/jobs";
      }
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  useEffect(() => {
    const parallaxScroll = () => {
      const scrolled = window.scrollY;
      const hero = document.querySelector(".hero");
      if (hero) {
        hero.style.backgroundPositionY = `${-(scrolled * 0.5)}px`;
      }
    };

    window.addEventListener("scroll", parallaxScroll);
    return () => window.removeEventListener("scroll", parallaxScroll);
  }, []);

  useEffect(() => {
    fetchComments();
    fetchStatistics();
    const savedLikedComments = localStorage.getItem("likedComments");
    if (savedLikedComments) {
      setLikedComments(JSON.parse(savedLikedComments));
    }
    const savedCommentsPerPage = localStorage.getItem("commentsPerPage");
    if (savedCommentsPerPage) {
      setCommentsPerPage(Number(savedCommentsPerPage));
    }
    fetchLatestCompanies();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [commentsPerPage]);

  const dataURItoBlob = (dataURI) => {
    const parts = dataURI.split(",");
    const mime = parts[0].match(/:(.*?);/)[1];
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const dataURItoURL = (dataURI) => {
    if (!dataURI) return null;
    const blob = dataURItoBlob(dataURI);
    return URL.createObjectURL(blob);
  };

  const getAvatarUrl = (avatarPath: string) => {
    if (!avatarPath) return "/placeholder.svg";
    if (avatarPath.startsWith("data:image")) {
      return dataURItoURL(avatarPath);
    }
    if (avatarPath.startsWith("http://") || avatarPath.startsWith("https://")) {
      return avatarPath;
    }
    if (!avatarPath.startsWith("/")) {
      return `/${avatarPath}`;
    }
    return avatarPath;
  };

  const fetchUserData = async (userId: number) => {
    if (userCache[userId]) {
      return userCache[userId];
    }
    try {
      const userData = await usersApi.getById(userId);
      setUserCache((prev) => ({ ...prev, [userId]: userData }));
      return userData;
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
      return null;
    }
  };

  const fetchComments = async () => {
    setIsLoadingComments(true);
    try {
      const commentsData = await commentsApi.getAll();
      const basicComments = commentsData.map((comment) => ({
        ...comment,
        first_name: "User",
        last_name: "",
        date: new Date().toISOString().split("T")[0],
        avatar: "",
      }));
      setAllComments(basicComments);
      const userPromises = commentsData.map(async (comment) => {
        const userData = await fetchUserData(comment.user);
        return { commentId: comment.id, userData };
      });
      const userResults = await Promise.all(userPromises);
      setAllComments((prevComments) =>
        prevComments.map((comment) => {
          const userResult = userResults.find(
            (result) => result.commentId === comment.id
          );
          if (userResult && userResult.userData) {
            return {
              ...comment,
              first_name: userResult.userData.first_name || "User",
              last_name: userResult.userData.last_name || "",
              avatar: userResult.userData.avatar || "",
            };
          }
          return comment;
        })
      );
    } catch (error) {
      console.error("Error loading comments:", error);
      setAllComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.content.trim() || !isAuthenticated || !user?.id) return;
    setIsSubmitting(true);
    try {
      const commentData = {
        content: newComment.content,
        stars: newComment.stars,
        user: Number.parseInt(user.id),
        likes: 0,
      };
      const response = await commentsApi.create(commentData);
      const newCommentObj: CommentWithUser = {
        ...response,
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        avatar: user.avatar || undefined,
        date: new Date().toISOString().split("T")[0],
      };
      setAllComments((prev) => [newCommentObj, ...prev]);
      setNewComment({ content: "", stars: 5 });
      setShowCommentForm(false);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error submitting comment:", error);
      alert("Failed to submit comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLike = async (commentId: number) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    try {
      const comment = allComments.find((c) => c.id === commentId);
      if (!comment) return;
      const isLiked = likedComments[commentId];
      const newLikes = isLiked ? comment.likes - 1 : comment.likes + 1;
      await commentsApi.like(commentId, newLikes);
      setAllComments((prevComments) =>
        prevComments.map((comment) =>
          comment.id === commentId ? { ...comment, likes: newLikes } : comment
        )
      );
      const updatedLikedComments = { ...likedComments, [commentId]: !isLiked };
      if (!updatedLikedComments[commentId]) {
        delete updatedLikedComments[commentId];
      }
      setLikedComments(updatedLikedComments);
      localStorage.setItem(
        "likedComments",
        JSON.stringify(updatedLikedComments)
      );
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    const commentsSection = document.getElementById("comments-section");
    if (commentsSection) {
      commentsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCommentsPerPageChange = (value: number) => {
    setCommentsPerPage(value);
    localStorage.setItem("commentsPerPage", value.toString());
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      if (currentPage <= 2) {
        end = Math.min(totalPages - 1, 4);
      }
      if (currentPage >= totalPages - 1) {
        start = Math.max(2, totalPages - 3);
      }
      if (start > 2) {
        pages.push("...");
      }
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (end < totalPages - 1) {
        pages.push("...");
      }
      pages.push(totalPages);
    }
    return pages;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  const fetchLatestCompanies = async () => {
    try {
      const allCompanies = await companiesApi.getAll();
      const sortedCompanies = allCompanies.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const latestSix = sortedCompanies.slice(0, 6);
      setLatestCompanies(latestSix);
    } catch (error) {
      console.error("Error fetching latest companies:", error);
    }
  };

  return (
    <div className="pt-20 min-h-screen bg-gray-900">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden hero">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-5 scale-110 transition-transform duration-500"></div>

        <div className="relative z-10 text-center max-w-4xl mx-auto px-4 mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-6xl font-bold mb-6 font-mono"
          >
            {t("home.hero.title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl mb-12 opacity-90"
          >
            {t("home.hero.subtitle")}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex items-center gap-4 bg-gray-800/50 backdrop-blur-md rounded-lg p-2 max-w-2xl mx-auto"
          >
            <SearchIcon className="w-6 h-6 ml-4 text-gray-400" />
            <input
              type="text"
              placeholder={t("home.hero.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-400 text-lg px-4"
            />
            <button
              onClick={handleSearch}
              className="px-8 py-3 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition-colors hover:scale-105 transform duration-200"
            >
              {t("home.hero.search")}
            </button>
          </motion.div>
        </div>

        {/* Статистика с реальными данными */}
        <div className="flex justify-center gap-12 px-8 py-8 bg-gray-800 rounded-lg w-auto mx-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <h3 className="text-4xl font-bold mb-2 font-mono text-emerald-400">
              {isLoadingStats ? (
                <Loader2 className="w-8 h-8 animate-spin mx-auto" />
              ) : (
                statistics.activeJobs
              )}
            </h3>
            <p className="text-sm text-gray-300">{t("home.stats.jobs")}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="text-center"
          >
            <h3 className="text-4xl font-bold mb-2 font-mono text-emerald-400">
              {isLoadingStats ? (
                <Loader2 className="w-8 h-8 animate-spin mx-auto" />
              ) : (
                statistics.totalStudents
              )}
            </h3>
            <p className="text-sm text-gray-300">{t("home.stats.students")}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="text-center"
          >
            <h3 className="text-4xl font-bold mb-2 font-mono text-emerald-400">
              {isLoadingStats ? (
                <Loader2 className="w-8 h-8 animate-spin mx-auto" />
              ) : (
                statistics.activeCompanies
              )}
            </h3>
            <p className="text-sm text-gray-300">{t("home.stats.companies")}</p>
          </motion.div>
        </div>
      </section>

      <section className="py-24 px-4 bg-gray-800">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto"
        >
          <motion.div
            variants={itemVariants}
            className="bg-gray-900 p-8 rounded-2xl shadow-lg transform hover:-translate-y-2 transition-all duration-300 border border-gray-700"
          >
            <TrendingUpIcon className="w-12 h-12 text-emerald-400 mb-4" />
            <h3 className="text-2xl font-bold mb-4 text-white">
              {t("home.features.jobs.title")}
            </h3>
            <p className="text-gray-400">
              {t("home.features.jobs.description")}
            </p>
          </motion.div>
          <motion.div
            variants={itemVariants}
            className="bg-gray-900 p-8 rounded-2xl shadow-lg transform hover:-translate-y-2 transition-all duration-300 border border-gray-700"
          >
            <UsersIcon className="w-12 h-12 text-emerald-400 mb-4" />
            <h3 className="text-2xl font-bold mb-4 text-white">
              {t("home.features.students.title")}
            </h3>
            <p className="text-gray-400">
              {t("home.features.students.description")}
            </p>
          </motion.div>
          <motion.div
            variants={itemVariants}
            className="bg-gray-900 p-8 rounded-2xl shadow-lg transform hover:-translate-y-2 transition-all duration-300 border border-gray-700"
          >
            <BriefcaseIcon className="w-12 h-12 text-emerald-400 mb-4" />
            <h3 className="text-2xl font-bold mb-4 text-white">
              {t("home.features.opportunities.title")}
            </h3>
            <p className="text-gray-400">
              {t("home.features.opportunities.description")}
            </p>
          </motion.div>
          <motion.div
            variants={itemVariants}
            className="bg-gray-900 p-8 rounded-2xl shadow-lg transform hover:-translate-y-2 transition-all duration-300 border border-gray-700"
          >
            <GraduationCapIcon className="w-12 h-12 text-emerald-400 mb-4" />
            <h3 className="text-2xl font-bold mb-4 text-white">
              {t("home.features.education.title")}
            </h3>
            <p className="text-gray-400">
              {t("home.features.education.description")}
            </p>
          </motion.div>
        </motion.div>
      </section>

      <section className="py-24 px-4 bg-gray-900">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl font-bold text-center mb-16 text-white"
        >
          {t("home.howItWorks.title")}
        </motion.h2>
        <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
          {[1, 2, 3].map((step) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: step * 0.2 }}
              className="flex-1 text-center p-8"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                {step}
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">
                {t(`home.howItWorks.step${step}.title`)}
              </h3>
              <p className="text-gray-400">
                {t(`home.howItWorks.step${step}.description`)}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-24 px-4 bg-gray-800">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl font-bold text-center mb-6 text-white"
        >
          {t("home.companies.title")}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-xl text-center mb-16 text-gray-400"
        >
          {t("home.companies.subtitle")}
        </motion.p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 max-w-6xl mx-auto items-center justify-items-center">
          {latestCompanies.map((company) => (
            <div key={company.id} className="flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className={`flex items-center justify-center p-6 rounded-lg hover:shadow-lg transition-all duration-300 bg-gray-900 w-40 h-24 mb-3`}
              >
                <img
                  src={company.logo || "/placeholder.svg"}
                  alt={company.name}
                  className="max-w-full max-h-full object-contain opacity-75 hover:opacity-100 transition-opacity"
                  style={{
                    objectFit: "contain",
                    backgroundColor: "transparent",
                  }}
                />
              </motion.div>
              <p className="text-sm text-gray-300 text-center">
                {company.name}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="comments-section" className="py-24 px-4 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-bold text-white"
            >
              {t("home.cta.studre")}
            </motion.h2>
            {isAuthenticated ? (
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                onClick={() => setShowCommentForm(true)}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors flex items-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                {t("home.cta.sharestu")}
              </motion.button>
            ) : (
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                onClick={() => navigate("/login")}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors flex items-center gap-2"
              >
                {t("home.cta.logintorewiew")}
              </motion.button>
            )}
          </div>

          {showCommentForm && isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 rounded-xl p-6 mb-8"
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t("home.cta.rate")}
                  </label>
                  <StarRating
                    rating={newComment.stars}
                    onChange={(rating) =>
                      setNewComment((prev) => ({ ...prev, stars: rating }))
                    }
                    size={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t("home.cta.youreview")}
                  </label>
                  <textarea
                    value={newComment.content}
                    onChange={(e) =>
                      setNewComment((prev) => ({
                        ...prev,
                        content: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 h-32 resize-none"
                    placeholder={t("home.cta.shareyourexp")}
                    required
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCommentForm(false);
                      setNewComment({ content: "", stars: 5 });
                    }}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    {t("home.cta.cancelreview")}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !newComment.content.trim()}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {t("home.cta.submitreview")}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {isLoadingComments ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : (
            <>
              {/* Comments per page selector - Integrated directly */}
              <div className="flex justify-end mb-6">
                <div className="relative inline-block">
                  <div className="flex items-center gap-2 text-gray-300 text-sm">
                    <span>{t("home.cta.commentsperpage")}</span>
                    <div className="relative">
                      <select
                        value={commentsPerPage}
                        onChange={(e) =>
                          handleCommentsPerPageChange(Number(e.target.value))
                        }
                        className="appearance-none bg-gray-800 border border-gray-700 rounded-md px-3 py-1 pr-8 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {[9, 12, 15].map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {currentComments.map((comment) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="bg-gray-800 p-8 rounded-xl border border-gray-700"
                  >
                    {/* Avatar left, name right */}
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold mr-3 overflow-hidden">
                        {comment.avatar ? (
                          <img
                            src={
                              getAvatarUrl(comment.avatar) || "/placeholder.svg"
                            }
                            alt={`${comment.first_name} ${comment.last_name}`}
                            className="w-10 h-10 object-cover"
                            onError={(e) => {
                              // If image fails to load, show first letter of name
                              e.currentTarget.style.display = "none";
                              e.currentTarget.parentElement!.innerText =
                                comment.first_name.charAt(0);
                            }}
                          />
                        ) : (
                          comment.first_name.charAt(0)
                        )}
                      </div>
                      <h4 className="font-bold text-white text-lg">{`${comment.first_name} ${comment.last_name}`}</h4>
                    </div>

                    {/* Stars below name */}
                    <div className="mb-4">
                      <StarRating rating={comment.stars} readonly size={5} />
                    </div>

                    {/* Comment text with word-wrap */}
                    <p className="text-gray-300 mb-6 break-words whitespace-pre-wrap">
                      {comment.content}
                    </p>

                    {/* Likes at the bottom */}
                    <div className="flex items-center justify-between">
                      <p className="text-gray-400 text-sm">{comment.date}</p>
                      <button
                        className={`flex items-center gap-1 ${
                          likedComments[comment.id]
                            ? "text-emerald-400"
                            : "text-gray-400 hover:text-emerald-400"
                        } transition-colors`}
                        onClick={() => handleToggleLike(comment.id)}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>{comment.likes}</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pagination - Integrated directly */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center mt-8 space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-md bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {getPageNumbers().map((page, index) => (
                    <React.Fragment key={index}>
                      {page === "..." ? (
                        <span className="px-3 py-1 text-gray-400">...</span>
                      ) : (
                        <button
                          onClick={() =>
                            typeof page === "number" && handlePageChange(page)
                          }
                          className={`px-3 py-1 rounded-md ${
                            currentPage === page
                              ? "bg-emerald-600 text-white"
                              : "bg-gray-800 text-white hover:bg-gray-700"
                          }`}
                        >
                          {page}
                        </button>
                      )}
                    </React.Fragment>
                  ))}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-md bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <section className="py-24 px-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl font-bold mb-6">{t("home.cta.title")}</h2>
          <p className="text-xl mb-8 text-gray-300">
            {t("home.cta.description")}
          </p>
          <button
            onClick={() => {
              console.log("CTA button clicked");
              try {
                navigate("/jobs");
              } catch (error) {
                console.error("Navigation error:", error);
                window.location.href = "/jobs";
              }
            }}
            className="px-12 py-4 bg-emerald-500 text-white rounded-lg font-semibold text-lg hover:bg-emerald-600 transition-colors hover:scale-105 transform duration-200"
          >
            {t("home.cta.button")}
          </button>
        </motion.div>
      </section>
    </div>
  );
};

export default Home;
