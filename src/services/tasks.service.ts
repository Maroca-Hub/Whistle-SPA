import { api } from "./api";

export type TaskStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "PENDING";

export interface TaskSkill {
  id: string;
  name: string;
  description: string;
  icon: string;
  available: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface CustomerTask {
  id: string;
  skill_id: string;
  customer_id: string;
  executor_id: string | null;
  description: string;
  latitude: number;
  longitude: number;
  status: TaskStatus;
  pending_bids_count: number;
  skill: TaskSkill;
  created_at: string;
  updated_at: string | null;
}

export interface TaskReview {
  id: string;
  task_id: string;
  reviewer_id: string;
  reviewed_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface TaskUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_picture?: string;
  rating?: number;
  created_at: string;
  updated_at: string | null;
}

export interface TaskBid {
  id: string;
  task_id: string;
  executor_id: string;
  amount: number;
  created_at: string;
  updated_at: string | null;
}

export interface TaskCandidate extends TaskUser {
  bid?: TaskBid;
}

export interface TaskChat {
  id: string;
  task_id: string;
  executor_id: string;
  customer_id: string;
  customer_read_at: string | null;
  executor_read_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface TaskDetails extends CustomerTask {
  reviews: TaskReview[];
  customer: TaskUser;
  candidate: TaskCandidate | null;
  chat: TaskChat | null;
}

export const tasksService = {
  getCustomerTasks: (page = 1, size = 20) =>
    api.get<CustomerTask[]>(`/tasks/customer?page=${page}&size=${size}`),

  getTaskDetails: (taskId: string) => api.get<TaskDetails>(`/tasks/${taskId}`),
};
