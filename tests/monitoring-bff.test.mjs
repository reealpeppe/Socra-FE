import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {NextRequest} from 'next/server.js';

class MockResponse extends Response {
  constructor(body,options){super(body,options);this.saved=[];this.cookies={set:(...args)=>this.saved.push(args)};}
  static json(body,options){return new MockResponse(JSON.stringify(body),{...options,headers:{...options?.headers,'Content-Type':'application/json'}});}
}
function securityModule(){
  const exports={};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/web-security.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,
    {exports,require:()=>({NextResponse:MockResponse}),process:{env:{NODE_ENV:'production',SOCRA_PUBLIC_ORIGINS:'https://socra.it'}},TextDecoder,Uint8Array});
  return exports;
}
function harness(upstream){
  const calls=[];const exports={};
  const compiled=ts.transpileModule(fs.readFileSync('lib/monitoring-server.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(compiled,{exports,require:(name)=>name==='next/server'?{NextResponse:MockResponse}:name==='@/lib/web-security'?securityModule():{getBackendUrl:p=>'http://backend'+p},
    Response,URL,AbortSignal,setTimeout,clearTimeout,process:{env:{NODE_ENV:'production',SOCRA_APP_ORIGIN:'https://socra.it'}},fetch:async(url,options)=>{calls.push({url,options});return upstream;}});
  return {api:exports,calls};
}
function request(path,method='POST',origin='https://socra.it'){
  return new NextRequest('https://socra.it/api/monitoring/'+path,{method,headers:{...(origin?{origin}:{}),'Content-Type':'application/json',Cookie:'socra_session=first-factor; socra_monitoring=old-grant'},body:method==='POST'?JSON.stringify({code:'123456'}):undefined});
}
test('successful MFA grant goes only into strict HTTP-only cookie',async()=>{
  const {api,calls}=harness(Response.json({grant_token:'secret-secondary-token',expires_in:28800,expires_at:'later',recovery_codes:['once']}));
  const result=await api.monitoringProxy(request('mfa/confirm'),'mfa/confirm');
  assert.equal(result.status,200);assert.ok(!(await result.text()).includes('secret-secondary-token'));
  const cookie=result.saved[0];assert.equal(cookie[0],'socra_monitoring');assert.equal(cookie[1],'secret-secondary-token');
  assert.deepEqual(JSON.parse(JSON.stringify(cookie[2])),{httpOnly:true,secure:true,sameSite:'strict',path:'/',maxAge:28800});
  assert.equal(calls[0].options.headers.Authorization,'Bearer first-factor');
});
test('mutations reject cross-site or missing Origin before upstream',async()=>{
  for(const origin of ['https://evil.test','']){
    const {api,calls}=harness(Response.json({}));
    assert.equal((await api.monitoringProxy(request('mfa/verify','POST',origin),'mfa/verify')).status,403);
    assert.equal(calls.length,0);
  }
});
test('unknown route or wrong method never reaches backend',async()=>{
  const {api,calls}=harness(Response.json({}));
  assert.equal((await api.monitoringProxy(request('x'),'x')).status,404);
  assert.equal((await api.monitoringProxy(request('dashboard'),'dashboard')).status,405);
  assert.equal(calls.length,0);
});
test('reads forward both proofs and private headers; failures clear proof',async()=>{
  const {api,calls}=harness(Response.json({detail:'MFA required'},{status:403}));
  const result=await api.monitoringProxy(request('dashboard','GET'),'dashboard');
  assert.equal(calls[0].options.headers['X-Monitoring-Grant'],'old-grant');
  assert.equal(result.headers.get('Cache-Control'),'private, no-store');
  assert.equal(result.headers.get('X-Robots-Tag'),'noindex, nofollow');
  assert.equal(result.saved[0][2].maxAge,0);
});

test('generic proxy rejects encoded/canonicalization forms before fetch',async()=>{
  const paths=[['monitoring'],['monitoring/mfa/verify'],['monitoring\\mfa\\verify'],['x','..','monitoring','mfa','verify'],['%2Fmonitoring%2Fmfa%2Fverify'],['%'],['monitor\ning','mfa','verify'],['monitor%0Ding','mfa','verify'],['monitoring?ignored']];
  for(const path of paths){
    let called=0;const exports={};
    const compiled=ts.transpileModule(fs.readFileSync('lib/server.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
    vm.runInNewContext(compiled,{exports,require:name=>name==='next/server'?{NextResponse:MockResponse}:name==='@/lib/web-security'?securityModule():{cookies:async()=>({get:()=>undefined})},
      Response,URL,AbortController,setTimeout,clearTimeout,process:{env:{}},fetch:async()=>{called++;return Response.json({grant_token:'must-not-reach-browser'});}});
    const result=await exports.proxyBackend(request('ignored'),path);
    assert.ok([403,404].includes(result.status),JSON.stringify(path));assert.equal(called,0);
  }
});

test('CSV keeps UTF-8 BOM, accents and download header',async()=>{
  const csv='\ufeffindicatore,valore\nQualitÃ ,8\n';
  const bytes=new TextEncoder().encode(csv);
  const {api}=harness(new Response(bytes,{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="socra-monitoraggio.csv"'}}));
  const result=await api.monitoringProxy(request('export.csv','GET'),'export.csv');
  assert.deepEqual(new Uint8Array(await result.arrayBuffer()),bytes);
  assert.ok(result.headers.get('Content-Disposition').includes('socra-monitoraggio.csv'));
});
