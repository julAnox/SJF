import axios from "axios";

const API_URL = "http://127.0.0.1:8000/app";

// Configure axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

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

export const companiesApi = {
  getAll: async () => {
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
