import type { Page } from '@playwright/test';

export const catalog = {version:'test',max_objectives:3,topics:[
  {code:'etf_funds',label:'ETF',skills:[{code:'etf_read',label:'Leggere la scheda di un ETF'},{code:'etf_compare',label:'Confrontare due ETF'}]},
  {code:'stocks',label:'Azioni',skills:[{code:'stock_fundamentals',label:'Leggere i dati fondamentali di un’azienda'}]}],
  discussion_modes:[{code:'step_by_step',label:'Guidami passo passo',description:'Un passaggio alla volta.'},{code:'concrete_case',label:'Lavoriamo su un caso concreto',description:'Un esempio.'}]};
export const etf = {id:'g-etf',topic:'ETF',topic_code:'etf_funds',is_active:true,skill_model:true,objective_codes:['etf_read'],objective_labels:['Leggere la scheda di un ETF'],discussion_mode:'step_by_step',discussion_mode_label:'Guidami passo passo'};
export const stock = {id:'g-stock',topic:'Azioni',topic_code:'stocks',is_active:true,skill_model:true,objective_codes:['stock_fundamentals'],objective_labels:['Leggere i dati fondamentali di un’azienda'],discussion_mode:'concrete_case',discussion_mode_label:'Lavoriamo su un caso concreto'};
export const undisclosed = {D1:'undisclosed',D2:'undisclosed',D3:'undisclosed',D4:'undisclosed',D5:'undisclosed'};
export function match(goal: typeof etf | typeof stock) {return {...goal,goal_id:goal.id,match_score:82,compatibility_band:'high',reason_summary:'Attività compatibili.',coverage_count:1,requested_count:1,covered_objective_codes:goal.objective_codes,covered_objective_labels:goal.objective_labels,missing_objective_codes:[],missing_objective_labels:[]};}
export function card(i=0) {return {...match(etf),mentor_id:`m-${i}`,nickname:`Mentor ${i}`,path_cost:1,is_recommended:true,goal_matches:[match(etf),match(stock)]};}
export async function fixture(page: Page, baseURL: string, options: {empty?:boolean;context?:Record<string,string>;pending?:boolean;profileMissing?:boolean}={}) {
  await page.context().addCookies([{name:'socra_session',value:'multi-test',url:baseURL,httpOnly:true}]);
  const state = {selections:options.empty?[]:[etf,stock],profile:{version:1,known_skills:['etf_read'],mentor_skills:['etf_read'],section_d:options.context ?? {},mentor_available:true},selectionWrites:0,contextWrites:0,sent:null as Record<string,unknown>|null};
  let profileSaved=!options.profileMissing;
  await page.route('**/api/backend/**',async route=>{
    const p=new URL(route.request().url()).pathname.replace('/api/backend','');
    const method=route.request().method();
    const body=method==='GET'?null:route.request().postDataJSON();
    if(p==='/goals/me/selection'){state.selectionWrites++;state.selections=body.selections.map((s: typeof etf)=>({...s,id:`g-${s.topic}`,topic_code:s.topic,topic:catalog.topics.find(t=>t.code===s.topic)?.label,skill_model:true,is_active:true,objective_labels:s.objective_codes.map(c=>catalog.topics.flatMap(t=>t.skills).find(a=>a.code===c)?.label)}));}
    if(p==='/skills/me/context'){state.contextWrites++;state.profile={...state.profile,section_d:body.section_d,version:state.profile.version+1};}
    if(p==='/skills/me'&&method==='PUT'){state.profile={...state.profile,...body,version:state.profile.version+1};profileSaved=true;}
    if(p==='/matching/requests'&&method==='POST')state.sent=body;
    const answered=Object.values(state.profile.section_d).filter(Boolean).length;
    const user={id:'u1',username:'test_user',nickname:'Giulia',email:'test@example.com',level:'L0',role:'user',account_status:'active',is_coach:true,email_verified:true};
    const goals={current:state.selections[0]??null,active_goals:state.selections,goals:state.selections};
    const data:Record<string,unknown>={
      '/auth/me':user,'/profiles/me':{...user,user_id:'u1',first_name:'Giulia',last_name:'Rossi'},
      '/skills/catalog':catalog,'/skills/me':profileSaved?{...state.profile,profile_completion:{experience_completed:true,context_completed:answered===5,context_answered_count:answered,context_total_count:5}}:null,
      '/skills/me/context':{...state.profile,profile_completion:{experience_completed:true,context_completed:answered===5,context_answered_count:answered,context_total_count:5}},
      '/surveys/onboarding/me':{latest_answer_id:'done',user_id:'u1'},'/surveys/onboarding/me/draft':null,
      '/goals/me':goals,'/goals/me/selection':goals,'/paths/me':[], '/notifications/me':[], '/wallet/me':{balance:5,debt:0},
      '/profiles/u1':{skill_model:true,user_id:'u1',skill_groups:[],completed_paths:0,public_badges:[],aggregate_metrics:{},public_reviews:[]},
      '/matching/requests/me':options.pending?[{id:'r1',mentee_id:'u1',mentor_id:'m-0',goal_id:'g-etf',status:'pending',initiator_role:'mentee',expires_at:'2026-12-01',created_at:'2026-10-05',goal:etf}]:[],
      '/matching/candidates/all':{items:body?.cursor?[card(10),card(11)]:Array.from({length:10},(_,i)=>card(i)),next_cursor:body?.cursor?null:'page-two'},
      '/matching/requests':{id:'r-new',status:'pending',...body},
    };
    await route.fulfill({json:Object.hasOwn(data,p)?data[p]:[]});
  });
  return state;
}
