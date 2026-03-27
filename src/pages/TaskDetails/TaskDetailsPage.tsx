import { useEffect, useMemo, useState } from "react";
import { BottomNav } from "../../components/BottomNav/BottomNav";
import {
  tasksService,
  type TaskDetails,
  type TaskStatus,
} from "../../services/tasks.service";
import styles from "./TaskDetailsPage.module.css";

interface TaskDetailsPageProps {
  taskId: string;
}

function navigate(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function getStatusLabel(status: TaskStatus): string {
  if (status === "IN_PROGRESS") return "EM ANDAMENTO";
  if (status === "COMPLETED") return "CONCLUÍDO";
  if (status === "CANCELLED") return "CANCELADO";
  return "PENDENTE";
}

function formatDateLabel(isoDate: string): string {
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("pt-BR", { month: "long" });
  const year = date.getFullYear();
  return `${day} ${month}, ${year}`;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function fullName(firstName?: string, lastName?: string): string {
  return [firstName, lastName].filter(Boolean).join(" ").trim();
}

export function TaskDetailsPage({ taskId }: TaskDetailsPageProps) {
  const [task, setTask] = useState<TaskDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await tasksService.getTaskDetails(taskId);
        if (isMounted) {
          setTask(response);
        }
      } catch {
        if (isMounted) {
          setError("Não foi possível carregar os detalhes da tarefa.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [taskId]);

  const review = task?.reviews?.[0] ?? null;
  const statusLabel = task ? getStatusLabel(task.status) : "-";
  const candidateName = task?.candidate
    ? fullName(task.candidate.first_name, task.candidate.last_name)
    : "Aguardando profissional";

  const candidateRating = useMemo(() => {
    if (task?.candidate?.rating) {
      return Number(task.candidate.rating).toFixed(1);
    }

    return "-";
  }, [task]);

  return (
    <main className={styles.container}>
      <section className={styles.panel}>
        <header className={styles.header}>
          <button
            type="button"
            className={styles.headerIconButton}
            aria-label="Voltar"
            onClick={() => navigate("/tasks")}
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
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <h1 className={styles.headerTitle}>Detalhes da Tarefa</h1>

          <button
            type="button"
            className={styles.headerIconButton}
            aria-label="Mais opções"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="12" cy="5" r="1.6" fill="currentColor" />
              <circle cx="12" cy="12" r="1.6" fill="currentColor" />
              <circle cx="12" cy="19" r="1.6" fill="currentColor" />
            </svg>
          </button>
        </header>

        {isLoading && <p className={styles.feedback}>Carregando tarefa...</p>}
        {!isLoading && error && <p className={styles.feedback}>{error}</p>}

        {!isLoading && !error && task && (
          <>
            <section className={styles.summaryCard}>
              <div className={styles.summaryTop}>
                <div>
                  <p className={styles.summaryLabel}>STATUS ATUAL</p>
                  <p className={styles.summaryStatus}>{statusLabel}</p>
                </div>

                <div className={styles.idChip}>
                  <p className={styles.idLabel}>ID:</p>
                  <p className={styles.idValue}>#{task.id.slice(0, 6)}</p>
                </div>
              </div>

              <h2 className={styles.taskTitle}>{task.skill.name}</h2>

              <div className={styles.professionTag}>
                {task.skill.name} Profissional
              </div>

              <p className={styles.taskDescription}>{task.description}</p>

              <div className={styles.summaryDivider} />

              <div className={styles.metaGrid}>
                <div>
                  <p className={styles.metaLabel}>DATA</p>
                  <p className={styles.metaValue}>
                    {formatDateLabel(task.created_at)}
                  </p>
                </div>
                <div>
                  <p className={styles.metaLabel}>LOCAL</p>
                  <p className={styles.metaValue}>
                    Lat {task.latitude.toFixed(2)}, Lng{" "}
                    {task.longitude.toFixed(2)}
                  </p>
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Profissional</h3>
                <button type="button" className={styles.chatButton}>
                  Abrir Chat
                </button>
              </div>

              <article className={styles.proCard}>
                <div className={styles.proInfo}>
                  <div className={styles.proAvatar}>
                    <img
                      src={
                        task.candidate?.profile_picture ||
                        task.customer.profile_picture ||
                        ""
                      }
                      alt=""
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <p className={styles.proName}>{candidateName}</p>
                    <p className={styles.proMeta}>★ {candidateRating}</p>
                  </div>
                </div>

                <div className={styles.priceBlock}>
                  <p className={styles.priceLabel}>VALOR ACORDADO</p>
                  <p className={styles.priceValue}>
                    {formatCurrency(task.candidate?.bid?.amount ?? 0)}
                  </p>
                </div>
              </article>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Avaliar Serviço</h3>
              <article className={styles.reviewCard}>
                {review ? (
                  <>
                    <p className={styles.reviewText}>
                      Comentário: {review.comment}
                    </p>
                    <p className={styles.reviewText}>
                      Nota: {review.rating} / 5
                    </p>
                  </>
                ) : (
                  <>
                    <p className={styles.reviewHint}>
                      Como foi sua experiência com o profissional?
                    </p>
                    <div className={styles.stars} aria-hidden="true">
                      <span>★</span>
                      <span>★</span>
                      <span>★</span>
                      <span>★</span>
                      <span>★</span>
                    </div>
                    <textarea
                      className={styles.reviewInput}
                      placeholder="Conte-nos o que achou do serviço prestado..."
                    />
                    <button type="button" className={styles.submitReviewButton}>
                      Enviar Avaliação
                    </button>
                  </>
                )}
              </article>
            </section>

            <div className={styles.actions}>
              <button type="button" className={styles.completeButton}>
                Concluir tarefa
              </button>
              <button type="button" className={styles.cancelButton}>
                Cancelar tarefa
              </button>
            </div>
          </>
        )}
      </section>

      <BottomNav active="tasks" />
    </main>
  );
}
