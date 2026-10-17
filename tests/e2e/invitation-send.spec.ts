import {expect,test,type Page} from '@playwright/test';
import {fixture} from './multi-goal-fixture';

async function invitations(page:Page, baseURL:string, empty=false) {
  await fixture(page,baseURL);
  if(empty)await page.route('**/api/backend/matching/candidates/all',route=>route.fulfill({json:{items:[],next_cursor:null}}));
  await page.route('**/api/backend/mentor-alerts/me',route=>route.fulfill({json:{enabled:false,subscribed_at:null,updated_at:null}}));
  const state={sent:[] as Record<string,unknown>[], fail:false,uncertain:false,delivery:'pending'};
  await page.route('**/api/backend/invitations**',route=>{
    if(route.request().method()==='GET')return route.fulfill({json:state.sent});
    const payload=route.request().postDataJSON();
    const result={...payload,id:'12345678-1234-1234-1234-123456789abc',role:'inviter',status:'pending',delivery_status:state.delivery,
      creation_key:payload.idempotency_key,recipient_email:payload.email,topic:'ETF',objective_labels:['Leggere la scheda di un ETF'],
      inviter_username:'Giulia',discussion_mode_label:'Guidami passo passo',expires_at:'2026-10-24T10:00:00',mentee_cost:0,mentor_reward:1,bonus_eligible:null,prerequisite_state:{},path_id:null};
    if(!state.fail||state.uncertain)state.sent=[result];
    return state.fail?route.fulfill({status:503,json:{detail:'Invio non disponibile'}}):route.fulfill({json:result});
  });
  return state;
}

test('invitation is always available and empty matching offers both actions',async({page,baseURL})=>{
  await invitations(page,baseURL!,true);
  await page.goto('/matching');
  await expect(page.getByRole('button',{name:'Invita qualcuno',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Conosci qualcuno che può aiutarti?'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Avvisami via email',exact:true})).toBeVisible();
});

test('invitation requires topic activities and email consent, with focus restored',async({page,baseURL})=>{
  const state=await invitations(page,baseURL!);
  await page.goto('/matching');
  const trigger=page.getByRole('button',{name:'Invita qualcuno',exact:true});
  await trigger.click();
  const dialog=page.getByRole('dialog',{name:'Invita qualcuno su Socra'});
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel('Email della persona da invitare')).toBeFocused();
  await expect(dialog.getByRole('button',{name:'Invia invito',exact:true})).toBeDisabled();
  await dialog.getByLabel('Email della persona da invitare').fill('amica@example.com');
  await dialog.getByLabel('Tema del confronto').selectOption('g-etf');
  await dialog.getByRole('checkbox',{name:'Leggere la scheda di un ETF',exact:true}).check();
  await dialog.getByRole('checkbox',{name:'Accetto di condividere la mia email dopo l’accettazione.'}).check();
  await expect(dialog).toContainText('persona nuova su Socra');
  await dialog.getByRole('button',{name:'Invia invito',exact:true}).click();
  await expect(dialog.getByRole('status')).toContainText('Invito in coda');
  expect(state.sent).toHaveLength(1);
  expect(state.sent[0].objective_codes).toEqual(['etf_read']);
  await dialog.getByRole('button',{name:'Chiudi invito',exact:true}).click();
  await expect(trigger).toBeFocused();
});

test('uncertain success is recovered without another invitation',async({page,baseURL})=>{
  const state=await invitations(page,baseURL!);state.fail=true;state.uncertain=true;
  await page.goto('/matching');
  await page.getByRole('button',{name:'Invita qualcuno',exact:true}).click();
  const dialog=page.getByRole('dialog');
  await dialog.getByLabel('Email della persona da invitare').fill('amica@example.com');
  await dialog.getByLabel('Tema del confronto').selectOption('g-etf');
  await dialog.getByRole('checkbox',{name:'Leggere la scheda di un ETF',exact:true}).check();
  await dialog.getByRole('checkbox',{name:'Accetto di condividere la mia email dopo l’accettazione.'}).check();
  await dialog.getByRole('button',{name:'Invia invito',exact:true}).click();
  await expect(dialog.getByRole('status')).toContainText('Invito in coda');
  expect(state.sent).toHaveLength(1);
});

test('changing topic clears activities and an unavailable send remains retryable',async({page,baseURL})=>{
  const state=await invitations(page,baseURL!);state.fail=true;
  await page.goto('/matching');await page.getByRole('button',{name:'Invita qualcuno',exact:true}).click();
  const dialog=page.getByRole('dialog');
  await dialog.getByLabel('Email della persona da invitare').fill('AMICA@EXAMPLE.COM');
  await dialog.getByLabel('Tema del confronto').selectOption('g-etf');
  await dialog.getByRole('checkbox',{name:'Leggere la scheda di un ETF',exact:true}).check();
  await dialog.getByLabel('Tema del confronto').selectOption('g-stock');
  await expect(dialog.getByRole('checkbox',{name:'Leggere i dati fondamentali di un’azienda',exact:true})).not.toBeChecked();
  await dialog.getByRole('checkbox',{name:'Leggere i dati fondamentali di un’azienda',exact:true}).check();
  await dialog.getByRole('checkbox',{name:'Accetto di condividere la mia email dopo l’accettazione.'}).check();
  await dialog.getByRole('button',{name:'Invia invito',exact:true}).click();
  await expect(dialog.getByRole('alert')).toBeVisible();
  state.fail=false;
  await dialog.getByRole('button',{name:'Invia invito',exact:true}).click();
  await expect(dialog.getByRole('status')).toContainText('Invito in coda');
  expect(state.sent[0].email).toBe('amica@example.com');
  expect(state.sent[0].objective_codes).toEqual(['stock_fundamentals']);
});

test('session changes hide the invitation draft before further writes',async({page,baseURL})=>{
  const state=await invitations(page,baseURL!);
  await page.goto('/matching');await page.getByRole('button',{name:'Invita qualcuno',exact:true}).click();
  await page.getByLabel('Email della persona da invitare').fill('private@example.com');
  await page.evaluate(()=>{localStorage.setItem('socra-session-change','different-account');window.dispatchEvent(new Event('socra:session-refresh'));});
  await expect(page.getByLabel('Email della persona da invitare')).toHaveCount(0);
  expect(state.sent).toEqual([]);
});
