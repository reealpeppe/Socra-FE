import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
import ts from 'typescript';
import {NextRequest} from 'next/server.js';

const require=createRequire(import.meta.url);
function compile(path,globals,imports={}){
  const exports={};
  const code=ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  runInNewContext(code,{exports,require:name=>imports[name]||require(name),...globals});return exports;
}
const token='p'.repeat(43);
const preview={inviter_username:'Giulia',topic:'ETF',objective_labels:['Leggere un ETF'],discussion_mode_label:'Passo passo',status:'pending',expires_at:new Date(Date.now()+86400000).toISOString(),mentee_cost:0,mentor_reward:1,bonus_new_users_only:true};
function setup(fetcher){
  const calls=[];
  const globals={process:{env:{NODE_ENV:'production'}},AbortSignal,AbortController,setTimeout,clearTimeout,Headers,Response,TextDecoder,Uint8Array,Buffer,
    fetch:async(url,init)=>{calls.push({url,init});return fetcher?fetcher(url,init):new Response(JSON.stringify(preview),{headers:{'Content-Type':'application/json'}});}};
  const security=compile('../lib/web-security.ts',globals);
  const invitations=compile('../lib/invitation-server.ts',globals,{'@/lib/web-security':security,'@/lib/server':{getBackendUrl:path=>'https://backend.example'+path}});
  return {calls,...invitations};
}
function request(path,body={},cookie=''){
  return new NextRequest('https://www.socra.it/api/invitations/'+path,{method:'POST',headers:{Origin:'https://www.socra.it','Content-Type':'application/json',Cookie:cookie},body:JSON.stringify(body)});
}
test('public context stores only invitation token in HttpOnly cookie without forwarding bearer',async()=>{
  const server=setup();const response=await server.storeInvitationContext(request('context',{token},'socra_session=private-bearer'));
  assert.equal(response.status,200);
  assert.equal(server.calls[0].url,'https://backend.example/invitations/preview');
  assert.equal(server.calls[0].init.headers.Authorization,undefined);
  const cookie=response.headers.get('set-cookie');
  assert.match(cookie,/socra_invitation=/);assert.match(cookie,/httponly/i);assert.match(cookie,/secure/i);assert.match(cookie,/samesite=lax/i);
  assert.doesNotMatch(await response.text(),new RegExp(token+'|private-bearer'));
});
test('claim uses cookie token and session on fixed upstream and clears successful context',async()=>{
  const server=setup(()=>new Response(JSON.stringify({...preview,id:'i',role:'recipient',prerequisite_state:{},path_id:null,bonus_eligible:true}),{headers:{'Content-Type':'application/json'}}));
  const result=await server.claimInvitationContext(request('claim',{},`socra_invitation=${token}; socra_session=private-bearer`));
  assert.equal(result.status,200);assert.equal(server.calls[0].url,'https://backend.example/invitations/claim');
  assert.equal(server.calls[0].init.headers.Authorization,'Bearer private-bearer');
  assert.deepEqual(JSON.parse(server.calls[0].init.body),{token});
  assert.match(result.headers.get('set-cookie'),/Max-Age=0/i);
  assert.doesNotMatch(await result.text(),new RegExp(token+'|private-bearer'));
});
test('context rejects foreign origin, oversized bodies and extra payload before network',async()=>{
  const server=setup();
  const bad=request('context',{token});bad.headers.set('Origin','https://evil.example');
  assert.equal((await server.storeInvitationContext(bad)).status,403);
  assert.equal((await server.storeInvitationContext(request('context',{token,redirect:'https://evil.example'}))).status,400);
  assert.equal((await server.storeInvitationContext(request('context',{token:'a'.repeat(5000)}))).status,413);
  assert.equal(server.calls.length,0);
});
test('claim without session or context never forwards a token',async()=>{
  const server=setup();
  assert.equal((await server.claimInvitationContext(request('claim',{},`socra_invitation=${token}`))).status,401);
  assert.deepEqual(await (await server.claimInvitationContext(request('claim',{},'socra_session=private'))).json(),{invitation:null});
  assert.equal(server.calls.length,0);
});
test('body stream failures and expired context do not establish a cookie',async()=>{
  const broken=setup(()=>({ok:true,status:200,json:async()=>{throw new Error('private body error');}}));
  const response=await broken.storeInvitationContext(request('context',{token}));
  assert.equal(response.status,503);assert.equal(response.headers.get('set-cookie'),null);
  assert.doesNotMatch(await response.text(),/private body error/);
});
test('invitation returns accept only exact local routes',()=>{
  const {safeInvitationReturn}=compile('../lib/invitations.ts',{});
  assert.equal(safeInvitationReturn('/inviti'),'/inviti');
  const path='/inviti/12345678-1234-1234-1234-123456789abc';assert.equal(safeInvitationReturn(path),path);
  for(const bad of ['//evil.example','/inviti?token=secret','/inviti/../settings','/inviti/123#token=a','/inviti\\evil','https://socra.it/inviti'])assert.equal(safeInvitationReturn(bad),null);
});
