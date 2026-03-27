import { createContext } from "react";

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_picture: string;
  created_at: string;
  updated_at: string | null;
}

export interface UserContextValue {
  user: User | null;
  loadUser: () => Promise<void>;
  updateUser: (nextUser: User) => void;
}

export const UserContext = createContext<UserContextValue | null>(null);
