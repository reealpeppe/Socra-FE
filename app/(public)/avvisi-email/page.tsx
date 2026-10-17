import type { Metadata } from "next";
import { MentorAlertUnsubscribe } from "@/components/MentorAlertUnsubscribe";

export const metadata: Metadata = { title: "Avvisi sui mentor · Socra", referrer: "no-referrer", robots: { index: false, follow: false } };
export default function MentorAlertEmailPage() { return <MentorAlertUnsubscribe />; }
