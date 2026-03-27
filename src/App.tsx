import "./App.css";
import { useEffect, useState } from "react";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Profile } from "./pages/Profile";
import { UserProvider } from "./contexts/UserProvider";

function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onLocationChange = () => {
      setPath(window.location.pathname);
    };

    window.addEventListener("popstate", onLocationChange);

    return () => {
      window.removeEventListener("popstate", onLocationChange);
    };
  }, []);

  const isAuthenticated = Boolean(localStorage.getItem("access_token"));

  if (!isAuthenticated && path !== "/") {
    window.history.replaceState({}, "", "/");
    return <Login />;
  }

  if (isAuthenticated && path === "/") {
    window.history.replaceState({}, "", "/home");
    return <Home />;
  }

  if (path === "/home") {
    return <Home />;
  }

  if (path === "/profile") {
    return <Profile />;
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
