# Closy — Presentation

Six-slide HTML presentation for Closy, an AI buyer that negotiates with suppliers by email, built for the Tacto Negotiation Arena.

## Open the presentation

Open `presentation.html` in a browser. It works locally without a server or an installation: the logo, background image, chart data and JavaScript are embedded in the HTML.

Use the **Previous / Next** buttons or the arrow keys to navigate. The final slide reveals one architecture block at a time.

## Files

- `presentation.html`: the complete presentation, including embedded assets, data and scripts.
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

The slide 2 example compares two completed P02 runs with different contract terms. It illustrates the arena's total-cost scoring model; it is not a controlled experiment or a claim about production savings.

## Refresh the benchmark data

```sh
python3 build-chart-data.py --vault /path/to/ehl-finale-vault --agent /path/to/hollerau-agent
```

After changing the chart source files, update the matching embedded `interactive-charts` and `negotiation-chart-data` script blocks in `presentation.html`. Opening the presentation uses those embedded copies.
