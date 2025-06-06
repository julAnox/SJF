"use client";

import type React from "react";

import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import {
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  InstagramIcon,
  LinkedinIcon,
  GithubIcon,
  BriefcaseIcon,
  FileTextIcon,
  MessageCircleIcon,
  GavelIcon,
  LightbulbIcon,
  ShieldIcon,
  UsersIcon,
  TargetIcon,
  HelpCircleIcon,
  BugIcon,
  CheckCircleIcon,
  InfoIcon,
  LoaderIcon,
} from "lucide-react";
import logo from "../../assets/logo.png";
import { newsletterService } from "../../services/newsletter-service";

const Footer = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  const handlePageNavigation = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAboutSectionNavigation = (sectionId: string) => {
    const currentPath = window.location.pathname;

    if (currentPath === "/about") {
      const element = document.getElementById(sectionId);
      if (element) {
        const headerOffset = 140;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    } else {
      navigate("/about");
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          const headerOffset = 140;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition =
            elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
      }, 300);
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setMessage(t("footer.emailRequired"));
      setMessageType("error");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setMessageType("");

    try {
      const response = await newsletterService.subscribe(email);
      setMessage(t("footer.subscriptionSuccess"));
      setMessageType("success");
      setEmail("");
    } catch (error: any) {
      setMessage(t("footer.subscriptionError"));
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
      setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 5000);
    }
  };

  return (
    <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-4 text-xl md:text-2xl font-bold text-emerald-400 mb-6">
              <span className="text-xl">Student's</span>
              <img src={logo || "/placeholder.svg"} alt="" className="w-10" />
              <span className="text-xl">Job</span>
            </div>
            <p className="text-gray-400 mb-6">{t("footer.description")}</p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-400">
                <PhoneIcon className="w-5 h-5" />
                <span>+375 29 135 24 68</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <MailIcon className="w-5 h-5" />
                <span>ermolenko@gmail.com</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <MapPinIcon className="w-5 h-5" />
                <span>Belarus, Minsk</span>
              </div>
            </div>
          </div>

          {/* Main Navigation */}
          <div>
            <h3 className="text-lg font-semibold text-emerald-400 mb-6">
              {t("footer.mainNavigation")}
            </h3>
            <ul className="space-y-4">
              <li>
                <button
                  onClick={() => handlePageNavigation("/jobs")}
                  className="text-gray-400 hover:text-emerald-400 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <BriefcaseIcon className="w-4 h-4" />
                  {t("footer.jobs")}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handlePageNavigation("/resumes")}
                  className="text-gray-400 hover:text-emerald-400 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <FileTextIcon className="w-4 h-4" />
                  {t("footer.resumes")}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handlePageNavigation("/chat")}
                  className="text-gray-400 hover:text-emerald-400 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <MessageCircleIcon className="w-4 h-4" />
                  {t("footer.chat")}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handlePageNavigation("/auction")}
                  className="text-gray-400 hover:text-emerald-400 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <GavelIcon className="w-4 h-4" />
                  {t("footer.auction")}
                </button>
              </li>
            </ul>
          </div>

          {/* About Page Sections - Column 1 */}
          <div>
            <h3 className="text-lg font-semibold text-emerald-400 mb-6">
              {t("footer.aboutSections1")}
            </h3>
            <ul className="space-y-4">
              <li>
                <button
                  onClick={() => handleAboutSectionNavigation("mission")}
                  className="text-gray-400 hover:text-emerald-400 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <InfoIcon className="w-4 h-4" />
                  {t("footer.mission")}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleAboutSectionNavigation("values")}
                  className="text-gray-400 hover:text-emerald-400 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <LightbulbIcon className="w-4 h-4" />
                  {t("footer.values")}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleAboutSectionNavigation("innovation")}
                  className="text-gray-400 hover:text-emerald-400 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <ShieldIcon className="w-4 h-4" />
                  {t("footer.innovation")}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleAboutSectionNavigation("integrity")}
                  className="text-gray-400 hover:text-emerald-400 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <UsersIcon className="w-4 h-4" />
                  {t("footer.integrity")}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleAboutSectionNavigation("inclusion")}
                  className="text-gray-400 hover:text-emerald-400 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <TargetIcon className="w-4 h-4" />
                  {t("footer.inclusion")}
                </button>
              </li>
            </ul>
          </div>

          {/* About Page Sections - Column 2 */}
          <div>
            <h3 className="text-lg font-semibold text-emerald-400 mb-6">
              {t("footer.aboutSections2")}
            </h3>
            <ul className="space-y-4">
              <li>
                <button
                  onClick={() => handleAboutSectionNavigation("faq")}
                  className="text-gray-400 hover:text-emerald-400 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <HelpCircleIcon className="w-4 h-4" />
                  {t("footer.faq")}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleAboutSectionNavigation("bugReport")}
                  className="text-gray-400 hover:text-emerald-400 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <BugIcon className="w-4 h-4" />
                  {t("footer.bugReport")}
                </button>
              </li>
              <li>
                <button
                  onClick={() =>
                    handleAboutSectionNavigation("recentQuestions")
                  }
                  className="text-gray-400 hover:text-emerald-400 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  {t("footer.recentQuestions")}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleAboutSectionNavigation("stats")}
                  className="text-gray-400 hover:text-emerald-400 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <InfoIcon className="w-4 h-4" />
                  {t("footer.stats")}
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-emerald-400 mb-4">
                {t("footer.newsletter")}
              </h3>
              <p className="text-gray-400 mb-4">
                {t("footer.newsletterDescription")}
              </p>
              <form onSubmit={handleNewsletterSubmit} className="space-y-4">
                {/* Адаптивная форма подписки: на планшетах кнопка снизу, на десктопе - справа */}
                <div className="flex flex-col md:flex-col lg:flex-row gap-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("footer.emailPlaceholder")}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700 focus:outline-none focus:border-emerald-500 transition-colors text-white placeholder-gray-500 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-colors text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 md:w-full lg:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <LoaderIcon className="w-4 h-4 animate-spin" />
                        {t("footer.subscribing")}
                      </>
                    ) : (
                      t("footer.subscribe")
                    )}
                  </button>
                </div>
                {message && (
                  <div
                    className={`text-sm ${
                      messageType === "success"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {message}
                  </div>
                )}
              </form>
            </div>

            {/* Social Links */}
            <div>
              <h3 className="text-lg font-semibold text-emerald-400 mb-4">
                {t("footer.followUs")}
              </h3>
              <div className="flex gap-11">
                <a
                  href="https://www.instagram.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-emerald-400 transition-colors"
                >
                  <InstagramIcon className="w-6 h-6" />
                </a>
                <a
                  href="https://ru.linkedin.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-emerald-400 transition-colors"
                >
                  <LinkedinIcon className="w-6 h-6" />
                </a>
                <a
                  href="https://github.com/julAnox"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-emerald-400 transition-colors"
                >
                  <GithubIcon className="w-6 h-6" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-800 text-center">
          <p className="text-gray-400">
            © 2025 Student's Job. {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
