import { useCallback, useEffect, useMemo, useState, type UIEvent } from "react";
import styles from "./Home.module.css";
import { useUser } from "../../hooks/useUser";
import { skillsService, type Skill } from "../../services/skills.service";

const TASK_LIST_SIZE = 20;

export function Home() {
  const { user, loadUser } = useUser();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isTaskModalClosing, setIsTaskModalClosing] = useState(false);
  const [taskItems, setTaskItems] = useState<Skill[]>([]);
  const [taskPage, setTaskPage] = useState(1);
  const [hasMoreTasks, setHasMoreTasks] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [taskListError, setTaskListError] = useState<string | null>(null);
  const [taskSearch, setTaskSearch] = useState("");

  const openTaskModal = useCallback(() => {
    setIsTaskModalClosing(false);
    setIsTaskModalOpen(true);
  }, []);

  const closeTaskModal = useCallback(() => {
    if (!isTaskModalOpen) {
      return;
    }

    setIsTaskModalClosing(true);
  }, [isTaskModalOpen]);

  const loadTaskPage = useCallback(async (page: number, reset = false) => {
    setIsLoadingTasks(true);
    setTaskListError(null);

    try {
      const response = await skillsService.getTopSkills(page, TASK_LIST_SIZE);

      setTaskItems((prev) => (reset ? response : [...prev, ...response]));
      setTaskPage(page);
      setHasMoreTasks(response.length >= TASK_LIST_SIZE);
    } catch {
      setTaskListError("Erro ao carregar tarefas.");
    } finally {
      setIsLoadingTasks(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
    skillsService
      .getTopSkills()
      .then(setSkills)
      .catch(() => {});
  }, [loadUser]);

  useEffect(() => {
    if (!isTaskModalOpen) {
      return;
    }

    loadTaskPage(1, true);
    setTaskSearch("");

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeTaskModal();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isTaskModalOpen, loadTaskPage, closeTaskModal]);

  useEffect(() => {
    if (!isTaskModalClosing) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsTaskModalOpen(false);
      setIsTaskModalClosing(false);
    }, 260);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isTaskModalClosing]);

  const filteredTaskItems = useMemo(() => {
    if (!taskSearch.trim()) {
      return taskItems;
    }

    const normalized = taskSearch.toLowerCase();

    return taskItems.filter(
      (item) =>
        item.name.toLowerCase().includes(normalized) ||
        item.description.toLowerCase().includes(normalized),
    );
  }, [taskItems, taskSearch]);

  const handleTaskListScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget;
      const threshold = 48;
      const reachedBottom =
        target.scrollTop + target.clientHeight >=
        target.scrollHeight - threshold;

      if (!reachedBottom || isLoadingTasks || !hasMoreTasks) {
        return;
      }

      loadTaskPage(taskPage + 1);
    },
    [hasMoreTasks, isLoadingTasks, loadTaskPage, taskPage],
  );

  return (
    <main className={styles.container}>
      <section className={styles.panel}>
        <header className={styles.topBar}>
          <div className={styles.userBlock}>
            <div className={styles.avatar} aria-hidden="true">
              <img
                src={user?.profile_picture}
                alt=""
                className={styles.avatarImage}
              />
            </div>

            <h1 className={styles.greeting}>
              Olá, {user?.first_name ?? "..."}
            </h1>
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

        <div
          className={styles.searchBox}
          onClick={openTaskModal}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openTaskModal();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Abrir listagem de tarefas"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M21 21L16.65 16.65"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Buscar servico"
            aria-label="Buscar servico"
            readOnly
          />
        </div>

        <section className={styles.heroCard}>
          <p className={styles.heroText}>
            encontre ajuda qualificada para suas demandas
          </p>
        </section>

        <section className={styles.skillsSection}>
          <div className={styles.skillsHeader}>
            <h2 className={styles.skillsTitle}>Serviços em alta</h2>
            <button
              type="button"
              className={styles.skillsViewAll}
              onClick={openTaskModal}
            >
              Ver todos
            </button>
          </div>

          <div className={styles.skillsList}>
            {skills.map((skill) => (
              <button key={skill.id} type="button" className={styles.skillChip}>
                <img
                  src={skill.icon}
                  alt=""
                  className={styles.skillChipIcon}
                  aria-hidden="true"
                />
                {skill.name}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.activeTaskSection}>
          <h2 className={styles.sectionTitle}>Tarefa ativa</h2>

          <article className={styles.taskCard}>
            <div className={styles.taskCardLeft}>
              <div className={styles.taskIcon} aria-hidden="true">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="3"
                    y="4"
                    width="18"
                    height="14"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M8 10H16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M8 14H12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            <div className={styles.taskCardContent}>
              <div className={styles.taskCardHeader}>
                <h3 className={styles.taskTitle}>Redesign de Landing Page</h3>
                <span className={styles.taskBadge}>ABERTO</span>
              </div>

              <p className={styles.taskStatus}>Status: Recebendo propostas</p>

              <div className={styles.taskProposals}>
                <div className={styles.proposalAvatars} aria-hidden="true">
                  <div className={styles.proposalAvatar}>
                    <img src="https://i.pravatar.cc/64?img=12" alt="" />
                  </div>
                  <div className={styles.proposalAvatar}>
                    <img src="https://i.pravatar.cc/64?img=29" alt="" />
                  </div>
                  <div className={styles.proposalAvatar}>
                    <img src="https://i.pravatar.cc/64?img=45" alt="" />
                  </div>
                </div>

                <button type="button" className={styles.proposalsLink}>
                  <span className={styles.proposalsCount}>12 propostas</span>
                  <span className={styles.proposalsText}>recebidas</span>
                </button>
              </div>

              <button type="button" className={styles.taskLink}>
                Gerenciar tarefa
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9 6L15 12L9 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </article>
        </section>

        <section className={styles.suggestionsSection}>
          <h2 className={styles.sectionTitle}>Sugestões para você</h2>

          <div className={styles.suggestionsGrid}>
            <article className={styles.suggestionCard}>
              <div className={styles.suggestionIcon} aria-hidden="true">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5 16L10 11L13 14L19 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15 8H19V12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className={styles.suggestionTitle}>
                Consultoria de Negócios
              </h3>
              <button type="button" className={styles.suggestionLink}>
                Explorar especialistas
              </button>
            </article>

            <article
              className={`${styles.suggestionCard} ${styles.suggestionCardLight}`}
            >
              <div className={styles.suggestionIcon} aria-hidden="true">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 4L18 20"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M18 4L6 20"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M4 8H10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M14 16H20"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h3 className={styles.suggestionTitle}>Tradução Técnica</h3>
              <p className={styles.suggestionPrice}>A partir de R$ 45,00/pág</p>
            </article>

            <article
              className={`${styles.suggestionCard} ${styles.suggestionCardBlue}`}
            >
              <div className={styles.suggestionBlueContent}>
                <div>
                  <h3 className={styles.suggestionTitleBlue}>
                    Marketing Digital
                  </h3>
                  <p className={styles.suggestionDescBlue}>
                    Impulsione suas vendas
                  </p>
                </div>

                <div className={styles.suggestionRocket} aria-hidden="true">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M14 4L20 10L12 18L6 12L14 4Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="14" cy="10" r="1.6" fill="currentColor" />
                  </svg>
                </div>
              </div>
            </article>
          </div>
        </section>
      </section>

      <button
        type="button"
        className={styles.fab}
        aria-label="Criar tarefa"
        onClick={openTaskModal}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 5V19"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M5 12H19"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <nav className={styles.bottomNav}>
        <button
          type="button"
          className={`${styles.navItem} ${styles.navItemActive}`}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
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
            xmlns="http://www.w3.org/2000/svg"
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

        <button type="button" className={styles.navItem}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
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

      {isTaskModalOpen && (
        <div
          className={`${styles.modalOverlay} ${isTaskModalClosing ? styles.modalOverlayClosing : ""}`}
          onClick={closeTaskModal}
        >
          <section
            className={`${styles.modalSheet} ${isTaskModalClosing ? styles.modalSheetClosing : ""}`}
            onClick={(event) => event.stopPropagation()}
            aria-modal="true"
            role="dialog"
            aria-label="Nova Tarefa"
          >
            <div className={styles.modalHandle} aria-hidden="true" />

            <h2 className={styles.modalTitle}>Nova Tarefa</h2>
            <p className={styles.modalSubtitle}>
              Selecione uma categoria para começar.
            </p>

            <div className={styles.modalSearchBox}>
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M21 21L16.65 16.65"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <input
                className={styles.modalSearchInput}
                type="text"
                placeholder="Busque por habilidades (ex: Python,...)"
                value={taskSearch}
                onChange={(event) => setTaskSearch(event.target.value)}
              />
            </div>

            <div
              className={styles.modalTaskList}
              onScroll={handleTaskListScroll}
            >
              {filteredTaskItems.map((task) => (
                <article key={task.id} className={styles.modalTaskCard}>
                  <div className={styles.modalTaskAvatar}>
                    <img src={task.icon} alt="" aria-hidden="true" />
                  </div>

                  <div className={styles.modalTaskTextBlock}>
                    <h3 className={styles.modalTaskTitle}>{task.name}</h3>
                    <p className={styles.modalTaskDescription}>
                      {task.description}
                    </p>
                  </div>

                  <div className={styles.modalTaskChevron} aria-hidden="true">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9 6L15 12L9 18"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </article>
              ))}

              {isLoadingTasks && (
                <p className={styles.modalStatusText}>Carregando tarefas...</p>
              )}

              {!isLoadingTasks && taskListError && (
                <p className={styles.modalStatusText}>{taskListError}</p>
              )}

              {!isLoadingTasks &&
                !taskListError &&
                filteredTaskItems.length === 0 && (
                  <p className={styles.modalStatusText}>
                    Nenhuma tarefa encontrada.
                  </p>
                )}

              {!isLoadingTasks &&
                !taskListError &&
                !hasMoreTasks &&
                taskItems.length > 0 && (
                  <p className={styles.modalStatusText}>
                    Você chegou ao fim da lista.
                  </p>
                )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
