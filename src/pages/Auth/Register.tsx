import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext";
import {
  UserPlus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Building2,
  GraduationCap,
} from "lucide-react";

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password1: "",
    password2: "",
    role: "student",
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email) {
      newErrors.email = t("auth.register.emailRequired");
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t("auth.register.emailInvalid");
    }

    if (!formData.password1) {
      newErrors.password1 = t("auth.register.passwordRequired");
    } else if (formData.password1.length < 6) {
      newErrors.password1 = t("auth.register.passwordLength");
    }

    if (!formData.password2) {
      newErrors.password2 = t("auth.register.confirmPasswordRequired");
    } else if (formData.password1 !== formData.password2) {
      newErrors.password2 = t("auth.register.passwordsNoMatch");
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = t("auth.register.termsRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
    setApiError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setApiError(null);

    try {
      await signup(formData.email, formData.password1, formData.role);
      navigate("/chat"); ///было профиль
    } catch (error: any) {
      console.error("Registration error:", error);
      setApiError(
        error.response?.data?.detail ||
          error.response?.data?.non_field_errors?.[0] ||
          "Failed to create account. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-28 flex items-center justify-center bg-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md px-8 py-12 mx-4 bg-gray-800 rounded-2xl shadow-xl"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            {t("auth.register.title")}
          </h2>
          <p className="text-gray-400">{t("auth.register.subtitle")}</p>
        </div>

        {apiError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-500">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{apiError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t("home.cta.accounttype")}
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, role: "student" }))
                }
                className={`p-4 rounded-lg border ${
                  formData.role === "student"
                    ? "border-emerald-500 bg-emerald-500/10 text-white"
                    : "border-gray-600 text-gray-400 hover:border-gray-500"
                } transition-colors flex flex-col items-center gap-2`}
              >
                <GraduationCap className="w-6 h-6" />
                <span>{t("home.cta.accounttypest")}</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, role: "company" }))
                }
                className={`p-4 rounded-lg border ${
                  formData.role === "company"
                    ? "border-emerald-500 bg-emerald-500/10 text-white"
                    : "border-gray-600 text-gray-400 hover:border-gray-500"
                } transition-colors flex flex-col items-center gap-2`}
              >
                <Building2 className="w-6 h-6" />
                <span>{t("home.cta.accounttypecp")}</span>
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              {t("auth.register.email")}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`block w-full pl-10 pr-3 py-2 rounded-lg bg-gray-700 border ${
                  errors.email ? "border-red-500" : "border-gray-600"
                } text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent`}
                placeholder="you@example.com"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password1"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              {t("auth.register.password")}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password1"
                name="password1"
                type={showPassword1 ? "text" : "password"}
                value={formData.password1}
                onChange={handleChange}
                className={`block w-full pl-10 pr-10 py-2 rounded-lg bg-gray-700 border ${
                  errors.password1 ? "border-red-500" : "border-gray-600"
                } text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword1(!showPassword1)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword1 ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                )}
              </button>
            </div>
            {errors.password1 && (
              <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.password1}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password2"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              {t("auth.register.confirmPassword")}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password2"
                name="password2"
                type={showPassword2 ? "text" : "password"}
                value={formData.password2}
                onChange={handleChange}
                className={`block w-full pl-10 pr-10 py-2 rounded-lg bg-gray-700 border ${
                  errors.password2 ? "border-red-500" : "border-gray-600"
                } text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword2(!showPassword2)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword2 ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                )}
              </button>
            </div>
            {errors.password2 && (
              <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.password2}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="agreeToTerms"
              name="agreeToTerms"
              type="checkbox"
              checked={formData.agreeToTerms}
              onChange={handleChange}
              className="h-4 w-4 text-emerald-500 border-gray-600 rounded focus:ring-emerald-500 bg-gray-700"
            />
            <label htmlFor="agreeToTerms" className="text-sm text-gray-400">
              {t("auth.register.terms")}{" "}
              <a href="/terms" className="text-emerald-500 hover:underline">
                {t("auth.register.termsLink")}
              </a>{" "}
              {t("auth.register.and")}{" "}
              <a href="/privacy" className="text-emerald-500 hover:underline">
                {t("auth.register.privacyLink")}
              </a>
            </label>
          </div>

          {errors.agreeToTerms && (
            <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.agreeToTerms}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <UserPlus className="w-5 h-5" />
            )}
            {t("auth.register.createAccount")}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            {t("auth.register.haveAccount")}{" "}
            <Link to="/login" className="text-emerald-500 hover:underline">
              {t("auth.login.signIn")}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
