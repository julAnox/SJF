import React, { useEffect, useState } from "react";
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
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import About from "./pages/About/About";
import Auction from "./pages/Auction/Auction";
import Profile from "./pages/Profile/Profile";
import enTranslations from "./locales/en.json";
import ruTranslations from "./locales/ru.json";
import AuctionNotificationModal from "./components/Modals/AuctionNotificationModal";

export const ApplicationContext = React.createContext<{
  applicationCount: number;
  setApplicationCount: (count: number) => void;
  showAuctionNotification: boolean;
  setShowAuctionNotification: (show: boolean) => void;
}>({
  applicationCount: 0,
  setApplicationCount: () => {},
  showAuctionNotification: false,
  setShowAuctionNotification: () => {},
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

function App() {
  const [applicationCount, setApplicationCount] = useState(() => {
    const applications = localStorage.getItem("applications");
    return applications ? JSON.parse(applications).length : 0;
  });
  const [showAuctionNotification, setShowAuctionNotification] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem("language");
    if (savedLang) {
      i18n.changeLanguage(savedLang);
    }
  }, []);

  useEffect(() => {
    if (applicationCount === 3) {
      setShowAuctionNotification(true);
    }
  }, [applicationCount]);

  return (
    <BrowserRouter>
      <ApplicationContext.Provider
        value={{
          applicationCount,
          setApplicationCount,
          showAuctionNotification,
          setShowAuctionNotification,
        }}
      >
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
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Register />} />
                <Route path="/about" element={<About />} />
                <Route path="/auction" element={<Auction />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
            </main>
            <Footer />

            <AuctionNotificationModal
              isOpen={showAuctionNotification}
              onClose={() => setShowAuctionNotification(false)}
            />
          </div>
        </AuthProvider>
      </ApplicationContext.Provider>
    </BrowserRouter>
  );
}

export default App;
