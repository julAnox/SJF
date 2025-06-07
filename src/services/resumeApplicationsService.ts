import api from "./api";

export interface ResumeApplication {
  id: number;
  resume: number;
  company: number;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const resumeApplicationsService = {
  getBaseUrl: () => api.defaults.baseURL,

  getAll: async (): Promise<ResumeApplication[]> => {
    try {
      const response = await api.get("/resume_applications/");
      return response.data;
    } catch (error) {
      console.error("Error fetching resume applications:", error);
      throw error;
    }
  },

  getById: async (id: string): Promise<ResumeApplication> => {
    try {
      const response = await api.get(`/resume_applications/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching resume application ${id}:`, error);
      throw error;
    }
  },

  getByCompany: async (companyId: number): Promise<ResumeApplication[]> => {
    try {
      const response = await api.get(
        `/resume_applications/?company=${companyId}`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching resume applications for company ${companyId}:`,
        error
      );
      throw error;
    }
  },

  getByResume: async (resumeId: number): Promise<ResumeApplication[]> => {
    try {
      const response = await api.get(
        `/resume_applications/?resume=${resumeId}`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching resume applications for resume ${resumeId}:`,
        error
      );
      throw error;
    }
  },

  create: async (
    applicationData: Partial<ResumeApplication>
  ): Promise<ResumeApplication> => {
    try {
      const response = await api.post("/resume_applications/", applicationData);
      return response.data;
    } catch (error) {
      console.error("Error creating resume application:", error);
      throw error;
    }
  },

  update: async (
    id: string,
    applicationData: Partial<ResumeApplication>
  ): Promise<ResumeApplication> => {
    try {
      const response = await api.patch(
        `/resume_applications/${id}/`,
        applicationData
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating resume application ${id}:`, error);
      throw error;
    }
  },

  updateStatus: async (
    id: string,
    status: string
  ): Promise<ResumeApplication> => {
    try {
      const response = await api.patch(`/resume_applications/${id}/`, {
        status,
      });
      return response.data;
    } catch (error) {
      console.error(
        `Error updating status for resume application ${id}:`,
        error
      );
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/resume_applications/${id}/`);
    } catch (error) {
      console.error(`Error deleting resume application ${id}:`, error);
      throw error;
    }
  },

  debug: async (id: string): Promise<any> => {
    try {
      const resumeApplication = await resumeApplicationsService.getById(id);

      const resume = await api.get(`/resumes/${resumeApplication.resume}/`);
      const company = await api.get(`/companies/${resumeApplication.company}/`);

      const chats = await api.get(`/chats/?resume_application=${id}`);

      const chatMessages = await Promise.all(
        chats.data.map(async (chat: any) => {
          const messages = await api.get(`/messages/?chat=${chat.id}`);
          return {
            chatId: chat.id,
            messages: messages.data,
          };
        })
      );

      return {
        resumeApplication,
        resume: resume.data,
        company: company.data,
        chats: chats.data,
        chatMessages,
      };
    } catch (error) {
      console.error(`Error debugging resume application ${id}:`, error);
      throw error;
    }
  },
};

export default resumeApplicationsService;
