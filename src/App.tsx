import "./App.css";
import { useEffect, useState } from "react";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";

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

  return <Login />;
}

export default App;
