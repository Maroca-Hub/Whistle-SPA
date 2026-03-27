import { useCallback, useEffect, useMemo, useState } from "react";
import { BottomNav } from "../../components/BottomNav/BottomNav";
import {
  tasksService,
  type TaskCandidate,
  type TaskDetails,
} from "../../services/tasks.service";
import styles from "./TaskDetailsPage.module.css";

interface TaskDetailsPageProps {
  taskId: string;
}

function navigate(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function getStatusConfig(status: string | null) {
  if (status === "COMPLETED") {
    return { label: "CONCLUÍDO", className: styles.statusCompleted };
  }

  if (status === "CANCELLED") {
    return { label: "CANCELADO", className: styles.statusCancelled };
  }

  if (status === "IN_PROGRESS") {
    return { label: "EM ANDAMENTO", className: styles.statusInProgress };
  }

  return { label: "PENDENTE", className: styles.statusPending };
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
  const [candidates, setCandidates] = useState<TaskCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReviewed, setIsReviewed] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "complete" | "cancel" | null
  >(null);

  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await tasksService.getTaskDetails(taskId);

        const shouldLoadCandidates = response.status === "PENDING";
        const isReviewed =
          response.reviews &&
          response.reviews.some(
            (review) => review.reviewer_id === response.customer_id,
          );
        const taskCandidates = shouldLoadCandidates
          ? await tasksService.getTaskCandidates(taskId)
          : [];

        if (isMounted) {
          setTask(response);
          setCandidates(taskCandidates);
          setIsReviewed(isReviewed);
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

  const handleCancelTask = useCallback(async () => {
    setIsCancelling(true);
    try {
      await tasksService.cancelTask(taskId);
      setTask((prev) => (prev ? { ...prev, status: "CANCELLED" } : prev));
    } catch {
      // keep current state
    } finally {
      setIsCancelling(false);
    }
  }, [taskId]);

  const handleCompleteTask = useCallback(async () => {
    setIsCompleting(true);
    try {
      await tasksService.completeTask(taskId);
      setTask((prev) => (prev ? { ...prev, status: "COMPLETED" } : prev));
    } catch {
      // keep current state
    } finally {
      setIsCompleting(false);
    }
  }, [taskId]);

  const handleSubmitReview = useCallback(async () => {
    if (reviewRating === 0) {
      setReviewError("Selecione uma nota.");
      return;
    }

    if (reviewComment.length > 0 && reviewComment.length < 20) {
      setReviewError("O comentário precisa ter no mínimo 20 caracteres.");
      return;
    }

    setReviewError(null);
    setIsSubmittingReview(true);

    try {
      const createdReview = await tasksService.createReview(taskId, {
        rating: reviewRating,
        comment: reviewComment,
      });
      setTask((prev) =>
        prev ? { ...prev, reviews: [createdReview, ...prev.reviews] } : prev,
      );
      setIsReviewed(true);
    } catch {
      setReviewError("Erro ao enviar avaliação. Tente novamente.");
    } finally {
      setIsSubmittingReview(false);
    }
  }, [reviewComment, reviewRating, taskId]);
  const status = getStatusConfig(task?.status ?? null);
  const isPendingTask = task?.status === "PENDING";
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
        </header>

        {isLoading && <p className={styles.feedback}>Carregando tarefa...</p>}
        {!isLoading && error && <p className={styles.feedback}>{error}</p>}

        {!isLoading && !error && task && (
          <>
            <section className={styles.summaryCard}>
              <div className={styles.summaryTop}>
                <p className={styles.summaryLabel}>STATUS</p>
                <p className={`${styles.summaryStatus} ${status.className}`}>
                  {status.label}
                </p>
              </div>

              <h2 className={styles.taskTitle}>{task.skill.name}</h2>

              <p className={styles.taskDescription}>{task.description}</p>

              <div className={styles.summaryDivider} />

              <div className={styles.metaGrid}>
                <p className={styles.metaLabel}>DATA</p>
                <p className={styles.metaValue}>
                  {formatDateLabel(task.created_at)}
                </p>
              </div>
            </section>

            {task.candidate ? (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>Profissional</h3>
                  <button
                    type="button"
                    className={styles.chatButton}
                    onClick={() =>
                      task.chat && navigate(`/chat/${task.chat.id}`)
                    }
                  >
                    Abrir Chat
                  </button>
                </div>

                <article className={styles.proCard}>
                  <div className={styles.proInfo}>
                    <div className={styles.proAvatar}>
                      <img
                        src={task.candidate?.profile_picture}
                        alt=""
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <p className={styles.proName}>{candidateName}</p>
                      <p className={styles.proMeta}>
                        ★
                        <span className={styles.proMetaText}>
                          {candidateRating}{" "}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className={styles.priceBlock}>
                    <p className={styles.priceLabel}>VALOR</p>
                    <p className={styles.priceValue}>
                      {formatCurrency(task.candidate?.bid?.amount ?? 0)}
                    </p>
                  </div>
                </article>
              </section>
            ) : (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>Profissional</h3>
                </div>

                <span>Nenhum profissional selecionado.</span>
              </section>
            )}

            {isPendingTask && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Candidatos</h3>

                <div className={styles.candidatesList}>
                  {candidates.map((candidate) => (
                    <article
                      key={candidate.id}
                      className={`${styles.proCard} ${styles.candidateCard}`}
                    >
                      <div className={styles.candidateHeader}>
                        <div className={styles.proInfo}>
                          <div className={styles.proAvatar}>
                            <img
                              src={candidate.profile_picture}
                              alt=""
                              aria-hidden="true"
                            />
                          </div>

                          <div>
                            <p className={styles.proName}>
                              {fullName(
                                candidate.first_name,
                                candidate.last_name,
                              )}
                            </p>
                            <p className={styles.proMeta}>
                              ★ {Number(candidate.rating ?? 0).toFixed(1)}
                            </p>
                          </div>
                        </div>

                        <div className={styles.priceBlock}>
                          <p className={styles.priceLabel}>VALOR</p>
                          <p className={styles.priceValue}>
                            {formatCurrency(candidate.bid?.amount ?? 0)}
                          </p>
                        </div>
                      </div>

                      <div className={styles.candidateActions}>
                        <button type="button" className={styles.rejectButton}>
                          Rejeitar
                        </button>
                        <button type="button" className={styles.acceptButton}>
                          Aceitar
                        </button>
                      </div>
                    </article>
                  ))}

                  {candidates.length === 0 && (
                    <p className={styles.feedback}>
                      Nenhum candidato no momento.
                    </p>
                  )}
                </div>
              </section>
            )}

            {task.status === "COMPLETED" && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Avaliações</h3>

                {task.reviews.map((rev) => {
                  const isCustomerReview = rev.reviewer_id === task.customer_id;
                  const reviewerName = isCustomerReview
                    ? fullName(
                        task.customer.first_name,
                        task.customer.last_name,
                      )
                    : task.candidate
                      ? fullName(
                          task.candidate.first_name,
                          task.candidate.last_name,
                        )
                      : "Profissional";

                  return (
                    <article key={rev.id} className={styles.reviewCard}>
                      <div className={styles.reviewCardHeader}>
                        <p className={styles.reviewerName}>{reviewerName}</p>
                        <p className={styles.reviewerRole}>
                          {isCustomerReview ? "Cliente" : "Profissional"}
                        </p>
                      </div>

                      <div className={styles.reviewStarsDisplay}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <span
                            key={n}
                            className={
                              n <= rev.rating
                                ? styles.starFilled
                                : styles.starEmpty
                            }
                          >
                            ★
                          </span>
                        ))}
                      </div>

                      <p className={styles.reviewDate}>
                        {formatDateLabel(rev.created_at)}
                      </p>

                      {rev.comment && (
                        <p className={styles.reviewExistingComment}>
                          {rev.comment}
                        </p>
                      )}
                    </article>
                  );
                })}

                {!isReviewed && (
                  <article className={styles.reviewCard}>
                    <p className={styles.reviewHint}>
                      Como foi sua experiência com{" "}
                      {task.candidate
                        ? fullName(
                            task.candidate.first_name,
                            task.candidate.last_name,
                          )
                        : "o profissional"}
                      ?
                    </p>

                    <div className={styles.starsInteractive}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          aria-label={`${n} estrelas`}
                          className={
                            n <= (reviewHover || reviewRating)
                              ? styles.starFilled
                              : styles.starEmpty
                          }
                          onClick={() => setReviewRating(n)}
                          onMouseEnter={() => setReviewHover(n)}
                          onMouseLeave={() => setReviewHover(0)}
                        >
                          ★
                        </button>
                      ))}
                    </div>

                    <textarea
                      className={styles.reviewInput}
                      placeholder="Conte-nos o que achou do serviço prestado..."
                      value={reviewComment}
                      maxLength={500}
                      onChange={(e) => setReviewComment(e.target.value)}
                    />

                    {reviewError && (
                      <p className={styles.reviewError}>{reviewError}</p>
                    )}

                    <button
                      type="button"
                      className={styles.submitReviewButton}
                      disabled={isSubmittingReview}
                      onClick={handleSubmitReview}
                    >
                      {isSubmittingReview ? "Enviando..." : "Enviar Avaliação"}
                    </button>
                  </article>
                )}
              </section>
            )}

            <div className={styles.separator} />

            <div className={styles.taskButtons}>
              {task.status === "IN_PROGRESS" && (
                <>
                  <button
                    type="button"
                    className={styles.completeButton}
                    disabled={isCompleting}
                    onClick={() => setConfirmAction("complete")}
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M20 6L9 17L4 12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {isCompleting ? "Concluindo..." : "Concluir tarefa"}
                  </button>
                </>
              )}

              {task.status !== "COMPLETED" && task.status !== "CANCELLED" && (
                <>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    disabled={isCancelling}
                    onClick={() => setConfirmAction("cancel")}
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M18 6L6 18M6 6L18 18"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {isCancelling ? "Cancelando..." : "Cancelar tarefa"}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </section>

      {confirmAction && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <p className={styles.modalMessage}>
              {confirmAction === "complete"
                ? "Você quer mesmo concluir essa tarefa?"
                : "Você quer mesmo cancelar essa tarefa?"}
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCancelButton}
                onClick={() => setConfirmAction(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.modalConfirmButton}
                disabled={isCancelling || isCompleting}
                onClick={() => {
                  if (confirmAction === "complete") handleCompleteTask();
                  else handleCancelTask();
                  setConfirmAction(null);
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav active="tasks" />
    </main>
  );
}
