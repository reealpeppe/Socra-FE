// Real local BFF/API flow with dedicated synthetic accounts. Providers remain off.
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium,expect} from '@playwright/test';
import {fingerprint} from './ux-review-common.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
assert.ok(process.env.UX_BACKEND_DIR,'Select the isolated backend checkout explicitly');
const backend=path.resolve(process.env.UX_BACKEND_DIR),python=path.join(backend,'.venv','Scripts','python.exe');
const stamp=new Date().toISOString().replaceAll(/[:.]/g,'-'),baseURL='http://127.0.0.1:3187',apiURL='http://127.0.0.1:8184';
const dbName=`invitations-preview-${stamp}.sqlite3`;
const env={...process.env,INVITATIONS_QA_DB:dbName,SOCRA_ENV:'test',SOCRA_EMAIL_ENABLED:'false',SOCRA_EMAIL_VERIFICATION_REQUIRED:'true',
  SOCRA_GOOGLE_MEET_ENABLED:'false',SOCRA_GOOGLE_MEET_TRANSCRIPTS_ENABLED:'false',SOCRA_DATABASE_URL:`sqlite:///${path.join(backend,'.local',dbName).replaceAll('\\','/')}`,
  SOCRA_API_BASE_URL:apiURL,SOCRA_PUBLIC_APP_URL:baseURL,SOCRA_PUBLIC_ORIGINS:baseURL};
execFileSync(process.execPath,['node_modules/next/dist/bin/next','build'],{cwd:root,env,windowsHide:true,stdio:'pipe'});
const seed=(...args)=>JSON.parse(execFileSync(python,['scripts/seed_invitations.py',...args],{cwd:backend,env,encoding:'utf8',windowsHide:true}));
const fixture=seed('seed'),output=path.join(root,'output','playwright','invitations',stamp);
await mkdir(output,{recursive:true});
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const manifest={run_id:stamp,fixture:fixture.fixture,source_fingerprint:await fingerprint(),build:(await readFile(path.join(root,'.next','BUILD_ID'),'utf8')).trim(),
  backend_base:execFileSync('git',['rev-parse','HEAD'],{cwd:backend,encoding:'utf8'}).trim(),frontend_base:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
  artifacts:[],checks:[],technical_status:'running',review_status:'pending',limitations:['Local synthetic SQLite fixture; PostgreSQL is tested separately','Email/Meet providers disabled','First-call metadata simulated only in guarded fixture']};
const children=[];
async function start(command,args,cwd,health){
  if(await fetch(health).then(()=>true).catch(()=>false))throw new Error('Dedicated preview port occupied');
  const child=spawn(command,args,{cwd,env,windowsHide:true,stdio:'ignore'});children.push(child);
  for(let attempt=0;attempt<150;attempt++){
    if(child.exitCode!==null)throw new Error(`Preview exited: ${child.exitCode}`);
    if(await fetch(health).then(response=>response.ok).catch(()=>false))return;
    await new Promise(resolve=>setTimeout(resolve,200));
  }throw new Error('Local preview did not start');
}
async function api(page,endpoint,body){
  const result=await page.evaluate(async({endpoint,body})=>{
    const response=await fetch('/api/backend'+endpoint,{method:body?'POST':'GET',credentials:'include',cache:'no-store',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});
    return {status:response.status,body:await response.json()};
  },{endpoint,body});assert.equal(result.status,200,JSON.stringify(result.body));return result.body;
}
let browser;
try{
  await start(python,['-m','uvicorn','app.main:app','--host','127.0.0.1','--port','8184'],backend,apiURL+'/health');
  await start(process.execPath,['node_modules/next/dist/bin/next','start','-p','3187'],root,baseURL+'/login');
  browser=await chromium.launch();
  for(const [viewport,size] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
    const account=fixture.users[viewport];
    const inviter=await browser.newContext({viewport:size,baseURL}),recipient=await browser.newContext({viewport:size,baseURL});
    const sender=await inviter.newPage(),page=await recipient.newPage();
    const capture=async(target,stage)=>{
      const file=`${viewport}-${stage}.png`,bytes=await target.screenshot({path:path.join(output,file),animations:'disabled'});
      manifest.artifacts.push({file,viewport,sha256:digest(bytes)});
      if(['before-survey','ready'].includes(stage)){
        const fullFile=`${viewport}-${stage}-full.png`,fullBytes=await target.screenshot({path:path.join(output,fullFile),fullPage:true,animations:'disabled'});
        manifest.artifacts.push({file:fullFile,viewport,sha256:digest(fullBytes)});
      }
      assert.equal(await target.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);
    };
    await sender.goto('/login?next=/matching');await sender.getByLabel('Username o email',{exact:true}).fill(account.username);
    await sender.getByLabel('Password',{exact:true}).fill('SocraInvitesDemo2026!');await sender.getByRole('button',{name:'Accedi',exact:true}).click();
    await expect(sender.getByRole('button',{name:'Crea un invito',exact:true})).toBeVisible();
    assert.equal((await api(sender,'/auth/me')).id,account.id);
    await capture(sender,'empty');await sender.getByRole('button',{name:'Crea un invito',exact:true}).click();
    const dialog=sender.getByRole('dialog');
    await expect(dialog).toBeVisible();await capture(sender,'dialog-open');
    await dialog.getByLabel('Email della persona da invitare').fill(account.recipient_email);
    await dialog.getByRole('checkbox',{name:'Leggere e comprendere un ETF',exact:true}).check();
    await dialog.getByRole('checkbox',{name:'Accetto di condividere la mia email dopo l’accettazione.'}).check();
    await capture(sender,'dialog');await dialog.getByRole('button',{name:'Invia invito',exact:true}).click();
    await expect(dialog.getByRole('status')).toContainText('L’invio email non è disponibile');
    await capture(sender,'saved');
    const link=seed('invitation-link',account.username).url;
    await sender.goto(link);await expect(sender.getByRole('heading',{name:`${account.username} ti invita su Socra`})).toBeVisible();
    await sender.goto('/inviti?elenco=1');
    await expect(sender.getByRole('heading',{name:'Il link di invito richiede attenzione',exact:true})).toBeVisible();
    await expect(sender.getByRole('heading',{name:'Inviti inviati',exact:true})).toBeVisible();
    await expect(sender.getByText(account.recipient_email,{exact:true})).toBeVisible();
    await capture(sender,'context-recovery');await sender.getByRole('button',{name:'Ignora questo link',exact:true}).click();
    await expect(sender.getByRole('heading',{name:'Il link di invito richiede attenzione',exact:true})).toHaveCount(0);
    await expect(sender.getByRole('heading',{name:'Inviti inviati',exact:true})).toBeVisible();
    await page.goto(link);await expect(page.getByRole('heading',{name:`${account.username} ti invita su Socra`})).toBeVisible();
    const title=await page.getByRole('heading',{name:`${account.username} ti invita su Socra`}).boundingBox(),navbar=await page.getByRole('navigation',{name:'Navigazione pubblica'}).boundingBox();
    assert.ok(title.y>=navbar.y+navbar.height+16,'Invitation title is hidden under public navigation');
    assert.equal(new URL(page.url()).hash,'');await capture(page,'landing');
    await page.getByRole('link',{name:'Crea account e scopri la proposta',exact:true}).click();
    await page.getByLabel('Nome',{exact:true}).fill('Andrea');await page.getByLabel('Cognome',{exact:true}).fill('Demo');
    await page.getByLabel('Username',{exact:true}).fill(account.recipient_username);await page.getByLabel('Email',{exact:true}).fill(account.recipient_email);
    await page.getByLabel('Password',{exact:true}).fill('SocraInvitesDemo2026!');await page.getByLabel('Conferma password',{exact:true}).fill('SocraInvitesDemo2026!');
    await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Crea account',exact:true}).click();
    await expect(page.getByRole('heading',{name:`La proposta di ${account.username}`})).toBeVisible();
    const proposalPath=new URL(page.url()).pathname;
    assert.equal((await api(page,'/surveys/onboarding/me')).latest_answer_id,null);
    await capture(page,'before-survey');await page.getByRole('link',{name:'Continua con la survey',exact:true}).click();
    await page.locator('summary').filter({hasText:/^ETF/}).click();
    await page.getByRole('checkbox',{name:'So: Leggere e comprendere un ETF',exact:true}).check();
    await page.getByRole('checkbox',{name:'Posso aiutare: Leggere e comprendere un ETF',exact:true}).check();
    await page.getByRole('button',{name:'Conferma le risposte',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Aggiungi il tuo contesto personale'})).toBeVisible();
    for(let index=1;index<=5;index++)await page.locator(`select[name=D${index}]`).selectOption('undisclosed');
    await page.getByRole('button',{name:'Continua',exact:true}).click();
    await expect(page).toHaveURL(baseURL+proposalPath);await expect(page.getByRole('heading',{name:`La proposta di ${account.username}`})).toBeVisible();
    const verification=seed('verification-link',account.recipient_username).url;
    const verify=await recipient.newPage();await verify.goto(verification);await verify.getByRole('button',{name:'Conferma email',exact:true}).click();
    await expect(verify.getByRole('status')).toContainText('Email verificata');await verify.close();
    await page.reload();await expect(page.getByRole('button',{name:'Accetta e inizia il percorso',exact:true})).toBeVisible();
    await page.getByRole('checkbox',{name:'Accetto di condividere la mia email dopo l’accettazione.'}).check();await capture(page,'ready');
    await page.getByRole('button',{name:'Accetta e inizia il percorso',exact:true}).evaluate(button=>button.scrollIntoView({block:'center',behavior:'instant'}));
    await capture(page,'ready-controls');
    await page.getByRole('button',{name:'Accetta e inizia il percorso',exact:true}).click();await expect(page).toHaveURL(/\/paths\//);
    const pathId=new URL(page.url()).pathname.split('/').at(-1);
    assert.equal((await api(sender,'/wallet/me')).balance,2);
    assert.equal((await api(page,'/wallet/me')).balance,2);
    await expect(page.getByText(account.username,{exact:true}).first()).toBeVisible();await capture(page,'path');
    seed('first-call',pathId);
    await api(sender,`/paths/${pathId}/close-side`,{});await api(page,`/paths/${pathId}/close-side`,{});
    await api(sender,`/feedback/${pathId}/mentee`,{answers:{objective_outcomes:[{code:'etf_read',result:'yes',can_help:'no',share_skill:false}],clarity:'mixed',would_repeat:'yes',external_promotion:false}});
    await api(page,`/feedback/${pathId}/mentor`,{answers:{objective_outcomes:[{code:'etf_read',result:'yes'}],engagement:'active'}});
    assert.equal((await api(sender,'/wallet/me')).balance,5);assert.equal((await api(page,'/wallet/me')).balance,6);
    await page.goto('/wallet');await expect(page.getByText('Primo percorso da invito completato: 3 crediti bonus',{exact:false}).first()).toBeVisible();await capture(page,'wallet');
    manifest.checks.push({viewport,real_login:true,real_invitation:true,context_recovery:true,proposal_before_survey:true,survey_return:proposalPath,email_verified:true,cost:0,mentor_reward:1,final_balances:[5,6],no_provider_calls:true});
    // Keep each viewport's empty search independent of the prior fixture mentor.
    await page.evaluate(async()=>{const response=await fetch('/api/backend/profiles/me/mentor-status',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({is_coach:false})});if(!response.ok)throw new Error('Fixture mentor pause failed');});
    await inviter.close();await recipient.close();
  }
  const existing=seed('existing-pair');
  const senderContext=await browser.newContext({viewport:{width:1440,height:1000},baseURL}),mentorContext=await browser.newContext({viewport:{width:1440,height:1000},baseURL});
  const sender=await senderContext.newPage(),mentor=await mentorContext.newPage();
  async function login(page,username,next='/inviti'){
    await page.goto('/login?next='+next);await page.getByLabel('Username o email',{exact:true}).fill(username);await page.getByLabel('Password',{exact:true}).fill('SocraInvitesDemo2026!');await page.getByRole('button',{name:'Accedi',exact:true}).click();await expect(page).not.toHaveURL(/\/login/);
  }
  await login(sender,existing.inviter.username);
  await api(sender,'/invitations',{email:existing.mentor.email,goal_id:existing.inviter.goal_id,objective_codes:['etf_read'],email_sharing_accepted:true,idempotency_key:crypto.randomUUID()});
  await mentor.goto(seed('invitation-link',existing.inviter.username).url);await mentor.getByRole('link',{name:'Ho già un account',exact:true}).click();
  await mentor.getByLabel('Username o email',{exact:true}).fill(existing.mentor.username);await mentor.getByLabel('Password',{exact:true}).fill('SocraInvitesDemo2026!');await mentor.getByRole('button',{name:'Accedi',exact:true}).click();
  await expect(mentor.getByRole('heading',{name:`La proposta di ${existing.inviter.username}`})).toBeVisible();
  await expect(mentor.getByText('Il bonus per nuovi iscritti non si applica a questo invito.',{exact:true})).toBeVisible();
  await mentor.getByRole('checkbox',{name:'Accetto di condividere la mia email dopo l’accettazione.'}).check();
  const existingFile='desktop-existing-proposal.png',existingBytes=await mentor.screenshot({path:path.join(output,existingFile)});
  manifest.artifacts.push({file:existingFile,viewport:'desktop',sha256:digest(existingBytes)});
  await mentor.getByRole('button',{name:'Accetta e inizia il percorso',exact:true}).click();await expect(mentor).toHaveURL(/\/paths\//);
  const existingPath=new URL(mentor.url()).pathname.split('/').at(-1);seed('first-call',existingPath);
  await api(sender,`/paths/${existingPath}/close-side`,{});await api(mentor,`/paths/${existingPath}/close-side`,{});
  await api(sender,`/feedback/${existingPath}/mentee`,{answers:{objective_outcomes:[{code:'etf_read',result:'yes',can_help:'no',share_skill:false}],clarity:'mixed',would_repeat:'yes',external_promotion:false}});
  await api(mentor,`/feedback/${existingPath}/mentor`,{answers:{objective_outcomes:[{code:'etf_read',result:'yes'}],engagement:'active'}});
  assert.equal((await api(sender,'/wallet/me')).balance,2);assert.equal((await api(mentor,'/wallet/me')).balance,3);
  assert.equal((await api(mentor,'/wallet/me/transactions')).filter(row=>row.reason==='invitation_bonus').length,0);
  manifest.checks.push({existing_recipient:true,final_balances:[2,3],no_invitation_bonus:true});
  await senderContext.close();await mentorContext.close();
  assert.equal(await fingerprint(),manifest.source_fingerprint,'Product sources changed during capture');
  manifest.technical_status='passed';
}catch(error){manifest.technical_status='failed';manifest.error=error.message;throw error;}
finally{
  if(browser)await browser.close();
  for(const child of children.reverse()){
    if(process.platform==='win32')execFileSync('taskkill',['/pid',String(child.pid),'/t','/f'],{windowsHide:true,stdio:'ignore'});
    else child.kill();
  }
  await writeFile(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2));
  console.log(JSON.stringify({output,technical_status:manifest.technical_status,screenshots:manifest.artifacts.length}));
}
