"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import applicationsService from "../services/applicationsService";

interface ApplicationContextType {
  applicationCount: number;
  setApplicationCount: (count: number | ((prev: number) => number)) => void;
  refreshApplicationCount: () => Promise<void>;
  addApplication: () => void;
}

const ApplicationContext = createContext<ApplicationContextType>({
  applicationCount: 0,
  setApplicationCount: () => {},
  refreshApplicationCount: async () => {},
  addApplication: () => {},
});

export const useApplicationContext = () => {
  const context = useContext(ApplicationContext);
  if (!context) {
    throw new Error(
      "useApplicationContext must be used within ApplicationProvider"
    );
  }
  return context;
};

export const ApplicationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [applicationCount, setApplicationCount] = useState<number>(0);
  const { user } = useAuth();

  const refreshApplicationCount = async () => {
    if (!user) {
      setApplicationCount(0);
      return;
    }

    try {
      console.log("Refreshing application count for user:", user.id);

      // Проверяем, участвовал ли пользователь в аукционе
      const auctionParticipated = localStorage.getItem(
        `auction_participated_${user.id}`
      );
      if (auctionParticipated) {
        console.log(
          "User has already participated in auction, setting count to 0"
        );
        setApplicationCount(0);
        return;
      }

      const applications = await applicationsService.getByUserId(user.id);
      console.log("Fetched applications:", applications);

      // Считаем только активные заявки (не использованные в аукционе)
      const activeApplications = applications.filter(
        (app) => !app.auction_used
      );
      const count = activeApplications.length;

      console.log("Setting application count to:", count);
      setApplicationCount(count);
    } catch (err) {
      console.error("Error fetching applications:", err);

      // Fallback to localStorage
      try {
        const storedApplications = JSON.parse(
          localStorage.getItem(`user_applications_${user.id}`) || "[]"
        );
        console.log("Using localStorage fallback:", storedApplications.length);
        setApplicationCount(storedApplications.length);
      } catch {
        setApplicationCount(0);
      }
    }
  };

  const addApplication = () => {
    console.log("Adding application, current count:", applicationCount);
    setApplicationCount((prev) => {
      const newCount = prev + 1;
      console.log("New application count:", newCount);

      // Также сохраняем в localStorage как backup
      if (user) {
        try {
          const storedApplications = JSON.parse(
            localStorage.getItem(`user_applications_${user.id}`) || "[]"
          );
          storedApplications.push({
            id: Date.now(),
            timestamp: new Date().toISOString(),
          });
          localStorage.setItem(
            `user_applications_${user.id}`,
            JSON.stringify(storedApplications)
          );
        } catch (err) {
          console.error("Error saving to localStorage:", err);
        }
      }

      return newCount;
    });
  };

  // Инициализация при загрузке или смене пользователя
  useEffect(() => {
    refreshApplicationCount();
  }, [user]);

  const value: ApplicationContextType = {
    applicationCount,
    setApplicationCount,
    refreshApplicationCount,
    addApplication,
  };

  return (
    <ApplicationContext.Provider value={value}>
      {children}
    </ApplicationContext.Provider>
  );
};

export { ApplicationContext };
