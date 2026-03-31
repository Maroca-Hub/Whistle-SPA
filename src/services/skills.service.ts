import { api } from "./api";

export interface Skill {
  id: string;
  name: string;
  available: boolean;
  icon: string;
  description: string;
  created_at: string;
  updated_at: string | null;
}

export const skillsService = {
  getTopSkills: (
    page = 1,
    size = 5,
    name?: string,
    orderByTasksCount = false,
  ) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("size", String(size));

    if (orderByTasksCount) {
      params.set("orderByTasksCount", "true");
    }

    if (name?.trim()) {
      params.set("name", name.trim());
    }

    return api.get<Skill[]>(`/skills?${params.toString()}`);
  },
};
