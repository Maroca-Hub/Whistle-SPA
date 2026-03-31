import "./App.css";
import { useCallback, useEffect, useState } from "react";
import { Home } from "./pages/Home";
import { AuthCallback, Login } from "./pages/Login";
import { Register } from "./pages/Login/Register";
import { Profile } from "./pages/Profile";
import { ChatPage } from "./pages/Chat";
import { TaskDetailsPage } from "./pages/TaskDetails";
import { Tasks } from "./pages/Tasks";
import { ExecutorProfilePage } from "./pages/ExecutorProfile";
import { UserProvider } from "./contexts/UserProvider";

function getTaskIdFromPath(path: string): string | null {
  const detailsPathMatch = /^\/tasks\/([^/]+)$/.exec(path);
  return detailsPathMatch?.[1] ?? null;
}

function getChatIdFromPath(path: string): string | null {
  const chatPathMatch = /^\/chat\/([^/]+)$/.exec(path);
  return chatPathMatch?.[1] ?? null;
}

function getExecutorIdFromPath(path: string): string | null {
  const match = /^\/executor\/([^/]+)$/.exec(path);
  return match?.[1] ?? null;
}

function App() {
  const [path, setPath] = useState(window.location.pathname);

  const replacePath = useCallback((nextPath: string) => {
    window.history.replaceState({}, "", nextPath);
    setPath(nextPath);
  }, []);

  useEffect(() => {
    const onLocationChange = () => {
      setPath(window.location.pathname);
    };

    window.addEventListener("popstate", onLocationChange);

    return () => {
      window.removeEventListener("popstate", onLocationChange);
    };
  }, []);

  if (path === "/auth/callback") {
    return <AuthCallback onNavigate={replacePath} />;
  }

  const isAuthenticated = Boolean(localStorage.getItem("access_token"));

  if (!isAuthenticated && path !== "/" && path !== "/register") {
    window.history.replaceState({}, "", "/");
    return <Login />;
  }

  if (isAuthenticated && (path === "/" || path === "/register")) {
    window.history.replaceState({}, "", "/home");
    return <Home />;
  }

  if (path === "/register") {
    return <Register />;
  }

  if (path === "/home") {
    return <Home />;
  }

  if (path === "/profile") {
    return <Profile />;
  }

  if (path === "/tasks") {
    return <Tasks />;
  }

  const taskId = getTaskIdFromPath(path);

  if (taskId) {
    return <TaskDetailsPage taskId={taskId} />;
  }

  const chatId = getChatIdFromPath(path);

  if (chatId) {
    return <ChatPage chatId={chatId} />;
  }

  const executorId = getExecutorIdFromPath(path);

  if (executorId) {
    return <ExecutorProfilePage executorId={executorId} />;
  }

  return <Login />;
}

function AppWithProviders() {
  return (
    <UserProvider>
      <App />
    </UserProvider>
  );
}

export default AppWithProviders;
