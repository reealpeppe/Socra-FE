"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, BookOpen, ChevronRight, Coins, GraduationCap, Sparkles, Target, UsersRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { OnboardingGate } from "@/components/OnboardingGate";
import { UserAvatar } from "@/components/Ui";
import { SkillPreparation } from "@/components/SkillPreparation";
import { clientGet } from "@/lib/api";
import type { GoalsMe, PathItem, PublicProfile, UserMe, Wallet } from "@/lib/types";
import styles from "./Dashboard.module.css";

type DashboardErrorKey = "user" | "wallet" | "goals" | "paths";

export default function DashboardPage() {
  const [me, setMe] = useState<UserMe | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [goals, setGoals] = useState<GoalsMe | null>(null);
  const [paths, setPaths] = useState<PathItem[]>([]);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [errors, setErrors] = useState<Partial<Record<DashboardErrorKey, string>>>({});
  const [loading, setLoading] = useState(true);
  const [dashboardRetryVersion, setDashboardRetryVersion] = useState(0);
  const [experienceSaved, setExperienceSaved] = useState(false);

  useEffect(() => {
    let active = true;

    // The wallet can load independently of the main dashboard.
    clientGet<Wallet>("/wallet/me").then(value => {
      if (active) { setWallet(value); setErrors(current => ({ ...current, wallet: undefined })); }
    }).catch(error => { if (active) setErrors(current => ({ ...current, wallet: error.message || "Crediti non disponibili" })); });
    Promise.allSettled([
      clientGet<UserMe>("/auth/me"),
      clientGet<GoalsMe>("/goals/me"),
      clientGet<PathItem[]>("/paths/me")
    ]).then(([userResult, goalResult, pathResult]) => {
      if (!active) return;
      const nextErrors: Partial<Record<DashboardErrorKey, string>> = {};
      if (userResult.status === "fulfilled") setMe(userResult.value);
      else nextErrors.user = userResult.reason?.message || "Profilo non disponibile";
      if (goalResult.status === "fulfilled") setGoals(goalResult.value);
      else nextErrors.goals = goalResult.reason?.message || "Obiettivi non disponibili";
      if (pathResult.status === "fulfilled") setPaths(Array.isArray(pathResult.value) ? pathResult.value : []);
      else nextErrors.paths = pathResult.reason?.message || "Percorsi non disponibili";
      setErrors(current => ({ wallet: current.wallet, ...nextErrors }));
      setLoading(false);
    });

    return () => { active = false; };
  }, [dashboardRetryVersion]);

  useEffect(() => {
    if (!me?.id) return;
    let active = true;
    try {
      const key = `socra_experience_saved:${me.id}`;
      if (sessionStorage.getItem(key)) { sessionStorage.removeItem(key); queueMicrotask(() => { if (active) setExperienceSaved(true); }); }
    } catch { /* The profile itself remains available without a local confirmation. */ }
    clientGet<PublicProfile>(`/profiles/${me.id}`).then(value => { if (active) setProfile(value); }).catch(() => { if (active) setProfile(null); });
    return () => { active = false; };
  }, [me?.id]);

  const activeGoal = goals?.active_goal || goals?.current || null;
  const displayName = me?.nickname || "utente Socra";
  const pendingGoalReview = useMemo(() => paths.find(path =>
    path.mentee_id === me?.id && path.status === "completed" && path.goal_review_completed === false
  ), [paths, me?.id]);
  const activeMenteePath = useMemo(() => paths.find(path =>
    path.mentee_id === me?.id && (path.status === "open" || path.status === "feedback_pending")
  ), [paths, me?.id]);
  const activeMentorPaths = useMemo(() => paths.filter(path =>
    path.mentor_id === me?.id && (path.status === "open" || path.status === "feedback_pending")
  ), [paths, me?.id]);
  const completedMentorPaths = useMemo(() => paths.filter(path =>
    path.mentor_id === me?.id && path.status === "completed"
  ).length, [paths, me?.id]);
  const mentorTopics = profile?.top_topics || [];
  const goalTitle = activeGoal?.skill_model ? activeGoal.topic : activeGoal?.goal_tag;
  const goalObjectives = activeGoal?.skill_model ? activeGoal.objective_labels || [] : [];
  const hasDataError = Object.values(errors).some(Boolean);
  const learningHref = pendingGoalReview
    ? `/goal?pathId=${encodeURIComponent(pendingGoalReview.id)}`
    : activeMenteePath ? `/paths/${activeMenteePath.id}`
      : activeGoal ? `/matching?goalId=${activeGoal.id}` : "/goal";
  const learningAction = pendingGoalReview ? "Rivedi obiettivo"
    : activeMenteePath ? "Apri il percorso" : activeGoal ? "Trova un mentor" : "Definisci obiettivo";

  return (
    <AppShell primaryAction={activeMenteePath ? { href: `/paths/${activeMenteePath.id}`, label: "Apri il percorso" } : undefined}>
      <OnboardingGate>
        <div className={styles.page} aria-busy={loading}>
          <header className={styles.intro}>
            <div>
              <p className={styles.eyebrow}>Il tuo spazio su Socra <span aria-hidden="true">/</span> Panoramica</p>
              <h1>Ciao {displayName}<span className={styles.wave} aria-hidden="true">✳</span></h1>
              <p className={styles.introCopy}>Un posto per imparare, condividere e seguire ciò che conta per te.</p>
            </div>
            <Link className={styles.wallet} href="/wallet" aria-label={`Crediti: ${errors.wallet ? "non disponibili" : wallet?.balance ?? "in caricamento"}. Apri il portafoglio`}>
              <span className={styles.walletIcon}><Coins size={21} aria-hidden="true" /></span>
              <span><small>Crediti</small><strong>{errors.wallet ? "—" : wallet?.balance ?? "—"}</strong></span>
              <ChevronRight size={17} aria-hidden="true" />
            </Link>
          </header>

          {experienceSaved ? <div className={styles.success} role="status">La tua esperienza è stata aggiornata.</div> : null}

          {me && !me.nickname ? <div className={styles.notice}>
            <span>Scegli come presentarti alla community: puoi aggiungere un nome, una breve presentazione e una foto facoltativa.</span>
            <Link href="/settings">Completa il tuo profilo</Link>
          </div> : null}
          {hasDataError ? <div className={styles.notice} role="alert">
            <span>Alcuni dati non sono disponibili al momento. Mostriamo solo le informazioni già verificate.</span>
            <button type="button" onClick={() => setDashboardRetryVersion(value => value + 1)}>Riprova</button>
          </div> : null}
          {pendingGoalReview ? <div className={styles.notice} role="alert">
            <span>Prima di iniziare un nuovo percorso, conferma o aggiorna il tuo obiettivo.</span>
            <Link href={`/goal?pathId=${encodeURIComponent(pendingGoalReview.id)}`}>Rivedi obiettivo</Link>
          </div> : null}

          {loading ? <div className={styles.loading} role="status">Caricamento dashboard…</div> : <>
            <div className={styles.grid}>
              <section className={`${styles.card} ${styles.learning}`} aria-labelledby="learning-title">
                <div className={styles.cardTop}>
                  <span className={styles.cardIcon}><GraduationCap size={23} aria-hidden="true" /></span>
                  <span className={styles.sectionIndex}>01 / Impara</span>
                  {activeMenteePath ? <span className={styles.status}>{activeMenteePath.status === "feedback_pending" ? "Feedback in corso" : "In corso"}</span> : null}
                </div>
                <h2 id="learning-title">Il tuo percorso di apprendimento</h2>
                {errors.paths ? <p className={styles.cardMessage}>I percorsi non sono disponibili. Usa “Riprova” in alto.</p>
                  : activeMenteePath ? <>
                    <p className={styles.featureTitle}>{activeMenteePath.skill_model ? activeMenteePath.goal?.topic || "Il tuo percorso" : activeMenteePath.goal?.goal_tag || goalTitle || "Il tuo percorso"}</p>
                    {activeMenteePath.skill_model ? <DashboardObjectives labels={activeMenteePath.agreed_objective_labels || []} agreed /> : null}
                    <div className={styles.person}><UserAvatar name={activeMenteePath.mentor?.nickname || "Mentor Socra"} size="sm" /><span><strong>{activeMenteePath.mentor?.nickname || "Mentor Socra"}</strong><small>Il tuo mentor</small></span></div>
                    <p className={styles.supporting}>Hai già un percorso attivo come apprendista.</p>
                  </> : <>
                    <p className={styles.featureTitle}>{errors.goals ? "Il tuo prossimo passo" : goalTitle || "Inizia da un obiettivo"}</p>
                    {!errors.goals && goalObjectives.length ? <DashboardObjectives labels={goalObjectives} /> : null}
                    <p className={styles.supporting}>{pendingGoalReview ? "Rivedi l’obiettivo prima di cercare un nuovo mentor." : activeGoal ? "Nessun percorso attivo come apprendista. Trova la persona giusta per iniziare." : "Scegli cosa desideri imparare e costruisci il tuo percorso."}</p>
                  </>}
                <div className={styles.cardBottom}>
                  <span className={styles.cardMeta}><BookOpen size={17} aria-hidden="true" /> {errors.paths ? "Stato non disponibile" : activeMenteePath ? "1 percorso attivo su 1" : "0 percorsi attivi su 1"}</span>
                  <Link className={styles.actionDark} href={learningHref}>{learningAction}<ArrowRight size={18} aria-hidden="true" /></Link>
                </div>
                <div className={styles.learningArt} aria-hidden="true"><i /><i /><i /><span /></div>
              </section>

              <section className={`${styles.card} ${styles.mentor}`} aria-labelledby="mentor-title">
                <div className={styles.cardTop}>
                  <span className={styles.cardIcon}><UsersRound size={22} aria-hidden="true" /></span>
                  <span className={styles.sectionIndex}>02 / Condividi</span>
                  {me?.is_coach ? <span className={styles.status}>Disponibile come mentor</span> : null}
                </div>
                <h2 id="mentor-title">I tuoi percorsi come mentor</h2>
                {!me ? <p className={styles.cardMessage}>Verifica ruolo mentor…</p>
                  : !me.is_coach && !activeMentorPaths.length ? <>
                    <p className={styles.featureTitle}>Condividi ciò che sai</p>
                    <p className={styles.supporting}>Dalle impostazioni puoi verificare gli argomenti su cui renderti disponibile.</p>
                  </> : errors.paths ? <p className={styles.cardMessage}>I percorsi non sono disponibili. Usa “Riprova” in alto.</p> : <>
                    <p className={styles.featureTitle}>{activeMentorPaths.length} {activeMentorPaths.length === 1 ? "percorso attivo" : "percorsi attivi"} su 3</p>
                    {activeMentorPaths.length ? <div className={styles.mentorList}>
                      {activeMentorPaths.slice(0, 3).map(path => <Link className={styles.mentorRow} href={`/paths/${path.id}`} key={path.id}>
                        <UserAvatar name={path.mentee?.nickname || "Apprendista Socra"} size="sm" />
                        <span><strong>{path.skill_model ? path.goal?.topic || "Percorso Socra" : path.goal?.goal_tag || "Percorso Socra"}</strong>{path.skill_model ? <small>{path.agreed_objective_labels?.join(" · ")}</small> : null}<small>con {path.mentee?.nickname || "Apprendista Socra"}</small></span>
                        <ChevronRight size={18} aria-hidden="true" />
                      </Link>)}
                    </div> : <p className={styles.supporting}>Non hai percorsi aperti come mentor. Puoi cercare apprendisti compatibili.</p>}
                  </>}
                {!me?.is_coach ? <Link className={styles.textLink} href="/settings">Gestisci ruolo mentor <ArrowRight size={17} aria-hidden="true" /></Link> : null}
                <div className={styles.cardBottom}>
                  <span className={styles.cardMeta}>{!errors.paths && me ? `${completedMentorPaths} completati` : ""}</span>
                  <Link className={styles.actionGold} href="/paths?tab=mentor">Vedi i percorsi <ArrowRight size={18} aria-hidden="true" /></Link>
                </div>
                <div className={styles.mentorArt} aria-hidden="true"><span /><span /></div>
              </section>

              <section className={`${styles.card} ${styles.goal}`} aria-labelledby="goal-title">
                <div className={styles.smallCardHead}><span className={styles.cardIcon}><Target size={21} aria-hidden="true" /></span><span className={styles.sectionIndex}>03 / La tua direzione</span><Link href="/goal" aria-label="Vai ai tuoi obiettivi"><ChevronRight size={19} aria-hidden="true" /></Link></div>
                <h2 id="goal-title">Il tuo obiettivo</h2>
                {errors.goals ? <p className={styles.cardMessage}>L&apos;obiettivo non è disponibile. Usa “Riprova” in alto.</p> : activeGoal ? <>
                  <div className={styles.goalTitleRow}><p className={styles.smallTitle}>{goalTitle}</p>{activeGoal.skill_model ? <small>{goalObjectives.length} {goalObjectives.length === 1 ? "obiettivo" : "obiettivi"}</small> : null}</div>
                  {goalObjectives.length ? <p className={styles.goalDescription}>{goalObjectives[0]}{goalObjectives.length > 1 ? <> <span>e {goalObjectives.length === 2 ? "un altro obiettivo" : `altri ${goalObjectives.length - 1} obiettivi`}</span></> : null}</p> : null}
                  <div className={styles.goalTags} aria-label="Tipi di confronto">
                    {activeGoal.skill_model ? <span>{activeGoal.discussion_mode_label}</span> : activeGoal.discussion_type_labels?.length
                      ? activeGoal.discussion_type_labels.map(label => <span key={label}>{label}</span>)
                      : <span>{activeGoal.topic || "Argomento non definito"}</span>}
                  </div>
                </> : <><p className={styles.cardMessage}>Nessun obiettivo attivo.</p><Link className={styles.textLink} href="/goal">Definisci obiettivo <ArrowRight size={16} aria-hidden="true" /></Link></>}
                <div className={styles.goalArt} aria-hidden="true" />
              </section>

              <section className={`${styles.card} ${styles.skills}`} aria-labelledby="skills-title">
                <div className={styles.smallCardHead}><span className={styles.cardIcon}><Sparkles size={21} aria-hidden="true" /></span><span className={styles.sectionIndex}>04 / La tua esperienza</span><Link href="/competenze" aria-label="Vai alle tue competenze"><ChevronRight size={19} aria-hidden="true" /></Link></div>
                <h2 id="skills-title">Competenze e disponibilità</h2>
                {profile?.skill_model ? profile.skill_groups?.length ? <div className={styles.preparation} aria-label="Preparazione per argomento"><small className={styles.preparationLabel}>Preparazione · attività conosciute</small>{profile.skill_groups.slice(0, 3).map(group => <SkillPreparation group={group} compact key={group.topic} />)}</div> : <p className={styles.cardMessage}>Nessuna attività conosciuta indicata.</p> : mentorTopics.length ? <div className={styles.topicList} aria-label="Topic di competenza">{mentorTopics.slice(0, 3).map(topic => <span key={topic}>{topic}</span>)}{mentorTopics.length > 3 ? <span>+{mentorTopics.length - 3}</span> : null}</div> : <p className={styles.cardMessage}>Nessun argomento ancora disponibile.</p>}
                <div className={styles.availability}><span className={me?.is_coach ? styles.availabilityDot : styles.availabilityDotOff} />{me?.is_coach ? "Disponibile come mentor" : "Disponibilità mentor disattivata"}</div>
                <div className={styles.skillsArt} aria-hidden="true"><BarChart3 size={30} /></div>
              </section>
            </div>
          </>}
        </div>
      </OnboardingGate>
    </AppShell>
  );
}

function DashboardObjectives({ labels, agreed = false }: { labels: string[]; agreed?: boolean }) {
  return <div className={styles.objectives}><small>{labels.length} {labels.length === 1 ? "obiettivo" : "obiettivi"}{agreed ? " concordati" : ""}</small><ul>{labels.map(label => <li key={label}>{label}</li>)}</ul></div>;
}
