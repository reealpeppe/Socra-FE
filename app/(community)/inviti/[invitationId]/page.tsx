import {AppShell} from '@/components/AppShell';
import {InvitationProposal} from '@/components/InvitationProposal';
export default async function InvitationPage({params}:{params:Promise<{invitationId:string}>}){const {invitationId}=await params;return <AppShell><InvitationProposal key={invitationId} invitationId={invitationId}/></AppShell>;}
