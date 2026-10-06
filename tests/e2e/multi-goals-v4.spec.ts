import {test,expect} from '@playwright/test';
import {fixture,etf,card} from './multi-goal-fixture';

test('selects_etf_and_stocks_and_dashboard_shows_both',async({page,baseURL})=>{
  const state=await fixture(page,baseURL!,{empty:true});
  await page.goto('/goal');
  const etf=page.locator('details').filter({has:page.getByText('ETF',{exact:true})});
  await etf.locator('summary').click();
  await etf.getByRole('checkbox',{name:'Leggere la scheda di un ETF',exact:true}).check();
  await etf.getByRole('radio',{name:'Guidami passo passo',exact:true}).check();
  const stock=page.locator('details').filter({has:page.getByText('Azioni',{exact:true})});
  await stock.locator('summary').click();
  await stock.getByRole('checkbox',{name:'Leggere i dati fondamentali di un’azienda',exact:true}).check();
  await stock.getByRole('radio',{name:'Lavoriamo su un caso concreto',exact:true}).check();
  await page.getByRole('button',{name:'Salva e continua',exact:true}).click();
  await expect.poll(()=>state.selectionWrites).toBe(1);
  expect(state.selections).toHaveLength(2);
  await page.goto('/dashboard');
  const panel=page.locator('section[aria-labelledby="goal-title"]');
  await expect(panel).toContainText('ETF');await expect(panel).toContainText('Azioni');
});

test('aggregate_card_lists_two_themes_and_sends_selected_goal',async({page,baseURL})=>{
  const state=await fixture(page,baseURL!);await page.goto('/matching');
  const card=page.locator('[data-person-id="m-0"]');
  await expect(card).toContainText('ETF');await expect(card).toContainText('Azioni');
  await card.getByRole('button',{name:'Chiedi un confronto'}).click();
  const dialog=page.getByRole('dialog');
  await dialog.getByRole('radio',{name:/Azioni/}).check();
  await dialog.getByRole('checkbox',{name:'Leggere i dati fondamentali di un’azienda',exact:true}).check();
  await dialog.getByLabel('Il tuo messaggio').fill('Vorrei capire insieme i dati fondamentali di questa azienda.');
  await dialog.getByRole('checkbox',{name:/Accetto la condivisione/}).check();
  await dialog.getByRole('button',{name:'Invia',exact:true}).click();
  await expect.poll(()=>state.sent?.goal_id).toBe('g-stock');
  expect(state.sent?.agreed_objective_codes).toEqual(['stock_fundamentals']);
});

test('loads_all_pages_without_duplicate_cards',async({page,baseURL})=>{
  await fixture(page,baseURL!);await page.goto('/matching');
  await expect(page.locator('[data-person-id]')).toHaveCount(10);
  await page.getByRole('button',{name:'Mostra altri',exact:true}).click();
  await expect(page.locator('[data-person-id]')).toHaveCount(12);
  const ids=await page.locator('[data-person-id]').evaluateAll(els=>els.map(el=>el.getAttribute('data-person-id')));
  expect(new Set(ids).size).toBe(12);
});

test('cancel_goal_change_keeps_pending_request',async({page,baseURL})=>{
  const state=await fixture(page,baseURL!,{pending:true});await page.goto('/goal');
  const etf=page.locator('details').filter({has:page.getByText('ETF',{exact:true})});
  await etf.getByRole('checkbox',{name:'Leggere la scheda di un ETF',exact:true}).uncheck();
  await page.getByRole('button',{name:'Aggiorna e vedi i mentor',exact:true}).click();
  const dialog=page.getByRole('dialog');await expect(dialog).toContainText('proposta');
  await dialog.getByRole('button',{name:'Annulla',exact:true}).click();expect(state.selectionWrites).toBe(0);
});

test('cancelled_request_has_clear_status',async({page,baseURL})=>{
  await fixture(page,baseURL!);
  await page.route('**/api/backend/matching/requests/me?**',r=>r.fulfill({json:[{id:'r1',status:'cancelled_by_goal_change',mentee_id:'u1',mentor_id:'m-0',goal_id:etf.id,goal:etf,mentor:{nickname:'Mentor'},initiator_role:'mentee',expires_at:'2026-12-01',created_at:'2026-10-05'}]}));
  await page.goto('/requests?tab=sent');
  await expect(page.getByText('Annullata per modifica dell’obiettivo',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Accetta',exact:true})).toHaveCount(0);
});

test('changing_account_discards_old_pages',async({page,baseURL})=>{
  await fixture(page,baseURL!);await page.goto('/matching');
  await page.getByRole('button',{name:'Mostra altri',exact:true}).click();
  await expect(page.locator('[data-person-id]')).toHaveCount(12);
  await page.route('**/api/backend/matching/candidates/all',r=>r.fulfill({json:{items:[],next_cursor:null}}));
  await page.evaluate(()=>{localStorage.setItem('socra-session-change','new-account');window.dispatchEvent(new Event('socra:session-refresh'));});
  await expect(page.locator('[data-person-id]')).toHaveCount(0);
});

test('aggregate_long_identity_and_details_fit_viewport',async({page,baseURL})=>{
  await fixture(page,baseURL!);
  await page.route('**/api/backend/matching/candidates/all',r=>r.fulfill({json:{items:[{...card(),nickname:'nome_pubblico_molto_lungo'.repeat(4)}],next_cursor:null}}));
  await page.goto('/matching');await expect(page.locator('[data-person-id]')).toHaveCount(1);
  const overflow=await page.locator('[data-person-id], [data-person-id] h2, [data-person-id] details, [data-person-id] button').evaluateAll(nodes=>nodes.some(node=>{const r=node.getBoundingClientRect();return r.right>innerWidth||r.left<0;}));
  expect(overflow).toBe(false);
});

for (const failedEndpoint of ['/goals/me','/skills/me','/matching/requests/me']) {
  test(`failed_initial_selection_read_blocks_writes_and_recovers_${failedEndpoint}`,async({page,baseURL})=>{
    const state=await fixture(page,baseURL!,{pending:true});
    const pattern=`**/api/backend${failedEndpoint}${failedEndpoint.includes('requests')?'?**':''}`;
    let fail=true;
    await page.route(pattern,route=>fail?route.fulfill({status:503,json:{detail:'Lettura temporaneamente non disponibile'}}):route.fallback());
    await page.goto('/goal');
    await expect(page.locator('main').getByRole('alert')).toBeVisible();
    await expect(page.getByRole('button',{name:/Salva e continua|Aggiorna e vedi i mentor/})).toHaveCount(0);
    expect(state.selectionWrites).toBe(0);
    fail=false;
    await page.getByRole('button',{name:'Riprova',exact:true}).click();
    const topic=page.locator('details').filter({has:page.getByText('ETF',{exact:true})});
    await expect(topic.getByRole('checkbox',{name:'Leggere la scheda di un ETF',exact:true})).toBeChecked();
    await topic.getByRole('checkbox',{name:'Leggere la scheda di un ETF',exact:true}).uncheck();
    await page.getByRole('button',{name:'Aggiorna e vedi i mentor',exact:true}).click();
    await expect(page.getByRole('dialog')).toContainText('proposta');
    expect(state.selectionWrites).toBe(0);
  });
}
test('account_change_during_page_request_keeps_new_pagination_usable',async({page,baseURL})=>{
  await fixture(page,baseURL!);
  let release!:()=>void, started!:()=>void;
  const waiting=new Promise<void>(r=>release=r), requested=new Promise<void>(r=>started=r);
  let old=true;
  await page.route('**/api/backend/matching/candidates/all',async route=>{
    const body=route.request().postDataJSON();
    if(old&&body?.cursor){started();await waiting;return route.fulfill({json:{items:[card(99)],next_cursor:null}});}
    return route.fallback();
  });
  await page.goto('/matching');
  await expect(page.locator('[data-person-id]')).toHaveCount(10);
  await page.getByRole('button',{name:'Mostra altri',exact:true}).click();
  await requested;old=false;
  await page.evaluate(()=>{localStorage.setItem('socra-session-change','account-with-more');window.dispatchEvent(new Event('socra:session-refresh'));});
  await expect(page.locator('[data-person-id]')).toHaveCount(10);
  await expect(page.getByRole('button',{name:'Mostra altri',exact:true})).toBeEnabled();
  release();
  await page.getByRole('button',{name:'Mostra altri',exact:true}).click();
  await expect(page.locator('[data-person-id]')).toHaveCount(12);
  await expect(page.locator('[data-person-id="m-99"]')).toHaveCount(0);
});
