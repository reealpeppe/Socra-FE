import type { NextRequest } from "next/server";
import { authenticate } from "@/lib/server";

export function POST(request: NextRequest) { return authenticate(request, "register"); }
