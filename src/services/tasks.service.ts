import { api } from "./api";

export type TaskStatus = "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "PENDING";

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
  customer_has_resources: boolean;
  image: string | null;
  reviews: TaskReview[];
  customer: TaskUser;
  candidate: TaskCandidate | null;
  chat: TaskChat | null;
}

export interface CreateTaskRequest {
  skillId: string;
  description: string;
  latitude: number;
  longitude: number;
  customerHasResources: boolean;
  image?: File;
}

export interface CreatedTaskResponse {
  id: string;
  skill_id: string;
  customer_id: string;
  executor_id: string | null;
  description: string;
  latitude: number;
  longitude: number;
  status: TaskStatus;
  customer_has_resources: boolean;
  image: string | null;
  reviews: TaskReview[];
  created_at: string;
  updated_at: string | null;
}

export const tasksService = {
  getCustomerTasks: (page = 1, size = 20, statuses?: TaskStatus[]) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("size", String(size));
    statuses?.forEach((s) => params.append("statuses", s));
    return api.get<CustomerTask[]>(`/tasks/customer?${params.toString()}`);
  },
  getTaskDetails: (taskId: string) => api.get<TaskDetails>(`/tasks/${taskId}`),
  getTaskCandidates: (taskId: string) =>
    api.get<TaskCandidate[]>(`/tasks/${taskId}/bids`),
  createReview: (taskId: string, body: { rating: number; comment: string }) =>
    api.post<TaskReview>(`/tasks/${taskId}/reviews`, body),
  cancelTask: (taskId: string) =>
    api.post<TaskDetails>(`/tasks/${taskId}/cancel`, {}),
  completeTask: (taskId: string) =>
    api.post<TaskDetails>(`/tasks/${taskId}/complete`, {}),
  awardBid: (taskId: string, bidId: string) =>
    api.post<TaskDetails>(`/tasks/${taskId}/bids/${bidId}/award`, {}),
  declineBid: (taskId: string, bidId: string) =>
    api.post<void>(`/tasks/${taskId}/bids/${bidId}/decline`, {}),
  createTask: ({
    skillId,
    description,
    latitude,
    longitude,
    customerHasResources,
    image,
  }: CreateTaskRequest) => {
    const formData = new FormData();
    formData.append("skillId", skillId);
    formData.append("description", description);
    formData.append("latitude", String(latitude));
    formData.append("longitude", String(longitude));
    formData.append("customerHasResources", String(customerHasResources));

    if (image) {
      formData.append("image", image);
    }

    return api.post<CreatedTaskResponse>("/tasks", formData);
  },
};
