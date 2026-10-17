import {expect,test,type Page} from '@playwright/test';
import {fixture,undisclosed} from './multi-goal-fixture';

const id='12345678-1234-1234-1234-123456789abc';
const token='s'.repeat(43);
const preview={inviter_username:'Giulia',topic:'ETF',objective_labels:['Leggere la scheda di un ETF'],discussion_mode_label:'Guidami passo passo',status:'claimed',expires_at:'2026-10-24T10:00:00',mentee_cost:0,mentor_reward:1,bonus_new_users_only:true};
async function recipient(page:Page,baseURL:string,ready=false){
  await fixture(page,baseURL);
  const state={accepts:0,declines:0,ready,expired:false,uncertain:false,path:null as string|null};
  const detail=()=>({...preview,id,role:'recipient',status:state.expired?'expired':state.path?'accepted':state.declines?'declined':'claimed',path_id:state.path,
    bonus_eligible:true,delivery_status:null,recipient_email:null,creation_key:null,
    prerequisite_state:{email_verified:state.ready,onboarded:state.ready,skills_offered:state.ready,mentor_available:state.ready}});
  await page.route('**/api/invitations/context',route=>route.fulfill({json:preview}));
  await page.route('**/api/invitations/claim',route=>route.fulfill({json:{invitation:detail()}}));
  await page.route('**/api/backend/invitations**',route=>{
    const path=new URL(route.request().url()).pathname;
    if(path.endsWith('/accept')){state.accepts++;state.path='new-invitation-path';return state.uncertain?route.fulfill({status:504,json:{detail:'Timeout'}}):route.fulfill({json:{path_id:state.path}});}
    if(path.endsWith('/decline'))state.declines++;
    if(path.endsWith('/received'))return route.fulfill({json:[detail()]});
    if(path.endsWith('/sent'))return route.fulfill({json:[]});
    return route.fulfill({json:detail()});
  });return state;
}

test('public invitation clears fragment and carries only safe continuation into registration',async({page,baseURL})=>{
  await recipient(page,baseURL!);
  await page.goto('/invito#token='+token);
  await expect(page.getByRole('heading',{name:'Giulia ti invita su Socra'})).toBeVisible();
  const title=await page.getByRole('heading',{name:'Giulia ti invita su Socra'}).boundingBox();
  const navbar=await page.getByRole('navigation',{name:'Navigazione pubblica'}).boundingBox();
  expect(title!.y).toBeGreaterThanOrEqual(navbar!.y+navbar!.height+16);
  await expect.poll(()=>new URL(page.url()).hash).toBe('');
  await expect(page.getByRole('link',{name:'Crea account e scopri la proposta',exact:true})).toHaveAttribute('href','/register?next=/inviti');
  expect(await page.evaluate(()=>JSON.stringify({...localStorage,...sessionStorage}))).not.toContain(token);
});

for(const status of [404,409,503])test(`failed invitation context ${status} preserves own lists and can be ignored`,async({page,baseURL})=>{
  await recipient(page,baseURL!);
  let discarded=0;
  await page.route('**/api/invitations/claim',route=>route.fulfill({status,json:{detail:'Questo link non è disponibile.'}}));
  await page.route('**/api/invitations/context',route=>{
    if(route.request().method()==='DELETE')discarded++;
    return route.fulfill({json:{cleared:true}});
  });
  await page.goto('/inviti?elenco=1');
  await expect(page.getByRole('heading',{name:'Proposte ricevute',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Inviti inviati',exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'Apri proposta',exact:true})).toHaveAttribute('href','/inviti/'+id);
  await expect(page.getByText('Questo link non è disponibile.',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Ignora questo link',exact:true}).click();
  await expect(page.getByText('Questo link non è disponibile.',{exact:true})).toHaveCount(0);
  await expect(page.getByRole('heading',{name:'Proposte ricevute',exact:true})).toBeVisible();
  expect(discarded).toBe(1);
});

test('registered recipient sees proposal before survey and can explicitly decline',async({page,baseURL})=>{
  const state=await recipient(page,baseURL!);
  await page.goto('/inviti');
  await expect(page).toHaveURL(new RegExp('/inviti/'+id));
  await expect(page.getByRole('heading',{name:'La proposta di Giulia'})).toBeVisible();
  await expect(page.getByRole('link',{name:'Continua con la survey',exact:true})).toHaveAttribute('href',`/onboarding?next=/inviti/${id}`);
  expect(state.accepts).toBe(0);
  await page.getByRole('button',{name:'Rifiuta invito',exact:true}).click();
  await expect(page.getByRole('status').filter({hasText:'Hai rifiutato questo invito'})).toBeVisible();
  expect(state.declines).toBe(1);
});

test('ready proposal requires email consent and recovers an uncertain accepted path',async({page,baseURL})=>{
  const state=await recipient(page,baseURL!,true);state.uncertain=true;
  await page.goto('/inviti/'+id);
  const submit=page.getByRole('button',{name:'Accetta e inizia il percorso',exact:true});
  await expect(submit).toBeDisabled();
  await page.getByRole('checkbox',{name:'Accetto di condividere la mia email dopo l’accettazione.'}).check();
  await submit.click();
  await expect(page).toHaveURL(/\/paths\/new-invitation-path/);
  expect(state.accepts).toBe(1);
});

test('expired proposal offers recovery without an accept action',async({page,baseURL})=>{
  const state=await recipient(page,baseURL!,true);state.expired=true;
  await page.goto('/inviti/'+id);
  await expect(page.getByRole('status').filter({hasText:'Questo invito è scaduto'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Accetta e inizia il percorso',exact:true})).toHaveCount(0);
  expect(state.accepts).toBe(0);
});

test('registration goes to the proposal before survey without changing the auth payload',async({page,baseURL})=>{
  await recipient(page,baseURL!);
  let submitted:Record<string,unknown>|null=null;
  await page.route('**/api/auth/register',route=>{submitted=route.request().postDataJSON();return route.fulfill({json:{user_id:'u1'}});});
  await page.goto('/register?next=/inviti');
  await page.getByLabel('Nome',{exact:true}).fill('Anna');await page.getByLabel('Cognome',{exact:true}).fill('Rossi');
  await page.getByLabel('Username',{exact:true}).fill('anna_invited');await page.getByLabel('Email',{exact:true}).fill('anna@example.com');
  await page.getByLabel('Password',{exact:true}).fill('StrongPass123');await page.getByLabel('Conferma password',{exact:true}).fill('StrongPass123');
  await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Crea account',exact:true}).click();
  await expect(page.getByRole('heading',{name:'La proposta di Giulia'})).toBeVisible();
  expect(submitted).not.toHaveProperty('token');expect(submitted).not.toHaveProperty('next');
});

test('survey context continues to the associated proposal instead of a learner goal',async({page,baseURL})=>{
  await recipient(page,baseURL!);
  await page.route('**/api/backend/skills/me',route=>route.fulfill({json:{version:1,known_skills:['etf_read'],mentor_skills:['etf_read'],section_d:undisclosed,mentor_available:true}}));
  await page.goto(`/onboarding?next=/inviti/${id}`);
  await expect(page.getByRole('heading',{name:'Aggiungi il tuo contesto personale'})).toBeVisible();
  await page.getByRole('button',{name:'Continua',exact:true}).click();
  await expect(page.getByRole('heading',{name:'La proposta di Giulia'})).toBeVisible();
});

test('changing account hides the private proposal and prevents acceptance',async({page,baseURL})=>{
  const state=await recipient(page,baseURL!,true);
  await page.goto('/inviti/'+id);
  await expect(page.getByRole('heading',{name:'La proposta di Giulia'})).toBeVisible();
  await page.evaluate(()=>{localStorage.setItem('socra-session-change','different-recipient');window.dispatchEvent(new Event('socra:session-refresh'));});
  await expect(page.getByRole('heading',{name:'La proposta di Giulia'})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Accetta e inizia il percorso',exact:true})).toHaveCount(0);
  expect(state.accepts).toBe(0);
});
