import { api } from "./api";

export interface ExecutorSkill {
  id: string;
  name: string;
  available: boolean;
  icon: string;
  description: string;
  created_at: string;
  updated_at: string | null;
}

export interface ExecutorReview {
  id: string;
  task_id: string;
  reviewer_id: string;
  reviewed_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface ExecutorProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_picture: string;
  rating: number;
  description: string;
  portfolio: string[];
  skills: ExecutorSkill[];
  last_reviews: ExecutorReview[];
  created_at: string;
  updated_at: string | null;
}

export const executorsService = {
  getProfile: (executorId: string) =>
    api.get<ExecutorProfile>(`/executors/${executorId}`),
};
