import { useEffect, useState } from "react";
import styles from "./Profile.module.css";
import { useUser } from "../../hooks/useUser";

function navigate(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function Profile() {
  const { user, loadUser } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [committedProfile, setCommittedProfile] = useState<{
    firstName: string;
    lastName: string;
  } | null>(null);
  const [draftProfile, setDraftProfile] = useState<{
    firstName: string;
    lastName: string;
  } | null>(null);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const firstName =
    draftProfile?.firstName ??
    committedProfile?.firstName ??
    user?.first_name ??
    "";
  const lastName =
    draftProfile?.lastName ??
    committedProfile?.lastName ??
    user?.last_name ??
    "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  const handleToggleEdit = () => {
    if (isEditing) {
      setIsEditing(false);
      setDraftProfile(null);
      return;
    }

    setDraftProfile({ firstName, lastName });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setDraftProfile(null);
    setIsEditing(false);
  };

  const handleSave = () => {
    if (draftProfile) {
      setCommittedProfile(draftProfile);
    }
    setDraftProfile(null);
    setIsEditing(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/");
  };

  return (
    <main className={styles.container}>
      <section className={styles.panel}>
        <header className={styles.topBar}>
          <h1 className={styles.greeting}>Olá, {user?.first_name ?? "..."}</h1>

          <div className={styles.topActions}>
            <button
              type="button"
              className={styles.iconButton}
              aria-label="Notificações"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M15 18H9M17 10C17 8.67392 16.4732 7.40215 15.5355 6.46447C14.5979 5.52678 13.3261 5 12 5C10.6739 5 9.40215 5.52678 8.46447 6.46447C7.52678 7.40215 7 8.67392 7 10C7 12.6267 6.36054 14.4722 5.64935 15.7116C5.05045 16.7555 5.73431 18 6.95259 18H17.0474C18.2657 18 18.9495 16.7555 18.3507 15.7116C17.6395 14.4722 17 12.6267 17 10Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <div className={styles.topAvatar} aria-hidden="true">
              <img src={user?.profile_picture} alt="" />
            </div>
          </div>
        </header>

        <section className={styles.profileHeader}>
          <div className={styles.mainAvatarWrap}>
            <div className={styles.mainAvatar}>
              <img src={user?.profile_picture} alt="" aria-hidden="true" />
            </div>

            <button
              type="button"
              className={styles.cameraButton}
              aria-label="Alterar foto"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4 8C4 6.89543 4.89543 6 6 6H8L9.4 4.4C9.77963 3.95472 10.3356 3.7 10.92 3.7H13.08C13.6644 3.7 14.2204 3.95472 14.6 4.4L16 6H18C19.1046 6 20 6.89543 20 8V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V8Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="12"
                  cy="13"
                  r="3"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
              </svg>
            </button>
          </div>

          <h2 className={styles.fullName}>{fullName || "Usuário"}</h2>
          <p className={styles.email}>{user?.email ?? ""}</p>
        </section>

        <section className={styles.editCard}>
          <div className={styles.editHeader}>
            <div className={styles.editTitleWrap}>
              <span className={styles.editIcon} aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M16 4L20 8L9 19H5V15L16 4Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <h3 className={styles.editTitle}>Editar perfil</h3>
            </div>

            <button
              type="button"
              className={styles.editToggleButton}
              onClick={handleToggleEdit}
              aria-label="Ativar edição"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M16 4L20 8L9 19H5V15L16 4Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <div className={styles.formField}>
            <label className={styles.label} htmlFor="firstName">
              Nome
            </label>
            <input
              id="firstName"
              className={styles.input}
              value={firstName}
              onChange={(event) =>
                setDraftProfile((current) => ({
                  firstName: event.target.value,
                  lastName: current?.lastName ?? lastName,
                }))
              }
              readOnly={!isEditing}
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.label} htmlFor="lastName">
              Sobrenome
            </label>
            <input
              id="lastName"
              className={styles.input}
              value={lastName}
              onChange={(event) =>
                setDraftProfile((current) => ({
                  firstName: current?.firstName ?? firstName,
                  lastName: event.target.value,
                }))
              }
              readOnly={!isEditing}
            />
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.saveButton}
              onClick={handleSave}
              disabled={!isEditing}
            >
              Salvar alterações
            </button>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={handleCancel}
              disabled={!isEditing}
            >
              Cancelar
            </button>
          </div>
        </section>

        <button type="button" className={styles.passwordRow}>
          <span className={styles.passwordRowLeft}>
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M7 11V8C7 5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8V11"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <rect
                x="5"
                y="11"
                width="14"
                height="10"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            <span className={styles.passwordTitle}>Alterar senha</span>
          </span>

          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M6 9L12 15L18 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className={styles.separator} />

        <button
          type="button"
          className={styles.logoutButton}
          onClick={handleLogout}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M15 3H5V21H15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10 12H21"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M18 9L21 12L18 15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Sair da conta</span>
        </button>
      </section>

      <nav className={styles.bottomNav}>
        <button
          type="button"
          className={styles.navItem}
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

        <button type="button" className={styles.navItem}>
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
          className={`${styles.navItem} ${styles.navItemActive}`}
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
    </main>
  );
}
