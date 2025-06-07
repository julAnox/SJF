import api from "./api";

export interface Application {
  id: number;
  user: number;
  job: number;
  resume: number | null;
  company: number | null;
  cover_letter: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const applicationsService = {
  getAll: async (): Promise<Application[]> => {
    try {
      const response = await api.get("/job_applications/");
      return response.data;
    } catch (error) {
      console.error("Error fetching applications:", error);
      return [];
    }
  },

  getById: async (id: string): Promise<Application> => {
    try {
      const response = await api.get(`/job_applications/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching application ${id}:`, error);
      throw error;
    }
  },

  getByUserId: async (userId: string): Promise<Application[]> => {
    try {
      const response = await api.get(`/job_applications/?user=${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching applications for user ${userId}:`, error);
      return [];
    }
  },

  getByJobId: async (jobId: string): Promise<Application[]> => {
    try {
      const response = await api.get(`/job_applications/?job=${jobId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching applications for job ${jobId}:`, error);
      return [];
    }
  },

  create: async (
    applicationData: Partial<Application>
  ): Promise<Application> => {
    try {
      const maxRetries = 3;
      let retries = 0;
      let lastError;

      while (retries < maxRetries) {
        try {
          const response = await api.post(
            "/job_applications/",
            applicationData
          );
          return response.data;
        } catch (error) {
          lastError = error;
          retries++;
          await new Promise((resolve) => setTimeout(resolve, 1000 * retries));
        }
      }

      console.error("Error creating application after retries:", lastError);
      throw lastError;
    } catch (error) {
      console.error("Error creating application:", error);
      throw error;
    }
  },

  update: async (
    id: string,
    applicationData: Partial<Application>
  ): Promise<Application> => {
    try {
      const response = await api.patch(
        `/job_applications/${id}/`,
        applicationData
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating application ${id}:`, error);
      throw error;
    }
  },

  updateStatus: async (id: string, status: string): Promise<Application> => {
    try {
      const response = await api.patch(`/job_applications/${id}/`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error updating status for application ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/job_applications/${id}/`);
    } catch (error) {
      console.error(`Error deleting application ${id}:`, error);
      throw error;
    }
  },
};

export default applicationsService;
