"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, LockKeyhole } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ButtonLink } from "@/components/Ui";
import {
  SafetyScenario,
  isMentorEligible,
} from "@/components/TopicCompetenceMatrix";
import { clientGet, clientPost } from "@/lib/api";
import {
  autonomyOptions,
  instrumentOptions,
  sectionDQuestions,
  topicInvestmentOptions,
  topicKnowledgeOptions,
} from "@/lib/options";
import {
  emptyAnswers,
  hasInvestment,
  ONBOARDING_POLICY,
  restoreAnswers,
  submittedAnswers,
  surveyComplete,
  topicComplete,
  type EssentialAnswers,
} from "@/lib/onboarding";
import { useUnsavedChangesGuard } from "@/lib/use-unsaved-changes-guard";
import type {
  TopicCompetenceDraft,
  TopicInvestmentBand,
  TopicKnowledgeLevel,
} from "@/lib/types";
import styles from "./OnboardingSurvey.module.css";

type OnboardingState = {
  user_id: string;
  latest_answer_id: string | null;
  is_coach: boolean;
};
type SavedDraft = { answers: Record<string, unknown>; updated_at?: string };
type LocalDraft = { answers: Record<string, unknown>; savedAt: number };
const label = (topic: string) =>
  instrumentOptions.find((row) => row.value === topic)?.label || topic;

export default function OnboardingSurvey({
  reassessment = false,
}: {
  reassessment?: boolean;
}) {
  const [answers, setAnswers] = useState<EssentialAnswers>(emptyAnswers);
  const [screen, setScreen] = useState("welcome");
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const draftKey = useRef<string | null>(null);
  const [initial, setInitial] = useState("");
  const idempotencyKey = useRef("");
  const finalizing = useRef(false);
  const pendingSave = useRef<Record<string, unknown> | null>(null);
  const savingPromise = useRef<Promise<void> | null>(null);
  const mounted = useRef(true);
  useUnsavedChangesGuard(
    reassessment && loaded && !done && initial !== JSON.stringify(answers),
  );

  useEffect(() => {
    mounted.current = true;
    let active = true;
    async function load() {
      try {
        idempotencyKey.current = crypto.randomUUID();
        if (reassessment) {
          const snapshot = await clientGet<{
            answers: Record<string, unknown> | null;
          }>("/competences-v3/me");
          if (!active) return;
          const restored = restoreAnswers(snapshot.answers || {});
          setAnswers(restored.answers);
          setInitial(JSON.stringify(restored.answers));
          setScreen("welcome");
        } else {
          const [stateResult, draftResult] = await Promise.allSettled([
            clientGet<OnboardingState>("/surveys/onboarding/me"),
            clientGet<SavedDraft | null>("/surveys/onboarding/me/draft"),
          ]);
          if (!active) return;
          if (stateResult.status === "rejected") throw stateResult.reason;
          const state = stateResult.value;
          draftKey.current = `socra_onboarding_draft:${state.user_id}`;
          if (state.latest_answer_id) {
            setDone(true);
            try {
              sessionStorage.removeItem(draftKey.current);
            } catch {
              /* Storage can be unavailable. */
            }
          } else {
            let local: LocalDraft | null = null;
            try {
              local = JSON.parse(
                sessionStorage.getItem(draftKey.current) || "null",
              );
            } catch {
              /* Recover from the server. */
            }
            const online =
              draftResult.status === "fulfilled" ? draftResult.value : null;
            const serverTime = online?.updated_at || "";
            const serverSavedAt = serverTime ? Date.parse(/[zZ]|[+-]\d{2}:\d{2}$/.test(serverTime) ? serverTime : `${serverTime}Z`) : 0;
            const raw =
              local &&
              (!online || local.savedAt > serverSavedAt)
                ? local.answers
                : online?.answers;
            if (raw && Object.keys(raw).length) {
              const restored = restoreAnswers(raw);
              setAnswers(restored.answers);
              setScreen(restored.screen);
              setSaveMessage(
                "Abbiamo recuperato le tue risposte. Puoi modificarle prima di confermare.",
              );
            }
            if (draftResult.status === "rejected")
              setSaveMessage(
                "Bozza online non disponibile. Le nuove risposte verranno salvate anche su questo dispositivo.",
              );
          }
        }
        setLoaded(true);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Non riusciamo a caricare le risposte.",
          );
          setLoadError(true);
        }
      }
    }
    void load();
    return () => {
      active = false;
      mounted.current = false;
    };
  }, [reassessment]);

  function drainSaves(): Promise<void> {
    if (savingPromise.current) return savingPromise.current;
    const run = async () => {
      if (mounted.current) setSaving(true);
      try {
        while (pendingSave.current && !finalizing.current) {
          const payload = pendingSave.current;
          pendingSave.current = null;
          try {
            await clientPost("/surveys/onboarding/me/draft", payload);
            if (mounted.current) setSaveMessage("Bozza salvata");
          } catch {
            if (mounted.current)
              setSaveMessage(
                "Salvataggio online non riuscito. Riproveremo alla prossima modifica; non chiudere questa pagina se il dispositivo non consente il salvataggio locale.",
              );
          }
        }
      } finally {
        if (mounted.current) setSaving(false);
      }
    };
    savingPromise.current = run().finally(() => {
      savingPromise.current = null;
    });
    return savingPromise.current;
  }

  useEffect(() => {
    if (
      reassessment ||
      !loaded ||
      done ||
      finalizing.current ||
      screen === "welcome"
    )
      return;
    const raw = {
      onboarding_policy: ONBOARDING_POLICY,
      essential_flow: { answers, screen },
    };
    try {
      if (draftKey.current)
        sessionStorage.setItem(
          draftKey.current,
          JSON.stringify({ answers: raw, savedAt: Date.now() }),
        );
    } catch {
      queueMicrotask(() =>
        setSaveMessage(
          "Il dispositivo non consente il salvataggio locale. Attendi la conferma della bozza online prima di uscire.",
        ),
      );
    }
    const timer = window.setTimeout(() => {
      if (finalizing.current) return;
      pendingSave.current = {
        current_step: 0,
        scores: {},
        answers: raw,
        include_section_d: true,
        d_never_invested: !hasInvestment(answers),
      };
      void drainSaves();
    }, 700);
    return () => window.clearTimeout(timer);
  }, [answers, screen, loaded, done, reassessment]);

  useEffect(() => {
    if (loaded) heading.current?.focus({ preventScroll: true });
  }, [screen, loaded, done]);
  const activeTopic = screen.startsWith("topic:") ? screen.slice(6) : null;
  const contextQuestion = screen.startsWith("context:")
    ? sectionDQuestions.find((question) => question.key === screen.slice(8))
    : undefined;
  const row = activeTopic ? answers.topics[activeTopic] || {} : {};
  const route = [
    "welcome",
    "selection",
    ...answers.selected.map((topic) => `topic:${topic}`),
    ...(hasInvestment(answers) ? ["autonomy"] : []),
    ...sectionDQuestions.map((question) => `context:${question.key}`),
    "review",
  ];
  const currentIndex = route.indexOf(screen);
  function go(next: string) {
    setError(null);
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function change(next: EssentialAnswers) {
    idempotencyKey.current = crypto.randomUUID();
    setError(null);
    setAnswers(next);
  }
  function updateTopic(patch: Partial<TopicCompetenceDraft>) {
    if (!activeTopic) return;
    const nextRow = { ...row, ...patch };
    if (!isMentorEligible(nextRow)) {
      delete nextRow.wants_to_mentor;
      delete nextRow.safety_scenario_answer;
    }
    if (patch.wants_to_mentor === false) delete nextRow.safety_scenario_answer;
    const next = {
      ...answers,
      topics: { ...answers.topics, [activeTopic]: nextRow },
    };
    if (!hasInvestment(next)) delete next.autonomy;
    change(next);
  }
  function next() {
    if (screen === "selection") {
      if (!answers.selected.length && !answers.none) {
        setError(
          "Scegli almeno uno strumento oppure indica che non li conosci e non li hai mai usati.",
        );
        return;
      }
      change({ ...answers, selectionConfirmed: true });
    }
    if (activeTopic && !topicComplete(activeTopic, row)) {
      setError("Completa le risposte su questo strumento prima di continuare.");
      return;
    }
    if (screen === "autonomy" && !answers.autonomy) {
      setError("Scegli la risposta che descrive meglio la tua esperienza.");
      return;
    }
    if (contextQuestion && !answers.context[contextQuestion.key]) {
      setError("Scegli una risposta oppure “Preferisco non rispondere” per continuare.");
      return;
    }
    go(route[currentIndex + 1] || "review");
  }
  async function submit() {
    if (!surveyComplete(answers)) {
      setError(
        "Manca qualche risposta. Rivedi il riepilogo e completa le voci mancanti prima di confermare.",
      );
      return;
    }
    setSubmitting(true);
    setError(null);
    finalizing.current = true;
    pendingSave.current = null;
    try {
      await savingPromise.current;
      await clientPost(
        reassessment
          ? "/competences-v3/me/reassessment"
          : "/surveys/onboarding/me/answers",
        reassessment
          ? {
              answers: submittedAnswers(answers),
              idempotency_key: idempotencyKey.current,
            }
          : { section: "onboarding", answers: submittedAnswers(answers) },
      );
      try {
        if (draftKey.current) sessionStorage.removeItem(draftKey.current);
      } catch {
        /* Server is authoritative. */
      }
      setDone(true);
    } catch (err) {
      finalizing.current = false;
      setError(
        err instanceof Error
          ? err.message
          : "Le risposte non sono state salvate. Riprova.",
      );
    } finally {
      setSubmitting(false);
    }
  }
  const title = done
    ? "Il tuo punto di partenza è pronto"
    : screen === "welcome"
      ? reassessment
        ? "La tua esperienza, oggi"
        : "Partiamo da te"
      : screen === "selection"
        ? "Quali strumenti conosci o hai già usato?"
        : activeTopic
          ? label(activeTopic)
          : screen === "autonomy"
            ? "Come prendi le tue decisioni?"
            : contextQuestion
              ? contextQuestion.label
              : "Ti riconosci in queste risposte?";

  return (
    <AppShell>
      <div className={styles.page}>
        <section className={styles.panel} aria-busy={submitting}>
          <div className={styles.topline}>
            <span className="eyebrow">
              {reassessment ? "La mia esperienza" : "Benvenuto su Socra"}
            </span>
            <span className={styles.private}>
              <LockKeyhole size={14} aria-hidden /> Risposte private
            </span>
          </div>
          {!loaded && !loadError ? (
            <p role="status">Recuperiamo le tue risposte…</p>
          ) : (
            <>
              <h1 ref={heading} tabIndex={-1}>
                {title}
              </h1>
              {error ? (
                <p className="error" role="alert">
                  {error}
                </p>
              ) : null}
              {loadError ? (
                <button
                  className="button primary"
                  onClick={() => window.location.reload()}
                >
                  Riprova
                </button>
              ) : done ? (
                <div className={styles.body}>
                  <p>
                    Ora possiamo proporti confronti più adatti a ciò che conosci
                    e a ciò che vuoi imparare. Potrai aggiornare queste risposte
                    in qualsiasi momento.
                  </p>
                  <div className={styles.actions}>
                    <ButtonLink href={reassessment ? "/competenze" : "/goal"}>
                      {reassessment
                        ? "Torna alla mia esperienza"
                        : "Scegli cosa vuoi imparare"}
                    </ButtonLink>
                    <ButtonLink href="/settings" variant="secondary">
                      Gestisci la disponibilità come mentor
                    </ButtonLink>
                  </div>
                </div>
              ) : (
                <>
                  {activeTopic ? (
                    <p className={styles.caption}>
                      Strumento {answers.selected.indexOf(activeTopic) + 1} di{" "}
                      {answers.selected.length} · conoscenza ed esperienza sono
                      due cose diverse.
                    </p>
                  ) : null}
                  {screen === "welcome" ? (
                    <div className={styles.body}>
                      <p className={styles.lead}>
                        C’è chi parte da zero, chi investe da anni e chi vuole
                        esplorare un argomento nuovo. Qui c’è spazio per tutti.
                      </p>
                      <p>
                        Raccontaci la tua esperienza e il tuo contesto personale.
                      </p>
                    </div>
                  ) : screen === "selection" ? (
                    <div className={styles.body}>
                      <p>
                        Seleziona anche gli strumenti che hai solo studiato,
                        oppure quelli in cui hai investito affidandoti a qualcun
                        altro.{" "}
                        <strong>
                          Non è una lista di ciò che vuoi imparare.
                        </strong>
                      </p>
                      <fieldset className={styles.instruments}>
                        <legend className="sr-only">
                          Strumenti conosciuti o utilizzati
                        </legend>
                        {instrumentOptions.map((item) => (
                          <label
                            key={item.value}
                            className={
                              answers.selected.includes(item.value)
                                ? styles.selected
                                : ""
                            }
                          >
                            <input
                              type="checkbox"
                              checked={answers.selected.includes(item.value)}
                              onChange={(event) =>
                                change({
                                  ...answers,
                                  none: false,
                                  selectionConfirmed: false,
                                  selected: event.target.checked
                                    ? instrumentOptions
                                        .filter(
                                          (option) =>
                                            option.value === item.value ||
                                            answers.selected.includes(
                                              option.value,
                                            ),
                                        )
                                        .map((option) => option.value)
                                    : answers.selected.filter(
                                        (topic) => topic !== item.value,
                                      ),
                                })
                              }
                            />
                            <span>{item.label}</span>
                          </label>
                        ))}
                      </fieldset>
                      <label className={styles.none}>
                        <input
                          type="checkbox"
                          checked={answers.none}
                          onChange={(event) =>
                            change({
                              ...answers,
                              selected: [],
                              none: event.target.checked,
                              selectionConfirmed: false,
                            })
                          }
                        />
                        <span>
                          Non conosco e non ho mai usato questi strumenti
                        </span>
                      </label>
                      <p className={styles.caption}>
                        Continuando confermi che per gli strumenti non
                        selezionati non hai conoscenze né denaro investito, oggi
                        o in passato. Puoi sempre tornare qui e correggere la
                        scelta.
                      </p>
                    </div>
                  ) : activeTopic ? (
                    <div className={styles.body}>
                      <ChoiceGroup
                        title="Quanto lo conosci?"
                        name={`knowledge-${activeTopic}`}
                        options={topicKnowledgeOptions}
                        value={row.knowledge_level}
                        onChange={(value) =>
                          updateTopic({
                            knowledge_level: value as TopicKnowledgeLevel,
                          })
                        }
                      />
                      <ChoiceGroup
                        title="Qual è il massimo importo tuo investito nello stesso momento?"
                        hint={
                          activeTopic === "forex" ||
                          activeTopic === "derivatives"
                            ? "Considera capitale proprio, premio o margine a rischio: non il nozionale. Demo e simulatori non contano."
                            : "Considera anche il passato, senza sommare acquisti e vendite ripetuti sullo stesso capitale. Demo e simulatori non contano."
                        }
                        name={`investment-${activeTopic}`}
                        compact
                        options={topicInvestmentOptions}
                        value={row.invested_amount_band}
                        onChange={(value) =>
                          updateTopic({
                            invested_amount_band: value as TopicInvestmentBand,
                          })
                        }
                      />
                      {isMentorEligible(row) ? (
                        <ChoiceGroup
                          title="Ti senti pronto a condividere la tua esperienza pratica su questo strumento per aiutare un’altra persona?"
                          name={`mentor-${activeTopic}`}
                          compact
                          options={[
                            { value: "yes", label: "Sì" },
                            { value: "no", label: "No" },
                          ]}
                          value={
                            typeof row.wants_to_mentor === "boolean"
                              ? row.wants_to_mentor
                                ? "yes"
                                : "no"
                              : undefined
                          }
                          onChange={(value) =>
                            updateTopic({ wants_to_mentor: value === "yes" })
                          }
                        />
                      ) : null}
                      {activeTopic === "forex" ||
                      activeTopic === "derivatives" ? (
                        <SafetyScenario
                          topic={activeTopic}
                          answer={row}
                          onChange={(value) =>
                            updateTopic({ safety_scenario_answer: value })
                          }
                        />
                      ) : null}
                    </div>
                  ) : screen === "autonomy" ? (
                    <div className={styles.body}>
                      <p>
                        Pensando agli investimenti che hai fatto finora, quale
                        situazione ti descrive meglio?
                      </p>
                      <ChoiceGroup
                        title="Nelle decisioni di investimento…"
                        name="autonomy"
                        options={autonomyOptions}
                        value={answers.autonomy}
                        onChange={(value) =>
                          change({ ...answers, autonomy: value })
                        }
                      />
                      <p className={styles.caption}>
                        Questa risposta ci aiuta a distinguere l’esperienza
                        diretta da quella completamente delegata.
                      </p>
                    </div>
                  ) : contextQuestion ? (
                    <div className={styles.body}>
                      <p className={styles.caption}>
                        Contesto personale · {sectionDQuestions.indexOf(contextQuestion) + 1} di {sectionDQuestions.length}
                      </p>
                      <p>
                        Queste informazioni aiutano Socra a conoscere la community
                        in forma aggregata. Non cambiano il matching e non sono
                        visibili agli altri utenti. Puoi scegliere “Preferisco non
                        rispondere” per ogni domanda.
                      </p>
                      <ChoiceGroup
                        title={contextQuestion.label}
                        name={`context-${contextQuestion.key}`}
                        options={contextQuestion.options}
                        value={answers.context[contextQuestion.key]}
                        onChange={(value) => change({
                          ...answers,
                          context: { ...answers.context, [contextQuestion.key]: value },
                        })}
                        hideTitle
                      />
                    </div>
                  ) : (
                    <div className={styles.body}>
                      <p>
                        Non devono essere risposte perfette: devono descrivere
                        la tua esperienza di oggi.
                      </p>
                      {answers.selected.map((topic) => {
                        const item = answers.topics[topic] || {};
                        return (
                          <div className={styles.review} key={topic}>
                            <div>
                              <h2>{label(topic)}</h2>
                              <p>
                                {topicKnowledgeOptions.find(
                                  (option) =>
                                    option.value === item.knowledge_level,
                                )?.label || "Conoscenza da completare"}{" "}
                                ·{" "}
                                {topicInvestmentOptions.find(
                                  (option) =>
                                    option.value === item.invested_amount_band,
                                )?.label || "Importo da completare"}
                              </p>
                              <p className={styles.caption}>
                                {item.wants_to_mentor
                                  ? "Vuoi condividere la tua esperienza"
                                  : "Per ora non ti proponi come mentor"}
                              </p>
                            </div>
                            <button
                              className="button secondary"
                              onClick={() => go(`topic:${topic}`)}
                              aria-label={`Modifica ${label(topic)}`}
                            >
                              Modifica
                            </button>
                          </div>
                        );
                      })}
                      <div className={styles.review}>
                        <p>
                          {answers.selected.length
                            ? answers.selected.length === instrumentOptions.length ? "Hai incluso tutti gli strumenti disponibili." : "Gli altri strumenti: nessuna conoscenza e nessun investimento."
                            : "Non hai ancora conoscenze né investimenti negli strumenti elencati. Va benissimo partire da qui."}
                        </p>
                        <button
                          className="button secondary"
                          onClick={() => go("selection")}
                        >
                          Rivedi strumenti
                        </button>
                      </div>
                      {hasInvestment(answers) ? (
                        <div className={styles.review}>
                          <p>
                            {autonomyOptions.find(
                              (option) => option.value === answers.autonomy,
                            )?.label || "Autonomia da completare"}
                          </p>
                          <button
                            className="button secondary"
                            onClick={() => go("autonomy")}
                          >
                            Modifica autonomia
                          </button>
                        </div>
                      ) : null}
                      {answers.autonomy === "delegated" ? (
                        <p className={styles.caption}>
                          Con decisioni completamente delegate non attiviamo la
                          disponibilità come mentor. Puoi comunque iniziare a
                          imparare e aggiornare l’esperienza in seguito.
                        </p>
                      ) : null}
                      <h2>Contesto personale</h2>
                      {sectionDQuestions.map((question) => (
                        <div className={styles.review} key={question.key}>
                          <div>
                            <h3>{question.label}</h3>
                            <p>{question.options.find((option) => option.value === answers.context[question.key])?.label || "Da completare"}</p>
                          </div>
                          <button className="button secondary" onClick={() => go(`context:${question.key}`)} aria-label={`Modifica ${question.label}`}>
                            Modifica
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className={styles.footer}>
                    {screen !== "welcome" ? (
                      <button
                        className="button secondary"
                        type="button"
                        disabled={submitting}
                        onClick={() =>
                          go(
                            route[Math.max(0, currentIndex - 1)] || "selection",
                          )
                        }
                      >
                        <ChevronLeft size={16} aria-hidden /> Indietro
                      </button>
                    ) : (
                      <span />
                    )}
                    <button
                      className="button primary"
                      type="button"
                      disabled={submitting}
                      onClick={screen === "review" ? submit : next}
                    >
                      {submitting
                        ? "Salvataggio…"
                        : screen === "welcome"
                          ? "Cominciamo"
                          : screen === "review"
                            ? "Conferma le risposte"
                            : "Continua"}
                      {!submitting ? (
                        <ArrowRight size={16} aria-hidden />
                      ) : null}
                    </button>
                  </div>
                  {screen !== "welcome" ? (
                    <p className={styles.save} role="status">
                      {reassessment
                        ? "Le modifiche saranno salvate alla conferma finale."
                        : saving
                          ? "Salvataggio bozza…"
                          : saveMessage ||
                            "Puoi tornare indietro: le risposte rimangono."}
                    </p>
                  ) : null}
                </>
              )}
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function ChoiceGroup({
  title,
  hint,
  name,
  options,
  value,
  onChange,
  compact = false,
  hideTitle = false,
}: {
  title: string;
  hint?: string;
  name: string;
  options: readonly { value: string; label: string; description?: string }[];
  value?: string;
  onChange: (value: string) => void;
  compact?: boolean;
  hideTitle?: boolean;
}) {
  return (
    <fieldset className={styles.choices}>
      <legend className={hideTitle ? "sr-only" : undefined}>{title}</legend>
      {hint ? <p className={styles.caption}>{hint}</p> : null}
      <div className={compact ? styles.compact : styles.options}>
        {options.map((option) => (
          <label
            className={value === option.value ? styles.selected : ""}
            key={option.value}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>
              <strong>{option.label}</strong>
              {option.description ? <small>{option.description}</small> : null}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
