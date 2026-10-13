import { ChevronRight, Info } from 'lucide-react';

export function EtfExplanation({ className }: { className?: string }) {
  return <details className={className}>
    <summary><Info size={16} aria-hidden="true" /><span>Cos’è un ETF?</span><ChevronRight size={14} aria-hidden="true" /></summary>
    <p>ETF significa Exchange Traded Fund: un fondo quotato in borsa.</p>
  </details>;
}
