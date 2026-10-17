export function safeInvitationReturn(value:string|null):string|null {
  return value && /^\/inviti(?:\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})?$/i.test(value) ? value : null;
}

export const invitationStateLabel:Record<string,string>={pending:'In attesa',claimed:'Proposta aperta',accepted:'Percorso iniziato',completed:'Percorso completato',declined:'Invito rifiutato',expired:'Invito scaduto'};

export function invitationSessionMarker(){try{return localStorage.getItem('socra-session-change');}catch{return null;}}
