"use client";

import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
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

  const isStudent = user?.role === "student";

  useEffect(() => {
    const fetchUnreadMessages = async () => {
      if (!user) return;

      try {
        const allMessages = await messagesService.getAll();
        const allChats = await chatsService.getAll();
        const allApplications = await applicationsService.getAll();
        const allJobs = await jobsApi.getAll();
        const allCompanies = await companiesApi.getAll();

        let relevantUnreadMessages = 0;

        if (user.role === "student") {
          for (const chat of allChats) {
            const application = allApplications.find(
              (app) => app.id === chat.application
            );
            if (!application || application.user !== Number.parseInt(user.id))
              continue;

            const isChatOpen = window.location.pathname.includes(
              `/chat/${chat.id}`
            );

            if (!isChatOpen) {
              const chatMessages = allMessages.filter(
                (msg) =>
                  msg.chat === chat.id &&
                  !msg.read &&
                  msg.sender !== Number.parseInt(user.id)
              );

              relevantUnreadMessages += chatMessages.length;
            }
          }
        } else if (user.role === "company") {
          const userCompany = allCompanies.find(
            (company) => company.user === Number.parseInt(user.id)
          );

          if (userCompany) {
            for (const chat of allChats) {
              const application = allApplications.find(
                (app) => app.id === chat.application
              );
              if (!application) continue;

              const job = allJobs.find((j) => j.id === application.job);
              if (!job) continue;

              const isCompanyJob =
                typeof job.company === "number"
                  ? job.company === userCompany.id
                  : job.company.id === userCompany.id;

              if (!isCompanyJob) continue;

              const isChatOpen = window.location.pathname.includes(
                `/chat/${chat.id}`
              );

              if (!isChatOpen) {
                const chatMessages = allMessages.filter(
                  (msg) =>
                    msg.chat === chat.id &&
                    !msg.read &&
                    msg.sender !== Number.parseInt(user.id)
                );

                relevantUnreadMessages += chatMessages.length;
              }
            }
          }
        }

        setUnreadCount(relevantUnreadMessages);

        if (relevantUnreadMessages > 0) {
          document.title = `(${relevantUnreadMessages}) Student Job Portal`;
        } else {
          document.title = "Student Job Portal";
        }
      } catch (error) {
        console.error("Error fetching unread messages:", error);
      }
    };

    fetchUnreadMessages();

    const interval = setInterval(fetchUnreadMessages, 1500); // Check every 1.5 seconds

    const handleUnreadMessagesUpdated = () => {
      setTimeout(() => {
        fetchUnreadMessages();
      }, 300);
    };

    window.addEventListener(
      "unreadMessagesUpdated",
      handleUnreadMessagesUpdated
    );

    return () => {
      clearInterval(interval);
      window.removeEventListener(
        "unreadMessagesUpdated",
        handleUnreadMessagesUpdated
      );
    };
  }, [user]);

  return (
    <header className="fixed top-0 left-0 right-0 bg-gray-900/80 backdrop-blur-md z-50 border-b border-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between px-6 py-6 lg:py-5">
          {/* Logo */}
          <NavLink
            to="/"
            className="flex items-center gap-4 text-xl md:text-2xl font-bold text-emerald-400 hover:text-emerald-300 transition-colors shrink-0"
          >
            <span className="text-xl">Student's</span>
            <img src={logo || "/placeholder.svg"} alt="" className="w-10" />
            <span className="text-xl">Job</span>
          </NavLink>

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
              <NavLink
                to="/jobs"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out text-sm
                  ${
                    isActive
                      ? "text-emerald-400 bg-gray-800"
                      : "text-gray-400 hover:text-emerald-400 hover:bg-gray-800"
                  }`
                }
              >
                <BriefcaseIcon className="w-5 h-5" />
                {t("nav.jobs")}
              </NavLink>
              {!isStudent && (
                <NavLink
                  to="/resumes"
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out text-sm
                    ${
                      isActive
                        ? "text-emerald-400 bg-gray-800"
                        : "text-gray-400 hover:text-emerald-400 hover:bg-gray-800"
                    }`
                  }
                >
                  <FileTextIcon className="w-5 h-5" />
                  {t("nav.resumes")}
                </NavLink>
              )}
              <NavLink
                to="/chat"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out text-sm
                  ${
                    isActive
                      ? "text-emerald-400 bg-gray-800"
                      : "text-gray-400 hover:text-emerald-400 hover:bg-gray-800"
                  }`
                }
              >
                <div className="relative">
                  <MessagesSquareIcon className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </div>
                  )}
                </div>
                {t("nav.chat")}
              </NavLink>
              <NavLink
                to="/auction"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out text-sm
                  ${
                    isActive
                      ? "text-emerald-400 bg-gray-800"
                      : "text-gray-400 hover:text-emerald-400 hover:bg-gray-800"
                  }`
                }
              >
                <GavelIcon className="w-5 h-5" />
                {t("nav.auction")}
              </NavLink>
              <NavLink
                to="/about"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out text-sm
                  ${
                    isActive
                      ? "text-emerald-400 bg-gray-800"
                      : "text-gray-400 hover:text-emerald-400 hover:bg-gray-800"
                  }`
                }
              >
                <InfoIcon className="w-5 h-5" />
                {t("nav.about")}
              </NavLink>
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
                  <NavLink
                    to="/profile"
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
                  </NavLink>
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-gray-800 transition-all duration-300 ease-in-out text-sm"
                  >
                    <LogInIcon className="w-5 h-5" />
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <NavLink
                    to="/login"
                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-gray-800 transition-all duration-300 ease-in-out text-sm"
                  >
                    <LogInIcon className="w-5 h-5" />
                    {t("nav.login")}
                  </NavLink>

                  <NavLink
                    to="/signup"
                    className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-all duration-300 ease-in-out text-sm"
                  >
                    <UserPlusIcon className="w-5 h-5" />
                    {t("nav.signup")}
                  </NavLink>
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
            <NavLink
              to="/jobs"
              onClick={closeMenu}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out
                ${
                  isActive
                    ? "text-emerald-400 bg-gray-800"
                    : "text-gray-400 hover:text-emerald-400 hover:bg-gray-800"
                }`
              }
            >
              <BriefcaseIcon className="w-5 h-5" />
              {t("nav.jobs")}
            </NavLink>
            {!isStudent && (
              <NavLink
                to="/resumes"
                onClick={closeMenu}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out
                  ${
                    isActive
                      ? "text-emerald-400 bg-gray-800"
                      : "text-gray-400 hover:text-emerald-400 hover:bg-gray-800"
                  }`
                }
              >
                <FileTextIcon className="w-5 h-5" />
                {t("nav.resumes")}
              </NavLink>
            )}
            <NavLink
              to="/chat"
              onClick={closeMenu}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out
                ${
                  isActive
                    ? "text-emerald-400 bg-gray-800"
                    : "text-gray-400 hover:text-emerald-400 hover:bg-gray-800"
                }`
              }
            >
              <div className="relative">
                <MessagesSquareIcon className="w-5 h-5" />
                {unreadCount > 0 && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </div>
                )}
              </div>
              {t("nav.chat")}
            </NavLink>
            <NavLink
              to="/auction"
              onClick={closeMenu}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out
                ${
                  isActive
                    ? "text-emerald-400 bg-gray-800"
                    : "text-gray-400 hover:text-emerald-400 hover:bg-gray-800"
                }`
              }
            >
              <GavelIcon className="w-5 h-5" />
              {t("nav.auction")}
            </NavLink>
            <NavLink
              to="/about"
              onClick={closeMenu}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out
                ${
                  isActive
                    ? "text-emerald-400 bg-gray-800"
                    : "text-gray-400 hover:text-emerald-400 hover:bg-gray-800"
                }`
              }
            >
              <InfoIcon className="w-5 h-5" />
              {t("nav.about")}
            </NavLink>

            <div className="pt-2 border-t border-gray-700">
              <button
                onClick={() => {
                  toggleLanguage();
                  closeMenu();
                }}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-gray-800 transition-all duration-300 ease-in-out"
              >
                <Globe className="w-5 h-5" />
                {i18n.language.toUpperCase()}
              </button>

              {isAuthenticated ? (
                <>
                  <NavLink
                    to="/profile"
                    onClick={closeMenu}
                    className="w-full flex items-center gap-2 px-4 py-3 mt-2 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-gray-800 transition-all duration-300 ease-in-out"
                  >
                    <User className="w-5 h-5" />
                    Profile
                  </NavLink>
                  <button
                    onClick={() => {
                      logout();
                      closeMenu();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 mt-2 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-gray-800 transition-all duration-300 ease-in-out"
                  >
                    <LogInIcon className="w-5 h-5" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <NavLink
                    to="/login"
                    onClick={closeMenu}
                    className="w-full flex items-center gap-2 px-4 py-3 mt-2 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-gray-800 transition-all duration-300 ease-in-out"
                  >
                    <LogInIcon className="w-5 h-5" />
                    {t("nav.login")}
                  </NavLink>

                  <NavLink
                    to="/signup"
                    onClick={closeMenu}
                    className="w-full flex items-center gap-2 px-4 py-3 mt-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-all duration-300 ease-in-out"
                  >
                    <UserPlusIcon className="w-5 h-5" />
                    {t("nav.signup")}
                  </NavLink>
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
