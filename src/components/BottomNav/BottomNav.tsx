import styles from "./BottomNav.module.css";

type NavTab = "home" | "tasks" | "profile";

interface BottomNavProps {
  active: NavTab;
}

function navigate(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function BottomNav({ active }: BottomNavProps) {
  return (
    <nav className={styles.bottomNav}>
      <button
        type="button"
        className={`${styles.navItem} ${active === "home" ? styles.navItemActive : ""}`}
        onClick={() => navigate("/home")}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 10L12 3L21 10V20H3V10Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
        <span className={styles.navLabel}>Home</span>
      </button>

      <button
        type="button"
        className={`${styles.navItem} ${active === "tasks" ? styles.navItemActive : ""}`}
        onClick={() => navigate("/tasks")}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M7 3V6M17 3V6M4 9H20M6 21H18C19.1046 21 20 20.1046 20 19V7C20 5.89543 19.1046 5 18 5H6C4.89543 5 4 5.89543 4 7V19C4 20.1046 4.89543 21 6 21Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className={styles.navLabel}>Tarefas</span>
      </button>

      <button
        type="button"
        className={`${styles.navItem} ${active === "profile" ? styles.navItemActive : ""}`}
        onClick={() => navigate("/profile")}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M5 20C5 16.6863 8.13401 14 12 14C15.866 14 19 16.6863 19 20"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        <span className={styles.navLabel}>Perfil</span>
      </button>
    </nav>
  );
}
