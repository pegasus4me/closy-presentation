// Data is embedded in the presentation so the charts work without a network connection.
const chartData = JSON.parse(document.getElementById('negotiation-chart-data').textContent);
const euro = value => new Intl.NumberFormat('en-IE', {style: 'currency', currency: 'EUR', maximumFractionDigits: 2}).format(value);
const pointsLabel = value => (value * 100).toFixed(1);
const escapeChartText = value => String(value).replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));

function replaySvg(points, active) {
  const x = index => 60 + index * 176;
  const y = price => 220 - (price - 130) * 18;
  const grid = [130, 135, 140].map(price => `<line x1="60" x2="764" y1="${y(price)}" y2="${y(price)}" stroke="var(--chart-grid)" stroke-dasharray="3 8"/><text x="12" y="${y(price) + 5}" fill="var(--chart-muted)">€${price}</text>`).join('');
  const line = points.map((point, index) => `${x(index)},${y(point.price)}`).join(' ');
  const dots = points.map((point, index) => `<g data-round="${index}" role="button" tabindex="0" aria-label="Round ${point.round}: €${point.price.toFixed(2)} per unit">
    <title>Round ${point.round}: €${point.price.toFixed(2)}. Select to inspect the terms.</title>
    <circle cx="${x(index)}" cy="${y(point.price)}" r="18" fill="transparent"/>
    ${index === active ? `<circle cx="${x(index)}" cy="${y(point.price)}" r="13" fill="var(--chart-accent)" fill-opacity="0.12"/>` : ''}
    <circle cx="${x(index)}" cy="${y(point.price)}" r="${index === active ? 7 : 5}" fill="${index === active ? 'var(--chart-accent)' : '#071117'}" stroke="var(--chart-accent)" stroke-width="2"/>
    <text x="${index === 0 ? x(index) + 6 : x(index)}" y="${y(point.price) - 22}" text-anchor="${index === 0 ? 'start' : 'middle'}" fill="var(--chart-text)">${point.price.toFixed(2)}</text>
    <text x="${x(index)}" y="253" text-anchor="middle" fill="var(--chart-muted)">${index === 0 ? 'Opening' : 'Round ' + point.round}</text>
  </g>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 820 270" aria-labelledby="replay-chart-title" style="font:18px -apple-system,BlinkMacSystemFont,sans-serif">
    <title id="replay-chart-title">P01 supplier quoted unit price over five rounds, from €138.55 to €131.20. Select a point or use the slider.</title>
    ${grid}<line x1="${x(active)}" x2="${x(active)}" y1="${y(points[active].price)}" y2="220" stroke="var(--chart-accent)" stroke-opacity="0.3" stroke-dasharray="4 6"/>
    <polyline points="${line}" fill="none" stroke="var(--chart-accent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${dots}</svg>`;
}

function benchmarkSvg(cases, mode, activeId) {
  const left = 70, scale = 760, height = cases.length * 31 + 55;
  const grid = [0, .25, .5, .75, 1].map(value => `<line x1="${left + value * scale}" x2="${left + value * scale}" y1="10" y2="${height - 30}" stroke="var(--chart-grid)" stroke-dasharray="3 8"/><text x="${left + value * scale}" y="${height - 7}" text-anchor="middle" fill="var(--chart-muted)">${value * 100}</text>`).join('');
  const rows = cases.map((row, index) => {
    const y = 25 + index * 31, selected = row.id === activeId;
    const observations = mode === 'archive'
      ? row.runs.map((run, runIndex) => `<circle cx="${left + scale * run.score}" cy="${y + (runIndex % 3 - 1) * 3}" r="3.5" fill="var(--chart-archive)"/>`).join('') + `<line x1="${left + scale * row.median}" x2="${left + scale * row.median}" y1="${y - 9}" y2="${y + 9}" stroke="var(--chart-accent)" stroke-width="3" stroke-linecap="round"/><circle cx="${left + scale * row.archive_best}" cy="${y}" r="5" fill="#071117" stroke="var(--chart-best)" stroke-width="2"/>`
      : `<line x1="${left + scale * row.reference}" x2="${left + scale * row.score}" y1="${y + 4}" y2="${y - 4}" stroke="var(--chart-reference)" stroke-opacity="0.5" stroke-width="2"/>
        <path d="M ${left + scale * row.reference} ${y - 1} l 5 5 l -5 5 l -5 -5 Z" fill="var(--chart-reference)"/>
        ${selected ? `<circle cx="${left + scale * row.score}" cy="${y - 4}" r="11" fill="var(--chart-accent)" fill-opacity="0.12"/>` : ''}
        <circle cx="${left + scale * row.score}" cy="${y - 4}" r="5.5" fill="var(--chart-accent)"/>`;
    const label = mode === 'archive' ? `${pointsLabel(row.median)} · ${row.runs.length} runs` : pointsLabel(row.score);
    return `<g class="score-row" style="--row-delay:${index * 25}ms" data-case="${row.id}" role="button" tabindex="0" aria-label="Inspect ${row.id}">
      <title>${row.id}: ${mode === 'archive' ? 'median ' + pointsLabel(row.median) + ' out of 100, ' + row.runs.length + ' archived runs' : 'team best ' + pointsLabel(row.score) + ', Tacto reference ' + pointsLabel(row.reference) + ', out of 100'}</title>
      <rect x="0" y="${y - 14}" width="1000" height="28" rx="6" fill="${selected ? 'var(--chart-accent)' : 'transparent'}" fill-opacity="0.07"/>
      <text x="8" y="${y + 5}" fill="var(--chart-text)">${row.id}</text>${observations}
      <text x="850" y="${y + 5}" fill="${selected ? 'var(--chart-accent)' : 'var(--chart-text)'}">${label}</text>
    </g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 ${height}" aria-labelledby="benchmark-chart-title" style="font:18px -apple-system,BlinkMacSystemFont,sans-serif">
    <title id="benchmark-chart-title">Practice negotiation scores, 0 to 100. Higher is better. Select a case to inspect its results.</title>${grid}${rows}</svg>`;
}

const roundSlider = document.getElementById('replay-round');
function renderReplay() {
  const replay = chartData.replay, index = Number(roundSlider.value), point = replay.points[index];
  document.getElementById('replay-plot').innerHTML = replaySvg(replay.points, index);
  document.getElementById('replay-round-label').textContent = `Offer ${index + 1} of ${replay.points.length}`;
  const story = [
    'The supplier asks for €138.55 per unit. Closy checks the contract and the supplier’s cost claims before replying.',
    'Closy cites its cost estimate and the contract’s notice period. The supplier moves the price start to April 2027 and lowers the quote.',
    'Closy offers faster payment in exchange for a lower price. The supplier cuts the quote to €132.40.',
    'Closy continues the payment-for-price trade-off. The supplier lowers its quote to €131.70.',
    'The supplier makes its final offer: €131.20 per unit. Closy accepts it.'
  ];
  const startDate = new Intl.DateTimeFormat('en', {month: 'short', year: 'numeric', timeZone: 'UTC'}).format(new Date(`${point.effective_date}T00:00:00Z`));
  document.getElementById('replay-detail').innerHTML = `<p class="chart-kicker">${index === 0 ? 'Supplier’s first offer' : index === replay.points.length - 1 ? 'Final offer · accepted' : `Supplier’s revised offer ${index}`}</p>
    <p class="chart-large">${euro(point.price)}<span> / unit</span></p>
    <p class="replay-action">${story[index]}</p>
    <dl class="chart-facts"><dt>Payment due</dt><dd>${point.payment_days} days</dd><dt>Price starts</dt><dd>${startDate}</dd></dl>
    ${index === 0 ? '<p class="chart-caption">The opening email did not specify payment terms; 30 days is the recorded default.</p>' : ''}`;
  document.querySelectorAll('#replay-plot [data-round]').forEach(pointElement => {
    const activate = () => {roundSlider.value = pointElement.dataset.round; renderReplay();};
    pointElement.addEventListener('click', activate);
    pointElement.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {event.preventDefault(); event.stopPropagation(); activate();}
    });
  });
}
roundSlider.addEventListener('input', renderReplay);
const replay = chartData.replay;
document.getElementById('replay-summary').textContent = `Deal reached: ${euro(replay.deal)} in total cost · ${euro(replay.savings)} less than the opening total cost.`;
document.getElementById('replay-source').href = replay.url;

let benchmarkMode = 'vault';
const goalFilter = document.getElementById('benchmark-goal');
const caseSelect = document.getElementById('benchmark-case');
function filteredCases() {
  return chartData.cases.filter(row => goalFilter.value === 'all' || row.goal === goalFilter.value);
}
function renderCaseDetail() {
  const row = chartData.cases.find(item => item.id === caseSelect.value);
  const archive = benchmarkMode === 'archive';
  document.getElementById('benchmark-detail').innerHTML = `<p class="chart-kicker">${row.id} · ${escapeChartText(row.goal.replaceAll('_', ' '))}</p>
    <p class="chart-large">${pointsLabel(archive ? row.median : row.score)}<span> / 100</span></p>
    <p class="chart-caption">${archive ? 'Typical score (median) across ' + row.runs.length + ' archived runs, including failures.' : 'Our best recorded score for this case.'}</p>
    <dl class="chart-facts">${archive ? `<dt>Best archived run</dt><dd>${pointsLabel(row.archive_best)} / 100</dd><dt>Deals reached</dt><dd>${row.deal_count} of ${row.runs.length} runs</dd>` : `<dt>Tacto reference</dt><dd>${pointsLabel(row.reference)} / 100</dd><dt>Total cost</dt><dd>${euro(row.deal)}</dd><dt>Saved vs opening</dt><dd>${euro(row.savings)}</dd>`}</dl>
    ${archive ? '' : `<a class="chart-source" href="https://arena.tacto.ai/replay/${row.session}" target="_blank" rel="noopener noreferrer">Open recorded replay ↗</a>`}`;
}
function renderBenchmark() {
  const cases = filteredCases();
  if (!cases.some(row => row.id === caseSelect.value)) caseSelect.value = cases[0].id;
  document.getElementById('benchmark-plot').innerHTML = benchmarkSvg(cases, benchmarkMode, caseSelect.value);
  document.getElementById('benchmark-legend').textContent = benchmarkMode === 'archive'
    ? 'Grey dots: each run · Cyan tick: typical score (median) · Amber ring: best run'
    : 'Cyan circle: our best · Grey diamond: Tacto reference · Further right = better';
  document.getElementById('benchmark-method').textContent = benchmarkMode === 'archive'
    ? `${chartData.archived_runs} ended practice sessions archived in the code repository. Mixed agent versions, uneven repeats and incomplete coverage of later runs: this describes the archive, not the current agent’s expected performance.`
    : `Team bests: ${chartData.vault_snapshot}. Tacto reference: ${chartData.reference_snapshot}. Best-of results from different versions and repeat counts; this is a descriptive snapshot, not a controlled comparison. Scores are normalized savings, not percentage discounts.`;
  renderCaseDetail();
  document.querySelectorAll('#benchmark-plot [data-case]').forEach(rowElement => {
    const inspect = () => {caseSelect.value = rowElement.dataset.case; renderCaseDetail();};
    rowElement.addEventListener('focus', inspect);
    rowElement.addEventListener('click', () => {inspect(); renderBenchmark();});
    rowElement.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {event.preventDefault(); event.stopPropagation(); inspect(); renderBenchmark();}
    });
  });
}
function updateCaseOptions() {
  const selected = caseSelect.value;
  caseSelect.innerHTML = filteredCases().map(row => `<option value="${row.id}">${row.id}</option>`).join('');
  if (filteredCases().some(row => row.id === selected)) caseSelect.value = selected;
  renderBenchmark();
}
goalFilter.addEventListener('change', updateCaseOptions);
caseSelect.addEventListener('change', renderBenchmark);
document.querySelectorAll('[data-benchmark-view]').forEach(button => {
  button.addEventListener('click', () => {
    const view = button.dataset.benchmarkView;
    showBenchmarkStep(Number(view));
  });
});
const benchmarkSteps = [
  {title: 'Total saved across our practice cases.', description: 'Opening total cost minus negotiated total cost, across all 10 recorded P cases.', next: 'Show the comparison →'},
  {title: 'Compare one case at a time.', description: 'Each row is the same buying case. The cyan circle is our best recorded result; the grey diamond is Tacto’s reference.', next: 'Show the other runs →'},
  {title: 'One great result is only part of the story.', description: 'Show every archived run, including failures. The cyan mark is the middle score; the spread shows how much past results varied.', next: 'Start again ↺'}
];
let benchmarkStep = 0;
function animateBenchmark() {
  const stage = document.getElementById('benchmark-stage');
  if (stage.animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    stage.animate([{opacity: 0, transform: 'translateY(10px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: 300, easing: 'ease-out'});
  }
}
function showBenchmarkStep(index) {
  benchmarkStep = Math.max(0, Math.min(2, index));
  const step = benchmarkSteps[benchmarkStep];
  document.getElementById('benchmark-step-title').textContent = step.title;
  document.getElementById('benchmark-step-description').textContent = step.description;
  document.getElementById('benchmark-step-count').textContent = `Step ${benchmarkStep + 1} of 3`;
  document.getElementById('benchmark-back').disabled = benchmarkStep === 0;
  document.getElementById('benchmark-forward').textContent = step.next;
  document.getElementById('benchmark-score-explanation').hidden = benchmarkStep !== 0;
  document.getElementById('negotiation-panel').hidden = benchmarkStep === 0;
  document.querySelectorAll('[data-benchmark-view]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.benchmarkView) === benchmarkStep)));
  if (benchmarkStep > 0) {
    benchmarkMode = benchmarkStep === 1 ? 'vault' : 'archive';
    renderBenchmark();
  } else {
    document.getElementById('benchmark-method').textContent = `Sum of opening total cost minus agreed total cost for each of the ${chartData.cases.length} P cases in the vault snapshot (${chartData.vault_snapshot}). One best recorded agreement per case, with no repeated runs counted. Total costs include the arena’s cost components. Cases: ${chartData.cases.map(row => row.id).join(', ')}. The reduction percentage is total savings divided by total opening cost; it is not the arena score.`;
  }
  document.getElementById('benchmark-caution').textContent = benchmarkStep === 0
    ? 'Best recorded agreement per case, across different agent versions. Simulated practice savings; this total is not from a single run.'
    : benchmarkStep === 1
      ? 'Practice bests, not a final-test result. Versions and repeat counts differ.'
      : 'These 75 archived runs mix agent versions. They do not establish the reliability of today’s version.';
  animateBenchmark();
}
document.getElementById('benchmark-back').addEventListener('click', () => showBenchmarkStep(benchmarkStep - 1));
document.getElementById('benchmark-forward').addEventListener('click', () => showBenchmarkStep((benchmarkStep + 1) % 3));
function renderSavingsOverview() {
  // Add money in cents so the aggregate retains the recorded two-decimal amounts.
  const openingCents = chartData.cases.reduce((sum, row) => sum + Math.round(row.opening * 100), 0);
  const dealCents = chartData.cases.reduce((sum, row) => sum + Math.round(row.deal * 100), 0);
  const savedCents = openingCents - dealCents;
  const reduction = savedCents / openingCents * 100;
  document.getElementById('benchmark-score-explanation').innerHTML = `<div class="cost-path">
    <div class="cost-step"><p class="chart-kicker">Opening total cost</p><p class="cost-value">${euro(openingCents / 100)}</p><p class="chart-caption">Across all recorded P cases</p></div>
    <div class="cost-step"><p class="chart-kicker">Negotiated total cost</p><p class="cost-value">${euro(dealCents / 100)}</p><p class="chart-caption">One best agreement per case</p></div>
    <div class="cost-step"><p class="chart-kicker">Practice cases included</p><p class="cost-value">${chartData.cases.length} cases</p><p class="chart-caption">Every P case in this snapshot</p></div>
    </div><div class="score-explanation"><div><p class="chart-kicker">Total saved vs opening</p>
      <p class="score-calculation">${reduction.toFixed(1)}% lower total cost</p></div><p class="score-result">${euro(savedCents / 100)}</p></div>
    <p class="chart-caption score-example">${chartData.cases.map(row => row.id).join(' · ')}. Total cost includes price, delivery, payment terms and other costs charged by the arena.</p>`;
}
document.getElementById('benchmark-source').href = chartData.source;
renderReplay();
updateCaseOptions();
renderSavingsOverview();
showBenchmarkStep(0);
