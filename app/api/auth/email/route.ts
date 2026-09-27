import type { NextRequest } from "next/server";
import { correctUnverifiedEmail } from "@/lib/server";

export function PATCH(request: NextRequest) { return correctUnverifiedEmail(request); }
