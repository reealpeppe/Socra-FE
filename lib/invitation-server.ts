import {NextResponse,type NextRequest} from 'next/server';
import {getBackendUrl} from '@/lib/server';
import {guardMutation,readJsonBody,bodyError,privateJson} from '@/lib/web-security';

const cookieName='socra_invitation';
const tokenPattern=/^[a-zA-Z0-9_-]{32,128}$/;
function privateResponse(body:unknown,status=200){const response=privateJson(body,status);response.headers.set('Referrer-Policy','no-referrer');return response;}
function setContext(response:NextResponse,token:string,maxAge:number){response.cookies.set(cookieName,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge});}
async function upstream(path:'/invitations/preview'|'/invitations/claim',token:string,bearer?:string){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  try{
    const headers:Record<string,string>={'Content-Type':'application/json'};
    if(bearer)headers.Authorization=`Bearer ${bearer}`;
    const result=await fetch(getBackendUrl(path),{method:'POST',headers,body:JSON.stringify({token}),cache:'no-store',signal:controller.signal});
    const data=await result.json();
    return {status:result.status,ok:result.ok,data};
  }finally{clearTimeout(timer);}
}
function previewFields(value:Record<string,unknown>){
  if(typeof value.inviter_username!=='string'||typeof value.topic!=='string'||typeof value.discussion_mode_label!=='string'||typeof value.status!=='string'
    ||typeof value.expires_at!=='string'||!Array.isArray(value.objective_labels)||!value.objective_labels.every(label=>typeof label==='string'))throw new Error('Invalid preview');
  return {inviter_username:value.inviter_username,topic:value.topic,objective_labels:value.objective_labels,
    discussion_mode_label:value.discussion_mode_label,status:value.status,expires_at:value.expires_at,mentee_cost:0,mentor_reward:1,bonus_new_users_only:true};
}
async function prepareContext(token:string){
  try{
    const result=await upstream('/invitations/preview',token);
    if(!result.ok)return privateResponse({detail:'Invito non disponibile. Il link potrebbe essere scaduto o rinnovato.'},result.status);
    const preview=previewFields(result.data);
    const expires=Date.parse(/[zZ]|[+-]\d{2}:\d{2}$/.test(preview.expires_at)?preview.expires_at:preview.expires_at+'Z');
    if(!Number.isFinite(expires))throw new Error('Invalid expiry');
    const maxAge=Math.min(7*86400,Math.max(0,Math.floor((expires-Date.now())/1000)));
    const response=privateResponse(preview);
    setContext(response,maxAge>0?token:'',maxAge);
    return response;
  }catch{return privateResponse({detail:'Non riusciamo a caricare l’invito. Riprova tra poco.'},503);}
}
export async function storeInvitationContext(request:NextRequest){
  const rejected=guardMutation(request);if(rejected)return rejected;
  let input:Record<string,unknown>;
  try{input=JSON.parse((await readJsonBody(request,4096))!);}catch(error){return bodyError(error);}
  if(Object.keys(input).length!==1||typeof input.token!=='string'||!tokenPattern.test(input.token))return privateResponse({detail:'Link di invito non valido.'},400);
  return prepareContext(input.token);
}
export async function readInvitationContext(request:NextRequest){
  const token=request.cookies.get(cookieName)?.value;
  if(!token||!tokenPattern.test(token))return privateResponse({detail:'Apri il link nella tua email di invito.'},404);
  return prepareContext(token);
}
export async function clearInvitationContext(request:NextRequest){
  const rejected=guardMutation(request);if(rejected)return rejected;
  const response=privateResponse({cleared:true});setContext(response,'',0);return response;
}
export async function claimInvitationContext(request:NextRequest){
  const rejected=guardMutation(request);if(rejected)return rejected;
  let input:Record<string,unknown>;
  try{input=JSON.parse((await readJsonBody(request,4096))!);}catch(error){return bodyError(error);}
  if(Object.keys(input).length)return privateResponse({detail:'Richiesta non valida.'},400);
  const bearer=request.cookies.get('socra_session')?.value;
  if(!bearer)return privateResponse({detail:'Accedi per leggere la proposta.'},401);
  const token=request.cookies.get(cookieName)?.value;
  if(!token)return privateResponse({invitation:null});
  if(!tokenPattern.test(token))return privateResponse({detail:'Link di invito non valido.'},400);
  try{
    const result=await upstream('/invitations/claim',token,bearer);
    if(!result.ok)return privateResponse({detail:result.status===404?'Questo invito è destinato a un altro indirizzo email. Accedi con l’account che ha ricevuto l’invito.':'Invito non disponibile. Potrebbe essere scaduto o rifiutato.'},result.status);
    const data=result.data;
    const detail={...previewFields(data),id:data.id,role:data.role,prerequisite_state:data.prerequisite_state,
      path_id:data.path_id??null,bonus_eligible:data.bonus_eligible??null,delivery_status:null,recipient_email:null,creation_key:null};
    const response=privateResponse({invitation:detail});setContext(response,'',0);return response;
  }catch{return privateResponse({detail:'Non riusciamo ad associare l’invito. Riprova: la proposta resta disponibile.'},503);}
}
