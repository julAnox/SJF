"use client";

import { useEffect, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { AuthProvider } from "./contexts/AuthContext";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import Home from "./pages/Home/Home";
import Jobs from "./pages/Jobs/Jobs";
import Resumes from "./pages/Resumes/Resumes";
import Chat from "./pages/Chat/Chat";
import Auction from "./pages/Auction/Auction";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import About from "./pages/About/About";
import enTranslations from "./locales/en.json";
import ruTranslations from "./locales/ru.json";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";

const Profile = lazy(() => import("./pages/Profile/Profile"));

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslations },
    ru: { translation: ruTranslations },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

const ProfileLoader = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      <p className="text-gray-400">Загрузка профиля...</p>
    </div>
  </div>
);

function App() {
  useEffect(() => {
    const savedLang = localStorage.getItem("language");
    if (savedLang) {
      i18n.changeLanguage(savedLang);
    }
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/resumes" element={<Resumes />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/chat/:id" element={<Chat />} />
                <Route path="/auction" element={<Auction />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Register />} />
                <Route path="/about" element={<About />} />
                <Route
                  path="/profile"
                  element={
                    <Suspense fallback={<ProfileLoader />}>
                      <Profile />
                    </Suspense>
                  }
                />
              </Routes>
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
