import {test,expect} from '@playwright/test';
import {fixture,undisclosed} from './multi-goal-fixture';

test('survey_always_offers_optional_context_and_skip_shows_banner_without_write',async({page,baseURL})=>{
  const state=await fixture(page,baseURL!);await page.goto('/competenze');
  await page.getByRole('checkbox',{name:'Confermo le attività indicate, anche se non ne ho selezionata nessuna.'}).check();
  await page.getByRole('button',{name:'Conferma le risposte',exact:true}).click();
  await expect(page.getByText('Contesto personale',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Salta per ora',exact:true}).click();
  expect(state.contextWrites).toBe(0);await page.goto('/dashboard');
  await expect(page.getByText('Completa il tuo profilo!',{exact:true})).toBeVisible();
});

test('saving_five_answers_removes_banner_after_reload',async({page,baseURL})=>{
  const state=await fixture(page,baseURL!);await page.goto('/settings#personal-context');
  await expect(page.getByText('0/5 risposte',{exact:true})).toBeVisible();
  for(const k of Object.keys(undisclosed))await page.locator(`select[name=${k}]`).selectOption('undisclosed');
  await page.getByRole('button',{name:'Salva contesto personale',exact:true}).click();
  await expect.poll(()=>state.contextWrites).toBe(1);await page.goto('/dashboard');
  await expect(page.getByText('Completa il tuo profilo!',{exact:true})).toHaveCount(0);
});

test('legacy_gt_75k_prefills_and_saves',async({page,baseURL})=>{
  const state=await fixture(page,baseURL!,{context:{...undisclosed,D2:'gt_75k'}});await page.goto('/settings#personal-context');
  await expect(page.locator('select[name=D2]')).toHaveValue('gt_75k');
  await page.locator('select[name=D1]').selectOption('employee_permanent');
  await page.getByRole('button',{name:'Salva contesto personale',exact:true}).click();
  await expect.poll(()=>state.contextWrites).toBe(1);expect(state.profile.section_d.D2).toBe('gt_75k');
});

test('mentor_offer_help_opens_with_keyboard_without_changing_answers',async({page,baseURL})=>{
  const state=await fixture(page,baseURL!);await page.goto('/competenze');
  const help=page.getByRole('button',{name:'Cosa significa Posso aiutare?'}).first();
  await help.focus();await page.keyboard.press('Enter');await expect(help).toHaveAttribute('aria-expanded','true');
  await expect(page.getByText(/Potrai ricevere richieste compatibili/)).toBeVisible();
  expect(state.contextWrites).toBe(0);await expect(page.getByRole('checkbox',{name:'Posso aiutare: Leggere la scheda di un ETF',exact:true})).toBeChecked();
});

test('context_error_retry_and_second_edit',async({page,baseURL})=>{
  const state=await fixture(page,baseURL!);const keys:string[]=[];
  await page.route('**/api/backend/skills/me/context',r=>{
    const payload=r.request().postDataJSON();keys.push(payload.idempotency_key);
    if(keys.length===1)return r.fulfill({status:503,json:{detail:'Contesto temporaneamente non disponibile'}});
    state.profile={...state.profile,section_d:payload.section_d,version:state.profile.version+1};
    return r.fulfill({json:{...state.profile,profile_completion:{experience_completed:true,context_completed:true,context_answered_count:5,context_total_count:5}}});
  });
  await page.goto('/settings#personal-context');
  for(const k of Object.keys(undisclosed))await page.locator(`select[name=${k}]`).selectOption('undisclosed');
  const save=page.getByRole('button',{name:'Salva contesto personale',exact:true});
  await save.click();await expect(page.locator('#personal-context [role=alert]')).toBeVisible();
  await save.click();await expect(page.getByText('Contesto personale aggiornato.',{exact:true})).toBeVisible();
  expect(keys[1]).toBe(keys[0]);
  await page.locator('select[name=D1]').selectOption('employee_permanent');await save.click();
  await expect.poll(()=>keys.length).toBe(3);expect(keys[2]).not.toBe(keys[1]);
});

test('session_change_discards_context_draft',async({page,baseURL})=>{
  await fixture(page,baseURL!);await page.goto('/settings#personal-context');
  await page.locator('select[name=D1]').selectOption('employee_permanent');
  await page.evaluate(()=>{localStorage.setItem('socra-session-change','other');window.dispatchEvent(new Event('socra:session-refresh'));});
  await expect(page.locator('#personal-context select')).toHaveCount(0);
});
