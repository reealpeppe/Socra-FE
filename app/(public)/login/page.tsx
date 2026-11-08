"use client";
import { LoginForm } from "@/components/LoginForm";
import { PrelaunchAuthBoundary } from "@/components/PrelaunchAuthBoundary";
export default function LoginPage() {
  return <PrelaunchAuthBoundary mode="login"><LoginForm /></PrelaunchAuthBoundary>;
}
