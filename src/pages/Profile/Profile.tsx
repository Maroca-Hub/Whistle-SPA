import { useEffect, useRef, useState, type ChangeEvent } from "react";
import styles from "./Profile.module.css";
import { useUser } from "../../hooks/useUser";
import { AppHeader } from "../../components/AppHeader/AppHeader";
import { BottomNav } from "../../components/BottomNav/BottomNav";
import { ApiError, authService } from "../../services/auth.service";

function navigate(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function Profile() {
  const { user, loadUser, updateUser } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [draftProfile, setDraftProfile] = useState<{
    firstName: string;
    lastName: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const currentFirstName = user?.first_name ?? "";
  const currentLastName = user?.last_name ?? "";
  const fullName = [currentFirstName, currentLastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const profilePictureSrc = user?.profile_picture ?? "";

  const handleToggleEdit = () => {
    if (isEditing) {
      setIsEditing(false);
      setDraftProfile(null);
      setSaveError(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    setDraftProfile({
      firstName: currentFirstName,
      lastName: currentLastName,
    });
    setSaveError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setDraftProfile(null);
    setSaveError(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setIsEditing(false);
  };

  const handleProfilePictureClick = () => {
    if (!isEditing) {
      setDraftProfile({
        firstName: currentFirstName,
        lastName: currentLastName,
      });
      setIsEditing(true);
    }

    fileInputRef.current?.click();
  };

  const handleProfilePictureChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024;

    if (file.size > MAX_FILE_SIZE) {
      setSaveError("A foto de perfil deve ter no máximo 5MB.");
      event.target.value = "";
      return;
    }

    setIsUploadingPicture(true);
    setSaveError(null);

    try {
      const updatedUser = await authService.updateMe({
        firstName: currentFirstName,
        lastName: currentLastName,
        profilePicture: file,
      });

      updateUser(updatedUser);
    } catch {
      setSaveError("Não foi possível atualizar a foto de perfil.");
    } finally {
      setIsUploadingPicture(false);
      event.target.value = "";
    }
  };

  const handleSave = async () => {
    if (!draftProfile || isSaving) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const updatedUser = await authService.updateMe({
        firstName: draftProfile.firstName,
        lastName: draftProfile.lastName,
      });

      updateUser(updatedUser);
      setDraftProfile(null);
      setIsEditing(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setSaveError(error.message);
      } else {
        setSaveError("Erro ao salvar perfil.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/");
  };

  const resetPasswordForm = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setPasswordError(null);
    setPasswordSuccess(null);
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleTogglePassword = () => {
    if (isPasswordOpen) {
      resetPasswordForm();
      setIsPasswordOpen(false);
      return;
    }

    setPasswordError(null);
    setPasswordSuccess(null);
    setIsPasswordOpen(true);
  };

  const handleCancelPassword = () => {
    resetPasswordForm();
    setIsPasswordOpen(false);
  };

  const handleSavePassword = async () => {
    if (isSavingPassword) {
      return;
    }

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      setPasswordError("Preencha todos os campos de senha.");
      setPasswordSuccess(null);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError("A nova senha e a confirmação precisam ser iguais.");
      setPasswordSuccess(null);
      return;
    }

    setIsSavingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      await authService.updatePassword({
        oldPassword,
        newPassword,
      });

      setPasswordSuccess("Senha atualizada com sucesso.");
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setShowOldPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch {
      setPasswordError("Não foi possível atualizar a senha.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <main className={styles.container}>
      <section className={styles.panel}>
        <AppHeader firstName={user?.first_name} />
        <section className={styles.profileHeader}>
          <div className={styles.mainAvatarWrap}>
            <div className={styles.mainAvatar}>
              <img src={profilePictureSrc} alt="" aria-hidden="true" />
            </div>

            <button
              type="button"
              className={styles.cameraButton}
              aria-label="Alterar foto"
              onClick={handleProfilePictureClick}
              disabled={isUploadingPicture}
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

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={styles.hiddenFileInput}
              onChange={handleProfilePictureChange}
            />
          </div>

          <h2 className={styles.fullName}>{fullName || "Usuário"}</h2>
          <p className={styles.email}>{user?.email ?? ""}</p>
        </section>

        <section className={styles.editCard}>
          <div className={styles.editHeader}>
            <div className={styles.editTitleWrap}>
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

          {isEditing ? (
            <>
              <div className={styles.formField}>
                <label className={styles.label} htmlFor="firstName">
                  Nome
                </label>
                <input
                  id="firstName"
                  className={styles.input}
                  value={draftProfile?.firstName ?? ""}
                  onChange={(event) =>
                    setDraftProfile((current) => ({
                      firstName: event.target.value,
                      lastName: current?.lastName ?? "",
                    }))
                  }
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.label} htmlFor="lastName">
                  Sobrenome
                </label>
                <input
                  id="lastName"
                  className={styles.input}
                  value={draftProfile?.lastName ?? ""}
                  onChange={(event) =>
                    setDraftProfile((current) => ({
                      firstName: current?.firstName ?? "",
                      lastName: event.target.value,
                    }))
                  }
                />
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.saveButton}
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? "Salvando..." : "Salvar"}
                </button>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancelar
                </button>
              </div>

              {saveError && <p className={styles.saveError}>{saveError}</p>}
            </>
          ) : (
            <>
              <div className={styles.formField}>
                <label className={styles.label}>Nome</label>
                <p className={styles.inputStatic}>{currentFirstName || "-"}</p>
              </div>

              <div className={styles.formField}>
                <label className={styles.label}>Sobrenome</label>
                <p className={styles.inputStatic}>{currentLastName || "-"}</p>
              </div>
            </>
          )}
        </section>

        <section className={styles.passwordCard}>
          <div className={styles.editHeader}>
            <div className={styles.editTitleWrap}>
              <h3 className={styles.editTitle}>Alterar senha</h3>
            </div>

            <button
              type="button"
              className={styles.editToggleButton}
              onClick={handleTogglePassword}
              aria-expanded={isPasswordOpen}
              aria-controls="password-dropdown"
              aria-label="Abrir ou fechar alteração de senha"
            >
              <svg
                className={`${styles.passwordChevron} ${isPasswordOpen ? styles.passwordChevronOpen : ""}`}
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
          </div>

          {isPasswordOpen && (
            <div id="password-dropdown" className={styles.passwordDropdown}>
              <div className={styles.formField}>
                <label className={styles.label} htmlFor="oldPassword">
                  Senha atual
                </label>
                <div className={styles.passwordInputWrap}>
                  <input
                    id="oldPassword"
                    className={styles.input}
                    type={showOldPassword ? "text" : "password"}
                    value={oldPassword}
                    onChange={(event) => setOldPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    className={styles.passwordEyeButton}
                    onClick={() => setShowOldPassword((current) => !current)}
                    aria-label={
                      showOldPassword
                        ? "Ocultar senha atual"
                        : "Mostrar senha atual"
                    }
                  >
                    {showOldPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              <div className={styles.formField}>
                <label className={styles.label} htmlFor="newPassword">
                  Nova senha
                </label>
                <div className={styles.passwordInputWrap}>
                  <input
                    id="newPassword"
                    className={styles.input}
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    className={styles.passwordEyeButton}
                    onClick={() => setShowNewPassword((current) => !current)}
                    aria-label={
                      showNewPassword
                        ? "Ocultar nova senha"
                        : "Mostrar nova senha"
                    }
                  >
                    {showNewPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              <div className={styles.formField}>
                <label className={styles.label} htmlFor="confirmNewPassword">
                  Repita a nova senha
                </label>
                <div className={styles.passwordInputWrap}>
                  <input
                    id="confirmNewPassword"
                    className={styles.input}
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmNewPassword}
                    onChange={(event) =>
                      setConfirmNewPassword(event.target.value)
                    }
                  />
                  <button
                    type="button"
                    className={styles.passwordEyeButton}
                    onClick={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Ocultar confirmação de senha"
                        : "Mostrar confirmação de senha"
                    }
                  >
                    {showConfirmPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.saveButton}
                  onClick={handleSavePassword}
                  disabled={isSavingPassword}
                >
                  {isSavingPassword ? "Salvando..." : "Salvar"}
                </button>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={handleCancelPassword}
                  disabled={isSavingPassword}
                >
                  Cancelar
                </button>
              </div>

              {passwordError && (
                <p className={styles.saveError}>{passwordError}</p>
              )}
              {passwordSuccess && (
                <p className={styles.saveSuccess}>{passwordSuccess}</p>
              )}
            </div>
          )}
        </section>

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

      <BottomNav active="profile" />
    </main>
  );
}
