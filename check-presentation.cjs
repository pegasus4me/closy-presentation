const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const html = fs.readFileSync(path.join(__dirname, 'presentation.html'), 'utf8');
const data = JSON.parse(html.match(/<script type="application\/json" id="negotiation-chart-data">([\s\S]*?)<\/script>/)[1]);
const elements = new Map();
function element(id, value = '') {
  const item = {id, value, textContent: '', innerHTML: '', hidden: false, dataset: {}, attrs: {},
    events: {}, addEventListener(type, fn) {this.events[type] = fn;},
    setAttribute(name, value) {this.attrs[name] = value;}};
  elements.set(id, item);
  return item;
}
for (const id of ['previous-slide', 'next-slide', 'slide-counter', 'replay-plot', 'replay-round-label',
  'replay-detail', 'replay-summary', 'replay-source', 'benchmark-plot', 'benchmark-legend',
  'benchmark-method', 'benchmark-detail', 'benchmark-source', 'negotiation-panel',
  'benchmark-stage', 'benchmark-step-title', 'benchmark-step-description', 'benchmark-step-count',
  'benchmark-back', 'benchmark-forward', 'benchmark-score-explanation', 'benchmark-caution']) element(id);
element('negotiation-chart-data').textContent = JSON.stringify(data);
element('replay-round', '0');
element('benchmark-goal', 'all');
element('benchmark-case', 'P01');
const views = ['0', '1', '2'].map(view => {
  const item = element('view-' + view); item.dataset.benchmarkView = view; return item;
});
// Counted from the HTML so optional slides can be added or removed without editing this check.
// The architecture is always the last slide; the benchmarks are found by their content.
const slideSections = html.split('<section class="slide"').slice(1);
const slideCount = slideSections.length;
const lastSlide = slideCount - 1;
const benchmarkSlide = slideSections.findIndex(section => section.includes('id="benchmark-stage"'));
const concessionSlide = slideSections.findIndex(section => section.includes('concession-reveal'));
assert(concessionSlide > 0, 'Concession slide not found');
assert(benchmarkSlide > 2, 'Benchmark slide not found after slide 3');
const slides = Array.from({length: slideCount}, (_, index) => ({hidden: index !== 0}));
const securityBlocks = Array.from({length: 4}, (_, index) => ({
  attrs: {},
  classes: new Set(index ? ['is-pending'] : []),
  classList: {toggle(name, enabled) {this.owner.classes[enabled ? 'add' : 'delete'](name);}},
  setAttribute(name, value) {this.attrs[name] = value;},
}));
securityBlocks.forEach(block => {block.classList.owner = block;});
const concessionBlocks = Array.from({length: 3}, (_, index) => ({
  attrs: {},
  classes: new Set(index ? ['is-pending'] : []),
  classList: {toggle(name, enabled) {this.owner.classes[enabled ? 'add' : 'delete'](name);}},
  setAttribute(name, value) {this.attrs[name] = value;},
}));
concessionBlocks.forEach(block => {block.classList.owner = block; block.closest = () => slides[concessionSlide];});
const document = {events: {}, getElementById: id => {
    assert(elements.has(id), 'Missing test element ' + id); return elements.get(id);
  }, addEventListener(type, fn) {this.events[type] = fn;}, querySelectorAll(selector) {
    if (selector === '.slide') return slides;
    if (selector === '.security-reveal') return securityBlocks;
    if (selector === '.concession-reveal') return concessionBlocks;
    if (selector === '[data-benchmark-view]') return views;
    if (selector.startsWith('#replay-plot')) return [...elements.get('replay-plot').innerHTML.matchAll(/data-round="(\d+)"/g)].map(match => {
      const item = element('point-' + match[1]); item.dataset.round = match[1]; return item;
    });
    if (selector.startsWith('#benchmark-plot')) return [...elements.get('benchmark-plot').innerHTML.matchAll(/data-case="(P\d+)"/g)].map(match => {
      const item = element('row-' + match[1]); item.dataset.case = match[1]; return item;
    });
    throw Error('Unexpected selector ' + selector);
  }};
let reduceMotion = false, animationCount = 0;
elements.get('benchmark-stage').animate = () => {animationCount++;};
const context = vm.createContext({document, Intl, window: {matchMedia: () => ({matches: reduceMotion})}});
for (const script of html.matchAll(/<script(?: id="interactive-charts")?>([\s\S]*?)<\/script>/g)) vm.runInContext(script[1], context);
function assertActive(index) {
  assert.equal(slides.filter(slide => !slide.hidden).length, 1);
  assert.equal(slides[index].hidden, false);
}
assertActive(0);
for (let index = 1; index <= concessionSlide; index++) {elements.get('next-slide').events.click(); assertActive(index);}
assert.equal(elements.get('slide-counter').textContent, `${concessionSlide + 1} / ${slideCount} · 1 / 3`);
assert.equal(concessionBlocks[0].attrs['aria-hidden'], 'false');
assert.equal(concessionBlocks[1].attrs['aria-hidden'], 'true');
for (let step = 1; step < 3; step++) {
  elements.get('next-slide').events.click(); assertActive(concessionSlide);
  assert.equal(concessionBlocks[step].attrs['aria-hidden'], 'false');
  assert.equal(elements.get('slide-counter').textContent, `${concessionSlide + 1} / ${slideCount} · ${step + 1} / 3`);
}
elements.get('previous-slide').events.click(); assertActive(concessionSlide);
assert.equal(concessionBlocks[2].attrs['aria-hidden'], 'true');
elements.get('next-slide').events.click(); assertActive(concessionSlide);
for (let index = concessionSlide + 1; index < slideCount; index++) {elements.get('next-slide').events.click(); assertActive(index);}
assert.equal(concessionBlocks[0].attrs['aria-hidden'], 'true');
assert.equal(elements.get('slide-counter').textContent, `${slideCount} / ${slideCount} · 1 / 4`);
assert.equal(securityBlocks[0].attrs['aria-hidden'], 'false');
assert.equal(securityBlocks[1].attrs['aria-hidden'], 'true');
assert.equal(elements.get('next-slide').disabled, false);
for (let step = 1; step < 4; step++) {
  elements.get('next-slide').events.click();
  assertActive(lastSlide);
  assert.equal(securityBlocks[step].attrs['aria-hidden'], 'false');
  assert.equal(elements.get('slide-counter').textContent, `${slideCount} / ${slideCount} · ${step + 1} / 4`);
}
assert(elements.get('next-slide').disabled);
elements.get('previous-slide').events.click(); assertActive(lastSlide);
assert.equal(securityBlocks[3].attrs['aria-hidden'], 'true');
for (let step = 0; step < 3; step++) elements.get('previous-slide').events.click();
assertActive(lastSlide - 1);
const key = name => document.events.keydown({key: name, target: {closest: () => null}, preventDefault() {}});
key('ArrowRight'); assertActive(lastSlide);
assert.equal(securityBlocks[1].attrs['aria-hidden'], 'true');
key('ArrowRight'); assert.equal(securityBlocks[1].attrs['aria-hidden'], 'false');
key('ArrowLeft'); assert.equal(securityBlocks[1].attrs['aria-hidden'], 'true');
key('End'); assert.equal(securityBlocks[3].attrs['aria-hidden'], 'false');
key('Home'); assertActive(0);
for (let index = 1; index <= concessionSlide; index++) key('ArrowRight');
assertActive(concessionSlide);
assert.equal(concessionBlocks[1].attrs['aria-hidden'], 'true');
key('ArrowRight'); assertActive(concessionSlide);
assert.equal(concessionBlocks[1].attrs['aria-hidden'], 'false');
key('ArrowLeft'); assert.equal(concessionBlocks[1].attrs['aria-hidden'], 'true');
key('Home'); assertActive(0);
// One move per slide to the concession slide, two more reveal its steps, then one per slide.
for (let move = 0; move < benchmarkSlide + 2; move++) elements.get('next-slide').events.click();
assertActive(benchmarkSlide);
assert.equal(elements.get('negotiation-panel').hidden, true);
assert.equal(elements.get('benchmark-score-explanation').hidden, false);
const savingsView = elements.get('benchmark-score-explanation').innerHTML;
assert(savingsView.includes('12,759,510.63'));
assert(savingsView.includes('11,580,638.24'));
assert(savingsView.includes('1,178,872.39'));
assert(savingsView.includes('9.2%'));
assert(savingsView.includes('10 cases'));
for (const row of data.cases) assert(savingsView.includes(row.id));
assert(!savingsView.includes('99.8'));
assert(elements.get('benchmark-method').textContent.includes('no repeated runs counted'));
assert(elements.get('benchmark-caution').textContent.includes('not from a single run'));
elements.get('benchmark-forward').events.click();
assert.equal(elements.get('negotiation-panel').hidden, false);
assert.equal(elements.get('benchmark-score-explanation').hidden, true);
assert(elements.get('benchmark-step-count').textContent.includes('2 of 3'));
assert.equal((elements.get('benchmark-plot').innerHTML.match(/data-case=/g) || []).length, 10);
assert(elements.get('replay-summary').textContent.includes('56,862.84'));
assert(elements.get('replay-summary').textContent.includes('1,096,916.90'));
assert(elements.get('replay-round-label').textContent === 'Offer 1 of 5');
assert(elements.get('replay-detail').innerHTML.includes('contract and the supplier'));
assert(!elements.get('replay-summary').textContent.includes('Score'));
elements.get('replay-round').value = '0'; elements.get('replay-round').events.input();
assert(elements.get('replay-detail').innerHTML.includes('138.55'));
assert(elements.get('replay-detail').innerHTML.includes('30 days'));
elements.get('point-2').events.click();
assert(elements.get('replay-detail').innerHTML.includes('132.40'));
assert(elements.get('replay-detail').innerHTML.includes('14 days'));
assert(elements.get('replay-detail').innerHTML.includes('faster payment'));
elements.get('replay-round').value = '4'; elements.get('replay-round').events.input();
assert(elements.get('replay-round-label').textContent === 'Offer 5 of 5');
assert(elements.get('replay-detail').innerHTML.includes('Closy accepts it'));
elements.get('benchmark-forward').events.click();
assert(elements.get('benchmark-method').textContent.includes('75 ended practice sessions'));
assert(elements.get('benchmark-legend').textContent.includes('median'));
elements.get('benchmark-goal').value = 'quality_first'; elements.get('benchmark-goal').events.change();
assert.equal((elements.get('benchmark-plot').innerHTML.match(/data-case=/g) || []).length, 1);
assert(elements.get('benchmark-detail').innerHTML.includes('P11'));
elements.get('benchmark-back').events.click();
assert.equal(elements.get('negotiation-panel').hidden, false);
assert.equal(views[1].attrs['aria-pressed'], 'true');
const before = animationCount;
reduceMotion = true;
views[0].events.click();
assert.equal(animationCount, before, 'Reduced-motion preference must suppress stage animation');
assert.equal(elements.get('negotiation-panel').hidden, true);
assert.equal(elements.get('benchmark-back').disabled, true);
views[2].events.click();
elements.get('benchmark-forward').events.click();
assert.equal(views[0].attrs['aria-pressed'], 'true');
const benchmarkSvg = vm.runInContext('benchmarkSvg(chartData.cases, "vault", "P01")', context);
const archiveSvg = vm.runInContext('benchmarkSvg(chartData.cases, "archive", "P01")', context);
const replaySvg = vm.runInContext('replaySvg(chartData.replay.points, 4)', context);
for (const svg of [benchmarkSvg, archiveSvg, replaySvg]) {
  assert(!svg.includes('NaN')); assert(!svg.includes('undefined'));
}
assert.equal(vm.runInContext('escapeChartText("<img onerror=bad>")', context), '&lt;img onerror=bad&gt;');
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify([benchmarkSvg, archiveSvg, replaySvg]));
console.log('Passed: navigation, concession reveals, replay, three benchmark steps, aggregate savings, filters, reduced motion, source data and SVG geometry.');
