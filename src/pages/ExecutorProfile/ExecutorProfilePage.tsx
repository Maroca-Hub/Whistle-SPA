import { useEffect, useState } from "react";
import { BottomNav } from "../../components/BottomNav/BottomNav";
import {
  executorsService,
  type ExecutorProfile,
} from "../../services/executors.service";
import styles from "./ExecutorProfilePage.module.css";

interface ExecutorProfilePageProps {
  executorId: string;
}

function fullName(firstName?: string, lastName?: string): string {
  return [firstName, lastName].filter(Boolean).join(" ").trim();
}

function formatMemberSince(isoDate: string): string {
  const date = new Date(isoDate);
  const month = date.toLocaleString("pt-BR", { month: "long" });
  const year = date.getFullYear();
  return `${month.charAt(0).toUpperCase() + month.slice(1)} de ${year}`;
}

function formatDateLabel(isoDate: string): string {
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("pt-BR", { month: "long" });
  const year = date.getFullYear();
  return `${day} ${month}, ${year}`;
}

const PORTFOLIO_PREVIEW = 6;

export function ExecutorProfilePage({ executorId }: ExecutorProfilePageProps) {
  const [executor, setExecutor] = useState<ExecutorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAllPortfolio, setShowAllPortfolio] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await executorsService.getProfile(executorId);
        if (isMounted) setExecutor(data);
      } catch {
        if (isMounted) setError("Não foi possível carregar o perfil.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [executorId]);

  const name = executor
    ? fullName(executor.first_name, executor.last_name)
    : "";
  const portfolioItems = showAllPortfolio
    ? (executor?.portfolio ?? [])
    : (executor?.portfolio ?? []).slice(0, PORTFOLIO_PREVIEW);

  return (
    <main className={styles.container}>
      <section className={styles.panel}>
        <header className={styles.header}>
          <button
            type="button"
            className={styles.headerIconButton}
            aria-label="Voltar"
            onClick={() => window.history.back()}
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

          <h1 className={styles.headerTitle}>Perfil do profissional</h1>

          <div className={styles.headerRight} />
        </header>

        {isLoading && <p className={styles.feedback}>Carregando perfil...</p>}
        {!isLoading && error && <p className={styles.feedback}>{error}</p>}

        {!isLoading && !error && executor && (
          <>
            <section className={styles.profileHero}>
              <div className={styles.avatarWrap}>
                <div className={styles.avatar}>
                  <img
                    src={executor.profile_picture}
                    alt=""
                    aria-hidden="true"
                  />
                </div>
                <div className={styles.ratingBadge}>
                  <span className={styles.ratingStar}>★</span>
                  <span className={styles.ratingValue}>
                    {Number(executor.rating).toFixed(1)}
                  </span>
                </div>
              </div>

              <h2 className={styles.heroName}>{name}</h2>

              {executor.skills.length > 0 && (
                <p className={styles.heroTagline}>
                  {executor.skills.map((s) => s.name).join(" & ")}
                </p>
              )}
            </section>

            <section className={styles.aboutSection}>
              <h3 className={styles.sectionTitle}>Sobre</h3>
              <div className={styles.aboutCard}>
                <p className={styles.aboutText}>{executor.description}</p>
              </div>
            </section>

            {executor.skills.length > 0 && (
              <section className={styles.skillsSection}>
                <h3 className={styles.sectionTitle}>Habilidades</h3>
                <div className={styles.skillChips}>
                  {executor.skills.map((skill) => (
                    <span key={skill.id} className={styles.skillChip}>
                      {skill.name}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <section className={styles.infoSection}>
              <h3 className={styles.sectionTitle}>Informações</h3>
              <div className={styles.infoCard}>
                <div className={styles.infoRow}>
                  <div className={styles.infoIconWrap}>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                        stroke="#059669"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className={styles.infoLabel}>Status</p>
                    <p className={styles.infoValue}>Identidade Verificada</p>
                  </div>
                </div>
              </div>

              <div className={styles.infoCard}>
                <div className={styles.infoRow}>
                  <div className={styles.infoIconWrap}>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <rect
                        x="3"
                        y="4"
                        width="18"
                        height="18"
                        rx="2"
                        stroke="#0a86af"
                        strokeWidth="2"
                      />
                      <path
                        d="M16 2V6M8 2V6M3 10H21"
                        stroke="#0a86af"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className={styles.infoLabel}>Membro desde</p>
                    <p className={styles.infoValue}>
                      {formatMemberSince(executor.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {executor.portfolio.length > 0 && (
              <section className={styles.portfolioSection}>
                <div className={styles.portfolioHeader}>
                  <h3 className={styles.sectionTitle}>Portfólio</h3>
                  {executor.portfolio.length > PORTFOLIO_PREVIEW && (
                    <button
                      type="button"
                      className={styles.seeAllButton}
                      onClick={() => setShowAllPortfolio((v) => !v)}
                    >
                      {showAllPortfolio ? "Ver menos" : "Ver todos"}
                    </button>
                  )}
                </div>
                <div className={styles.portfolioGrid}>
                  {portfolioItems.map((url, i) => (
                    <div key={i} className={styles.portfolioItem}>
                      <img src={url} alt="" aria-hidden="true" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {executor.last_reviews.length > 0 && (
              <section className={styles.reviewsSection}>
                <h3 className={styles.sectionTitle}>Avaliações recentes</h3>
                {executor.last_reviews.map((rev) => (
                  <article key={rev.id} className={styles.reviewCard}>
                    <div className={styles.reviewStars}>
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
                    {rev.comment && (
                      <p className={styles.reviewComment}>{rev.comment}</p>
                    )}
                    <p className={styles.reviewDate}>
                      {formatDateLabel(rev.created_at)}
                    </p>
                  </article>
                ))}
              </section>
            )}
          </>
        )}
      </section>

      <BottomNav active="tasks" />
    </main>
  );
}
