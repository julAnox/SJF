import type React from "react";
import type { Company, Job, Resume } from "./api";

export interface CompanyWithRating extends Company {
  rating: number;
  reviewCount: number;
}

export interface JobWithCompany extends Job {
  companyData: CompanyWithRating;
}

export interface ResumeWithRating extends Resume {
  rating: number;
  reviewCount: number;
}

export interface ComparisonMetric {
  key: keyof Company;
  label: string;
  icon: React.ReactNode;
  format: (value: any) => string;
  isNumeric: boolean;
  higherIsBetter?: boolean;
}

export interface AuctionPageProps {
  companies?: CompanyWithRating[];
  loading?: boolean;
  error?: string | null;
}
