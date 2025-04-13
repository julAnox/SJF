export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  dateOfBirth: string;
  country: string;
  region: string;
  phone: string;
  avatar?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<User | null>;
  signup: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<User | null>;
}
