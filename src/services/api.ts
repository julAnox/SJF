import axios from "axios";

const API_URL = "http://127.0.0.1:8000/app";

// Configure axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add response interceptor to log responses
api.interceptors.response.use(
  (response) => {
    console.log("API Response:", response.data);
    return response;
  },
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

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

  create: async (resumeData: any) => {
    const response = await api.post("/resumes/", resumeData);
    return response.data;
  },

  update: async (id: string, resumeData: any) => {
    const response = await api.patch(`/resumes/${id}/`, resumeData);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/resumes/${id}/`);
  },
};

// Companies API
export const companiesApi = {
  getAll: async () => {
    const response = await api.get("/companies/");
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/companies/${id}/`);
    return response.data;
  },

  create: async (companyData: any) => {
    const response = await api.post("/companies/", companyData);
    return response.data;
  },

  update: async (id: string, companyData: any) => {
    const response = await api.patch(`/companies/${id}/`, companyData);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/companies/${id}/`);
  },
};

// Types matching Django models
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
  publish_phone: boolean;
  publish_status: boolean;
  role: string;
  created_at: string;
  updated_at: string;
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
  title: string;
  photo: string;
  city: string;
  metro: string;
  skills: string[] | Record<string, string>;
  experience_years: number;
  current_position: string;
  degree: string;
  university: string;
  graduation_year: number;
  specialization: string;
  expected_salary: number;
  languages: string[] | Record<string, string>;
  availability: string;
  status: string;
  last_active: string;
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

export interface Application {
  id: number;
  user: number;
  job: number;
  resume: number;
  cover_letter: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Chat {
  id: number;
  application: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  chat: number;
  sender: number;
  content: string;
  message_type: string;
  metadata: any;
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

export default api;
