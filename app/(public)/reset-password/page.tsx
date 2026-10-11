import type { Metadata } from "next";
import { AccountAction } from "@/components/AccountAction";
export const metadata: Metadata = { title: "Nuova password · Socra", referrer: "no-referrer", robots: { index: false, follow: false } };
export default function ResetPasswordPage() { return <AccountAction action="reset" />; }
