import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type UIEvent,
} from "react";
import styles from "./Home.module.css";
import { useUser } from "../../hooks/useUser";
import { ApiError } from "../../services/api";
import { skillsService, type Skill } from "../../services/skills.service";
import { tasksService, type CustomerTask } from "../../services/tasks.service";
import { AppHeader } from "../../components/AppHeader/AppHeader";
import { BottomNav } from "../../components/BottomNav/BottomNav";
import { getStatusConfig } from "../../utils/statusHelper";

const SKILL_LIST_SIZE = 20;

function navigate(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function Home() {
  const { user, loadUser } = useUser();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [suggestionSkills, setSuggestionSkills] = useState<Skill[]>([]);
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
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [description, setDescription] = useState("");
  const [customerHasResources, setCustomerHasResources] = useState(false);
  const [taskImage, setTaskImage] = useState<File | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [createTaskError, setCreateTaskError] = useState<string | null>(null);
  const skipNextSearchEffectRef = useRef(false);

  const openTaskModal = useCallback(() => {
    setIsTaskModalClosing(false);
    setIsTaskModalOpen(true);
    setSelectedSkill(null);
    setDescription("");
    setCustomerHasResources(false);
    setTaskImage(null);
    setCreateTaskError(null);
  }, []);

  const openTaskModalWithSkill = useCallback((skill: Skill) => {
    setIsTaskModalClosing(false);
    setIsTaskModalOpen(true);
    setSelectedSkill(skill);
    setDescription("");
    setCustomerHasResources(false);
    setTaskImage(null);
    setCreateTaskError(null);
  }, []);

  const closeTaskModal = useCallback(() => {
    if (!isTaskModalOpen || isCreatingTask) {
      return;
    }

    setIsTaskModalClosing(true);
  }, [isCreatingTask, isTaskModalOpen]);

  const loadSkillPage = useCallback(
    async (page: number, reset = false, search = "") => {
      setIsLoadingSkills(true);
      setSkillListError(null);

      try {
        const response = await skillsService.getTopSkills(
          page,
          SKILL_LIST_SIZE,
          search,
        );

        setSkillItems((prev) => (reset ? response : [...prev, ...response]));
        setSkillPage(page);
        setHasMoreSkills(response.length >= SKILL_LIST_SIZE);
      } catch {
        setSkillListError("Erro ao carregar tarefas.");
      } finally {
        setIsLoadingSkills(false);
      }
    },
    [],
  );

  const loadActiveTask = useCallback(() => {
    tasksService
      .getCustomerTasks(1, 1, ["PENDING", "IN_PROGRESS"])
      .then((tasks) => {
        setActiveTask(tasks[0] ?? null);
      })
      .catch(() => {
        setActiveTask(null);
      });
  }, []);

  useEffect(() => {
    loadUser();
    loadActiveTask();

    skillsService
      .getTopSkills(1, 5, undefined, true)
      .then(setSkills)
      .catch(() => {});
  }, [loadActiveTask, loadUser]);

  useEffect(() => {
    const loadSuggestionsSkills = async () => {
      try {
        const STORAGE_KEY = "suggestionSkills";
        const TIMESTAMP_KEY = "suggestionSkillsTimestamp";
        const ONE_DAY_MS = 24 * 60 * 60 * 1000;

        const now = Date.now();
        const lastUpdate = localStorage.getItem(TIMESTAMP_KEY);
        const savedSkillIds = localStorage.getItem(STORAGE_KEY);

        if (
          lastUpdate &&
          savedSkillIds &&
          now - parseInt(lastUpdate) < ONE_DAY_MS
        ) {
          const skillIds = JSON.parse(savedSkillIds) as string[];
          const allSkills = await skillsService.getTopSkills(1, 100);
          const matched = allSkills.filter((s) => skillIds.includes(s.id));
          if (matched.length > 0) {
            setSuggestionSkills(matched);
            return;
          }
        }

        const randomPage = Math.floor(Math.random() * 8) + 1;
        const pageSkills = await skillsService.getTopSkills(randomPage, 5);

        if (pageSkills.length === 0) {
          return;
        }

        const shuffled = [...pageSkills].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, 3);

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(selected.map((s) => s.id)),
        );
        localStorage.setItem(TIMESTAMP_KEY, String(now));
        setSuggestionSkills(selected);
      } catch {
        // silently fail, suggestions are optional
      }
    };

    loadSuggestionsSkills();
  }, []);

  useEffect(() => {
    if (!isTaskModalOpen) {
      return;
    }

    setSkillSearch("");
    setDebouncedSkillSearch("");
    skipNextSearchEffectRef.current = true;
    loadSkillPage(1, true, "");

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

  useEffect(() => {
    if (!isTaskModalOpen) {
      return;
    }

    if (skipNextSearchEffectRef.current) {
      skipNextSearchEffectRef.current = false;
      return;
    }

    loadSkillPage(1, true, debouncedSkillSearch);
  }, [debouncedSkillSearch, isTaskModalOpen, loadSkillPage]);

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

      loadSkillPage(skillPage + 1, false, debouncedSkillSearch);
    },
    [
      debouncedSkillSearch,
      hasMoreSkills,
      isLoadingSkills,
      loadSkillPage,
      skillPage,
    ],
  );

  const handleTaskImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setTaskImage(file);
  };

  const requestCurrentLocation = useCallback(async () => {
    setCreateTaskError(null);
    setIsRequestingLocation(true);

    try {
      if ("permissions" in navigator && navigator.permissions?.query) {
        const permissionStatus = await navigator.permissions.query({
          name: "geolocation",
        });

        if (permissionStatus.state === "denied") {
          throw new Error("GEOLOCATION_PERMISSION_BLOCKED");
        }
      }

      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error("Geolocalizacao indisponivel"));
            return;
          }

          navigator.geolocation.getCurrentPosition(
            resolve,
            (error) => {
              if (error.code === error.PERMISSION_DENIED) {
                reject(new Error("GEOLOCATION_PERMISSION_DENIED"));
                return;
              }

              if (error.code === error.TIMEOUT) {
                reject(new Error("GEOLOCATION_TIMEOUT"));
                return;
              }

              reject(new Error("GEOLOCATION_UNAVAILABLE"));
            },
            {
              enableHighAccuracy: true,
              timeout: 8000,
              maximumAge: 60000,
            },
          );
        },
      );

      return position;
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === "GEOLOCATION_PERMISSION_DENIED" ||
          error.message === "GEOLOCATION_PERMISSION_BLOCKED"
        ) {
          setCreateTaskError(
            "Para criar a demanda, voce precisa liberar o uso da localizacao nas permissoes do navegador.",
          );
        } else if (error.message === "GEOLOCATION_TIMEOUT") {
          setCreateTaskError(
            "Nao foi possivel obter sua localizacao a tempo. Tente novamente.",
          );
        } else if (
          error.message === "GEOLOCATION_UNAVAILABLE" ||
          error.message === "Geolocalizacao indisponivel"
        ) {
          setCreateTaskError("Seu navegador nao oferece geolocalizacao.");
        } else {
          setCreateTaskError(error.message);
        }
      } else {
        setCreateTaskError("Nao foi possivel obter sua localizacao.");
      }

      return null;
    } finally {
      setIsRequestingLocation(false);
    }
  }, []);

  const handleCreateTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedSkill || isCreatingTask) {
      return;
    }

    const trimmedDescription = description.trim();

    if (!trimmedDescription) {
      setCreateTaskError("Descreva a tarefa para continuar.");
      return;
    }

    if (trimmedDescription.length < 20) {
      setCreateTaskError(
        "A descricao da tarefa deve ter no minimo 20 caracteres.",
      );
      return;
    }

    if (trimmedDescription.length > 255) {
      setCreateTaskError(
        "A descricao da tarefa deve ter no maximo 255 caracteres.",
      );
      return;
    }

    setCreateTaskError(null);
    setIsCreatingTask(true);

    try {
      const position = await requestCurrentLocation();

      if (!position) {
        return;
      }

      const createdTask = await tasksService.createTask({
        skillId: selectedSkill.id,
        description: trimmedDescription,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        customerHasResources,
        image: taskImage ?? undefined,
      });

      navigate(`/tasks/${createdTask.id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          setCreateTaskError("Servico nao encontrado.");
        } else if (error.status === 409) {
          setCreateTaskError(
            "Voce ja possui uma tarefa em andamento. Finalize-a antes de criar outra.",
          );
        } else if (error.status === 422) {
          setCreateTaskError("Este servico nao esta disponivel no momento.");
        } else {
          setCreateTaskError("Erro ao criar tarefa. Tente novamente.");
        }
      } else if (error instanceof Error) {
        setCreateTaskError(error.message);
      } else {
        setCreateTaskError("Erro ao criar tarefa.");
      }
    } finally {
      setIsCreatingTask(false);
    }
  };

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
              <button
                key={skill.id}
                type="button"
                className={styles.skillChip}
                onClick={() => openTaskModalWithSkill(skill)}
              >
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
                  {(() => {
                    const status = getStatusConfig(activeTask.status);
                    const statusClassName = {
                      pending: styles.statusPending,
                      inProgress: styles.statusInProgress,
                      completed: styles.statusCompleted,
                      cancelled: styles.statusCancelled,
                    }[status.statusClass];
                    return (
                      <span
                        className={`${styles.taskBadge} ${statusClassName}`}
                      >
                        {status.label}
                      </span>
                    );
                  })()}
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

        {suggestionSkills.length > 0 && (
          <section className={styles.suggestionsSection}>
            <h2 className={styles.sectionTitle}>Sugestões para você</h2>

            <div className={styles.suggestionsGrid}>
              {suggestionSkills.map((skill) => (
                <button
                  key={skill.id}
                  type="button"
                  className={styles.suggestionCard}
                  onClick={() => openTaskModalWithSkill(skill)}
                >
                  <div className={styles.suggestionIcon} aria-hidden="true">
                    <img
                      src={skill.icon}
                      alt=""
                      style={{ width: "20px", height: "20px" }}
                    />
                  </div>
                  <h3 className={styles.suggestionTitle}>{skill.name}</h3>
                  <p className={styles.suggestionDescription}>
                    {skill.description}
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}
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

            {!selectedSkill ? (
              <>
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
                  {skillItems.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      className={styles.modalTaskCard}
                      onClick={() => {
                        setSelectedSkill(task);
                        setCreateTaskError(null);
                      }}
                    >
                      <div className={styles.modalTaskAvatar}>
                        <img src={task.icon} alt="" aria-hidden="true" />
                      </div>

                      <div className={styles.modalTaskTextBlock}>
                        <h3 className={styles.modalTaskTitle}>{task.name}</h3>
                        <p className={styles.modalTaskDescription}>
                          {task.description}
                        </p>
                      </div>

                      <div
                        className={styles.modalTaskChevron}
                        aria-hidden="true"
                      >
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
                    </button>
                  ))}

                  {isLoadingSkills && (
                    <p className={styles.modalStatusText}>
                      Carregando tarefas...
                    </p>
                  )}

                  {!isLoadingSkills && skillListError && (
                    <p className={styles.modalStatusText}>{skillListError}</p>
                  )}

                  {!isLoadingSkills &&
                    !skillListError &&
                    skillItems.length === 0 && (
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
              </>
            ) : (
              <>
                <div className={styles.modalFormHeader}>
                  <button
                    type="button"
                    className={styles.modalBackButton}
                    onClick={() => {
                      setSelectedSkill(null);
                      setCreateTaskError(null);
                    }}
                    disabled={isCreatingTask}
                    aria-label="Voltar"
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M15 18L9 12L15 6"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  <h2 className={styles.modalFormTitle}>O que você precisa?</h2>
                  <div
                    className={styles.modalHeaderSpacer}
                    aria-hidden="true"
                  />
                </div>

                <article className={styles.modalSelectedSkillCard}>
                  <div className={styles.modalTaskAvatar}>
                    <img src={selectedSkill.icon} alt="" aria-hidden="true" />
                  </div>
                  <div className={styles.modalTaskTextBlock}>
                    <h3 className={styles.modalTaskTitle}>
                      {selectedSkill.name}
                    </h3>
                    <p className={styles.modalTaskDescription}>
                      {selectedSkill.description}
                    </p>
                  </div>
                </article>

                <form className={styles.modalForm} onSubmit={handleCreateTask}>
                  <label
                    className={styles.modalFieldLabel}
                    htmlFor="description"
                  >
                    Descricao da tarefa *
                  </label>
                  <textarea
                    id="description"
                    className={styles.modalTextarea}
                    placeholder="Descreva detalhadamente o que precisa ser feito..."
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    maxLength={255}
                    disabled={isCreatingTask}
                  />

                  <p className={styles.modalFieldHint}>
                    {description.trim().length}/255 caracteres
                  </p>

                  <label
                    className={styles.modalCheckboxRow}
                    htmlFor="hasResources"
                  >
                    <input
                      id="hasResources"
                      type="checkbox"
                      checked={customerHasResources}
                      onChange={(event) =>
                        setCustomerHasResources(event.target.checked)
                      }
                      disabled={isCreatingTask}
                    />
                    Tenho o material necessario para a tarefa
                  </label>

                  <label className={styles.modalFieldLabel} htmlFor="image">
                    Imagem (opcional)
                  </label>
                  <input
                    id="image"
                    type="file"
                    accept="image/*"
                    className={styles.modalFileInput}
                    onChange={handleTaskImageChange}
                    disabled={isCreatingTask}
                  />

                  {taskImage && (
                    <p className={styles.modalImageName}>{taskImage.name}</p>
                  )}

                  <div className={styles.modalInfoBox}>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" fill="currentColor" />
                      <path
                        d="M12 8.2V8.4"
                        stroke="#ffffff"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M12 11V15.6"
                        stroke="#ffffff"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    <p>
                      Iremos procurar profissionais qualificados em sua regiao.
                    </p>
                  </div>

                  {createTaskError && (
                    <p className={styles.modalFormError}>{createTaskError}</p>
                  )}

                  <button
                    type="submit"
                    className={styles.modalSubmitButton}
                    disabled={isCreatingTask || isRequestingLocation}
                  >
                    {isCreatingTask ? "Criando..." : "Criar tarefa"}
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
