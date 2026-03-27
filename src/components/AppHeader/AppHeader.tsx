import styles from "./AppHeader.module.css";

interface AppHeaderProps {
  firstName?: string;
}

export function AppHeader({ firstName }: AppHeaderProps) {
  return (
    <header className={styles.topBar}>
      <div className={styles.userBlock}>
        <h1 className={styles.greeting}>Olá, {firstName ?? "..."}</h1>
        <span className={styles.welcome}>Oque você precisa fazer hoje?</span>
      </div>

      <button
        type="button"
        className={styles.iconButton}
        aria-label="Notificacoes"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M15 18H9M17 10C17 8.67392 16.4732 7.40215 15.5355 6.46447C14.5979 5.52678 13.3261 5 12 5C10.6739 5 9.40215 5.52678 8.46447 6.46447C7.52678 7.40215 7 8.67392 7 10C7 12.6267 6.36054 14.4722 5.64935 15.7116C5.05045 16.7555 5.73431 18 6.95259 18H17.0474C18.2657 18 18.9495 16.7555 18.3507 15.7116C17.6395 14.4722 17 12.6267 17 10Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 19C10 19.5304 10.2107 20.0391 10.5858 20.4142C10.9609 20.7893 11.4696 21 12 21C12.5304 21 13.0391 20.7893 13.4142 20.4142C13.7893 20.0391 14 19.5304 14 19"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </header>
  );
}
