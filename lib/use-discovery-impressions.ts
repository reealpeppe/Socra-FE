"use client";

import { useEffect, useRef } from "react";
import { clientPost } from "@/lib/api";

/** A fetched or off-screen card is not an impression. Receipts remain server-owned. */
export function useDiscoveryImpressions(renderedReceipts: string) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!root.current || !renderedReceipts || typeof IntersectionObserver === "undefined") return;
    let active = true;
    const visible = new Set<Element>();
    const acknowledged = new Set<string>();
    const timers = new Map<Element, ReturnType<typeof setTimeout>>();
    const stop = (element: Element) => { clearTimeout(timers.get(element)); timers.delete(element); };
    const start = (element: Element) => {
      const receipt = element.getAttribute("data-discovery-offer");
      if (!receipt || document.visibilityState !== "visible" || timers.has(element) || acknowledged.has(receipt)) return;
      timers.set(element, setTimeout(() => {
        timers.delete(element);
        if (!active || !visible.has(element) || document.visibilityState !== "visible") return;
        acknowledged.add(receipt);
        // One issued receipt per request. Server retries are idempotent, and a
        // failed acknowledgement must not prevent the user from using matching.
        void clientPost("/matching/discovery/impressions", { offer_ids: [receipt] }).catch(() => {
          acknowledged.delete(receipt);
        });
      }, 1000));
    };
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) { visible.add(entry.target); start(entry.target); }
        else { visible.delete(entry.target); stop(entry.target); }
      }
    }, { threshold: [0, 0.5] });
    root.current.querySelectorAll("[data-discovery-offer]").forEach((element) => observer.observe(element));
    const onVisibility = () => visible.forEach((element) => {
      stop(element);
      if (document.visibilityState === "visible") start(element);
    });
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      active = false;
      observer.disconnect();
      timers.forEach(clearTimeout);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [renderedReceipts]);
  return root;
}
