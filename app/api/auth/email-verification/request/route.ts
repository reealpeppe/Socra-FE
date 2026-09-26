import type { NextRequest } from "next/server";
import { requestEmailVerification } from "@/lib/server";
export function POST(request: NextRequest) { return requestEmailVerification(request); }
