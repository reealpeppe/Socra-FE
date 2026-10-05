"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { useConfirmation } from "@/components/ConfirmationDialog";
import { PersonalContext } from "./PersonalContext";
import { MentorOfferHelp } from "./MentorOfferHelp";
import { SkillPreparation } from "@/components/SkillPreparation";
import { clientGet, clientPost, clientPut } from "@/lib/api";
import { emptySkillAnswers, restoreSkillAnswers, type SkillAnswers } from "@/lib/skills";
import { useUnsavedChangesGuard } from "@/lib/use-unsaved-changes-guard";
import type { PublicProfile, SkillCatalog, SkillGroup, SkillProfile } from "@/lib/types";
import styles from "./SkillLearning.module.css";

type Draft = { answers: { skill_flow?: SkillAnswers }; updated_at?: string };
type SurveyOwner = { sessionMarker: string | null };

function sessionMarker(): string | null {
  try { return localStorage.getItem("socra-session-change"); }
  catch { return null; }
}

export function SkillSurvey({ catalog, reassessment = false }: { catalog: SkillCatalog; reassessment?: boolean }) {
  const router = useRouter();
  const [preparation, setPreparation] = useState<Array<Omit<SkillGroup, "skills" | "offered_count" | "coverage_percent" | "confirmed_count"> & { confirmed_count?: number }>>([]);
  const userId = useRef("");
  const [contextOwner, setContextOwner] = useState("");
  const [answers, setAnswers] = useState<SkillAnswers>(emptySkillAnswers);
  const [loaded, setLoaded] = useState(false);
  const [existing, setExisting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [contextStep, setContextStep] = useState(false);
  const [savedProfile, setSavedProfile] = useState<SkillProfile | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [initial, setInitial] = useState("");
  const draftKey = useRef("");
  const saveChain = useRef(Promise.resolve());
  const finalizing = useRef(false);
  const requestKey = useRef("");
  const ownerRef = useRef<SurveyOwner | null>(null);
  const initialOffers = useRef<string[]>([]);
  const { confirm, confirmationDialog } = useConfirmation();
  const ownsSession = useCallback((owner: SurveyOwner | null) =>
    owner !== null && ownerRef.current === owner && owner.sessionMarker === sessionMarker(), []);
  useUnsavedChangesGuard(loaded && !done && !busy && JSON.stringify(answers) !== initial);

  useEffect(() => {
    // Each load owns its queued work. Auth writes this marker even before navigation.
    const owner = { sessionMarker: sessionMarker() };
    ownerRef.current = owner;
    saveChain.current = Promise.resolve();
    finalizing.current = false;
    Promise.all([
      clientGet<{ user_id: string }>("/surveys/onboarding/me"),
      clientGet<SkillProfile | null>("/skills/me"),
      reassessment ? Promise.resolve(null) : clientGet<Draft | null>("/surveys/onboarding/me/draft").catch(() => null),
    ]).then(([user, profile, draft]) => {
      if (!ownsSession(owner)) return;
      draftKey.current = `socra_skills_draft:${user.user_id}:${reassessment ? "edit" : "onboarding"}`;
      userId.current = user.user_id;
      setContextOwner(user.user_id);
      requestKey.current = crypto.randomUUID();
      const saved = restoreSkillAnswers(profile, catalog);
      initialOffers.current = saved.mentor_skills;
      let raw: unknown = profile || draft?.answers?.skill_flow;
      try {
        const local = JSON.parse(sessionStorage.getItem(draftKey.current) || "null") as { answers: SkillAnswers; savedAt: number; baseVersion?: number } | null;
        const serverTime = draft?.updated_at;
        const serverSavedAt = serverTime ? Date.parse(/[zZ]|[+-]\d{2}:\d{2}$/.test(serverTime) ? serverTime : `${serverTime}Z`) : 0;
        if (local && (!profile || reassessment) && local.baseVersion === profile?.version && local.savedAt > serverSavedAt) raw = local.answers;
      } catch { /* The server copy is usable when local storage is unavailable. */ }
      setAnswers(restoreSkillAnswers(raw, catalog));
      setInitial(JSON.stringify(saved));
      setExisting(!!profile);
      setDone(false);
      setSavedProfile(profile);
      setContextStep(!!profile && !reassessment);
      setLoaded(true);
      baseVersion.current = profile?.version;
      if (reassessment && profile) {
        setPreparation(catalog.topics.map(topic => {
          const known = topic.skills.filter(skill => profile.known_skills.includes(skill.code)).length;
          return { topic: topic.code, label: topic.label, known_count: known, total_count: topic.skills.length, preparation_percent: 100 * known / topic.skills.length };
        }).filter(group => group.known_count > 0));
        clientGet<PublicProfile>(`/profiles/${user.user_id}`).then(publicProfile => {
          if (ownsSession(owner) && publicProfile.skill_model) setPreparation(publicProfile.skill_groups || []);
        }).catch(() => { /* Saved knowledge remains available without public evidence. */ });
      }
    }).catch(err => { if (ownsSession(owner)) setError(err instanceof Error ? err.message : "Impossibile caricare le risposte."); });
    return () => { if (ownerRef.current === owner) ownerRef.current = null; };
  }, [catalog, reassessment, attempt, ownsSession]);
  const baseVersion = useRef<number | undefined>(undefined);
  useEffect(() => {
    const refresh = () => {
      if (ownerRef.current && ownerRef.current.sessionMarker !== sessionMarker()) {
        ownerRef.current = null; setLoaded(false); setAnswers(emptySkillAnswers()); setContextStep(false);
        setSavedProfile(null); setDone(false); setConfirmed(false); setAttempt(v => v + 1);
      }
    };
    window.addEventListener('socra:session-refresh', refresh);
    return () => window.removeEventListener('socra:session-refresh', refresh);
  }, []);

  useEffect(() => {
    const owner = ownerRef.current;
    if (!loaded || done || finalizing.current || !ownsSession(owner)) return;
    try { sessionStorage.setItem(draftKey.current, JSON.stringify({ answers, savedAt: Date.now(), baseVersion: baseVersion.current })); }
    catch { /* Online draft remains available. */ }
    if (reassessment || existing) return;
    const timer = window.setTimeout(() => {
      saveChain.current = saveChain.current.then(async () => {
        if (finalizing.current || !ownsSession(owner)) return;
        try {
          await clientPost("/surveys/onboarding/me/draft", { current_step: 0, scores: {}, answers: { skill_flow: answers }, include_section_d: false, d_never_invested: false });
          if (ownsSession(owner)) setSaveMessage("Bozza salvata");
        } catch { if (ownsSession(owner)) setSaveMessage("Bozza online non disponibile. Conserva questa pagina aperta per non perdere le risposte."); }
      });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [answers, loaded, done, reassessment, existing, ownsSession]);

  function update(next: SkillAnswers) {
    setAnswers(next); setConfirmed(false); setError(null); requestKey.current = crypto.randomUUID();
  }
  function toggleKnown(code: string, checked: boolean) {
    update({ ...answers,
      known_skills: checked ? [...answers.known_skills, code] : answers.known_skills.filter(item => item !== code),
      mentor_skills: checked ? answers.mentor_skills : answers.mentor_skills.filter(item => item !== code),
    });
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const owner = ownerRef.current;
    if (!ownsSession(owner)) return;
    if (!confirmed || busy) { setError("Conferma le attività indicate."); return; }
    setBusy(true); setError(null);
    if (initialOffers.current.length && !answers.mentor_skills.length && !await confirm("Stai rimuovendo tutte le attività su cui offri aiuto. La tua disponibilità come mentor verrà disattivata e non riceverai nuove richieste. I percorsi già aperti continueranno. Vuoi salvare questa modifica?")) {
      if (ownsSession(owner)) setBusy(false);
      return;
    }
    if (!ownsSession(owner)) return;
    finalizing.current = true;
    try {
      await saveChain.current;
      if (!ownsSession(owner)) return;
      const profile = await clientPut<SkillProfile>("/skills/me", { ...answers, idempotency_key: requestKey.current });
      if (!ownsSession(owner)) return;
      try { sessionStorage.removeItem(draftKey.current); } catch { /* Saved on the server. */ }
      setSavedProfile(profile);
      setContextStep(true);
      if (reassessment) {
        try { sessionStorage.setItem(`socra_experience_saved:${userId.current}`, "1"); } catch { /* The saved profile remains available. */ }

      }
    } catch (err) { if (ownsSession(owner)) { finalizing.current = false; setError(err instanceof Error ? err.message : "Risposte non salvate."); } }
    finally { if (ownsSession(owner)) setBusy(false); }
  }

  return <AppShell>{confirmationDialog}<div className={styles.page}>
    {!loaded ? <div className="card" role={error ? "alert" : "status"}>{error || "Caricamento delle tue risposte…"}{error ? <button className="button secondary" onClick={() => { setError(null); setAttempt(value => value + 1); }}>Riprova</button> : null}</div>
      : contextStep ? <section className={`${styles.section} stack`}><p className={styles.eyebrow}>Il tuo profilo · passo facoltativo</p><h1>Aggiungi il tuo contesto personale</h1><p>La tua esperienza è salvata. Puoi rispondere alle cinque domande private, scegliere “Preferisco non rispondere” o continuare per ora.</p><PersonalContext key={contextOwner} profile={savedProfile} expanded onSaved={setSavedProfile} onSkip={()=>{setContextStep(false);setDone(true);if(reassessment)router.push('/dashboard');}}/>{savedProfile?.profile_completion?.context_completed?<Link className="button dark" href={reassessment?'/dashboard':'/goal'}>Continua</Link>:null}</section>
      : done ? <section className={`${styles.section} stack`}><p className={styles.eyebrow}>Il tuo punto di partenza</p><h1>{reassessment ? "Le tue capacità sono aggiornate" : "Il tuo punto di partenza è chiaro"}</h1><p>Ora puoi scegliere le attività che vuoi imparare insieme a un mentor.</p><Link className="button dark" href={reassessment ? "/dashboard" : "/goal"}>{reassessment ? "Torna alla dashboard" : "Scegli cosa imparare"}</Link></section>
      : <form className={styles.page} onSubmit={submit} aria-busy={busy}>
        <header className={styles.intro}><p className={styles.eyebrow}>La tua esperienza</p><h1>{reassessment ? "Rivedi ciò che sai fare" : "Cosa sai fare, cosa vuoi condividere?"}</h1><p>Indica le attività che sai svolgere. Tra queste, scegli quelle su cui ti fa piacere aiutare un’altra persona. Puoi partire senza selezionarne nessuna.</p></header>
        {reassessment && existing ? <section className={styles.section} aria-label="Preparazione per argomento"><h2>Preparazione per argomento</h2><p className="muted">Il tuo punto di partenza attuale, dalle attività dichiarate e confermate nei percorsi.</p>{preparation.length ? <div className={styles.preparationGrid}>{preparation.map(group => <SkillPreparation key={group.topic} group={group} />)}</div> : <p className="muted">Non hai ancora indicato attività conosciute.</p>}</section> : null}
        <section className={styles.section} aria-label="Capacità per tema"><h2>Le tue capacità</h2><p className="muted">Sul profilo sarà visibile la preparazione per argomento. Scegli separatamente le attività su cui vuoi aiutare.</p>
          <MentorOfferHelp />
          {catalog.topics.map((topic, index) => <details className={styles.topic} key={topic.code} open={index === 0 || answers.known_skills.some(code => topic.skills.some(skill => skill.code === code))}>
            <summary>{topic.label}<small>{topic.skills.filter(skill => answers.known_skills.includes(skill.code)).length} conosciute · {topic.skills.filter(skill => answers.mentor_skills.includes(skill.code)).length} offerte</small></summary>
            {topic.skills.map(skill => <div className={styles.skill} key={skill.code}>
              <label className={styles.check}><input type="checkbox" aria-label={`So: ${skill.label}`} checked={answers.known_skills.includes(skill.code)} disabled={busy} onChange={event => toggleKnown(skill.code, event.target.checked)} /><span>{skill.label}</span></label>
              <label className={styles.check}><input type="checkbox" aria-label={`Posso aiutare: ${skill.label}`} checked={answers.mentor_skills.includes(skill.code)} disabled={busy || !answers.known_skills.includes(skill.code)} onChange={event => update({ ...answers, mentor_skills: event.target.checked ? [...answers.mentor_skills, skill.code] : answers.mentor_skills.filter(code => code !== skill.code) })} /><span>Posso aiutare</span></label>
            </div>)}
          </details>)}
        </section>
        {existing ? <p className={styles.notice}>Le modifiche non riattivano una disponibilità mentor messa in pausa. I percorsi già svolti restano nel tuo storico.</p> : null}
        <label className={styles.check}><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} disabled={busy} required /><span>Confermo le attività indicate, anche se non ne ho selezionata nessuna.</span></label>
        {error ? <p className="error" role="alert">{error}</p> : null}
        <div className={styles.actions}><small className="muted" role="status">{saveMessage}</small><button className="button dark" disabled={busy} type="submit">{busy ? "Salvataggio…" : "Conferma le risposte"}</button></div>
      </form>}
  </div></AppShell>;
}
