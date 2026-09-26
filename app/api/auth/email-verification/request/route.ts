import type { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/server";
export function POST(request: NextRequest) { return proxyBackend(request, ["auth", "email-verification", "request"]); }
