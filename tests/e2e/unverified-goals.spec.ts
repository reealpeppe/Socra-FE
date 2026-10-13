import {test,expect,type Page} from '@playwright/test';
import {fixture,undisclosed} from './multi-goal-fixture';

const user={id:'u1',username:'test_user',nickname:'Giulia',email:'test@example.com',level:'L0',role:'user',account_status:'active',is_coach:true,email_delivery_enabled:false};
const unverified={email_verified:false,email_verification_required:true};

async function account(page:Page,flags:Record<string,boolean>){
  await page.route('**/api/backend/auth/me',route=>route.fulfill({json:{...user,...flags}}));
}
function etfTopic(page:Page){return page.locator('details').filter({has:page.getByText('ETF',{exact:true})});}

test.afterEach(async({page})=>{await page.screenshot({path:test.info().outputPath('page.png'),fullPage:true});});

test('unverified account chooses and saves goals without protected matching reads, then matching remains gated',async({page,baseURL})=>{
  const state=await fixture(page,baseURL!,{empty:true,context:undisclosed});
  await account(page,unverified);
  const matchingReads:string[]=[],writes:Record<string,unknown>[]=[];
  await page.route('**/api/backend/matching/**',route=>{
    matchingReads.push(route.request().url());
    return route.fulfill({status:403,json:{detail:'Verify your email before searching profiles or using matching'}});
  });
  await page.route('**/api/backend/goals/me/selection',async route=>{
    writes.push(route.request().postDataJSON());await route.fallback();
  });
  await page.goto('/goal');
  await expect(page.getByRole('heading',{name:'Cosa vuoi imparare?',exact:true})).toBeVisible();
  await etfTopic(page).locator('summary').click();
  await etfTopic(page).getByRole('checkbox',{name:'Leggere la scheda di un ETF',exact:true}).check();
  await etfTopic(page).getByRole('radio',{name:'Guidami passo passo',exact:true}).check();
  await page.screenshot({path:test.info().outputPath('unverified-goal-selected.png'),fullPage:true});
  await page.getByRole('button',{name:'Salva e continua',exact:true}).click();
  await expect(page).toHaveURL(/\/matching$/);
  await expect(page.getByRole('heading',{name:'Conferma la tua email',exact:true})).toBeVisible();
  expect(state.selectionWrites).toBe(1);
  expect(writes).toHaveLength(1);
  expect(writes[0]).toEqual({selections:[{topic:'etf_funds',objective_codes:['etf_read'],discussion_mode:'step_by_step'}],idempotency_key:expect.any(String)});
  expect(matchingReads).toEqual([]);
  await page.goto('/goal');
  await expect(etfTopic(page).getByRole('checkbox',{name:'Leggere la scheda di un ETF',exact:true})).toBeChecked();
  expect(matchingReads).toEqual([]);
});

test('goal and skill reads start while account verification is still loading',async({page,baseURL})=>{
  await fixture(page,baseURL!,{empty:true});
  let release!:()=>void;
  const waiting=new Promise<void>(resolve=>release=resolve);
  await page.route('**/api/backend/auth/me',async route=>{await waiting;await route.fulfill({json:{...user,...unverified}});});
  let goalsRead=false,skillsRead=false;
  await page.route('**/api/backend/goals/me',async route=>{goalsRead=true;await route.fallback();});
  await page.route('**/api/backend/skills/me',async route=>{skillsRead=true;await route.fallback();});
  await page.route('**/api/backend/matching/**',route=>route.fulfill({status:403,json:{detail:'Verify your email before searching profiles or using matching'}}));
  try{
    await page.goto('/goal');
    await expect.poll(()=>goalsRead&&skillsRead).toBe(true);
  }finally{release();}
  await expect(page.getByRole('heading',{name:'Cosa vuoi imparare?',exact:true})).toBeVisible();
});

test('a previous account verification response cannot start protected matching reads',async({page,baseURL})=>{
  await fixture(page,baseURL!,{empty:true});
  let release!:()=>void,authReads=0;
  const waiting=new Promise<void>(resolve=>release=resolve);
  await page.route('**/api/backend/auth/me',async route=>{
    const previous=++authReads===1;
    if(previous)await waiting;
    await route.fulfill({json:{...user,...(previous?{email_verified:true,email_verification_required:true}:{...unverified,id:'u2',username:'another_user'})}});
  });
  const matchingReads:string[]=[];
  await page.route('**/api/backend/matching/**',route=>{matchingReads.push(route.request().url());return route.fulfill({status:403,json:{detail:'Verify your email before searching profiles or using matching'}});});
  try{
    await page.goto('/goal');
    await expect.poll(()=>authReads).toBe(1);
    await expect(page.locator('main').getByRole('status').filter({hasText:'Caricamento obiettivi…'})).toBeVisible();
    await page.evaluate(()=>{localStorage.setItem('socra-session-change','another-account');document.dispatchEvent(new Event('visibilitychange'));});
    await expect(page.getByRole('heading',{name:'Cosa vuoi imparare?',exact:true})).toBeVisible();
    const previousResponse=page.waitForResponse(async response=>response.url().endsWith('/api/backend/auth/me')&&(await response.json()).email_verified===true);
    release();await previousResponse;
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>resolve(null))));
    expect(matchingReads).toEqual([]);
    await etfTopic(page).locator('summary').click();
    await expect(etfTopic(page).getByRole('checkbox',{name:'Leggere la scheda di un ETF',exact:true})).not.toBeChecked();
  }finally{release();}
});

test('unverified goal retry keeps the idempotency key after an uncertain save',async({page,baseURL})=>{
  const state=await fixture(page,baseURL!,{empty:true});await account(page,unverified);
  const writes:Record<string,unknown>[]=[];
  await page.route('**/api/backend/goals/me/selection',async route=>{
    writes.push(route.request().postDataJSON());
    if(writes.length===1)return route.fulfill({status:503,json:{detail:'Save temporarily unavailable'}});
    await route.fallback();
  });
  await page.goto('/goal');
  await etfTopic(page).locator('summary').click();
  await etfTopic(page).getByRole('checkbox',{name:'Leggere la scheda di un ETF',exact:true}).check();
  await etfTopic(page).getByRole('radio',{name:'Guidami passo passo',exact:true}).check();
  const save=page.getByRole('button',{name:'Salva e continua',exact:true});await save.click();
  await expect(page.locator('main').getByRole('alert')).toBeVisible();
  await expect(etfTopic(page).getByRole('checkbox',{name:'Leggere la scheda di un ETF',exact:true})).toBeChecked();
  await save.click();
  await expect(page.getByRole('heading',{name:'Conferma la tua email',exact:true})).toBeVisible();
  expect(writes).toHaveLength(2);expect(writes[1]).toEqual(writes[0]);expect(state.selectionWrites).toBe(1);
});

for(const [name,flags] of [
  ['verified',{email_verified:true,email_verification_required:true}],
  ['verification disabled',{email_verified:false,email_verification_required:false}],
  ['legacy without verification flags',{}],
] as const){
  test(`${name} account still confirms cancellation of a pending proposal before saving`,async({page,baseURL})=>{
    const state=await fixture(page,baseURL!,{pending:true});
    await account(page,flags);
    await page.goto('/goal');
    await etfTopic(page).getByRole('checkbox',{name:'Leggere la scheda di un ETF',exact:true}).uncheck();
    const save=page.getByRole('button',{name:'Aggiorna e vedi i mentor',exact:true});
    await save.click();
    const dialog=page.getByRole('dialog');
    await expect(dialog).toContainText('annullerà la proposta in attesa');
    await dialog.getByRole('button',{name:'Annulla',exact:true}).click();
    expect(state.selectionWrites).toBe(0);
    await save.click();
    await dialog.getByRole('button',{name:'Conferma',exact:true}).click();
    await expect.poll(()=>state.selectionWrites).toBe(1);
    await expect(page).toHaveURL(/\/matching$/);
  });
}

for(const [endpoint,status,flags] of [
  ['/auth/me',503,unverified],
  ['/auth/me',401,unverified],
  ['/matching/requests/me?role=mentee',503,{email_verified:true,email_verification_required:true}],
  ['/matching/requests/me?role=mentee',403,{email_verified:true,email_verification_required:true}],
] as const){
  test(`${endpoint} ${status} does not become an empty pending-proposal list`,async({page,baseURL})=>{
    const state=await fixture(page,baseURL!,{pending:true});
    await account(page,flags);
    let fail=true;
    await page.route(`**/api/backend${endpoint}`,route=>fail?route.fulfill({status,json:{detail:status===401?'Authentication required':'Read temporarily unavailable'}}):route.fallback());
    await page.goto('/goal');
    if(status===401)await expect(page.getByRole('button',{name:'Apri le opzioni di accesso',exact:true})).toBeVisible();
    else await expect(page.locator('main').getByRole('alert')).toBeVisible();
    await expect(page.getByRole('button',{name:/Salva e continua|Aggiorna e vedi i mentor/})).toHaveCount(0);
    expect(state.selectionWrites).toBe(0);
    if(status===401)return;
    fail=false;
    await page.locator('main').getByRole('button',{name:'Riprova',exact:true}).click();
    await expect(etfTopic(page).getByRole('checkbox',{name:'Leggere la scheda di un ETF',exact:true})).toBeChecked();
    if(endpoint.startsWith('/matching')){
      await etfTopic(page).getByRole('checkbox',{name:'Leggere la scheda di un ETF',exact:true}).uncheck();
      await page.getByRole('button',{name:'Aggiorna e vedi i mentor',exact:true}).click();
      await expect(page.getByRole('dialog')).toContainText('annullerà la proposta in attesa');
      expect(state.selectionWrites).toBe(0);
    }
  });
}
