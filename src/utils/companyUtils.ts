import api from "../services/api";

/**
 * Utility functions for handling company-related operations
 */

/**
 * Gets the company ID for the current user
 * @param user The current user object
 * @returns The company ID
 */
export const getCompanyIdFromUser = (user: any): number => {
  // If the user has a company_id field, use that
  if (user.company_id) {
    return Number(user.company_id);
  }

  // If the user is a company, use their ID
  if (user.role === "company" || user.user_type === "company") {
    return Number(user.id);
  }

  // If the user has a company field, use that
  if (user.company) {
    return Number(user.company);
  }

  // Default to the user's ID (not ideal, but a fallback)
  return Number(user.id);
};

/**
 * Gets a default job ID for the company
 * @param companyId The company ID
 * @returns A promise that resolves to a job ID
 */
export const getDefaultJobForCompany = async (
  companyId: number
): Promise<number> => {
  try {
    // Try to get the first job for this company
    const response = await api.get(`/jobs/?company=${companyId}&limit=1`);

    if (response.data && response.data.length > 0) {
      return response.data[0].id;
    }

    // If no jobs found, return a default ID
    return 1;
  } catch (error) {
    console.error("Error fetching default job:", error);
    return 1; // Default fallback
  }
};

export default {
  getCompanyIdFromUser,
  getDefaultJobForCompany,
};
