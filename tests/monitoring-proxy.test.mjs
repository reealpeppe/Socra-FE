import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(){
  const exports={};
  const NextResponse={next:()=>new Response(null),redirect:url=>new Response(null,{status:307,headers:{Location:url.toString()}})};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('proxy.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:()=>({NextResponse}),URL});
  return exports;
}
function request(path,session=false){return {nextUrl:new URL('https://www.socra.it'+path),url:'https://www.socra.it'+path,cookies:{get:()=>session?{value:'test-session'}:undefined}};}
test('existing private routes still redirect anonymous users',()=>{
  for(const path of ['/dashboard','/matching','/admin','/settings']){
    const response=load().proxy(request(path));assert.equal(response.status,307,path);
    assert.equal(new URL(response.headers.get('Location')).pathname,'/login');
    assert.equal(new URL(response.headers.get('Location')).searchParams.get('next'),path);
  }
});
test('existing sessions/public routes pass and monitoring stays no-store/noindex',()=>{
  assert.equal(load().proxy(request('/dashboard',true)).status,200);
  assert.equal(load().proxy(request('/faq')).status,200);
  for(const path of ['/admin/monitoraggio','/admin/monitoraggio/verifica']){
    const response=load().proxy(request(path));
    assert.equal(response.headers.get('Cache-Control'),'private, no-store');
    assert.equal(response.headers.get('X-Robots-Tag'),'noindex, nofollow');
  }
});
