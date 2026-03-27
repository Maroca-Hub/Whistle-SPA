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
  getTopSkills: (page = 1, size = 5) =>
    api.get<Skill[]>(`/skills?page=${page}&size=${size}`),
};
