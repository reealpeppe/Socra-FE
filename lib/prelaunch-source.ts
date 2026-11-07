import { createHash, createHmac } from "node:crypto";
import { isIP } from "node:net";
import type { NextRequest } from "next/server";

export function prelaunchSourceHeaders(request: NextRequest, path: string, body: string): Record<string, string> {
  const secret = process.env.SOCRA_PRELAUNCH_PROXY_SECRET;
  const ip = request.headers.get("x-real-ip")?.trim();
  // Railway's public HTTP edge sets X-Real-IP. Other environments use the backend bucket.
  if (!process.env.RAILWAY_ENVIRONMENT_ID || !secret || !ip || !isIP(ip)) return {};
  const stamp = Math.floor(Date.now() / 1000).toString();
  const client = createHmac("sha256", secret).update("socra/prelaunch/client/v1:" + ip.toLowerCase()).digest("hex");
  const bodyHash = createHash("sha256").update(body).digest("hex");
  const message = [stamp, client, request.method, path, bodyHash].join("\n");
  const signature = createHmac("sha256", secret).update(message).digest("hex");
  return { "X-Socra-Prelaunch-Source": [stamp, client, signature].join(".") };
}
