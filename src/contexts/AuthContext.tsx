"use client";

import {
  createContext,
  useState,
  useContext,
  type ReactNode,
  useEffect,
} from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "https://sjb-u3p4.onrender.com/app";

const DEFAULT_AVATAR =
  "https://static.vecteezy.com/system/resources/thumbnails/005/545/335/small/user-sign-icon-person-symbol-human-avatar-isolated-on-white-backogrund-vector.jpg";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar: string;
  date_of_birth: string;
  phone: string;
  country: string;
  region: string;
  district: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  signup: (
    email: string,
    password: string,
    role: string
  ) => Promise<User | null>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<User | null>;
  fetchUserProfile: () => Promise<User | null>;
  verifyPassword: (password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  axios.defaults.baseURL = API_URL;
  axios.defaults.headers.common["Content-Type"] = "application/json";

  const transformUserData = (userData: any): User => {
    return {
      id: userData.id.toString(),
      email: userData.email,
      first_name: userData.first_name || "",
      last_name: userData.last_name || "",
      avatar: userData.avatar || DEFAULT_AVATAR,
      date_of_birth: userData.date_of_birth || "",
      phone: userData.phone || "",
      country: userData.country || "",
      region: userData.region || "",
      district: userData.district || "",
      role: userData.role || "student",
    };
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.get(`/users/?email=${email}`);
      const users = response.data;

      if (!users || users.length === 0) {
        throw new Error("User not found");
      }

      const userData = users[0];

      if (userData.password !== password) {
        throw new Error("Invalid password");
      }

      const transformedUser = transformUserData(userData);
      setUser(transformedUser);
      localStorage.setItem("user", JSON.stringify(transformedUser));

      navigate("/profile");

      return transformedUser;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const verifyPassword = async (password: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await axios.get(`/users/?email=${user.email}`);
      const users = response.data;

      if (!users || users.length === 0) {
        return false;
      }

      const userData = users[0];
      return userData.password === password;
    } catch (error) {
      console.error("Password verification error:", error);
      return false;
    }
  };

  const signup = async (email: string, password: string, role: string) => {
    try {
      const response = await axios.post("/users/", {
        email,
        password,
        first_name: "",
        last_name: "",
        avatar: DEFAULT_AVATAR,
        date_of_birth: "",
        phone: "",
        country: "",
        region: "",
        district: "",
        role: role || "student",
      });

      if (!response.data) {
        throw new Error("Failed to create user");
      }

      const transformedUser = transformUserData(response.data);
      setUser(transformedUser);
      localStorage.setItem("user", JSON.stringify(transformedUser));

      navigate("/chat"); ///было профиль

      return transformedUser;
    } catch (error: any) {
      console.error("Signup error:", error);
      if (error.response?.data) {
        const backendError = Object.values(error.response.data)[0];
        throw new Error(
          Array.isArray(backendError) ? backendError[0] : backendError
        );
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem("user");
      setUser(null);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return null;

    try {
      const response = await axios.patch(`/users/${user.id}/`, data);

      const transformedUser = transformUserData({
        ...response.data,
        ...data,
      });

      setUser(transformedUser);
      localStorage.setItem("user", JSON.stringify(transformedUser));

      return transformedUser;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  const fetchUserProfile = async () => {
    if (!user?.id) return null;

    try {
      const response = await axios.get(`/users/${user.id}/`);

      const transformedUser = transformUserData(response.data);
      setUser(transformedUser);
      localStorage.setItem("user", JSON.stringify(transformedUser));

      return transformedUser;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (user?.id) {
          await fetchUserProfile();
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        updateProfile,
        fetchUserProfile,
        verifyPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
