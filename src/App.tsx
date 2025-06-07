"use client";

import { useEffect } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
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
import Profile from "./pages/Profile/Profile";
import enTranslations from "./locales/en.json";
import ruTranslations from "./locales/ru.json";

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

function App() {
  useEffect(() => {
    const savedLang = localStorage.getItem("language");
    if (savedLang) {
      i18n.changeLanguage(savedLang);
    }
  }, []);

  // iOS Safari viewport height fix
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', () => {
      setTimeout(setVH, 100);
    });

    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);

  // Prevent zoom on iOS when focusing inputs
  useEffect(() => {
    const preventDefault = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    let lastTouchEnd = 0;
    const preventZoom = (e: TouchEvent) => {
      const now = new Date().getTime();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    document.addEventListener('touchstart', preventDefault, { passive: false });
    document.addEventListener('touchend', preventZoom, { passive: false });

    return () => {
      document.removeEventListener('touchstart', preventDefault);
      document.removeEventListener('touchend', preventZoom);
    };
  }, []);

  return (
    <HashRouter>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50 flex flex-col" style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}>
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
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </HashRouter>
  );
}

export default App;