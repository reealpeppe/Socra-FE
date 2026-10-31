import type {NextRequest} from "next/server";
import {prelaunchMutation} from "@/lib/prelaunch-server";
export function POST(request:NextRequest){return prelaunchMutation(request,'profile-link');}
