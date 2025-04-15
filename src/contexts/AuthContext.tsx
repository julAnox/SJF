import {
  createContext,
  useState,
  useContext,
  type ReactNode,
  useEffect,
} from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000/app"; // Base API URL

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
  publish_phone: boolean;
  publish_status: boolean;
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
  verifyPassword: (password: string) => Promise<boolean>; // Add this line
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

  // Configure axios defaults
  axios.defaults.baseURL = API_URL;
  axios.defaults.headers.common["Content-Type"] = "application/json";

  const transformUserData = (userData: any): User => {
    return {
      id: userData.id.toString(),
      email: userData.email,
      first_name: userData.first_name || "",
      last_name: userData.last_name || "",
      avatar: userData.avatar || "",
      date_of_birth: userData.date_of_birth || "",
      phone: userData.phone || "",
      country: userData.country || "",
      region: userData.region || "",
      district: userData.district || "",
      publish_phone: userData.publish_phone || false,
      publish_status: userData.publish_status || false,
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

  // Add verifyPassword function
  const verifyPassword = async (password: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Get the current user's data to check password
      const response = await axios.get(`/users/?email=${user.email}`);
      const users = response.data;

      if (!users || users.length === 0) {
        return false;
      }

      const userData = users[0];

      // Check if the provided password matches the stored password
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
        avatar: "",
        date_of_birth: "",
        phone: "",
        country: "",
        region: "",
        district: "",
        publish_phone: false,
        publish_status: false,
        role: role || "student", // Ensure role is passed through
      });

      if (!response.data) {
        throw new Error("Failed to create user");
      }

      const transformedUser = transformUserData(response.data);
      setUser(transformedUser);
      localStorage.setItem("user", JSON.stringify(transformedUser));

      navigate("/profile");

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
        verifyPassword, // Add this line
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
