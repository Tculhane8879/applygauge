import { type AccessTokenProvider, authenticatedApiFetch } from "@/lib/api";
import { type ApplicationStatus, type SkillCategory } from "@/lib/api/jobs";

export type SkillDemandRead = {
  id: string;
  name: string;
  category: SkillCategory;
  job_count: number;
  job_percentage: number;
};

export type RecentJobRead = {
  id: string;
  company_name: string;
  title: string;
  current_status: ApplicationStatus;
  created_at: string;
};

export type AnalyticsOverviewRead = {
  total_jobs: number;
  applied_jobs: number;
  interview_jobs: number;
  response_rate_percentage: number | null;
  top_skills: SkillDemandRead[];
  recent_jobs: RecentJobRead[];
};

export type SkillInsightsResponse = {
  total_jobs: number;
  items: SkillDemandRead[];
};

export function getAnalyticsOverview(getAccessToken: AccessTokenProvider) {
  return authenticatedApiFetch<AnalyticsOverviewRead>(
    "/api/v1/analytics/overview",
    getAccessToken,
  );
}

export function getSkillInsights(getAccessToken: AccessTokenProvider) {
  return authenticatedApiFetch<SkillInsightsResponse>(
    "/api/v1/analytics/skills",
    getAccessToken,
  );
}
