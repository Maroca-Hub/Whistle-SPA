import { useEffect } from "react";
import styles from "./Login.module.css";

interface AuthCallbackProps {
  onNavigate: (path: string) => void;
}

export function AuthCallback({ onNavigate }: AuthCallbackProps) {
  const params = new URLSearchParams(window.location.search);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const hasError = !accessToken || !refreshToken;

  useEffect(() => {
    if (!accessToken || !refreshToken) {
      return;
    }

    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);

    onNavigate("/home");
  }, [accessToken, onNavigate, refreshToken]);

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.heading}>Finalizando login</h1>
        <p className={styles.subheading}>
          {hasError
            ? "Não foi possível concluir o login com Google."
            : "Aguarde enquanto preparamos sua conta."}
        </p>

        {hasError && (
          <>
            <button
              type="button"
              className={styles.submitButton}
              onClick={() => {
                onNavigate("/");
              }}
            >
              Voltar para login
            </button>
          </>
        )}
      </div>
    </main>
  );
}
