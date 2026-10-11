# Closy — Presentation

Six-slide, five-minute HTML pitch about our approach and how we built Closy for the Tacto Negotiation Arena. English slides with the original logo, ASCII background and SF Pro/system typography.

## Open the presentation

Open `presentation.html` in a browser. It works locally without a server or an installation: the logo, background image and JavaScript are embedded in each HTML file.

Use **Next**, **Space** or **→** to reveal one block, then advance to the next slide. **Previous / ←** steps backward. **Home** resets the pitch; **End** opens the fully revealed closing slide. Reduced-motion preferences are respected.

At the end, **Benchmarks** opens `appendix.html`, keeping the replay and score charts outside the six-slide pitch.

## Pitch timing

1. Our approach and implementation — 20 s
2. We turned the data into negotiation leverage — 45 s
3. We traded terms, not just price — 55 s
4. Inside one negotiation turn — 70 s
5. Built to finish before the deadline — 50 s
6. We tested ideas—and rejected the ones that failed — 60 s

## Files

- `presentation.html`: the main pitch, including embedded assets and navigation.
- `appendix.html`: preserved interactive replay and benchmark charts.
- `speaker-notes.md`: talk track, timings, implementation choices and evidence limits.
- `pitch-evidence.json`: exact figures and source URLs used in the main pitch.
- `presentation-charts.js`: source copy of the replay and benchmark code embedded in the appendix.
- `negotiation-chart-data.json`: source copy of the data embedded in the appendix.
- `benchmark-summary.json`: benchmark summary snapshot.
- `build-chart-data.py`: compiles chart data from local vault and agent checkouts.
- `check-presentation.cjs`: checks pitch navigation, reveals, keyboard handling and evidence figures.
- `check-appendix.cjs`: checks the preserved benchmark interactions and chart geometry.

The older seven-slide PDF is retained as `previous-presentation-backup.pdf`; it is not a backup of the new pitch. `presentation-backup.pdf` is the backup of the current six slides: captured on screen at 1920×1080, each slide at its last reveal step, navigation hidden; images only, so links are not clickable. The team’s short-screen logo adjustment, desktop fit-to-screen behavior and replay-label fix are preserved. Desktop fitting may reduce text size; mobile screens retain scrolling.

## Validate

```sh
node check-presentation.cjs
node check-appendix.cjs
```

## Data provenance

Recorded practice results come from [the team vault](https://github.com/IchamRaison/ehl-finale-vault) and [the agent repository](https://github.com/IchamRaison/hollerau-agent). Source commits and session links are included in the data and slides.

The architecture follows main `4fabd57` and the vault’s planned final configuration (`PEGASUS_READER=0`; LLM reader optional). The P01 exchange is historical (`b09063f`). Local rehearsal measures execution, not hidden-supplier negotiation quality. R4 results are offline case-held-out experiments. The separate DSH pilot is not presented as the final agent.

Appendix bests mix versions and repeat counts and are not current-agent performance estimates. Each source snapshot and limitation is retained. Checks do not replace visual review in the presentation browser.

## Refresh the benchmark data

```sh
python3 build-chart-data.py --vault /path/to/ehl-finale-vault --agent /path/to/hollerau-agent
```

After changing the chart source files, update the matching embedded `interactive-charts` and `negotiation-chart-data` script blocks in `appendix.html`. The benchmark builder does not modify the pitch or its evidence.
