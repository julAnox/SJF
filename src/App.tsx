"use client";

import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import Home from "./pages/Home/Home";
import Jobs from "./pages/Jobs/Jobs";
import Resumes from "./pages/Resumes/Resumes";
import Chat from "./pages/Chat/Chat";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import About from "./pages/About/About";
import Auction from "./pages/Auction/Auction";
import Profile from "./pages/Profile/Profile";
import enTranslations from "./locales/en.json";
import ruTranslations from "./locales/ru.json";
import AuctionNotificationModal from "./components/Modals/AuctionNotificationModal";
import applicationsService from "./services/applicationsService";

export const ApplicationContext = React.createContext<{
  applicationCount: number;
  setApplicationCount: (count: number | ((prev: number) => number)) => void;
  showAuctionNotification: boolean;
  setShowAuctionNotification: (show: boolean) => void;
  refreshApplicationCount: () => Promise<void>;
  resetApplications: () => Promise<void>;
}>({
  applicationCount: 0,
  setApplicationCount: () => {},
  showAuctionNotification: false,
  setShowAuctionNotification: () => {},
  refreshApplicationCount: async () => {},
  resetApplications: async () => {},
});

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

// Компонент для управления состоянием заявок
const ApplicationManager: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [applicationCount, setApplicationCount] = useState(0);
  const [showAuctionNotification, setShowAuctionNotification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Функция для загрузки количества заявок из базы данных
  const refreshApplicationCount = async () => {
    if (!user) {
      console.log("No user, setting application count to 0");
      setApplicationCount(0);
      return;
    }

    try {
      setIsLoading(true);
      console.log("Fetching applications for user:", user.id);

      // Получаем все заявки пользователя из базы данных
      const applications = await applicationsService.getByUserId(user.id);
      console.log("Fetched applications from database:", applications);

      // Проверяем, есть ли у пользователя активный аукцион
      const hasActiveAuction = localStorage.getItem(
        `auction_completed_${user.id}`
      );

      if (hasActiveAuction) {
        console.log(
          "User has completed auction, filtering out used applications"
        );
        // Если аукцион был завершен, считаем только новые заявки после аукциона
        const auctionCompletedTime = new Date(hasActiveAuction);
        const newApplications = applications.filter((app) => {
          const appTime = new Date(app.created_at);
          return appTime > auctionCompletedTime;
        });
        console.log("New applications after auction:", newApplications.length);
        setApplicationCount(newApplications.length);
      } else {
        // Если аукцион не был завершен, считаем все заявки
        console.log(
          "No auction completed, counting all applications:",
          applications.length
        );
        setApplicationCount(applications.length);
      }
    } catch (err) {
      console.error("Error fetching applications from database:", err);
      setApplicationCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для сброса заявок после аукциона
  const resetApplications = async () => {
    if (!user) return;

    console.log("Resetting applications after auction completion");

    // Помечаем время завершения аукциона
    localStorage.setItem(
      `auction_completed_${user.id}`,
      new Date().toISOString()
    );

    // Сбрасываем счетчик
    setApplicationCount(0);
    setShowAuctionNotification(false);

    console.log("Applications reset completed");
  };

  // Загружаем данные при смене пользователя
  useEffect(() => {
    if (user) {
      console.log("User changed, refreshing application count for:", user.id);
      refreshApplicationCount();
    } else {
      setApplicationCount(0);
      setShowAuctionNotification(false);
    }
  }, [user]);

  // Показываем уведомление при достижении 3 заявок
  useEffect(() => {
    console.log("Application count changed to:", applicationCount);
    if (applicationCount >= 3) {
      setShowAuctionNotification(true);
    } else {
      setShowAuctionNotification(false);
    }
  }, [applicationCount]);

  return (
    <ApplicationContext.Provider
      value={{
        applicationCount,
        setApplicationCount,
        showAuctionNotification,
        setShowAuctionNotification,
        refreshApplicationCount,
        resetApplications,
      }}
    >
      {children}
    </ApplicationContext.Provider>
  );
};

function App() {
  useEffect(() => {
    const savedLang = localStorage.getItem("language");
    if (savedLang) {
      i18n.changeLanguage(savedLang);
    }
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <ApplicationManager>
          <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/resumes" element={<Resumes />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/chat/:id" element={<Chat />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Register />} />
                <Route path="/about" element={<About />} />
                <Route path="/auction" element={<Auction />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
            </main>
            <Footer />

            <ApplicationContext.Consumer>
              {({
                showAuctionNotification,
                setShowAuctionNotification,
                applicationCount,
              }) => (
                <AuctionNotificationModal
                  isOpen={showAuctionNotification}
                  onClose={() => setShowAuctionNotification(false)}
                  applicationCount={applicationCount}
                />
              )}
            </ApplicationContext.Consumer>
          </div>
        </ApplicationManager>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
