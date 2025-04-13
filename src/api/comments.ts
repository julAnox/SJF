import api from "../services/api";

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

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  avatar: string;
}

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

  // Update the comment with a new like count
  like: async (id: number, likes: number): Promise<Comment> => {
    const response = await api.patch(`/comments/${id}/`, { likes });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/comments/${id}/`);
  },
};

export const usersApi = {
  getById: async (id: number): Promise<User> => {
    const response = await api.get(`/users/${id}/`);
    return response.data;
  },
};
