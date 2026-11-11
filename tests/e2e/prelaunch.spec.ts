import {expect, test, type Page} from '@playwright/test';
import {fixture} from './multi-goal-fixture';

const launch = {phase:'prelaunch', campaign_enabled:true, email_bonus:1, registration_bonus:2, redemption_days:30,
  redeem_until:null, expected_launch_at:null, email_delivery_enabled:true};
const preparation = {next_step:'ready',first_name:'Reader',intent:'learn',email_verified:true,
  experience_saved:true,goal:'Confrontare due ETF',verification_delivery:null};
async function setup(page:Page, blocked=true, authenticated=true) {
  if (authenticated) await page.context().addCookies([{name:'socra_session',value:'test-session',domain:'127.0.0.1',path:'/'}]);
  await page.route('**/api/prelaunch/status', route => route.fulfill({json:launch}));
  await page.route('**/api/backend/auth/me', route => authenticated ? route.fulfill({json:{id:'u1',username:'reader',email:'reader@example.com',
    nickname:'Reader', role:'user', account_status:'active',email_verified:true,email_verification_required:true,prelaunch_blocked:blocked}})
    : route.fulfill({status:401,json:{detail:'Authentication required'}}));
  await page.route('**/api/backend/prelaunch/me', route => route.fulfill({json:{...launch,blocked,reserved_bonus:2,awarded_bonus:0,
    preparation,credits:3,referrals:{code:null,accepted:0,ready:0}}}));
  return () => { authenticated=true; };
}
test('waiting screen blocks direct community URLs without requesting community data', async ({page}) => {
  await setup(page);
  const operational:string[]=[];
  page.on('request', request => { if (/\/api\/backend\/(matching|paths|notifications|wallet)/.test(request.url())) operational.push(request.url()); });
  await page.goto('/matching');
  await expect(page.getByRole('heading', {name:'Ciao Reader, ci sei.'})).toBeVisible();
  await expect(page.getByRole('link', {name:'Modifica dati'})).toBeVisible();
  expect(operational).toEqual([]);
  await page.reload();
  await expect(page.getByRole('heading', {name:'Ciao Reader, ci sei.'})).toBeVisible();
});
test('single email entry leads to a dedicated thank you page', async ({page}) => {
  await page.route('**/api/prelaunch/status', route => route.fulfill({json:launch}));
  await page.route('**/api/backend/auth/me', route => route.fulfill({status:401,json:{detail:'Authentication required'}}));
  await page.route('**/api/prelaunch/reserve', route => route.fulfill({json:{status:'ok'}}));
  await page.route('**/api/prelaunch/reservation', route => route.fulfill({json:{email:'lead@example.com'}}));
  await page.goto('/prelancio');
  await page.getByLabel('La tua email', {exact:true}).fill('lead@example.com');
  await page.getByRole('checkbox',{name:'Richiedo il posto',exact:false}).check();
  await page.getByRole('button', {name:'Riservami un posto',exact:true}).click();
  await expect(page).toHaveURL(/\/prelancio\/grazie$/);
  await expect(page.getByRole('heading',{name:'Sei dentro. Il tuo posto è riservato.'})).toBeVisible();
  await expect(page.getByRole('link',{name:'Completa ora'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Continuerò più tardi'})).toBeVisible();
  expect(await page.locator('body').evaluate(el => el.scrollWidth <= window.innerWidth)).toBeTruthy();
});

test('registration link and optional launch updates are separate choices',async({page})=>{
  await setup(page,true,false);
  let submitted:Record<string,unknown>|undefined;
  await page.route('**/api/prelaunch/reserve',route=>{submitted=route.request().postDataJSON();return route.fulfill({json:{status:'ok'}});});
  await page.goto('/prelancio');
  await expect(page.getByRole('complementary',{name:'Pre-lancio Socra'})).toHaveCount(0);
  await page.getByLabel('La tua email',{exact:true}).fill('lead@example.test');
  const link=page.getByRole('checkbox',{name:'Richiedo il posto',exact:false});
  const updates=page.getByRole('checkbox',{name:'Voglio ricevere aggiornamenti',exact:false});
  await expect(link).not.toBeChecked();await expect(updates).not.toBeChecked();
  await expect(updates).not.toHaveAttribute('required');
  await link.check();await page.getByRole('button',{name:'Riservami un posto',exact:true}).click();
  await expect(page).toHaveURL(/\/prelancio\/grazie$/);
  expect(submitted?.accepted).toBe(true);expect(submitted?.updates_opt_in).toBe(false);
  await page.goto('/prelancio');await page.getByLabel('La tua email',{exact:true}).fill('other@example.test');
  await link.check();await updates.check();await page.getByRole('button',{name:'Riservami un posto',exact:true}).click();
  await expect(page).toHaveURL(/\/prelancio\/grazie$/);expect(submitted?.updates_opt_in).toBe(true);
  await page.goto('/prelancio/condizioni');await expect(page.getByText(/versione/i)).toHaveCount(0);
});

test('invitation survives reload and can be explicitly discarded', async ({page}) => {
  await setup(page,true,false);
  let submitted: Record<string, unknown> | undefined;
  await page.route('**/api/prelaunch/referral', route => route.fulfill({json:{inviter:'marta'}}));
  await page.route('**/api/prelaunch/reserve', route => {
    submitted = route.request().postDataJSON();
    return route.fulfill({json:{status:'ok'}});
  });
  await page.goto('/prelancio#invito=signed-public-invitation');
  await expect(page.getByText('marta ti ha invitato su Socra.')).toBeVisible();
  await page.reload();
  await expect(page.getByText('marta ti ha invitato su Socra.')).toBeVisible();
  await page.getByLabel('La tua email', {exact:true}).fill('invited@example.test');
  await page.getByRole('checkbox', {name:'Richiedo il posto',exact:false}).check();
  await page.getByRole('button', {name:'Accetta l’invito',exact:true}).click();
  await expect(page).toHaveURL(/prelancio\/grazie$/);
  expect(submitted?.referral).toBe('signed-public-invitation');
  await page.goto('/prelancio#invito=another-public-invitation');
  await expect(page.getByText('marta ti ha invitato su Socra.')).toBeVisible();
  await page.getByRole('button', {name:'Continua senza invito',exact:true}).click();
  await page.reload();
  await expect(page.getByRole('button', {name:'Riservami un posto',exact:true})).toBeVisible();
  await expect(page.getByText('marta ti ha invitato su Socra.')).toHaveCount(0);
});

test('prelaunch login is distinct from registration email entry',async({page})=>{
  await setup(page,true,false);
  await page.goto('/login');
  await expect(page.getByLabel('Username o email')).toBeVisible();
  await expect(page.getByRole('button',{name:'Accedi',exact:true})).toBeVisible();
  await page.goto('/register');
  await expect(page.getByLabel('La tua email',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Riservami un posto',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Crea account',exact:true})).toHaveCount(0);
});

test('returning account always sees its prelaunch area after login',async({page})=>{
  const loggedIn=await setup(page,true,false);
  await page.route('**/api/auth/login',route=>{loggedIn();return route.fulfill({json:{user_id:'u1'},headers:{'set-cookie':'socra_session=test-session; Path=/; SameSite=Lax'}});});
  await page.goto('/login?accesso=1&next=%2Fsettings');
  await page.getByLabel('Username o email').fill('reader');
  await page.getByLabel('Password',{exact:true}).fill('StrongPass123');
  await page.getByRole('button',{name:'Accedi',exact:true}).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading',{name:'Ciao Reader, ci sei.'})).toBeVisible();
  await expect(page.getByText('Profilo completo, email confermata.')).toBeVisible();
});

test('personal link completes an already verified account and starts preparation',async({page})=>{
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
  await page.getByRole('button',{name:'Salva e continua',exact:true}).click();
  await expect(page).toHaveURL(/\/prelancio\/prepara$/);
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
  await page.getByLabel('Nome',{exact:true}).fill('Ada');
  await page.getByRole('button',{name:'Salva dati',exact:true}).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(profile.first_name).toBe('Ada');
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
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText('Profilo completo, email confermata.')).toBeVisible();
  expect(state.selectionWrites).toBe(1);
  expect(operational).toEqual([]);
});

for (const suffix of ['', '?next=%2Finviti%2F00000000-0000-0000-0000-000000000001']) {
  test('experience waits for account state before operational reads ' + suffix, async ({page,baseURL}) => {
    await fixture(page,baseURL!);
    await setup(page);
    let release!: () => void;
    const waiting = new Promise<void>(resolve => { release = resolve; });
    await page.route('**/api/backend/auth/me', async route => {
      await waiting;
      return route.fulfill({json:{id:'u1',username:'reader',email:'reader@example.test',
        role:'user',account_status:'active',email_verified:true,prelaunch_blocked:true}});
    });
    const operational: string[] = [];
    page.on('request', request => {
      if (/\/api\/backend\/(invitations|profiles\/u1|matching)/.test(request.url())) operational.push(request.url());
    });
    try {
      const ownData = page.waitForRequest(request => request.url().endsWith('/api/backend/skills/me'));
      await page.goto('/competenze' + suffix);
      await expect(page.getByRole('heading',{name:'Verifica dell’accesso',exact:true})).toBeVisible();
      expect(operational).toEqual([]);
      release();
      await ownData;
      await expect(page.getByRole('heading',{name:'Rivedi ciò che sai fare',exact:true})).toBeVisible();
      expect(operational).toEqual([]);
    } finally { release(); }
  });
}
