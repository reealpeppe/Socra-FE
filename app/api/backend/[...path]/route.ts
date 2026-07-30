import { type NextRequest } from "next/server";
import { proxyBackend } from "@/lib/server";

type BackendRouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(request: NextRequest, context: BackendRouteContext) {
  const { path } = await context.params;
  return proxyBackend(request, path);
}

export async function POST(request: NextRequest, context: BackendRouteContext) {
  const { path } = await context.params;
  return proxyBackend(request, path);
}

export async function PATCH(request: NextRequest, context: BackendRouteContext) {
  const { path } = await context.params;
  return proxyBackend(request, path);
}
