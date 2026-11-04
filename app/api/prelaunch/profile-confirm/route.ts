import type { NextRequest } from "next/server";
import { confirmPrelaunchProfile } from "@/lib/server";
export function POST(request: NextRequest) { return confirmPrelaunchProfile(request); }
