import type {Metadata} from 'next';
import {InvitationLanding} from '@/components/InvitationLanding';
export const metadata:Metadata={title:'Il tuo invito · Socra',referrer:'no-referrer',robots:{index:false,follow:false}};
export default function InvitationPage(){return <InvitationLanding/>;}
