import axios from "axios";

const API_URL = "https://sjb-u3p4.onrender.com/app";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    console.log(
      "API Request:",
      config.method?.toUpperCase(),
      config.url,
      config.data
    );
    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log("API Response:", response.status, response.data);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(
        "API Error Response:",
        error.response.status,
        error.response.data
      );
    } else if (error.request) {
      console.error("API Error Request:", error.request);
    } else {
      console.error("API Error:", error.message);
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: number;
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
  created_at: string;
  updated_at: string;
  last_login: string | null;
  last_signup: string;
}

export interface Job {
  id: number;
  company: number | Company;
  title: string;
  description: string;
  requirements: string | Record<string, any>;
  salary_min: number;
  salary_max: number;
  city: string;
  metro: string;
  type: string;
  schedule: string;
  experiense: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Resume {
  id: number;
  user: number;
  gender: string | null;
  profession: string;
  experience: string;
  education: string;
  institutionName: string;
  graduationYear: string;
  specialization: string;
  skills: Record<string, string> | null;
  contacts: string;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: number;
  user: number;
  name: string;
  logo: string;
  description: string;
  website: string;
  industry: string;
  size: string;
  founded_year: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Auction {
  id: number;
  application: number;
  status: string;
  start_time: string;
  current_stage: number;
  stage_end_time: string;
  created_at: string;
  updated_at: string;
}

export interface AuctionBid {
  id: number;
  auction: number;
  company: number;
  stage: number;
  value: any;
  timestamp: string;
}

export interface Comment {
  id: number;
  user: number;
  stars: number;
  content: string;
  likes: number;
  first_name?: string;
  last_name?: string;
  date?: string;
}

export interface Issue {
  id: number;
  user: number;
  issue: string;
  solution: string | null;
  views?: number;
  first_name?: string;
  last_name?: string;
  created_at?: string;
  updated_at?: string;
}

// Users API
export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get("/users/");
    return response.data;
  },

  getById: async (id: number): Promise<User> => {
    const response = await api.get(`/users/${id}/`);
    return response.data;
  },
};

// Jobs API
export const jobsApi = {
  getAll: async () => {
    const response = await api.get("/jobs/");
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/jobs/${id}/`);
    return response.data;
  },

  create: async (jobData: any) => {
    const response = await api.post("/jobs/", jobData);
    return response.data;
  },

  update: async (id: string, jobData: any) => {
    const response = await api.patch(`/jobs/${id}/`, jobData);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/jobs/${id}/`);
  },
};

// Resumes API
export const resumesApi = {
  getAll: async () => {
    const response = await api.get("/resumes/");
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/resumes/${id}/`);
    return response.data;
  },

  create: async (resumeData: FormData) => {
    const response = await api.post("/resumes/", resumeData);
    return response.data;
  },

  update: async (id: string, resumeData: Partial<Resume>) => {
    const response = await api.patch(`/resumes/${id}/`, resumeData);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/resumes/${id}/`);
  },
};

// Companies API
export const companiesApi = {
  getAll: async (): Promise<Company[]> => {
    const response = await api.get("/companies/");
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/companies/${id}/`);
    return response.data;
  },

  create: async (companyData: Partial<Company>) => {
    const response = await api.post("/companies/", companyData);
    return response.data;
  },

  update: async (id: string, companyData: Partial<Company>) => {
    const response = await api.patch(`/companies/${id}/`, companyData);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/companies/${id}/`);
  },
};

// Comments API
export const commentsApi = {
  getAll: async (): Promise<Comment[]> => {
    const response = await api.get("/comments/");
    return response.data;
  },

  create: async (commentData: {
    stars: number;
    content: string;
    user: number;
    likes: number;
  }): Promise<Comment> => {
    const response = await api.post("/comments/", commentData);
    return response.data;
  },

  like: async (id: number, likes: number): Promise<Comment> => {
    const response = await api.patch(`/comments/${id}/`, { likes });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/comments/${id}/`);
  },
};

// Issues API
export const issuesApi = {
  getAll: async (): Promise<Issue[]> => {
    const response = await api.get("/issues/");
    return response.data;
  },

  getResolved: async (): Promise<Issue[]> => {
    const response = await api.get("/issues/");
    return response.data.filter((issue: Issue) => issue.solution);
  },

  getById: async (id: number): Promise<Issue> => {
    const response = await api.get(`/issues/${id}/`);
    return response.data;
  },

  create: async (issueData: {
    user: number;
    issue: string;
  }): Promise<Issue> => {
    const response = await api.post("/issues/", issueData);
    return response.data;
  },

  update: async (id: number, issueData: Partial<Issue>): Promise<Issue> => {
    const response = await api.patch(`/issues/${id}/`, issueData);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/issues/${id}/`);
  },
};

// Analytics API
export const analyticsApi = {
  estimateDailyLoginsSignups: async (): Promise<number> => {
    try {
      const users = await usersApi.getAll();

      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const recentUsers = users.filter((user) => {
        const createdAt = new Date(user.created_at);
        const lastLogin = user.last_login ? new Date(user.last_login) : null;
        return (
          (createdAt >= twentyFourHoursAgo && createdAt <= now) ||
          (lastLogin && lastLogin >= twentyFourHoursAgo && lastLogin <= now)
        );
      });

      return recentUsers.length;
    } catch (error) {
      console.error("Ошибка при оценке посещений и регистраций:", error);
      return 0;
    }
  },
};

export default api;
