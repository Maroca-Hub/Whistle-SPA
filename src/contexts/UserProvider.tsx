import { useState, useCallback, type ReactNode } from "react";
import { authService } from "../services/auth.service";
import { UserContext, type User } from "./UserContext";

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const loadUser = useCallback(async () => {
    const data = await authService.me();
    setUser(data);
  }, []);

  return (
    <UserContext.Provider value={{ user, loadUser }}>
      {children}
    </UserContext.Provider>
  );
}
