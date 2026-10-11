# Closy — five-minute pitch

English talk track. Six main slides; interactive replay and benchmark charts in `appendix.html` for questions.

## 1 · Our approach: we didn’t trust the LLM — 0:00–0:20

“We’re security engineers, not ML researchers. An LLM can write, but it can invent a number or cite a fact that doesn’t exist. For a buyer, that’s unacceptable. So we treated the agent as an untrusted system: zero trust. The code computes every euro, every argument cites a verifiable fact, and a fail-closed guard checks the email before it leaves.”

Point at block 05: `guard.py` removes any sentence whose ID is unknown or whose figure does not match its source, keeps our alternative, its price, a budget or urgency out of the email, and replaces an invalid term sheet with a safe question. The LLM is optional (reader and prose, off by default); the 0.998 replay used the template. The 202-session figures measure what suppliers took into account (X9); ranking arguments by that effect is PR #12, not in `4fabd57`. Do not mention prompt injection or attacking the agent: the project has none.

## 2 · We turned the data into negotiation leverage — 0:20–1:05

“In P01, the supplier announced a price increase with 51 days’ notice. The contract required 90. Closy cited the two records to challenge the increase’s start date. In this recorded negotiation, all five cited arguments were verified by the arena.”

The reference IDs point to the supplier notice and the contract. The evidence adapter chooses relevant facts from the package. This is not a benchmark of general document understanding. “Verified” is the arena’s claim assessment.

The replay used historical agent b09063f, not final revision 4fabd57. Follow the same session in slides 2 and 3.

## 3 · We traded terms, not just price — 1:05–2:00

“That supplier offered €137.90 with payment at 45 days. Closy offered payment at 14 days in exchange for a lower price. The supplier came back at €132.40 and explicitly said faster payment enabled that offer. Paying sooner also costs the buyer something, so we calculate the cost of the whole package.”

Reveal what we give, what we get, then the supplier’s exact reply. Other arguments accompanied this exchange: do not claim payment alone caused the entire reduction.

“We found 15 to 75 non-price combinations per studied practice case. We enumerate permitted combinations rather than fit a large optimizer to this small grid.”

Trade-off: the code caps enumeration at 2,000 combinations; it is not exhaustive for arbitrarily large contracts. Buyer cost uses the kit’s published formula; supplier economics and relationship costs may rely on estimates. Attribute the formula and structured-offer protocol to Tacto’s kit.

## 4 · Inside one negotiation turn — 2:00–3:10

Walk the reply through the six modules, one reveal at a time:

1. Read the email and structured offer as external data.
2. Extract signals into supplier state. The final runbook selected keywords; a LLM reader is optional.
3. Calculate total buyer cost for allowed packages in Python, using the kit’s formula.
4. The coded policy chooses a counter-offer, acceptance or walk-away.
5. Check counter-offer references, cited figures, mandatory terms and selected sensitive wording.
6. Send the move, record the reply and update supplier state.

“We kept arithmetic and offer decisions in code. When the optional LLM reader invents a quote or cites a line that does not contain it, that signal is rejected.”

Trade-off: the planned final keyword configuration avoids LLM calls and latency, but rules have narrower language coverage. The final negotiator is not fully LLM-driven. The DSH pilot and unmerged reader improvements are separate experiments.

Security limits: an exact quote can still contain an untrue supplier claim. Action messages bypass the guard; its wording filter is not general data-loss prevention or comprehensive prompt-injection protection. Avoid claiming every message is secure.

## 5 · Built to finish before the deadline — 3:10–4:00

“We run up to ten cases concurrently. Supplier workers share a decision lock within each case. The runner watches the cap and switches to closing logic before time runs out. If the agent’s closing function fails, it can fall back to the kit’s closing move.”

“The documented local rehearsal finished 21 of 21 cases without crashes or timeouts. Across 144 decision calls, the median was 55 milliseconds and the maximum was 880 milliseconds.”

Scope: 11 Oct 09:40, main 4fabd57, local scripted simulator, parallel=10, 60-second cap. Decision computation timings exclude supplier response and network time. Completed cases do not all mean deals: the rehearsal recorded 18 agreements. This supports execution readiness, not hidden-supplier deal quality or guaranteed recovery after a process crash.

## 6 · We tested ideas—and rejected the ones that failed — 4:00–5:00

“We did not add a strategy because it sounded promising. We wrote its success criteria, tested it, then decided whether to keep it.”

“For example, we tried predicting the supplier’s price floor from its first counter-offer and the case category. We evaluated 137 archived sessions across eight cases, leaving one case out at a time. We required an error of at most 2% of the opening price. The measured error was 8.6%, and the other criteria also failed, so we rejected it.”

The other criteria: beat the reference on at least seven of eight cases and never overshoot by more than 3% of opening price. Observed: four of eight and 12.1% overshoot.

“All three R4 ideas failed their prewritten criteria and did not alter the final version.”

Close: “Every offer is calculated. Every argument is sourced. Every change must earn its place.”

Scope: R4 was offline; no arena sessions. Case-held-out evaluation within the practice archive does not establish transfer to hidden final suppliers. These are reported team measurements, not experiments rerun for this deck.

## Provenance and appendix

- Agent: https://github.com/IchamRaison/hollerau-agent/tree/4fabd5764257fc15890bd2ef19040c96ed795a86
- Vault: https://github.com/IchamRaison/ehl-finale-vault/tree/4399dd9f182ed68968538e9695cdc6ca1bea0339
- `pitch-evidence.json`: exact slide figures and source URLs.
- `appendix.html`: preserved historical replay, best-per-case savings, reference comparison and archive distribution. Its older snapshot is not relabeled as final-version performance.

The final configuration comes from the runbook, not an actual finale launch log. Confirm which revision and reader setting actually ran before describing it as a completed finale configuration.
