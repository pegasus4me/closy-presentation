# Closy — Presentation

Nine-slide HTML presentation for Closy, an AI buyer that negotiates with suppliers by email, built for the Tacto Negotiation Arena.

## Open the presentation

Open `presentation.html` in a browser. It works locally without a server or an installation: the logo, background image, chart data and JavaScript are embedded in the HTML.

Use the **Previous / Next** buttons or the arrow keys to navigate. Slide 2 explains the approach and implementation. Slide 4 reveals one part of the recorded payment trade at a time. The final slide reveals one architecture block at a time.

Two slides are optional: slide 5 ("The proof was in the contract.", `<section aria-labelledby="slide-proof-title">`) and slide 8 ("Why did Closy write that?", `<section id="slide-why">`). Delete either section, or both, to shorten the deck. Navigation and `check-presentation.cjs` count the slides from the HTML, and slide 8's script does nothing once its section is gone, so nothing else needs to change.

Slide 8 lists Closy's recorded first P01 email sentence by sentence; select one (click, or Tab then Enter) to see the evidence it cites, the arena's check, the supplier's reply and the measured effect of that argument type. Its data is embedded in the `why-data` block, extracted from `analysis/pegasus_data/sessions/P01-3a0b48ea4e9dae20.json` in the agent repository. Slides taller than the screen are scaled down to fit above the navigation.

## Files

- `presentation.html`: the complete presentation, including embedded assets, data and scripts.
- `presentation-backup.pdf`: offline backup of the nine slides, captured on screen at 1920×1080 with slides 4 and 9 fully revealed. Images only: links are not clickable, slide 7 shows its first step and slide 8 its default sentence.
- `presentation-charts.js`: source copy of the interactive replay and benchmark code embedded in the HTML.
- `negotiation-chart-data.json`: source copy of the data embedded in the HTML.
- `benchmark-summary.json`: benchmark summary snapshot.
- `build-chart-data.py`: compiles chart data from local vault and agent checkouts.
- `check-presentation.cjs`: checks navigation, replay, benchmark interactions, savings and chart geometry using Node.js.

## Validate

```sh
node check-presentation.cjs
```

## Data provenance

Recorded practice results come from [the team vault](https://github.com/IchamRaison/ehl-finale-vault) and [the agent repository](https://github.com/IchamRaison/hollerau-agent). Source commits and session links are included in the data and slides.

The slide 3 example compares two completed P02 runs with different contract terms. It illustrates the arena's total-cost scoring model; it is not a controlled experiment or a claim about production savings.

## Refresh the benchmark data

```sh
python3 build-chart-data.py --vault /path/to/ehl-finale-vault --agent /path/to/hollerau-agent
```

After changing the chart source files, update the matching embedded `interactive-charts` and `negotiation-chart-data` script blocks in `presentation.html`. Opening the presentation uses those embedded copies.
