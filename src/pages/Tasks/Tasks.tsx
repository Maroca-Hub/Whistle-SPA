import { useCallback, useEffect, useState, type UIEvent } from "react";
import styles from "./Tasks.module.css";
import { useUser } from "../../hooks/useUser";
import {
  tasksService,
  type CustomerTask,
  type TaskStatus,
} from "../../services/tasks.service";
import { AppHeader } from "../../components/AppHeader/AppHeader";
import { BottomNav } from "../../components/BottomNav/BottomNav";

const TASKS_PAGE_SIZE = 20;

type FilterType = "all" | "active" | "done";

function formatRelativeDate(isoDate: string): string {
  const createdAt = new Date(isoDate);
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const startNow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const startCreated = new Date(
    createdAt.getFullYear(),
    createdAt.getMonth(),
    createdAt.getDate(),
  ).getTime();
  const diffDays = Math.max(0, Math.floor((startNow - startCreated) / dayMs));

  if (diffDays === 0) {
    return "Hoje";
  }

  if (diffDays === 1) {
    return "Ontem";
  }

  return `${diffDays} dias atrás`;
}

function getStatusConfig(status: string) {
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

function getTagText(task: CustomerTask): string {
  return `${task.pending_bids_count} proposta${task.pending_bids_count !== 1 ? "s" : ""}`;
}

function getTaskIcon(task: CustomerTask) {
  return task.skill.icon;
}

function navigate(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function Tasks() {
  const { user, loadUser } = useUser();
  const [tasks, setTasks] = useState<CustomerTask[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const filterToStatuses = useCallback(
    (f: FilterType): TaskStatus[] | undefined => {
      if (f === "active") return ["PENDING", "IN_PROGRESS"];
      if (f === "done") return ["COMPLETED"];
      return undefined;
    },
    [],
  );

  const loadPage = useCallback(
    async (targetPage: number, currentFilter: FilterType, reset = false) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await tasksService.getCustomerTasks(
          targetPage,
          TASKS_PAGE_SIZE,
          filterToStatuses(currentFilter),
        );
        setTasks((previous) => (reset ? response : [...previous, ...response]));
        setPage(targetPage);
        setHasMore(response.length >= TASKS_PAGE_SIZE);
      } catch {
        setError("Erro ao carregar tarefas.");
      } finally {
        setIsLoading(false);
      }
    },
    [filterToStatuses],
  );

  useEffect(() => {
    loadPage(1, filter, true);
  }, [filter, loadPage]);

  const handleScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget;
      const threshold = 56;
      const reachedBottom =
        target.scrollTop + target.clientHeight >=
        target.scrollHeight - threshold;

      if (!reachedBottom || isLoading || !hasMore) {
        return;
      }

      loadPage(page + 1, filter);
    },
    [filter, hasMore, isLoading, loadPage, page],
  );

  return (
    <main className={styles.container}>
      <section className={styles.panel}>
        <AppHeader firstName={user?.first_name} />

        <section className={styles.hero}>
          <h2 className={styles.title}>Minhas Tarefas</h2>
          <p className={styles.subtitle}>
            Gerencie suas demandas e acompanhe o progresso em tempo real.
          </p>
        </section>

        <div className={styles.filters}>
          <button
            type="button"
            className={`${styles.filterButton} ${filter === "all" ? styles.filterButtonActive : ""}`}
            onClick={() => setFilter("all")}
          >
            Todas
          </button>
          <button
            type="button"
            className={`${styles.filterButton} ${filter === "active" ? styles.filterButtonActive : ""}`}
            onClick={() => setFilter("active")}
          >
            Ativas
          </button>
          <button
            type="button"
            className={`${styles.filterButton} ${filter === "done" ? styles.filterButtonActive : ""}`}
            onClick={() => setFilter("done")}
          >
            Finalizadas
          </button>
        </div>

        <section className={styles.list} onScroll={handleScroll}>
          {tasks.map((task) => {
            const status = getStatusConfig(task.status);

            return (
              <article
                key={task.id}
                className={styles.card}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/tasks/${task.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate(`/tasks/${task.id}`);
                  }
                }}
              >
                <div className={styles.cardTop}>
                  <div className={styles.skillIconBox}>
                    <img
                      src={getTaskIcon(task)}
                      alt=""
                      className={styles.skillIcon}
                      aria-hidden="true"
                    />
                  </div>

                  <div className={styles.cardBadges}>
                    <span
                      className={`${styles.statusBadge} ${status.className}`}
                    >
                      {status.label}
                    </span>
                    {task.status === "PENDING" &&
                      task.pending_bids_count > 0 && (
                        <span className={styles.proposalsBadge}>
                          {getTagText(task)}
                        </span>
                      )}
                  </div>
                </div>

                <h3 className={styles.cardTitle}>{task.skill.name}</h3>
                <p className={styles.cardDescription}>{task.description}</p>

                <p className={styles.dateLabel}>
                  {formatRelativeDate(task.created_at)}
                </p>
              </article>
            );
          })}

          {isLoading && (
            <p className={styles.statusText}>Carregando tarefas...</p>
          )}
          {!isLoading && error && <p className={styles.statusText}>{error}</p>}
          {!isLoading && !error && tasks.length === 0 && (
            <p className={styles.statusText}>
              Nenhuma tarefa para esse filtro.
            </p>
          )}
          {!isLoading && !error && !hasMore && tasks.length > 0 && (
            <p className={styles.statusText}>Você chegou ao fim da lista.</p>
          )}
        </section>
      </section>

      <BottomNav active="tasks" />
    </main>
  );
}
