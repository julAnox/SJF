import { config } from "../config";

export const newsletterService = {
  subscribe: async (email) => {
    const response = await fetch(
      `${config.API_BASE_URL}/app/newsletter/subscribe/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to subscribe");
    }

    return data;
  },
};
