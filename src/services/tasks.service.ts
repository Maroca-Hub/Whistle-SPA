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

export const tasksService = {
  getCustomerTasks: (page = 1, size = 20) =>
    api.get<CustomerTask[]>(`/tasks/customer?page=${page}&size=${size}`),
};
