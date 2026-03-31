import { useState } from "react";
import styles from "./Login.module.css";
import { ApiError, authService } from "../../services/auth.service";
import { usersService } from "../../services/users.service";

const LOGIN_AFTER_SIGNUP_EMAIL_KEY = "login_after_signup_email";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function navigateToLogin() {
  window.history.pushState({}, "", "/");
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [firstNameTouched, setFirstNameTouched] = useState(false);
  const [lastNameTouched, setLastNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [profilePictureTouched, setProfilePictureTouched] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstNameError = !firstName.trim() ? "Informe seu nome." : null;
  const lastNameError = !lastName.trim() ? "Informe seu sobrenome." : null;
  const emailError = !email.trim()
    ? "Informe seu e-mail."
    : !isValidEmail(email)
      ? "E-mail inválido."
      : null;
  const profilePictureError = !profilePicture
    ? "A foto de perfil é obrigatória."
    : null;

  const showFirstNameError = Boolean(
    firstNameError && (firstNameTouched || submitAttempted),
  );
  const showLastNameError = Boolean(
    lastNameError && (lastNameTouched || submitAttempted),
  );
  const showEmailError = Boolean(
    emailError && (emailTouched || submitAttempted),
  );
  const showProfilePictureError = Boolean(
    profilePictureError && (profilePictureTouched || submitAttempted),
  );

  const canSubmit =
    !loading &&
    Boolean(firstName.trim()) &&
    Boolean(lastName.trim()) &&
    Boolean(email.trim()) &&
    !emailError &&
    Boolean(profilePicture);

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

        <h1 className={styles.heading}>Crie sua conta</h1>
        <p className={styles.subheading}>
          Complete os dados abaixo para começar.
        </p>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <form
          className={styles.form}
          onSubmit={async (event) => {
            event.preventDefault();
            setError(null);
            setSubmitAttempted(true);

            if (
              firstNameError ||
              lastNameError ||
              emailError ||
              profilePictureError
            ) {
              return;
            }

            const selectedProfilePicture = profilePicture;

            if (!selectedProfilePicture) {
              return;
            }

            setLoading(true);

            try {
              await usersService.create({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim(),
                profilePicture: selectedProfilePicture,
              });

              await authService.requestOtp(email.trim());
              sessionStorage.setItem(
                LOGIN_AFTER_SIGNUP_EMAIL_KEY,
                email.trim(),
              );
              navigateToLogin();
            } catch (err) {
              if (err instanceof ApiError) {
                if (err.status === 409) {
                  setError("Já existe uma conta para este e-mail.");
                } else if (err.status === 415) {
                  setError("Tipo de arquivo inválido para a foto de perfil.");
                } else {
                  setError(`Erro: ${err.message}`);
                }
              } else if (err instanceof Error) {
                setError(err.message);
              } else {
                setError("Não foi possível criar a conta. Tente novamente.");
              }
            } finally {
              setLoading(false);
            }
          }}
        >
          <div className={styles.field}>
            <label htmlFor="firstName" className={styles.label}>
              Nome
            </label>
            <input
              id="firstName"
              type="text"
              className={`${styles.input} ${showFirstNameError ? styles.inputError : ""}`}
              placeholder="Seu nome"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                setFirstNameTouched(true);
              }}
              onBlur={() => setFirstNameTouched(true)}
              disabled={loading}
            />
            {showFirstNameError && (
              <p className={styles.fieldError}>{firstNameError}</p>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="lastName" className={styles.label}>
              Sobrenome
            </label>
            <input
              id="lastName"
              type="text"
              className={`${styles.input} ${showLastNameError ? styles.inputError : ""}`}
              placeholder="Seu sobrenome"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                setLastNameTouched(true);
              }}
              onBlur={() => setLastNameTouched(true)}
              disabled={loading}
            />
            {showLastNameError && (
              <p className={styles.fieldError}>{lastNameError}</p>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              E-mail
            </label>
            <input
              id="email"
              type="email"
              className={`${styles.input} ${showEmailError ? styles.inputError : ""}`}
              placeholder="nome@exemplo.com"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailTouched(true);
              }}
              onBlur={() => setEmailTouched(true)}
              disabled={loading}
            />
            {showEmailError && (
              <p className={styles.fieldError}>{emailError}</p>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="profilePicture" className={styles.label}>
              Foto de perfil
            </label>
            <input
              id="profilePicture"
              type="file"
              className={`${styles.fileInput} ${showProfilePictureError ? styles.fileInputError : ""}`}
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setProfilePicture(file);
                setProfilePictureTouched(true);
              }}
              onBlur={() => setProfilePictureTouched(true)}
              disabled={loading}
            />
            {showProfilePictureError && (
              <p className={styles.fieldError}>{profilePictureError}</p>
            )}
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={!canSubmit}
          >
            {loading ? "Carregando..." : "Criar conta"}
          </button>
        </form>

        <p className={styles.registerPrompt}>
          Já tem uma conta?{" "}
          <button
            type="button"
            className={styles.registerLink}
            onClick={navigateToLogin}
            disabled={loading}
          >
            Entrar
          </button>
        </p>
      </div>
    </main>
  );
}
