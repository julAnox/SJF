import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState } from "react";
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
  GraduationCap,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const Header = () => {
  const { t, i18n } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ru" : "en";
    i18n.changeLanguage(newLang);
    localStorage.setItem("language", newLang);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const isStudent = user?.role === "student";

  return (
    <header className="fixed top-0 left-0 right-0 bg-gray-900/80 backdrop-blur-md z-50 border-b border-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between px-6 py-6 lg:py-5">
          {/* Logo */}
          <NavLink
            to="/"
            className="flex items-center gap-4 text-xl md:text-2xl font-bold text-emerald-400 hover:text-emerald-300 transition-colors shrink-0"
          >
            <GraduationCap className="w-10 h-10" />
            <span className="hidden xs:block">Student's Job</span>
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
                <MessagesSquareIcon className="w-5 h-5" />
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
                        `https://ui-avatars.com/api/?name=${user?.first_name}+${user?.last_name}&background=random`
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
              <MessagesSquareIcon className="w-5 h-5" />
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
