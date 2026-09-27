"use client";

import { useState } from "react";
import { UserAvatar } from "@/components/Ui";
import { accountPost, ClientApiError, clientDelete, clientPatch, clientPut } from "@/lib/api";
import type { OwnProfile, UserMe } from "@/lib/types";

export function ProfileEditor({ initialProfile, user, onUpdated }: {
  initialProfile: OwnProfile; user: UserMe; onUpdated: (profile: OwnProfile) => void;
}) {
  const [profile, setProfile] = useState(initialProfile);
  const [nickname, setNickname] = useState(initialProfile.nickname || "");
  const [bio, setBio] = useState(initialProfile.bio || "");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [verificationRequested, setVerificationRequested] = useState(false);

  function updated(value: OwnProfile) { setProfile(value); onUpdated(value); }
  function fail(err: unknown) { setError(err instanceof ClientApiError ? err.message : "Modifica non salvata. Riprova."); }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy("profile"); setError(null); setMessage(null);
    try {
      updated(await clientPatch<OwnProfile>("/profiles/me", { nickname: nickname.trim(), bio: bio.trim() }));
      setMessage("Profilo aggiornato.");
    } catch (err) { fail(err); }
    finally { setBusy(null); }
  }

  async function upload(file: File | undefined) {
    if (!file || busy) return;
    setError(null); setMessage(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Scegli una foto JPEG, PNG o WebP. SVG e immagini animate non sono ammessi."); return;
    }
    if (file.size > 2 * 1024 * 1024) { setError("La foto non può superare 2 MiB."); return; }
    setBusy("photo");
    try {
      const imageData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Foto non leggibile"));
        reader.onerror = () => reject(new Error("Foto non leggibile"));
        reader.readAsDataURL(file);
      });
      updated(await clientPut<OwnProfile>("/profiles/me/avatar", { image_data_url: imageData }));
      setMessage("Foto aggiornata.");
    } catch (err) { fail(err); }
    finally { setBusy(null); }
  }

  async function removePhoto() {
    if (busy) return;
    setBusy("photo"); setError(null); setMessage(null);
    try { updated(await clientDelete<OwnProfile>("/profiles/me/avatar")); setMessage("Foto rimossa."); }
    catch (err) { fail(err); }
    finally { setBusy(null); }
  }

  async function requestVerification() {
    if (busy || !user.email_delivery_enabled) return;
    setBusy("verification"); setError(null); setMessage(null);
    try {
      const result = await accountPost<{ status: "ok"; email_delivery_enabled: boolean }>("email-verification/request");
      setVerificationRequested(result.email_delivery_enabled);
      setMessage(result.email_delivery_enabled
        ? "Richiesta di verifica registrata. Controlla la posta e l’eventuale cartella indesiderata; il link vale 24 ore."
        : "L’invio email è disattivato in questo ambiente. Nessuna email è stata inviata.");
    } catch (err) { fail(err); }
    finally { setBusy(null); }
  }

  return <section className="card profile-editor" aria-labelledby="profile-editor-title">
    <h2 className="settings-section-title" id="profile-editor-title">Il tuo profilo nella community</h2>
    <div className="profile-editor-intro">
      <UserAvatar name={profile.nickname || "Utente Socra"} src={profile.avatar_url} size="lg" />
      <p className="muted">Nome, presentazione e foto sono visibili agli altri membri. La tua email e le risposte della survey restano private.</p>
    </div>
    {error ? <p className="error" role="alert">{error}</p> : null}
    {message ? <p className="success" role="status">{message}</p> : null}
    <form className="stack" onSubmit={save}>
      <div className="stack" style={{ gap: 6 }}>
        <label htmlFor="profile-nickname">Nome nella community</label>
        <input className="input" id="profile-nickname" autoComplete="nickname" maxLength={80} required value={nickname} onChange={event => setNickname(event.target.value)} disabled={busy !== null} />
      </div>
      <div className="stack" style={{ gap: 6 }}>
        <label htmlFor="profile-bio">Presentazione breve</label>
        <textarea className="input" id="profile-bio" rows={4} maxLength={500} value={bio} onChange={event => setBio(event.target.value)} aria-describedby="profile-bio-hint" disabled={busy !== null} />
        <small className="muted" id="profile-bio-hint">{bio.length}/500 caratteri. Non inserire recapiti, importi o dati riservati.</small>
      </div>
      <button className="button dark" type="submit" disabled={busy !== null || !nickname.trim()}>{busy === "profile" ? "Salvataggio…" : "Salva profilo"}</button>
    </form>
    <div className="profile-editor-photo stack">
      <label htmlFor="profile-photo">Foto del profilo <span className="muted">(facoltativa)</span></label>
      <input className="input" id="profile-photo" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="profile-photo-hint" disabled={busy !== null} onChange={event => {
        const file = event.target.files?.[0]; event.target.value = ""; void upload(file);
      }} />
      <small className="muted" id="profile-photo-hint">JPEG, PNG o WebP, massimo 2 MiB. Verrà ritagliata in quadrato e salvata senza metadati. Niente SVG o immagini animate.</small>
      {busy === "photo" ? <p role="status">Aggiornamento foto…</p> : null}
      {profile.avatar_url ? <button className="button secondary" type="button" disabled={busy !== null} onClick={() => void removePhoto()}>Rimuovi foto</button> : null}
    </div>
    <div className="profile-editor-verification stack">
      <h3>Verifica email</h3>
      <p style={{ overflowWrap: "anywhere" }}>{user.email}</p>
      {user.email_verified ? <span className="pill green">Email verificata</span> : <>
        <span className="pill amber">Email da verificare</span>
        <p className="muted">{user.email_verification_required
          ? "Per inviare o accettare una proposta, entrambe le persone devono avere un’email verificata. Puoi continuare a compilare survey e profilo."
          : "La verifica email non è richiesta per i percorsi in questo ambiente."}</p>
        {!user.email_delivery_enabled ? <p className="muted">L’invio email è disattivato in questo ambiente. Nessuna email sarà inviata.</p> : null}
        <button className="button secondary" type="button" disabled={busy !== null || !user.email_delivery_enabled || verificationRequested} onClick={() => void requestVerification()}>{busy === "verification" ? "Richiesta…" : "Invia link di verifica"}</button>
        {verificationRequested ? <p className="muted">Per richiedere un altro link, attendi almeno 60 secondi e ricarica la pagina. Massimo 5 richieste all’ora.</p> : null}
      </>}
    </div>
    <style jsx>{`
      .profile-editor { display: grid; gap: 18px; }
      .profile-editor-intro { display: flex; align-items: center; gap: 14px; }
      .profile-editor-intro p { line-height: 1.6; font-size: .875rem; margin: 0; }
      label { font-weight: 700; font-size: .9rem; }
      .profile-editor-photo, .profile-editor-verification { border-top: 1px solid var(--line); padding-top: 18px; }
      .profile-editor-verification h3, .profile-editor-verification p { margin: 0; }
      .profile-editor-verification h3 { font-size: 1rem; }
      .profile-editor-verification .pill { justify-self: start; }
      .profile-editor :global(button) { justify-self: start; }
      @media(max-width: 540px) { .profile-editor-intro { align-items: flex-start; } }
    `}</style>
  </section>;
}
