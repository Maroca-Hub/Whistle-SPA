import { useCallback, useEffect, useMemo, useState } from "react";
import { BottomNav } from "../../components/BottomNav/BottomNav";
import { chatsService } from "../../services/chats.service";
import {
  tasksService,
  type TaskBidSummary,
  type TaskDetails,
} from "../../services/tasks.service";
import { wsService } from "../../services/ws.service";
import { useUser } from "../../hooks/useUser";
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseIncomingBid(data: unknown): TaskBidSummary | null {
  if (!isRecord(data)) {
    return null;
  }

  if (
    typeof data.id === "string" &&
    typeof data.task_id === "string" &&
    typeof data.executor_id === "string" &&
    typeof data.amount === "number" &&
    isRecord(data.candidate)
  ) {
    return data as unknown as TaskBidSummary;
  }

  if (
    typeof data.id === "string" &&
    typeof data.executor_id === "string" &&
    isRecord(data.bid) &&
    typeof data.bid.id === "string" &&
    typeof data.bid.task_id === "string" &&
    typeof data.bid.amount === "number"
  ) {
    const candidateRating =
      typeof data.rating === "number"
        ? data.rating
        : typeof data.rating === "string"
          ? Number(data.rating)
          : null;

    return {
      id: data.bid.id,
      task_id: data.bid.task_id,
      executor_id: data.executor_id,
      amount: data.bid.amount,
      status: typeof data.bid.status === "string" ? data.bid.status : "PENDING",
      candidate_rating: Number.isFinite(candidateRating)
        ? candidateRating
        : null,
      candidate: {
        id: data.id,
        email: typeof data.email === "string" ? data.email : "",
        first_name: typeof data.first_name === "string" ? data.first_name : "",
        last_name: typeof data.last_name === "string" ? data.last_name : "",
        profile_picture:
          typeof data.profile_picture === "string"
            ? data.profile_picture
            : undefined,
        rating:
          typeof candidateRating === "number" ? candidateRating : undefined,
        created_at: typeof data.created_at === "string" ? data.created_at : "",
        updated_at:
          typeof data.updated_at === "string" ? data.updated_at : null,
      },
      created_at:
        typeof data.bid.created_at === "string" ? data.bid.created_at : "",
      updated_at:
        typeof data.bid.updated_at === "string" ? data.bid.updated_at : null,
    };
  }

  return null;
}

function parseCanceledBid(
  data: unknown,
): { id: string; task_id?: string } | null {
  if (!isRecord(data) || typeof data.id !== "string") {
    return null;
  }

  return {
    id: data.id,
    task_id: typeof data.task_id === "string" ? data.task_id : undefined,
  };
}

export function TaskDetailsPage({ taskId }: TaskDetailsPageProps) {
  const { user } = useUser();
  const [task, setTask] = useState<TaskDetails | null>(null);
  const [bids, setBids] = useState<TaskBidSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReviewed, setIsReviewed] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "complete" | "cancel" | null
  >(null);
  const [confirmBidAction, setConfirmBidAction] = useState<{
    type: "accept" | "reject";
    bid: TaskBidSummary;
  } | null>(null);
  const [isProcessingBid, setIsProcessingBid] = useState(false);

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

        const shouldLoadBids = response.status === "PENDING";
        const isReviewed =
          response.reviews &&
          response.reviews.some(
            (review) => review.reviewer_id === response.customer_id,
          );
        const taskBids = shouldLoadBids
          ? await tasksService.getTaskBids(taskId, user?.id)
          : [];

        if (isMounted) {
          setTask(response);
          setBids(taskBids);
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
  }, [taskId, user?.id]);

  useEffect(() => {
    wsService.connect();

    const subscribe = wsService.onMessage((event) => {
      try {
        const parsed = JSON.parse(event.data);

        if (parsed.type === "TASK_BIDDED") {
          const incomingBid = parseIncomingBid(parsed.data);

          if (!incomingBid || incomingBid.task_id !== taskId) {
            return;
          }

          setBids((prev) => {
            const existingIds = new Set(prev.map((bid) => bid.id));
            if (existingIds.has(incomingBid.id)) return prev;
            return [...prev, incomingBid];
          });

          return;
        }

        if (parsed.type === "BID_CANCELED") {
          const canceledBid = parseCanceledBid(parsed.data);

          if (
            !canceledBid ||
            (canceledBid.task_id && canceledBid.task_id !== taskId)
          ) {
            return;
          }

          setBids((prev) => prev.filter((bid) => bid.id !== canceledBid.id));
          setConfirmBidAction((prev) =>
            prev?.bid.id === canceledBid.id ? null : prev,
          );
        }
      } catch (err) {
        console.error("Erro ao processar mensagem do websocket:", err);
      }
    });

    return () => {
      subscribe();
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

  const handleAwardBid = useCallback(
    async (bid: TaskBidSummary) => {
      setIsProcessingBid(true);
      try {
        await tasksService.awardBid(taskId, bid.id);
        const updated = await tasksService.getTaskDetails(taskId);
        const isReviewed =
          updated.reviews &&
          updated.reviews.some(
            (review) => review.reviewer_id === updated.customer_id,
          );
        setTask(updated);
        setBids([]);
        setIsReviewed(isReviewed);
      } catch {
        // keep current state
      } finally {
        setIsProcessingBid(false);
      }
    },
    [taskId],
  );

  const handleDeclineBid = useCallback(
    async (bid: TaskBidSummary) => {
      setIsProcessingBid(true);
      try {
        await tasksService.declineBid(taskId, bid.id);
        setBids((prev) =>
          prev.filter((currentBid) => currentBid.id !== bid.id),
        );
      } catch {
        // keep current state
      } finally {
        setIsProcessingBid(false);
      }
    },
    [taskId],
  );

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
  const selectedProfessional = task?.bid?.candidate ?? task?.candidate ?? null;
  const selectedProfessionalBidAmount =
    task?.bid?.amount ?? task?.candidate?.bid?.amount ?? 0;
  const selectedProfessionalRating =
    task?.bid?.candidate_rating ?? task?.candidate?.rating ?? null;
  const candidateName = selectedProfessional
    ? fullName(selectedProfessional.first_name, selectedProfessional.last_name)
    : "Aguardando profissional";

  const candidateRating = useMemo(() => {
    if (
      selectedProfessionalRating !== null &&
      selectedProfessionalRating !== undefined
    ) {
      return Number(selectedProfessionalRating).toFixed(1);
    }

    return "-";
  }, [selectedProfessionalRating]);

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

              <div className={styles.summaryMetaBlock}>
                <div className={styles.metaGrid}>
                  <p className={styles.metaLabel}>DATA</p>
                  <p className={styles.metaValue}>
                    {formatDateLabel(task.created_at)}
                  </p>
                </div>

                <div className={styles.metaGrid}>
                  <p className={styles.metaLabel}>MATERIAL</p>
                  <p className={styles.metaValue}>
                    {task.customer_has_resources
                      ? "Cliente possui material"
                      : "Cliente não possui material"}
                  </p>
                </div>
              </div>

              {task.image && (
                <>
                  <div className={styles.summaryDivider} />
                  <div className={styles.demandImageBlock}>
                    <p className={styles.metaLabel}>IMAGEM DA TAREFA</p>
                    <img
                      src={task.image}
                      alt="Imagem da tarefa"
                      className={styles.demandImage}
                    />
                  </div>
                </>
              )}
            </section>

            {task.chat || task.status === "IN_PROGRESS" ? (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>Profissional</h3>
                  <button
                    type="button"
                    className={styles.chatButton}
                    onClick={async () => {
                      if (task.chat) {
                        navigate(`/chat/${task.chat.id}`);
                      } else {
                        try {
                          const chat = await chatsService.createChat(task.id);
                          setTask((prev) => (prev ? { ...prev, chat } : prev));
                          navigate(`/chat/${chat.id}`);
                        } catch {
                          // keep current state
                        }
                      }
                    }}
                  >
                    Abrir Chat
                  </button>
                </div>

                <article className={styles.proCard}>
                  <button
                    type="button"
                    className={styles.proInfo}
                    onClick={() =>
                      selectedProfessional &&
                      navigate(`/executor/${selectedProfessional.id}`)
                    }
                  >
                    <div className={styles.proAvatar}>
                      <img
                        src={selectedProfessional?.profile_picture}
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
                  </button>

                  <div className={styles.priceBlock}>
                    <p className={styles.priceLabel}>VALOR</p>
                    <p className={styles.priceValue}>
                      {formatCurrency(selectedProfessionalBidAmount)}
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
                <h3 className={styles.sectionTitle}>Ofertas</h3>

                <div className={styles.candidatesList}>
                  {bids.map((bid) => (
                    <article
                      key={bid.id}
                      className={`${styles.proCard} ${styles.candidateCard}`}
                    >
                      <div className={styles.candidateHeader}>
                        <button
                          type="button"
                          className={styles.proInfo}
                          onClick={() =>
                            navigate(`/executor/${bid.candidate.id}`)
                          }
                        >
                          <div className={styles.proAvatar}>
                            <img
                              src={bid.candidate.profile_picture}
                              alt=""
                              aria-hidden="true"
                            />
                          </div>

                          <div>
                            <p className={styles.proName}>
                              {fullName(
                                bid.candidate.first_name,
                                bid.candidate.last_name,
                              )}
                            </p>
                            <p className={styles.proMeta}>
                              ★ {Number(bid.candidate_rating ?? 0).toFixed(1)}
                            </p>
                          </div>
                        </button>

                        <div className={styles.priceBlock}>
                          <p className={styles.priceLabel}>VALOR</p>
                          <p className={styles.priceValue}>
                            {formatCurrency(bid.amount)}
                          </p>
                        </div>
                      </div>

                      <div className={styles.candidateActions}>
                        <button
                          type="button"
                          className={styles.rejectButton}
                          onClick={() =>
                            setConfirmBidAction({
                              type: "reject",
                              bid,
                            })
                          }
                        >
                          Rejeitar
                        </button>
                        <button
                          type="button"
                          className={styles.acceptButton}
                          onClick={() =>
                            setConfirmBidAction({
                              type: "accept",
                              bid,
                            })
                          }
                        >
                          Aceitar
                        </button>
                      </div>
                    </article>
                  ))}

                  {bids.length === 0 && (
                    <p className={styles.feedback}>
                      Ainda não há ofertas para essa tarefa. Fique de olho!
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
                    : selectedProfessional
                      ? fullName(
                          selectedProfessional.first_name,
                          selectedProfessional.last_name,
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
                      {selectedProfessional
                        ? fullName(
                            selectedProfessional.first_name,
                            selectedProfessional.last_name,
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

      {confirmBidAction && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <p className={styles.modalMessage}>
              {confirmBidAction.type === "accept"
                ? "Deseja mesmo aceitar essa oferta?"
                : "Deseja mesmo recusar essa oferta?"}
            </p>

            <div className={styles.candidateHeader}>
              <div className={styles.proInfo}>
                <div className={styles.proAvatar}>
                  <img
                    src={confirmBidAction.bid.candidate.profile_picture}
                    alt=""
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <p className={styles.proName}>
                    {fullName(
                      confirmBidAction.bid.candidate.first_name,
                      confirmBidAction.bid.candidate.last_name,
                    )}
                  </p>
                  <p className={styles.proMeta}>
                    ★{" "}
                    {Number(confirmBidAction.bid.candidate_rating ?? 0).toFixed(
                      1,
                    )}
                  </p>
                </div>
              </div>

              <div className={styles.priceBlock}>
                <p className={styles.priceLabel}>VALOR</p>
                <p className={styles.priceValue}>
                  {formatCurrency(confirmBidAction.bid.amount)}
                </p>
              </div>
            </div>

            <div className={styles.candidateModalActions}>
              <button
                type="button"
                className={styles.modalCancelButton}
                onClick={() => setConfirmBidAction(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.modalConfirmButton}
                disabled={isProcessingBid}
                onClick={async () => {
                  const action = confirmBidAction;
                  setConfirmBidAction(null);
                  if (action.type === "accept") {
                    await handleAwardBid(action.bid);
                  } else {
                    await handleDeclineBid(action.bid);
                  }
                }}
              >
                {isProcessingBid ? "Aguarde..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav active="tasks" />
    </main>
  );
}
