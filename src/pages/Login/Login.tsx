import { useState } from "react";
import styles from "./Login.module.css";
import { authService, ApiError } from "../../services/auth.service";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailError = email && !isValidEmail(email) ? "E-mail inválido." : null;
  const passwordError =
    password && !isValidPassword(password)
      ? "A senha deve ter pelo menos 8 caracteres."
      : null;
  const hasValidationErrors = Boolean(emailError || passwordError);

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <div className={styles.appIcon}>
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z"
              fill="white"
              stroke="white"
              strokeWidth="0.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className={styles.heading}>Bem-vindo de volta!</h1>
        <p className={styles.subheading}>
          Acesse sua conta para continuar sua jornada.
        </p>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <form
          className={styles.form}
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setLoading(true);

            try {
              const response = await authService.login({ email, password });
              localStorage.setItem("access_token", response.access_token);
              localStorage.setItem("refresh_token", response.refresh_token);
              console.log("Login realizado com sucesso");
            } catch (err) {
              if (err instanceof ApiError) {
                if (err.status === 404) {
                  setError("E-mail ou senha incorretos.");
                } else {
                  setError(`Erro: ${err.message}`);
                }
              } else if (err instanceof Error) {
                setError(err.message);
              } else {
                setError("Erro ao fazer login. Tente novamente.");
              }
            } finally {
              setLoading(false);
            }
          }}
        >
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              E-mail
            </label>
            <input
              id="email"
              type="email"
              className={`${styles.input} ${emailError ? styles.inputError : ""}`}
              placeholder="nome@exemplo.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            {emailError && <p className={styles.fieldError}>{emailError}</p>}
          </div>

          <div className={styles.field}>
            <div className={styles.passwordHeader}>
              <label htmlFor="password" className={styles.label}>
                Senha
              </label>
              <a href="#" className={styles.forgotLink}>
                Esqueceu a senha?
              </a>
            </div>
            <div className={styles.passwordWrapper}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className={`${styles.input} ${passwordError ? styles.inputError : ""}`}
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {passwordError && (
              <p className={styles.fieldError}>{passwordError}</p>
            )}
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading || !email || !password || hasValidationErrors}
          >
            {loading ? "Carregando..." : "Entrar"}
          </button>
        </form>

        <div className={styles.divider}>
          <span className={styles.dividerLine} />
          <span className={styles.dividerText}>Ou entre com</span>
          <span className={styles.dividerLine} />
        </div>

        <button type="button" className={styles.googleButton}>
          <img
            src="https://www.google.com/favicon.ico"
            width="18"
            height="18"
            alt=""
            className={styles.googleIcon}
          />
          Continuar com Google
        </button>

        <p className={styles.registerPrompt}>
          Não tem uma conta?{" "}
          <a href="#" className={styles.registerLink}>
            Cadastre-se
          </a>
        </p>
      </div>
    </main>
  );
}
