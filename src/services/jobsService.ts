import api from "./api";

export interface Job {
  id: number;
  company: number | any;
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

const jobsApi = {
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

export default jobsApi;
