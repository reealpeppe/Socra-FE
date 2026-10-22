import {test,expect} from '@playwright/test';
import {fixture,undisclosed} from './multi-goal-fixture';

test('survey_keeps_context_empty_until_explicit_answers_and_banner_remains',async({page,baseURL})=>{
  const state=await fixture(page,baseURL!);await page.goto('/competenze');
  await page.getByRole('button',{name:'Conferma le risposte',exact:true}).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(state.contextWrites).toBe(0);
  expect(state.profile.section_d).toEqual({});
  await expect(page.getByText('Completa il tuo profilo!',{exact:true})).toBeVisible();
});

test('saving_five_answers_removes_banner_after_reload',async({page,baseURL})=>{
  const state=await fixture(page,baseURL!);await page.goto('/settings#personal-context');
  await expect(page.getByText('0/5 risposte',{exact:true})).toBeVisible();
  const save=page.getByRole('button',{name:'Salva contesto personale',exact:true});
  await expect(save).toBeDisabled();
  await expect(save).toHaveCSS('background-color','rgb(230, 232, 233)');
  await page.locator('select[name=D1]').selectOption('student');
  await save.click();
  await expect.poll(()=>state.contextWrites).toBe(1);
  await page.goto('/dashboard');
  await expect(page.getByRole('link',{name:'Completa il profilo · 1/5'})).toBeVisible();
  await page.goto('/settings#personal-context');
  for(const [k,value] of Object.entries({D2:'lt_15k',D3:'none',D4:'none',D5:'adequate'}))await page.locator(`select[name=${k}]`).selectOption(value);
  await page.getByRole('button',{name:'Salva contesto personale',exact:true}).click();
  await expect.poll(()=>state.contextWrites).toBe(2);
  await page.goto('/dashboard');
  await expect(page.getByText('Completa il tuo profilo!',{exact:true})).toHaveCount(0);
});

test('disabled_mentor_offer_save_uses_the_gray_button_style',async({page,baseURL})=>{
  await fixture(page,baseURL!);await page.goto('/settings');
  const save=page.getByRole('button',{name:'Salva capacità offerte',exact:true});
  await expect(save).toBeDisabled();
  await expect(save).toHaveCSS('background-color','rgb(230, 232, 233)');
});

test('saving_experience_uses_the_gray_button_style_while_busy',async({page,baseURL})=>{
  await fixture(page,baseURL!);
  let finishSave:()=>void=()=>{};
  const savePending=new Promise<void>(resolve=>{finishSave=resolve;});
  await page.route('**/api/backend/skills/me',async route=>{
    if(route.request().method()==='PUT')await savePending;
    await route.fallback();
  });
  await page.goto('/competenze');
  await page.getByRole('button',{name:'Conferma le risposte',exact:true}).click();
  try{
    const saving=page.getByRole('button',{name:'Salvataggio…',exact:true});
    await expect(saving).toBeDisabled();
    await expect(saving).toHaveCSS('background-color','rgb(230, 232, 233)');
  }finally{finishSave();}
  await expect(page).toHaveURL(/\/dashboard$/);
});

test('legacy_gt_75k_prefills_and_saves',async({page,baseURL})=>{
  const state=await fixture(page,baseURL!,{context:{...undisclosed,D2:'gt_75k'}});await page.goto('/settings#personal-context');
  await expect(page.getByText('1/5 risposte',{exact:true})).toBeVisible();
  await expect(page.locator('select[name=D1]')).toHaveValue('');
  await expect(page.locator('#personal-context')).not.toContainText('Preferisco non rispondere');
  await expect(page.locator('select[name=D2]')).toHaveValue('gt_75k');
  await page.locator('select[name=D1]').selectOption('employee_permanent');
  await page.getByRole('button',{name:'Salva contesto personale',exact:true}).click();
  await expect.poll(()=>state.contextWrites).toBe(1);
  expect(state.profile.section_d.D2).toBe('gt_75k');
  expect(state.profile.section_d.D1).toBe('employee_permanent');
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
    state.profile={...state.profile,section_d:{...state.profile.section_d,...payload.section_d},version:state.profile.version+1};
    return r.fulfill({json:{...state.profile,profile_completion:{experience_completed:true,context_completed:false,context_answered_count:1,context_total_count:5}}});
  });
  await page.goto('/settings#personal-context');
  await page.locator('select[name=D1]').selectOption('student');
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

test('saved_experience_and_context_continue_without_unsaved_warning',async({page,baseURL})=>{
  await fixture(page,baseURL!,{context:undisclosed});
  await page.addInitScript(()=>{(window as unknown as {warnings:number}).warnings=0;window.confirm=()=>{(window as unknown as {warnings:number}).warnings++;return true;};});
  await page.goto('/competenze');
  await page.getByRole('checkbox',{name:'So: Confrontare due ETF',exact:true}).check();
  await page.getByRole('button',{name:'Conferma le risposte',exact:true}).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(await page.evaluate(()=>(window as unknown as {warnings:number}).warnings)).toBe(0);
});
test('dashboard_context_read_error_survives_slow_public_profile_and_recovers',async({page,baseURL})=>{
  await fixture(page,baseURL!);
  let fail=true,release!:()=>void,failed!:()=>void;
  const held=new Promise<void>(r=>release=r),seen=new Promise<void>(r=>failed=r);
  await page.route('**/api/backend/skills/me',route=>{if(!fail)return route.fallback();failed();return route.fulfill({status:503,json:{detail:'Contesto personale non disponibile'}});});
  await page.route('**/api/backend/profiles/u1',async route=>{await held;return route.fallback();});
  await page.goto('/dashboard');await seen;release();
  await expect(page.getByText('Caricamento della dashboard…',{exact:true})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Riprova',exact:true})).toBeVisible();
  await expect(page.getByText(/Contesto personale non disponibile/)).toBeVisible();
  fail=false;await page.getByRole('button',{name:'Riprova',exact:true}).click();
  await expect(page.getByText('Completa il tuo profilo!',{exact:true})).toBeVisible();
});

test('completion_link_opens_context_in_already_mounted_settings',async({page,baseURL})=>{
  await fixture(page,baseURL!);await page.goto('/settings');
  await expect(page.locator('#personal-context')).not.toHaveAttribute('open');
  await page.getByRole('link',{name:'Completa il profilo · 0/5',exact:true}).click();
  await expect(page.locator('#personal-context select[name=D1]')).toBeVisible();
  await expect(page.locator('#personal-context summary')).toBeInViewport();
  await expect(page.locator('#personal-context summary')).toBeFocused();
  await page.locator('#personal-context summary').click();
  await page.getByRole('link',{name:'Completa il profilo · 0/5',exact:true}).click();
  await expect(page.locator('#personal-context select[name=D1]')).toBeVisible();
  await expect(page.locator('#personal-context summary')).toBeInViewport();
  await expect(page.locator('#personal-context summary')).toBeFocused();
});

test('completion_link_reveals_context_after_settings_finish_loading',async({page,baseURL})=>{
  await fixture(page,baseURL!);
  let finishProfile:()=>void=()=>{};
  const profilePending=new Promise<void>(resolve=>{finishProfile=resolve;});
  await page.route('**/api/backend/profiles/me',async route=>{
    await profilePending;
    await route.fallback();
  });
  await page.goto('/dashboard');
  await page.getByRole('link',{name:'Completa il profilo · 0/5',exact:true}).click();
  try{
    await expect(page).toHaveURL(/\/settings#personal-context$/);
    await expect(page.getByText('Caricamento impostazioni…',{exact:true})).toBeVisible();
  }finally{finishProfile();}
  await expect(page.getByText('Caricamento impostazioni…',{exact:true})).toHaveCount(0);
  await expect(page.locator('#personal-context select[name=D1]')).toBeVisible();
  await expect(page.locator('#personal-context summary')).toBeInViewport();
  await expect(page.locator('#personal-context summary')).toBeFocused();
});
