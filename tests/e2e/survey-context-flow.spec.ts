import {test,expect} from '@playwright/test';
import {fixture,undisclosed} from './multi-goal-fixture';

test('initial_experience_button_confirms_an_empty_selection_without_a_second_checkbox',async({page,baseURL})=>{
  const state=await fixture(page,baseURL!,{profileMissing:true});
  await page.goto('/onboarding');
  await expect(page.getByRole('checkbox',{name:/Confermo le attività/})).toHaveCount(0);
  for(const box of await page.getByRole('checkbox',{name:/^So:/}).all())await box.uncheck();
  await page.getByRole('button',{name:'Conferma le risposte',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Aggiungi il tuo contesto personale'})).toBeVisible();
  expect(state.profile.known_skills).toEqual([]);
  expect(state.contextWrites).toBe(0);
});

test('context_has_one_continue_after_five_explicit_choices_and_saves_before_navigation',async({page,baseURL})=>{
  const state=await fixture(page,baseURL!);
  await page.goto('/onboarding');
  const context=page.locator('#personal-context');
  await expect(context.getByText('Queste informazioni non compaiono sul tuo profilo pubblico.',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:/Salta per ora|Conferma le risposte|Salva contesto personale/})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Continua',exact:true})).toHaveCount(0);
  const why=context.getByText('Perché ci serve questa informazione?',{exact:true});
  await why.click();
  await expect(context.getByText(/conoscere meglio la community e a comprenderne bisogni e caratteristiche/)).toBeVisible();
  for(const k of ['D1','D2','D3','D4'])await page.locator(`select[name=${k}]`).selectOption('undisclosed');
  await expect(page.getByRole('button',{name:'Continua',exact:true})).toHaveCount(0);
  await page.locator('select[name=D5]').selectOption('undisclosed');
  await page.getByRole('button',{name:'Continua',exact:true}).click();
  await expect(page).toHaveURL(/\/goal$/);
  expect(state.contextWrites).toBe(1);
  expect(state.profile.section_d).toEqual(undisclosed);
});

test('saved_context_does_not_allow_continuing_with_a_new_incomplete_draft',async({page,baseURL})=>{
  const state=await fixture(page,baseURL!,{context:undisclosed});
  await page.goto('/onboarding');
  await page.locator('select[name=D1]').selectOption('');
  await expect(page.getByRole('button',{name:'Continua',exact:true})).toHaveCount(0);
  await expect(page.getByRole('link',{name:'Continua',exact:true})).toHaveCount(0);
  await page.locator('select[name=D1]').selectOption('employee_permanent');
  await page.getByRole('button',{name:'Continua',exact:true}).click();
  await expect(page).toHaveURL(/\/goal$/);
  expect(state.profile.section_d.D1).toBe('employee_permanent');
  expect(state.contextWrites).toBe(1);
});

test('failed_context_save_stays_in_survey_and_retries_the_same_request',async({page,baseURL})=>{
  const state=await fixture(page,baseURL!);
  const keys:string[]=[];
  await page.route('**/api/backend/skills/me/context',route=>{
    const body=route.request().postDataJSON();keys.push(body.idempotency_key);
    if(keys.length===1)return route.fulfill({status:503,json:{detail:'Contesto temporaneamente non disponibile'}});
    state.profile={...state.profile,section_d:body.section_d};
    return route.fulfill({json:{...state.profile,profile_completion:{experience_completed:true,context_completed:true,context_answered_count:5,context_total_count:5}}});
  });
  await page.goto('/onboarding');
  for(const k of Object.keys(undisclosed))await page.locator(`select[name=${k}]`).selectOption('undisclosed');
  const next=page.getByRole('button',{name:'Continua',exact:true});
  await next.click();
  await expect(page.locator('#personal-context [role=alert]')).toBeVisible();
  await expect(page).toHaveURL(/\/onboarding$/);
  await next.click();
  await expect(page).toHaveURL(/\/goal$/);
  expect(keys).toHaveLength(2);expect(keys[1]).toBe(keys[0]);
});

test('uncertain_committed_context_is_read_before_continuing',async({page,baseURL})=>{
  const state=await fixture(page,baseURL!);let writes=0;
  await page.route('**/api/backend/skills/me/context',route=>{
    writes++;
    state.profile={...state.profile,section_d:route.request().postDataJSON().section_d};
    return route.fulfill({status:503,json:{detail:'Risposta non disponibile'}});
  });
  await page.goto('/onboarding');
  for(const k of Object.keys(undisclosed))await page.locator(`select[name=${k}]`).selectOption('undisclosed');
  await page.getByRole('button',{name:'Continua',exact:true}).click();
  await expect(page).toHaveURL(/\/goal$/);
  expect(writes).toBe(1);
});

test('verified_email_offers_account_access_without_reopening_the_survey',async({page,baseURL})=>{
  await fixture(page,baseURL!,{context:undisclosed});
  await page.route('**/api/auth/email-verification/confirm',route=>route.fulfill({json:{status:'ok'}}));
  await page.goto('/verify-email#token=owned-local-test-token');
  await page.getByRole('button',{name:'Conferma email',exact:true}).click();
  await expect(page.getByRole('status').filter({hasText:'Email verificata'})).toBeVisible();
  await expect(page.getByRole('link',{name:/Riprendi.*survey/i})).toHaveCount(0);
  await expect(page.getByRole('link',{name:'Vai al tuo account',exact:true})).toHaveAttribute('href','/settings');
});
