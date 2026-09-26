import type { Metadata } from "next";
import { AccountAction } from "@/components/AccountAction";
export const metadata: Metadata = { title: "Verifica email · Socra", referrer: "no-referrer", robots: { index: false, follow: false } };
export default function VerifyEmailPage() { return <AccountAction action="verify" />; }
