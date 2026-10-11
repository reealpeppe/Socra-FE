import {chromium} from '@playwright/test';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const phase=process.argv[2]||'baseline';
assert.match(phase,/^[a-z0-9-]+$/);
const url=process.argv[3];
assert.match(url||'',/^http:\/\/(127\.0\.0\.1|localhost):\d+$/,'Pass a loopback production preview URL');
assert.ok(process.argv[4],'Pass the dedicated local UX fixture manifest');
const fixture=JSON.parse(await readFile(process.argv[4],'utf8'));
assert.equal(fixture.fixture,'socra-local-ux-v3-multi-goals');
assert.match(fixture.users.learner.username,/^ux\.review\./);
const browser=await chromium.launch({channel:'chrome'});
const results={phase,buildId:(await readFile('.next/BUILD_ID','utf8')).trim(),runs:[]};
const loading=/Stiamo preparando Socra|Caricamento (dashboard|percorsi|proposte|obiettivi|attività|crediti|impostazioni)|Verifica (del profilo|dell.account)/i;
await mkdir(`output/playwright/performance/${phase}`,{recursive:true});
try {
 for(const [label,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
  const context=await browser.newContext({viewport});const page=await context.newPage();page.setDefaultTimeout(15000);let authChecks=0;
  page.on('request',r=>{if(r.url().endsWith('/api/backend/auth/me'))authChecks++;});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&/content security policy|refused to/i.test(m.text()))errors.push(m.text());});
  async function ready(){try{await page.waitForFunction(pattern=>{const main=[...document.querySelectorAll('main')].find(el=>el.getBoundingClientRect().width);return main?.querySelector('h1')&&!new RegExp(pattern,'i').test(main.innerText);},loading.source);}catch(e){console.log('NOT READY',page.url(),await page.locator('body').innerText());throw e;}}
  async function navigate(href){
   let link=page.locator(`a[href="${href}"]:visible`).first();
   if(!await link.count()){
    const toggle=page.getByRole('button',{name:/Apri (menu|il menu account)/}).first();await toggle.click();
    link=page.locator(`a[href="${href}"]:visible`).first();
   }
   await page.evaluate(pattern=>{window.__perfSamples=[];window.__perfActive=true;const start=performance.now();const tick=()=>{if(!window.__perfActive)return;const main=document.querySelector('main');const text=main?.innerText||'';window.__perfSamples.push({ms:performance.now()-start,global:text.includes('Stiamo preparando Socra'),loading:new RegExp(pattern,'i').test(text),h1:main?.querySelector('h1')?.textContent||null});requestAnimationFrame(tick);};requestAnimationFrame(tick);},loading.source);
   console.log(label,href);const start=performance.now();await link.click();await page.waitForURL(u=>u.pathname+u.search===href);await ready();const elapsed=performance.now()-start;
   await page.waitForTimeout(80);
   const samples=await page.evaluate(()=>{window.__perfActive=false;return window.__perfSamples;});
   const bad=samples.filter(s=>s.global);const waits=samples.filter(s=>s.loading);
   return {href,readyMs:Math.round(elapsed),globalLoaderFrames:bad.length,globalLoaderMs:bad.length?Math.round(bad.at(-1).ms-bad[0].ms+16):0,loadingFrames:waits.length};
  }
  await page.goto(url+'/come-funziona');await ready();await page.getByRole('link',{name:'Inizia ora',exact:true}).waitFor();
  const publicRoutes=[];for(const href of ['/faq','/community','/come-funziona','/faq'])publicRoutes.push(await navigate(href));
  await page.screenshot({path:`output/playwright/performance/${phase}/${label}-public.png`});
  const publicAuthChecks=authChecks;
  await page.goto(url+'/login');
  await page.getByLabel('Username o email').fill(fixture.users.learner.username);
  await page.getByLabel('Password',{exact:true}).fill('SocraDemo2026!');
  await page.getByRole('button',{name:'Accedi',exact:true}).click();
  await page.waitForURL('**/dashboard');await ready();
  // Chrome accepts Secure cookies on loopback; APIRequestContext does not use
  // that browser exception. Read and revoke the session through the browser.
  const me=await page.evaluate(async()=>{const response=await fetch('/api/backend/auth/me');return response.json();});
  assert.equal(me.id,fixture.users.learner.id,'The preview must use the dedicated fixture');
  const privateRoutes=[];for(const href of ['/wallet',label==='desktop'?'/paths?tab=mentee':'/paths','/requests','/dashboard','/goal','/settings','/dashboard'])privateRoutes.push(await navigate(href));
  await page.screenshot({path:`output/playwright/performance/${phase}/${label}-dashboard.png`});
  await page.goto(url+'/goal');await ready();await page.screenshot({path:`output/playwright/performance/${phase}/${label}-goal.png`});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  assert.equal(overflow,false,'Horizontal overflow');
  assert.deepEqual(errors,[],'Browser/CSP errors');
  results.runs.push({viewport:label,publicRoutes,publicAuthChecks,privateRoutes,errors,overflow});
  await page.evaluate(async()=>{const response=await fetch('/api/auth/logout',{method:'POST'});if(!response.ok)throw new Error('Synthetic logout failed');});await context.close();
 }
}finally{await browser.close();await writeFile(`output/playwright/performance/${phase}/measurements.json`,JSON.stringify(results,null,2));}
console.log(JSON.stringify(results,null,2));
