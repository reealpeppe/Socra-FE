"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

/** In-page confirmation: readable on mobile, keyboard accessible, no browser alert dependency. */
export function useConfirmation() {
  const [message, setMessage] = useState<string | null>(null);
  const resolver = useRef<((accepted: boolean) => void) | null>(null);
  useEffect(() => () => { resolver.current?.(false); resolver.current = null; }, []);
  const confirm = useCallback((next: string) => new Promise<boolean>((resolve) => {
    resolver.current?.(false);
    resolver.current = resolve;
    setMessage(next);
  }), []);
  const finish = useCallback((accepted: boolean) => {
    resolver.current?.(accepted);
    resolver.current = null;
    setMessage(null);
  }, []);
  return { confirm, confirmationDialog: message === null ? null : <ConfirmationDialog message={message} onFinish={finish} /> };
}

function ConfirmationDialog({ message, onFinish }: { message: string; onFinish: (accepted: boolean) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const textId = useId();
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} aria-labelledby={titleId} aria-describedby={textId}
    onCancel={event => { event.preventDefault(); onFinish(false); }}
    style={{ width: "min(520px, calc(100% - 32px))", maxHeight: "85dvh", overflow: "auto", border: "1px solid var(--line)", borderRadius: 18, padding: 28, color: "var(--navy-950)" }}>
    <div className="stack">
      <h2 id={titleId}>Conferma la scelta</h2>
      <p id={textId} style={{ lineHeight: 1.65 }}>{message}</p>
      <div className="cluster">
        <button type="button" className="button secondary" autoFocus onClick={() => onFinish(false)}>Annulla</button>
        <button type="button" className="button dark" onClick={() => onFinish(true)}>Conferma</button>
      </div>
    </div>
  </dialog>;
}
