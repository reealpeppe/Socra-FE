import { type NextRequest } from "next/server";
import { proxyBackend } from "@/lib/server";

export async function GET(request: NextRequest, context: { params: { path: string[] } }) {
  return proxyBackend(request, context.params.path);
}

export async function POST(request: NextRequest, context: { params: { path: string[] } }) {
  return proxyBackend(request, context.params.path);
}
