const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const root = __dirname;
const html = fs.readFileSync(path.join(root, 'presentation.html'), 'utf8');
const evidence = JSON.parse(fs.readFileSync(path.join(root, 'pitch-evidence.json'), 'utf8'));
const sections = [...html.matchAll(/<section class="slide"[\s\S]*?<\/section>/g)].map(match => match[0]);
assert.equal(sections.length, 6);
assert.deepEqual(sections.map(s => Number(s.match(/data-seconds="(\d+)"/)[1])), evidence.timings_seconds);
assert.equal(evidence.timings_seconds.reduce((sum, n) => sum + n, 0), 300);
assert.equal((html.match(/class="logo"/g) || []).length, 6);
assert(html.includes('background-size: cover'));
assert(html.includes('.slide:first-child:not([hidden]) {display:flex'));
assert(!/\.slide:first-child\s*\{[^}]*display\s*:/.test(html), 'Cover display rule must not override the hidden slide state');
assert(html.includes('body::before'));
assert(html.includes('--presentation-background:'));
assert(html.includes('.slide {background-color:transparent;background-image:none;}'));
assert(html.includes('prefers-reduced-motion:reduce'));
assert(html.includes('@media print'));
assert(!html.includes('<script src='));
assert(!html.includes('The lowest price'));
assert(!sections[0].includes('We turn buyer data'));
assert(sections[0].includes('class="cover-footer"'));
assert(sections[0].includes('Closy · Tacto Negotiation Arena'));
for (const theme of ['01','Evidence','02','Trade-offs','03','Execution']) assert(sections[0].includes(theme));
assert.equal((sections[0].match(/class="reveal /g) || []).length,3);
assert(!html.includes('id="benchmark-plot"'));
assert(sections[1].includes(`${evidence.p01.notice_days}<span>days`));
assert(sections[1].includes(`${evidence.p01.contract_notice_days}<span>days`));
assert(sections[1].includes(`${evidence.p01.verified_claims} / ${evidence.p01.cited_claims}`));
assert(sections[2].includes('€137.90') && sections[2].includes('€132.40'));
assert(sections[2].includes('45 days') && sections[2].includes('14 days'));
assert(sections[2].includes('15–75 combinations') && sections[2].includes('19 practice cases'));
assert(sections[3].includes('PEGASUS_READER=0') && sections[3].includes('LLM reader optional'));
assert(sections[4].includes(`${evidence.rehearsal.completed} / ${evidence.rehearsal.cases}`));
assert(sections[4].includes(`${evidence.rehearsal.median_decide_ms} ms`));
assert(sections[4].includes(`${evidence.rehearsal.max_decide_ms} ms`));
assert(sections[5].includes(`${evidence.rejected_model.archived_sessions}<span>`));
assert(sections[5].includes(`≤ ${evidence.rejected_model.required_error_pct}%`));
assert(sections[5].includes(`${evidence.rejected_model.observed_error_pct}%`));
assert(html.includes(evidence.vault_commit));
assert(html.includes(evidence.agent_commit));
assert(sections[1].includes('Historical'));
assert(sections[2].includes('not an isolated causal test'));
assert(sections[4].includes('not a benchmark of hidden-supplier'));
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(ids.length, new Set(ids).size, 'IDs must be unique');
assert(fs.existsSync(path.join(root, 'appendix.html')));

const elements = new Map(['previous-slide','next-slide','slide-counter','appendix-link'].map(id => [id, {
  id, hidden:false, disabled:false, textContent:'', events:{}, addEventListener(type, fn) {this.events[type] = fn;}
}]));
function block() {
  const b = {attrs:{}, classes:new Set(), inert:false, setAttribute(name,value) {this.attrs[name] = value;}};
  b.classList = {toggle(name, enabled) {b.classes[enabled ? 'add' : 'delete'](name);}};
  return b;
}
const slides = sections.map(section => ({hidden:false,
  blocks: Array.from({length:(section.match(/class="reveal /g) || []).length}, block),
  querySelectorAll(selector) {assert.equal(selector, '.reveal');return this.blocks;}
}));
assert.deepEqual(slides.map(s => s.blocks.length), [3,3,3,6,3,4]);
const document = {events:{}, querySelectorAll(selector) {assert.equal(selector,'.slide');return slides;},
  getElementById(id) {assert(elements.has(id), `Missing element ${id}`);return elements.get(id);},
  addEventListener(type, fn) {this.events[type] = fn;}};
const context = vm.createContext({document});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], context);
const next = () => elements.get('next-slide').events.click();
const previous = () => elements.get('previous-slide').events.click();
function check(index, step) {
  assert.equal(slides.filter(s => !s.hidden).length,1);
  assert.equal(slides[index].hidden,false);
  slides.forEach((slide, i) => slide.blocks.forEach((b,j) => {
    const pending = i !== index || j > step;
    assert.equal(b.attrs['aria-hidden'], String(pending));
    assert.equal(b.inert,pending);
    assert.equal(b.classes.has('is-pending'),pending);
  }));
  assert.equal(elements.get('slide-counter').textContent,`${index+1} / 6` + (slides[index].blocks.length ? ` · ${step+1} / ${slides[index].blocks.length}` : ''));
}
check(0,0);
assert(elements.get('previous-slide').disabled);
for (let index=0;index<slides.length;index++) {
  if (index) {next();check(index,0);}
  for (let step=1;step<slides[index].blocks.length;step++) {next();check(index,step);}
}
assert(elements.get('next-slide').disabled);
assert(!elements.get('appendix-link').hidden);
next();check(5,3);
for (let index=slides.length-1;index>=0;index--) {
  for (let step=slides[index].blocks.length-2;step>=0;step--) {previous();check(index,step);}
  if (index) {previous();check(index-1,slides[index-1].blocks.length-1);}
}
assert(elements.get('previous-slide').disabled);
assert(elements.get('appendix-link').hidden);
const key = (name, options={}) => document.events.keydown({key:name,target:{closest:()=>null},preventDefault(){},...options});
key('End');check(5,3);
key('Home');check(0,0);
key('ArrowRight');check(0,1);
key('ArrowLeft');check(0,0);
key(' ',{target:{closest:selector=>selector.includes('button') ? {} : null}});check(0,0);
key('ArrowRight',{ctrlKey:true});check(0,0);
key('ArrowRight',{target:{closest:()=>({})}});check(0,0);
key('Enter');check(0,0);
key('PageDown');check(0,1);
key('PageUp');check(0,0);
console.log('Passed: six slides, five-minute timing, evidence figures, source caveats, progressive reveals, keyboard navigation and appendix link.');

const fitParts = [180, 400].map(height => {
  const values = new Map();
  return {height, values, classList:{contains:()=>false}, style:{
    setProperty(key,value) {values.set(key,value);}, removeProperty(key) {values.delete(key);}
  }};
});
fitParts.forEach((part,index) => {part.getBoundingClientRect = () => {
  const top = 100 + fitParts.slice(0,index).reduce((sum,p)=>sum+p.height*Number(p.values.get('zoom') || 1),0);
  return {top,bottom:top+part.height*Number(part.values.get('zoom') || 1)};
};});
const fitWindow = {innerWidth:1280,innerHeight:600,events:{},addEventListener(name,fn){this.events[name]=fn;}};
const cover = {}, active = {children:fitParts};
const fitDocument = {querySelectorAll:()=>fitParts.filter(p=>p.values.has('zoom')),
  querySelector:selector=>selector==='.slide' ? cover : active,addEventListener(){}};
let printing = false;
vm.runInNewContext(html.match(/<script id="fit-to-screen">([\s\S]*?)<\/script>/)[1], {
  document:fitDocument,window:fitWindow,matchMedia:()=>({matches:printing}),requestAnimationFrame:fn=>fn()
});
assert(Number(fitParts[0].values.get('zoom')) < 1);
assert(fitParts[1].getBoundingClientRect().bottom <= fitWindow.innerHeight-88);
printing = true; fitWindow.events.beforeprint();
assert(!fitParts[0].values.has('zoom'));
printing = false; fitWindow.innerWidth = 700; fitWindow.events.resize();
assert(!fitParts[0].values.has('zoom'), 'Mobile layout must retain native scrolling');
console.log('Passed: inherited desktop screen fitting, print reset and mobile scrolling.');
