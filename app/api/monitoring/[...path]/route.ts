import type { NextRequest } from "next/server";
import { monitoringProxy } from "@/lib/monitoring-server";

export const dynamic="force-dynamic";
async function handler(request: NextRequest, context: {params: Promise<{path: string[]}>}) {
  return monitoringProxy(request,(await context.params).path.join("/"));
}
export {handler as GET,handler as POST};
