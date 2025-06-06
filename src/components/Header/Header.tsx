"use client";

import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import {
  BriefcaseIcon,
  FileTextIcon,
  MessagesSquareIcon,
  InfoIcon,
  GavelIcon,
  Globe,
  LogInIcon,
  UserPlusIcon,
  Menu,
  X,
  User,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import logo from "../../assets/logo.png";
import messagesService from "../../services/messagesService";
import chatsService from "../../services/chatsService";
import applicationsService from "../../services/applicationsService";
import { jobsApi, companiesApi } from "../../services/api";

const Header = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ru" : "en";
    i18n.changeLanguage(newLang);
    localStorage.setItem("language", newLang);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
    closeMenu();
  };

  const handleLogoClick = () => {
    navigate("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleProfileClick = () => {
    navigate("/profile");
    window.scrollTo({ top: 0, behavior: "smooth" });
    closeMenu();
  };

  const handleAuthClick = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
    closeMenu();
  };

  const handleLogout = () => {
    logout();
    closeMenu();
  };

  const isStudent = user?.role === "student";

  const fetchUnreadMessages = useCallback(async () => {
    if (!user) return;

    try {
      console.log(
        `[${new Date().toISOString()}] 🔔 Header: Fetching fresh unread count...`
      );

      if (typeof window !== "undefined") {
        delete window.chatDataCache;
        delete window.chatRelatedDataCache;
        delete window.chatMessagesCache;
        delete window.messagesCache;
      }

      try {
        const unreadCountResponse = await chatsService.getUnreadCount(user.id);
        setUnreadCount(unreadCountResponse);

        if (unreadCountResponse > 0) {
          document.title = `(${unreadCountResponse}) Student's Job`;
        } else {
          document.title = "Student's Job";
        }

        console.log(
          `[${new Date().toISOString()}] 🔔 Header: Got ${unreadCountResponse} unread messages`
        );
        return;
      } catch (error) {
        console.log("Header: Falling back to manual unread count calculation");
      }

      const [allChats, allMessages] = await Promise.all([
        chatsService.getAll(),
        messagesService.getAll(),
      ]);

      let allApplications, allJobs, allCompanies;
      if (allChats.length > 0) {
        [allApplications, allJobs, allCompanies] = await Promise.all([
          applicationsService.getAll(),
          jobsApi.getAll(),
          companiesApi.getAll(),
        ]);
      } else {
        allApplications = [];
        allJobs = [];
        allCompanies = [];
      }

      let relevantUnreadMessages = 0;
      const currentOpenChat = window.currentOpenChat;

      for (const chat of allChats) {
        const application = allApplications.find(
          (app) => app.id === chat.application
        );
        if (!application) continue;

        const job = allJobs.find((j) => j.id === application.job);
        if (!job) continue;

        let isRelevant = false;

        if (user.role === "student") {
          isRelevant = application.user === Number.parseInt(user.id);
        } else if (user.role === "company") {
          const userCompany = allCompanies.find(
            (company) => company.user === Number.parseInt(user.id)
          );

          if (userCompany) {
            isRelevant =
              typeof job.company === "number"
                ? job.company === userCompany.id
                : job.company.id === userCompany.id;
          } else {
            isRelevant =
              typeof job.company === "number"
                ? job.company === Number.parseInt(user.id)
                : job.company.id === Number.parseInt(user.id);
          }
        }

        if (!isRelevant) continue;

        const isChatOpen = currentOpenChat === chat.id.toString();

        if (!isChatOpen) {
          const chatMessages = allMessages.filter(
            (msg) => msg.chat === chat.id
          );
          const unreadMessagesCount = chatMessages.filter(
            (msg) => !msg.read && msg.sender !== Number.parseInt(user.id)
          ).length;

          relevantUnreadMessages += unreadMessagesCount;
        }
      }

      setUnreadCount(relevantUnreadMessages);

      if (relevantUnreadMessages > 0) {
        document.title = `(${relevantUnreadMessages}) Student's Job`;
      } else {
        document.title = "Student's Job";
      }

      console.log(
        `[${new Date().toISOString()}] 🔔 Header: Calculated ${relevantUnreadMessages} unread messages`
      );

      if (typeof window !== "undefined") {
        window.globalUnreadCount = relevantUnreadMessages;
      }
    } catch (error) {
      console.error("Header: Error fetching unread messages:", error);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    fetchUnreadMessages();

    const interval = setInterval(() => {
      if (document.hasFocus()) {
        fetchUnreadMessages();
      }
    }, 2000);

    const handleUnreadMessagesUpdated = (event: CustomEvent) => {
      if (event.detail && typeof event.detail.unreadCount === "number") {
        setUnreadCount(event.detail.unreadCount);

        if (event.detail.unreadCount > 0) {
          document.title = `(${event.detail.unreadCount}) Student Job`;
        } else {
          document.title = "Student's Job";
        }
        return;
      }

      setTimeout(() => {
        fetchUnreadMessages();
      }, 500);
    };

    window.addEventListener(
      "unreadMessagesUpdated",
      handleUnreadMessagesUpdated as EventListener
    );

    const handleFocus = () => {
      fetchUnreadMessages();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener(
        "unreadMessagesUpdated",
        handleUnreadMessagesUpdated as EventListener
      );
      window.removeEventListener("focus", handleFocus);
    };
  }, [user, fetchUnreadMessages]);

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-gray-900/80 backdrop-blur-md z-50 border-b border-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between px-6 py-6 lg:py-5">
          {/* Logo */}
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-4 text-xl md:text-2xl font-bold text-emerald-400 hover:text-emerald-300 transition-colors shrink-0"
          >
            <span className="text-xl">Student's</span>
            <img src={logo || "/placeholder.svg"} alt="" className="w-10" />
            <span className="text-xl">Job</span>
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden text-gray-400 hover:text-white transition-colors"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center justify-between flex-1 max-w-7xl ml-7">
            <nav className="flex items-center gap-2">
              <button
                onClick={() => handleNavigation("/jobs")}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out text-sm
                  ${
                    isActivePath("/jobs")
                      ? "text-emerald-400 bg-gray-800"
                      : "text-gray-400 hover:text-emerald-400 hover:bg-gray-800"
                  }`}
              >
                <BriefcaseIcon className="w-5 h-5" />
                {t("nav.jobs")}
              </button>
              {!isStudent && (
                <button
                  onClick={() => handleNavigation("/resumes")}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out text-sm
                    ${
                      isActivePath("/resumes")
                        ? "text-emerald-400 bg-gray-800"
                        : "text-gray-400 hover:text-emerald-400 hover:bg-gray-800"
                    }`}
                >
                  <FileTextIcon className="w-5 h-5" />
                  {t("nav.resumes")}
                </button>
              )}
              <button
                onClick={() => handleNavigation("/chat")}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out text-sm
                  ${
                    isActivePath("/chat")
                      ? "text-emerald-400 bg-gray-800"
                      : "text-gray-400 hover:text-emerald-400 hover:bg-gray-800"
                  }`}
              >
                <div className="relative">
                  <MessagesSquareIcon className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </div>
                  )}
                </div>
                {t("nav.chat")}
              </button>
              <button
                onClick={() => handleNavigation("/auction")}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out text-sm
                  ${
                    isActivePath("/auction")
                      ? "text-emerald-400 bg-gray-800"
                      : "text-gray-400 hover:text-emerald-400 hover:bg-gray-800"
                  }`}
              >
                <GavelIcon className="w-5 h-5" />
                {t("nav.auction")}
              </button>
              <button
                onClick={() => handleNavigation("/about")}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out text-sm
                  ${
                    isActivePath("/about")
                      ? "text-emerald-400 bg-gray-800"
                      : "text-gray-400 hover:text-emerald-400 hover:bg-gray-800"
                  }`}
              >
                <InfoIcon className="w-5 h-5" />
                {t("nav.about")}
              </button>
            </nav>

            {/* Desktop Auth & Language */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-gray-800 transition-all duration-300 ease-in-out text-sm"
              >
                <Globe className="w-5 h-5" />
                {i18n.language.toUpperCase()}
              </button>

              {isAuthenticated ? (
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleProfileClick}
                    className="flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition-colors"
                  >
                    <img
                      src={
                        user?.avatar ||
                        `https://ui-avatars.com/api/?name=${
                          user?.first_name || "/placeholder.svg"
                        }+${user?.last_name}&background=random`
                      }
                      alt={`${user?.first_name} ${user?.last_name}`}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                    <span className="text-sm">
                      {user?.first_name} {user?.last_name}
                    </span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-gray-800 transition-all duration-300 ease-in-out text-sm"
                  >
                    <LogInIcon className="w-5 h-5" />
                    {t("home.cta.log")}
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => handleAuthClick("/login")}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-gray-800 transition-all duration-300 ease-in-out text-sm"
                  >
                    <LogInIcon className="w-5 h-5" />
                    {t("nav.login")}
                  </button>

                  <button
                    onClick={() => handleAuthClick("/signup")}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-all duration-300 ease-in-out text-sm"
                  >
                    <UserPlusIcon className="w-5 h-5" />
                    {t("nav.signup")}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden transition-all duration-300 ease-in-out ${
            isMenuOpen
              ? "max-h-screen opacity-100"
              : "max-h-0 opacity-0 pointer-events-none"
          }`}
        >
          <nav className="flex flex-col px-4 pb-4 space-y-2">
            <button
              onClick={() => handleNavigation("/jobs")}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out text-left
                ${
                  isActivePath("/jobs")
                    ? "text-emerald-400 bg-gray-800"
                    : "text-gray-400 hover:text-emerald-400 hover:bg-gray-800"
                }`}
            >
              <BriefcaseIcon className="w-5 h-5" />
              {t("nav.jobs")}
            </button>
            {!isStudent && (
              <button
                onClick={() => handleNavigation("/resumes")}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out text-left
                  ${
                    isActivePath("/resumes")
                      ? "text-emerald-400 bg-gray-800"
                      : "text-gray-400 hover:text-emerald-400 hover:bg-gray-800"
                  }`}
              >
                <FileTextIcon className="w-5 h-5" />
                {t("nav.resumes")}
              </button>
            )}
            <button
              onClick={() => handleNavigation("/chat")}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out text-left
                ${
                  isActivePath("/chat")
                    ? "text-emerald-400 bg-gray-800"
                    : "text-gray-400 hover:text-emerald-400 hover:bg-gray-800"
                }`}
            >
              <div className="relative">
                <MessagesSquareIcon className="w-5 h-5" />
                {unreadCount > 0 && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </div>
                )}
              </div>
              {t("nav.chat")}
            </button>
            <button
              onClick={() => handleNavigation("/auction")}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out text-left
                ${
                  isActivePath("/auction")
                    ? "text-emerald-400 bg-gray-800"
                    : "text-gray-400 hover:text-emerald-400 hover:bg-gray-800"
                }`}
            >
              <GavelIcon className="w-5 h-5" />
              {t("nav.auction")}
            </button>
            <button
              onClick={() => handleNavigation("/about")}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out text-left
                ${
                  isActivePath("/about")
                    ? "text-emerald-400 bg-gray-800"
                    : "text-gray-400 hover:text-emerald-400 hover:bg-gray-800"
                }`}
            >
              <InfoIcon className="w-5 h-5" />
              {t("nav.about")}
            </button>

            <div className="pt-2 border-t border-gray-700">
              <button
                onClick={() => {
                  toggleLanguage();
                  closeMenu();
                }}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-gray-800 transition-all duration-300 ease-in-out text-left"
              >
                <Globe className="w-5 h-5" />
                {i18n.language.toUpperCase()}
              </button>

              {isAuthenticated ? (
                <>
                  <button
                    onClick={handleProfileClick}
                    className="w-full flex items-center gap-2 px-4 py-3 mt-2 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-gray-800 transition-all duration-300 ease-in-out text-left"
                  >
                    <User className="w-5 h-5" />
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 mt-2 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-gray-800 transition-all duration-300 ease-in-out text-left"
                  >
                    <LogInIcon className="w-5 h-5" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleAuthClick("/login")}
                    className="w-full flex items-center gap-2 px-4 py-3 mt-2 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-gray-800 transition-all duration-300 ease-in-out text-left"
                  >
                    <LogInIcon className="w-5 h-5" />
                    {t("nav.login")}
                  </button>

                  <button
                    onClick={() => handleAuthClick("/signup")}
                    className="w-full flex items-center gap-2 px-4 py-3 mt-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-all duration-300 ease-in-out text-left"
                  >
                    <UserPlusIcon className="w-5 h-5" />
                    {t("nav.signup")}
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
