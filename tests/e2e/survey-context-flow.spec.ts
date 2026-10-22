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

test('context_can_be_skipped_or_saved_with_one_real_answer_before_navigation',async({page,baseURL})=>{
  const state=await fixture(page,baseURL!);
  await page.goto('/onboarding');
  const context=page.locator('#personal-context');
  await expect(context.getByText(/Conoscere la tua situazione economica e professionale/)).toBeVisible();
  await expect(context.getByText('Le risposte sono facoltative e riservate. Non saranno visibili agli altri utenti.')).toBeVisible();
  await expect(context).not.toContainText('Preferisco non rispondere');
  await expect(page.getByRole('button',{name:'Salva e continua',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Salta',exact:true}).click();
  await expect(page).toHaveURL(/\/goal$/);
  expect(state.contextWrites).toBe(0);
  await page.goto('/onboarding');
  await page.locator('select[name=D1]').selectOption('student');
  await expect(page.getByRole('button',{name:'Salva e continua',exact:true})).toBeEnabled();
  await page.getByRole('button',{name:'Salva e continua',exact:true}).click();
  await expect(page).toHaveURL(/\/goal$/);
  expect(state.contextWrites).toBe(1);
  expect(state.profile.section_d).toEqual({D1:'student'});
});

test('saved_context_can_be_replaced_without_filling_all_questions',async({page,baseURL})=>{
  const state=await fixture(page,baseURL!,{context:{D1:'student'}});
  await page.goto('/onboarding');
  await page.locator('select[name=D1]').selectOption('');
  await expect(page.getByRole('button',{name:'Salva e continua',exact:true})).toBeDisabled();
  await expect(page.getByRole('button',{name:'Salta',exact:true})).toBeEnabled();
  await page.locator('select[name=D1]').selectOption('employee_permanent');
  await page.getByRole('button',{name:'Salva e continua',exact:true}).click();
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
    state.profile={...state.profile,section_d:{...state.profile.section_d,...body.section_d}};
    return route.fulfill({json:{...state.profile,profile_completion:{experience_completed:true,context_completed:false,context_answered_count:1,context_total_count:5}}});
  });
  await page.goto('/onboarding');
  await page.locator('select[name=D1]').selectOption('student');
  const next=page.getByRole('button',{name:'Salva e continua',exact:true});
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
    state.profile={...state.profile,section_d:{...state.profile.section_d,...route.request().postDataJSON().section_d}};
    return route.fulfill({status:503,json:{detail:'Risposta non disponibile'}});
  });
  await page.goto('/onboarding');
  await page.locator('select[name=D1]').selectOption('student');
  await page.getByRole('button',{name:'Salva e continua',exact:true}).click();
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
