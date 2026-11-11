import Link from "next/link";
import { LogIn } from "lucide-react";
import { Brand } from "@/components/Brand";
import styles from "./AccessRecovery.module.css";

const copy = {
  loading: { title: "Verifica dell’accesso", message: "Stiamo verificando la tua sessione." },
  expired: { title: "La sessione è scaduta", message: "Accedi di nuovo per continuare nella tua area Socra." },
  unavailable: { title: "Non riusciamo a verificare l’accesso", message: "Riprova tra poco oppure torna alla home." },
};

export function AccessRecovery({ state, loginHref, onRetry }: {
  state: keyof typeof copy;
  loginHref: string;
  onRetry: () => void;
}) {
  return <div className={styles.frame}>
    <a className="skip-link" href="#main-content">Vai al contenuto principale</a>
    <header className={styles.header}>
      <div className={styles.bar}>
        <Link className={styles.brand} href="/" aria-label="Socra, vai alla home"><Brand variant="dark" /></Link>
        <nav aria-label="Navigazione accesso"><Link className="button ghost" href="/">Home</Link></nav>
      </div>
    </header>
    <main className={styles.main} id="main-content" tabIndex={-1}>
      <section className={styles.content} aria-labelledby="access-recovery-title">
        <span className={styles.icon}><LogIn size={24} aria-hidden="true" /></span>
        <h1 className={styles.title} id="access-recovery-title">{copy[state].title}</h1>
        <p className={styles.message} role={state === "unavailable" ? "alert" : "status"}>{copy[state].message}</p>
        <div className={styles.actions}>
          {state === "expired" ? <Link className="button primary" href={loginHref}>Accedi per continuare</Link>
            : state === "unavailable" ? <button type="button" className="button primary" onClick={onRetry}>Riprova</button> : null}
          <Link className="button secondary" href="/">Torna alla home</Link>
        </div>
      </section>
    </main>
  </div>;
}
