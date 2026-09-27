import type { NextRequest } from "next/server";
import { proxyAccountAction } from "@/lib/account-server";
export function POST(request: NextRequest) { return proxyAccountAction(request, "email-verification/confirm"); }
