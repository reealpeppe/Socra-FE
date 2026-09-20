"use client";

import { useReportWebVitals } from "next/web-vitals";

type Sample = {
  name: string;
  value: number;
  rating: string;
  navigationType: string;
};
declare global {
  interface Window {
    __socraVitals?: Sample[];
  }
}

// Local diagnostic buffer only: no account identifiers, URLs, survey answers,
// external analytics, cookies or persistent storage. Readable in browser QA.
function record(metric: Sample) {
  const samples = (window.__socraVitals ||= []);
  samples.push({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    navigationType: metric.navigationType,
  });
  if (samples.length > 50) samples.shift();
}

export function PerformanceDiagnostics() {
  useReportWebVitals(record);
  return null;
}
