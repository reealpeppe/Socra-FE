import {expect, test, type Page} from '@playwright/test';
import {fixture} from './multi-goal-fixture';

const launch = {phase:'prelaunch', campaign_enabled:true, email_bonus:1, registration_bonus:2, redemption_days:30,
  redeem_until:null, email_delivery_enabled:true};
async function setup(page:Page, blocked=true) {
  await page.context().addCookies([{name:'socra_session',value:'test-session',domain:'127.0.0.1',path:'/'}]);
  await page.route('**/api/prelaunch/status', route => route.fulfill({json:launch}));
  await page.route('**/api/backend/auth/me', route => route.fulfill({json:{id:'u1',username:'reader',email:'reader@example.com',
    nickname:'Reader', role:'user', account_status:'active',email_verified:true,email_verification_required:true,prelaunch_blocked:blocked}}));
  await page.route('**/api/backend/prelaunch/me', route => route.fulfill({json:{...launch,blocked,reserved_bonus:2,awarded_bonus:0}}));
}
test('waiting screen blocks direct community URLs without requesting community data', async ({page}) => {
  await setup(page);
  const operational:string[]=[];
  page.on('request', request => { if (/\/api\/backend\/(matching|paths|notifications|wallet)/.test(request.url())) operational.push(request.url()); });
  await page.goto('/matching');
  await expect(page.getByRole('heading', {name:'La community sta arrivando.'})).toBeVisible();
  await expect(page.getByText('prepara il tuo profilo se non lo hai già fatto', {exact:false})).toBeVisible();
  await expect(page.getByRole('link', {name:'Modifica il tuo profilo'})).toBeVisible();
  expect(operational).toEqual([]);
  await page.reload();
  await expect(page.getByRole('heading', {name:'La community sta arrivando.'})).toBeVisible();
});
test('single email entry leads to a dedicated thank you page', async ({page}) => {
  await page.route('**/api/prelaunch/status', route => route.fulfill({json:launch}));
  await page.route('**/api/backend/auth/me', route => route.fulfill({status:401,json:{detail:'Authentication required'}}));
  await page.route('**/api/prelaunch/join', route => route.fulfill({json:{status:'ok'}}));
  await page.goto('/prelancio');
  await page.getByLabel('La tua email', {exact:true}).fill('lead@example.com');
  await page.getByLabel('Desidero ricevere').check();
  await page.getByRole('button', {name:'Inizia da qui',exact:true}).click();
  await expect(page).toHaveURL(/\/prelancio\/grazie$/);
  await expect(page.getByRole('heading',{name:'Grazie, ci sei anche tu.'})).toBeVisible();
  await expect(page.getByText('Controlla la tua posta.',{exact:true})).toBeVisible();
  expect(await page.locator('body').evaluate(el => el.scrollWidth <= window.innerWidth)).toBeTruthy();
});

test('prelaunch login and registration share a single email entry',async({page})=>{
  await setup(page);
  for(const path of ['/login','/register']){
    await page.goto(path);
    await expect(page.getByLabel('La tua email',{exact:true})).toBeVisible();
    await expect(page.getByRole('button',{name:'Inizia da qui',exact:true})).toBeVisible();
    await expect(page.getByRole('button',{name:'Crea account',exact:true})).toHaveCount(0);
  }
});

test('returning account always sees the thank you screen after login',async({page})=>{
  await setup(page);
  await page.route('**/api/auth/login',route=>route.fulfill({json:{user_id:'u1'}}));
  await page.goto('/login?accesso=1&next=%2Fsettings');
  await page.getByLabel('Username o email').fill('reader');
  await page.getByLabel('Password',{exact:true}).fill('StrongPass123');
  await page.getByRole('button',{name:'Accedi',exact:true}).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading',{name:'La community sta arrivando.'})).toBeVisible();
  await expect(page.getByText('Ti terremo aggiornato via email',{exact:false})).toBeVisible();
});

test('personal link completes an already verified account and starts the survey',async({page})=>{
  await setup(page);
  let submitted:Record<string,unknown>|undefined;
  await page.route('**/api/prelaunch/profile-link',route=>route.fulfill({json:{email:'lead@example.test'}}));
  await page.route('**/api/auth/prelaunch-register',route=>{submitted=route.request().postDataJSON();return route.fulfill({json:{user_id:'u1'}});});
  await page.route('**/api/backend/skills/catalog',route=>route.fulfill({status:503,json:{detail:'fixture survey'}}));
  await page.goto('/prelancio/completa-profilo#token=personal-token-for-completion-test');
  await expect(page.getByLabel('Email',{exact:true})).toHaveValue('lead@example.test');
  await expect(page.getByLabel('Email',{exact:true})).not.toBeEditable();
  expect(page.url()).not.toContain('token=');
  await page.getByLabel('Nome',{exact:true}).fill('Test');
  await page.getByLabel('Cognome',{exact:true}).fill('Person');
  await page.getByLabel('Username',{exact:true}).fill('test-reader');
  await page.getByLabel('Password',{exact:true}).fill('StrongPass123');
  await page.getByLabel('Conferma password',{exact:true}).fill('StrongPass123');
  await page.getByLabel('Dichiaro di avere almeno 18 anni').check();
  await page.getByRole('button',{name:'Completa il profilo',exact:true}).click();
  await expect(page).toHaveURL(/\/onboarding$/);
  expect(submitted?.email).toBe('lead@example.test');
  expect(submitted?.token).toBe('personal-token-for-completion-test');
});
test('confirmation removes the token and requires an explicit action', async ({page}) => {
  await page.route('**/api/prelaunch/status', route => route.fulfill({json:launch}));
  let confirmed=0;
  await page.route('**/api/prelaunch/confirm', route => { confirmed++; return route.fulfill({json:{status:'ok'}}); });
  await page.goto('/prelancio/conferma#token=synthetic-private-token-for-test');
  await expect(page.getByRole('button', {name:'Conferma il mio indirizzo'})).toBeVisible();
  expect(page.url()).not.toContain('token=');
  expect(confirmed).toBe(0);
  await page.getByRole('button', {name:'Conferma il mio indirizzo'}).click();
  await expect(page.getByRole('status').filter({hasText:'Ti avviseremo'})).toBeVisible();
  expect(confirmed).toBe(1);
});

test('prelaunch settings loads and saves the profile without operational alerts', async ({page}) => {
  await setup(page);
  const operational:string[]=[];
  page.on('request', request => { if (/\/api\/backend\/(mentor-alerts|notifications|matching|wallet)/.test(request.url())) operational.push(request.url()); });
  await page.route('**/api/backend/skills/me', route => route.fulfill({json:null}));
  let profile={user_id:'u1',username:'reader',nickname:'Reader',first_name:'Test',last_name:'User',bio:'Presentazione iniziale',avatar_url:null};
  await page.route('**/api/backend/profiles/me', async route => {
    if (route.request().method()==='PATCH') profile={...profile,...route.request().postDataJSON()};
    await route.fulfill({json:profile});
  });
  await page.route('**/api/backend/mentor-alerts/**', route => route.fulfill({json:[]}));
  await page.goto('/settings');
  await expect(page.getByLabel('Username',{exact:true})).toHaveValue('reader');
  await page.getByLabel('Presentazione breve').fill('Profilo pronto per il lancio');
  await page.getByRole('button',{name:'Salva profilo',exact:true}).click();
  await expect(page.getByRole('status').filter({hasText:'Profilo aggiornato.'})).toBeVisible();
  expect(profile.bio).toBe('Profilo pronto per il lancio');
  expect(operational).toEqual([]);
});

test('prelaunch goals can be prepared without reading matching requests',async({page,baseURL})=>{
  const state=await fixture(page,baseURL!,{empty:true});
  await setup(page);
  const operational:string[]=[];
  page.on('request',request=>{if(/\/api\/backend\/(matching|notifications|wallet)/.test(request.url()))operational.push(request.url());});
  await page.goto('/goal');
  await expect(page.getByRole('heading',{name:'Cosa vuoi imparare?',exact:true})).toBeVisible();
  await page.getByText('ETF',{exact:true}).click();
  await page.getByRole('checkbox',{name:'Confrontare due ETF',exact:true}).check();
  await page.getByRole('radio',{name:'Guidami passo passo',exact:true}).check();
  await page.getByRole('button',{name:'Salva e continua',exact:true}).click();
  await expect(page.getByRole('heading',{name:'La community sta arrivando.'})).toBeVisible();
  expect(state.selectionWrites).toBe(1);
  expect(operational).toEqual([]);
});
