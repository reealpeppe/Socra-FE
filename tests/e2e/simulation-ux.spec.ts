import { expect, test } from '@playwright/test';
import { fixture, card, etf } from './multi-goal-fixture';

test('pending incoming proposal opens the received list from aggregate matching', async ({page,baseURL}) => {
  await fixture(page,baseURL!);
  await page.route('**/api/backend/matching/requests/me?**',r=>r.fulfill({json:[{id:'received',mentee_id:'u1',mentor_id:'m-0',goal_id:etf.id,status:'pending',initiator_role:'mentor',expires_at:'2099-12-01T12:00:00Z',goal:etf}]}));
  await page.goto('/matching');
  await expect(page.getByRole('link',{name:'Gestisci la proposta',exact:true})).toHaveAttribute('href','/requests?tab=received');
});

test('mentor can open an incoming pending proposal from the apprentice matching card', async ({page,baseURL}) => {
  await fixture(page,baseURL!);
  await page.route('**/api/backend/matching/requests/me?**',r=>r.fulfill({json:[{id:'incoming',mentee_id:'learner-2',mentor_id:'u1',goal_id:etf.id,status:'pending',initiator_role:'mentee',expires_at:'2099-12-01T12:00:00Z',goal:etf}]}));
  await page.route('**/api/backend/matching/mentees/all',r=>r.fulfill({json:{items:[{...card(),mentor_id:undefined,mentee_id:'learner-2',nickname:'Bruno'}],next_cursor:null}}));
  await page.goto('/matching/mentees');
  await expect(page.getByRole('link',{name:'Vedi la proposta',exact:true})).toHaveAttribute('href','/requests?tab=received');
});

test('proposal banner includes the public person and topic supplied by the notification', async ({page,baseURL}) => {
  await fixture(page,baseURL!);
  await page.route('**/api/backend/matching/requests/me?**',r=>r.fulfill({json:[{id:'received',mentee_id:'u1',mentor_id:'m-0',goal_id:etf.id,status:'pending',initiator_role:'mentor',expires_at:'2099-12-01T12:00:00Z',goal:etf}]}));
  await page.route('**/api/backend/notifications/me',r=>r.fulfill({json:[{id:'context-note',type:'mentor_proposal_received',read_at:null,created_at:'2026-10-13T22:30:00Z',payload:{request_id:'received',message:'Bruno · ETF: Hai ricevuto una nuova proposta di percorso.',link:'/requests'}}]}));
  await page.goto('/matching');
  await expect(page.getByRole('status',{name:'Nuova proposta'})).toContainText('Bruno · ETF');
});

test('ETF help is available during the experience selection before choosing activities', async ({page,baseURL}) => {
  await fixture(page,baseURL!);
  await page.goto('/competenze');
  const help=page.getByText('Cos’è un ETF?',{exact:true});
  await expect(help).toBeVisible();
  await help.click();
  await expect(page.getByText('ETF significa Exchange Traded Fund: un fondo quotato in borsa.',{exact:true})).toBeVisible();
});
