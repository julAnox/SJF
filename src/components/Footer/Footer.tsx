import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  FacebookIcon,
  TwitterIcon,
  InstagramIcon,
  LinkedinIcon,
  GithubIcon,
  GraduationCap,
} from "lucide-react";
import logo from "../../assets/logo.png";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-4 text-xl md:text-2xl font-bold text-emerald-400 mb-6">
              <span className="text-xl">Student's</span>
              <img src={logo} alt="" className="w-10" />
              <span className="text-xl">Job</span>
            </div>
            <p className="text-gray-400 mb-6">{t("footer.description")}</p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-400">
                <PhoneIcon className="w-5 h-5" />
                <span>+1 234 567 890</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <MailIcon className="w-5 h-5" />
                <span>contact@studentsjob.com</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <MapPinIcon className="w-5 h-5" />
                <span>123 Job Street, NY 10001</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-emerald-400 mb-6">
              {t("footer.quickLinks")}
            </h3>
            <ul className="space-y-4">
              <li>
                <NavLink
                  to="/about"
                  className="text-gray-400 hover:text-emerald-400 transition-colors"
                >
                  {t("footer.about")}
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/jobs"
                  className="text-gray-400 hover:text-emerald-400 transition-colors"
                >
                  {t("footer.jobs")}
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/companies"
                  className="text-gray-400 hover:text-emerald-400 transition-colors"
                >
                  {t("footer.companies")}
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/blog"
                  className="text-gray-400 hover:text-emerald-400 transition-colors"
                >
                  {t("footer.blog")}
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/contact"
                  className="text-gray-400 hover:text-emerald-400 transition-colors"
                >
                  {t("footer.contact")}
                </NavLink>
              </li>
            </ul>
          </div>

          {/* For Employers */}
          <div>
            <h3 className="text-lg font-semibold text-emerald-400 mb-6">
              {t("footer.forEmployers")}
            </h3>
            <ul className="space-y-4">
              <li>
                <NavLink
                  to="/post-job"
                  className="text-gray-400 hover:text-emerald-400 transition-colors"
                >
                  {t("footer.postJob")}
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/browse-resumes"
                  className="text-gray-400 hover:text-emerald-400 transition-colors"
                >
                  {t("footer.browseResumes")}
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/pricing"
                  className="text-gray-400 hover:text-emerald-400 transition-colors"
                >
                  {t("footer.pricing")}
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/recruitment"
                  className="text-gray-400 hover:text-emerald-400 transition-colors"
                >
                  {t("footer.recruitment")}
                </NavLink>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-semibold text-emerald-400 mb-6">
              {t("footer.newsletter")}
            </h3>
            <p className="text-gray-400 mb-4">
              {t("footer.newsletterDescription")}
            </p>
            <form className="space-y-4">
              <input
                type="email"
                placeholder={t("footer.emailPlaceholder")}
                className="w-full px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700 focus:outline-none focus:border-emerald-500 transition-colors text-white placeholder-gray-500"
              />
              <button
                type="submit"
                className="w-full px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-colors text-white font-medium"
              >
                {t("footer.subscribe")}
              </button>
            </form>
          </div>
        </div>

        {/* Social Links & Copyright */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex gap-6">
              <a
                href="#"
                className="text-gray-400 hover:text-emerald-400 transition-colors"
              >
                <FacebookIcon className="w-6 h-6" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-emerald-400 transition-colors"
              >
                <TwitterIcon className="w-6 h-6" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-emerald-400 transition-colors"
              >
                <InstagramIcon className="w-6 h-6" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-emerald-400 transition-colors"
              >
                <LinkedinIcon className="w-6 h-6" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-emerald-400 transition-colors"
              >
                <GithubIcon className="w-6 h-6" />
              </a>
            </div>
            <p className="text-gray-400 text-center md:text-left">
              © 2025 Student's Job. {t("footer.rights")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
