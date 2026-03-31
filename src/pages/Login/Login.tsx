import { useState } from "react";
import styles from "./Login.module.css";
import { authService, ApiError } from "../../services/auth.service";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function Login() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailError = email && !isValidEmail(email) ? "E-mail inválido." : null;
  const otpError =
    otp && !/^\d{6}$/.test(otp) ? "Informe um OTP com 6 dígitos." : null;
  const hasValidationErrors = Boolean(emailError || (otpRequested && otpError));

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
        {info && <div className={styles.infoMessage}>{info}</div>}

        <form
          className={styles.form}
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setInfo(null);
            setLoading(true);

            try {
              if (!otpRequested) {
                await authService.requestOtp(email);
                setOtpRequested(true);
                setInfo("Enviamos um código de acesso para o seu e-mail.");
                return;
              }

              const response = await authService.loginWithOtp({ email, otp });

              localStorage.setItem("access_token", response.access_token);
              localStorage.setItem("refresh_token", response.refresh_token);

              window.history.pushState({}, "", "/home");
              window.dispatchEvent(new PopStateEvent("popstate"));
            } catch (err) {
              if (err instanceof ApiError) {
                if (err.status === 404) {
                  setError("E-mail não encontrado.");
                } else if (err.status === 401) {
                  setError("Código de acesso inválido ou expirado.");
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
              onChange={(e) => {
                const nextEmail = e.target.value;
                setEmail(nextEmail);
                setOtp("");
                setOtpRequested(false);
                setError(null);
                setInfo(null);
              }}
              disabled={loading}
            />
            {emailError && <p className={styles.fieldError}>{emailError}</p>}
          </div>

          {otpRequested && (
            <div className={styles.field}>
              <label htmlFor="otp" className={styles.label}>
                Código de acesso
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                className={`${styles.input} ${otpError ? styles.inputError : ""}`}
                placeholder="000000"
                autoComplete="one-time-code"
                value={otp}
                maxLength={6}
                onChange={(e) => {
                  const nextValue = e.target.value.replace(/\D/g, "");
                  setOtp(nextValue);
                  setError(null);
                }}
                disabled={loading}
              />
              {otpError && <p className={styles.fieldError}>{otpError}</p>}
            </div>
          )}

          {otpRequested && (
            <button
              type="button"
              className={styles.secondaryButton}
              disabled={loading || Boolean(emailError)}
              onClick={async () => {
                setError(null);
                setInfo(null);
                setLoading(true);

                try {
                  await authService.requestOtp(email);
                  setInfo("Novo código de acesso enviado para o seu e-mail.");
                } catch (err) {
                  if (err instanceof ApiError && err.status === 404) {
                    setError("E-mail não encontrado.");
                  } else if (err instanceof ApiError) {
                    setError(`Erro: ${err.message}`);
                  } else {
                    setError("Erro ao reenviar OTP. Tente novamente.");
                  }
                } finally {
                  setLoading(false);
                }
              }}
            >
              Reenviar código
            </button>
          )}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={
              loading ||
              !email ||
              hasValidationErrors ||
              (otpRequested && otp.length !== 6)
            }
          >
            {loading
              ? "Carregando..."
              : otpRequested
                ? "Entrar com código de acesso"
                : "Receber código de acesso"}
          </button>
        </form>

        <div className={styles.divider}>
          <span className={styles.dividerLine} />
          <span className={styles.dividerText}>Ou entre com</span>
          <span className={styles.dividerLine} />
        </div>

        <button
          type="button"
          className={styles.googleButton}
          onClick={() => {
            window.location.href = authService.getGoogleLoginUrl();
          }}
          disabled={loading}
        >
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
