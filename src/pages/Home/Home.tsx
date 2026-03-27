import { useCallback, useEffect, useMemo, useState, type UIEvent } from "react";
import styles from "./Home.module.css";
import { useUser } from "../../hooks/useUser";
import { skillsService, type Skill } from "../../services/skills.service";
import { tasksService, type CustomerTask } from "../../services/tasks.service";
import { AppHeader } from "../../components/AppHeader/AppHeader";
import { BottomNav } from "../../components/BottomNav/BottomNav";

const SKILL_LIST_SIZE = 20;

function navigate(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function Home() {
  const { user, loadUser } = useUser();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [activeTask, setActiveTask] = useState<CustomerTask | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isTaskModalClosing, setIsTaskModalClosing] = useState(false);
  const [skillItems, setSkillItems] = useState<Skill[]>([]);
  const [skillPage, setSkillPage] = useState(1);
  const [hasMoreSkills, setHasMoreSkills] = useState(true);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [skillListError, setSkillListError] = useState<string | null>(null);
  const [skillSearch, setSkillSearch] = useState("");
  const [debouncedSkillSearch, setDebouncedSkillSearch] = useState("");

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

  const loadSkillPage = useCallback(async (page: number, reset = false) => {
    setIsLoadingSkills(true);
    setSkillListError(null);

    try {
      const response = await skillsService.getTopSkills(page, SKILL_LIST_SIZE);

      setSkillItems((prev) => (reset ? response : [...prev, ...response]));
      setSkillPage(page);
      setHasMoreSkills(response.length >= SKILL_LIST_SIZE);
    } catch {
      setSkillListError("Erro ao carregar tarefas.");
    } finally {
      setIsLoadingSkills(false);
    }
  }, []);

  useEffect(() => {
    loadUser();

    tasksService
      .getCustomerTasks(1, 1, ["PENDING", "IN_PROGRESS"])
      .then((tasks) => {
        setActiveTask(tasks[0] ?? null);
      })
      .catch(() => {
        setActiveTask(null);
      });

    skillsService
      .getTopSkills()
      .then(setSkills)
      .catch(() => {});
  }, [loadUser]);

  useEffect(() => {
    if (!isTaskModalOpen) {
      return;
    }

    loadSkillPage(1, true);
    setSkillSearch("");
    setDebouncedSkillSearch("");

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
  }, [isTaskModalOpen, loadSkillPage, closeTaskModal]);

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

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSkillSearch(skillSearch);
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [skillSearch]);

  const filteredSkillItems = useMemo(() => {
    if (!debouncedSkillSearch.trim()) {
      return skillItems;
    }

    const normalized = debouncedSkillSearch.toLowerCase();

    return skillItems.filter(
      (item) =>
        item.name.toLowerCase().includes(normalized) ||
        item.description.toLowerCase().includes(normalized),
    );
  }, [debouncedSkillSearch, skillItems]);

  const handleSkillListScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget;
      const threshold = 48;
      const reachedBottom =
        target.scrollTop + target.clientHeight >=
        target.scrollHeight - threshold;

      if (!reachedBottom || isLoadingSkills || !hasMoreSkills) {
        return;
      }

      loadSkillPage(skillPage + 1);
    },
    [hasMoreSkills, isLoadingSkills, loadSkillPage, skillPage],
  );

  return (
    <main className={styles.container}>
      <section className={styles.panel}>
        <AppHeader firstName={user?.first_name} />

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

        {activeTask && (
          <section className={styles.activeTaskSection}>
            <h2 className={styles.sectionTitle}>Tarefa ativa</h2>

            <article className={styles.taskCard}>
              <div className={styles.taskCardLeft}>
                <div className={styles.taskIcon} aria-hidden="true">
                  <img src={activeTask.skill.icon} alt="" />
                </div>
              </div>

              <div className={styles.taskCardContent}>
                <div className={styles.taskCardHeader}>
                  <h3 className={styles.taskTitle}>{activeTask.skill.name}</h3>
                  <span className={styles.taskBadge}>
                    {activeTask.status === "IN_PROGRESS"
                      ? "EM ANDAMENTO"
                      : "ABERTO"}
                  </span>
                </div>

                {activeTask.status === "PENDING" ? (
                  <div className={styles.taskProposals}>
                    <button type="button" className={styles.proposalsLink}>
                      <span className={styles.proposalsCount}>
                        {activeTask.pending_bids_count} proposta
                        {activeTask.pending_bids_count === 1 ? "" : "s"}
                      </span>
                      <span className={styles.proposalsText}>recebidas</span>
                    </button>
                  </div>
                ) : (
                  <p className={styles.taskDescription}>
                    Acompanhe o progresso e comunique-se com o prestador de
                    serviço para garantir os melhores resultados.
                  </p>
                )}

                <button
                  type="button"
                  className={styles.taskLink}
                  onClick={() => navigate(`/tasks/${activeTask.id}`)}
                >
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
        )}

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

      <BottomNav active="home" />

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

            <h2 className={styles.modalTitle}>Nova tarefa</h2>
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
                placeholder="Busque por serviços"
                value={skillSearch}
                onChange={(event) => setSkillSearch(event.target.value)}
              />
            </div>

            <div
              className={styles.modalTaskList}
              onScroll={handleSkillListScroll}
            >
              {filteredSkillItems.map((task) => (
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

              {isLoadingSkills && (
                <p className={styles.modalStatusText}>Carregando tarefas...</p>
              )}

              {!isLoadingSkills && skillListError && (
                <p className={styles.modalStatusText}>{skillListError}</p>
              )}

              {!isLoadingSkills &&
                !skillListError &&
                filteredSkillItems.length === 0 && (
                  <p className={styles.modalStatusText}>
                    Nenhuma tarefa encontrada.
                  </p>
                )}

              {!isLoadingSkills &&
                !skillListError &&
                !hasMoreSkills &&
                skillItems.length > 0 && (
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
