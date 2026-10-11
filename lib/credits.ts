import type { Wallet } from "./types";

export function availableCredits(wallet: Wallet | null): number | null {
  return wallet ? wallet.available_balance ?? wallet.balance : null;
}

export function advanceExplanation(wallet: Wallet | null): string | null {
  if (wallet?.advance_available === 1) {
    return "Stai aiutando qualcuno come mentor: puoi usare un credito in anticipo per il tuo prossimo percorso.";
  }
  if (wallet?.advance_used === 1) {
    return "Hai utilizzato un credito anticipato. Il prossimo credito guadagnato come mentor compenserà l’anticipo.";
  }
  return null;
}
