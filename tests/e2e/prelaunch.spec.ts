import {expect, test, type Page} from '@playwright/test';

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
  await expect(page.getByRole('heading', {name:'Socra sta arrivando!'})).toBeVisible();
  await expect(page.getByText('prepara il tuo profilo se non lo hai già fatto', {exact:false})).toBeVisible();
  await expect(page.getByRole('link', {name:'Modifica il tuo profilo'})).toBeVisible();
  expect(operational).toEqual([]);
  await page.reload();
  await expect(page.getByRole('heading', {name:'Socra sta arrivando!'})).toBeVisible();
});
test('email-only signup explains confirmation and retains the registration alternative', async ({page}) => {
  await page.route('**/api/prelaunch/status', route => route.fulfill({json:launch}));
  await page.route('**/api/backend/auth/me', route => route.fulfill({status:401,json:{detail:'Authentication required'}}));
  await page.route('**/api/prelaunch/subscribe', route => route.fulfill({json:{status:'ok'}}));
  await page.goto('/prelancio');
  await page.getByLabel('La tua email', {exact:true}).fill('lead@example.com');
  await page.getByLabel('Desidero ricevere').check();
  await page.getByRole('button', {name:'Avvisami al lancio'}).click();
  await expect(page.getByRole('status').filter({hasText:'Controlla la tua email'})).toBeVisible();
  await expect(page.getByRole('link',{name:'Crea il tuo account',exact:true}).first()).toBeVisible();
  expect(await page.locator('body').evaluate(el => el.scrollWidth <= window.innerWidth)).toBeTruthy();
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
