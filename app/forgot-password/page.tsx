import type { Metadata } from "next";
import { AccountAction } from "@/components/AccountAction";
export const metadata: Metadata = { title: "Recupero password · Socra", referrer: "no-referrer", robots: { index: false, follow: false } };
export default function ForgotPasswordPage() { return <AccountAction action="forgot" />; }
