import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source = readFileSync(new URL('../js/site.js', import.meta.url), 'utf8');
function page({saved, response = async () => ({ok:true, json:async () => ({language:'zh'})}), storageFails = false} = {}) {
  const handlers = {}, buttonHandlers = {}, values = new Map(saved ? [['wcab-lang',saved]] : []);
  const root = {dataset:{currentPage:'home', titleZh:'首页', titleEn:'Home'}};
  let calls = 0;
  const toggle = {setAttribute(){}, addEventListener(name, fn){buttonHandlers[name]=fn;}};
  const document = {
    documentElement:root, readyState:'loading',
    querySelectorAll(){return [];},
    querySelector(selector){if(selector === '[data-lang-toggle]') return toggle; if(selector === '.skip-link') return {addEventListener(){}}; return null;},
    addEventListener(name, fn){handlers[name]=fn;}
  };
  const context = {document, window:{siteAnalytics:{endpoint:'https://locale.test'}}, location:{hostname:'site.test'}, URL, AbortController, Date, JSON,
    localStorage:{getItem(k){if(storageFails) throw Error('disabled');return values.get(k)||null;},setItem(k,v){if(storageFails) throw Error('disabled');values.set(k,v);}},
    sessionStorage:{getItem(){return null;},setItem(){}},
    fetch:async (...args)=>{calls++;return response(...args);},
    setTimeout(){return 1;},clearTimeout(){},matchMedia(){return {matches:false};}
  };
  vm.runInNewContext(source, context);
  return {root, toggle:()=>buttonHandlers.click(), detect:()=>handlers.DOMContentLoaded(), calls:()=>calls, values};
}
test('manual Chinese and English preferences both take priority over region', async () => {
  for(const saved of ['zh','en']) {const p=page({saved});await p.detect();assert.equal(p.root.dataset.lang,saved);assert.equal(p.calls(),0);}
});
test('first visit follows region and failures retain English', async () => {
  const p=page();await p.detect();assert.equal(p.root.dataset.lang,'zh');
  const failed=page({response:async()=>{throw Error('offline');}});await failed.detect();assert.equal(failed.root.dataset.lang,'en');
  const invalid=page({response:async()=>({ok:true,json:async()=>({language:'bad'})})});await invalid.detect();assert.equal(invalid.root.dataset.lang,'en');
});
test('a pending region lookup never overrides a manual click, even without storage', async () => {
  let finish;
  const p=page({storageFails:true,response:()=>new Promise(resolve=>{finish=resolve;})});
  const detection=p.detect();p.toggle();p.toggle();assert.equal(p.root.dataset.lang,'en');
  finish({ok:true,json:async()=>({language:'zh'})});await detection;assert.equal(p.root.dataset.lang,'en');
});
