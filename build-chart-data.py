"""Compile presentation data from an updated vault and archived sessions; no API calls."""

import argparse
import calendar
import importlib.util
import json
import re
import statistics
import subprocess
from collections import defaultdict
from decimal import Decimal
from pathlib import Path
from urllib.parse import quote


def money(value):
    return float(Decimal(value.strip().replace(" ", "").replace("\u202f", "").replace(",", ".")))


def compile_data(vault, agent):
    vault_commit = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=vault, text=True).strip()
    agent_commit = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=agent, text=True).strip()
    note = vault / "03 Build/Coûts de référence par cas.md"
    text = note.read_text()
    snapshots = re.findall(r"Relevé du (\d{1,2})/(\d{1,2}) à (\d{2}:\d{2})\.", text)
    assert len(snapshots) >= 2, "Expected dated team and reference snapshots in the vault note"
    vault_year = subprocess.check_output(["git", "show", "-s", "--format=%cs", "HEAD"], cwd=vault, text=True).strip()[:4]
    def snapshot_label(record):
        day, month, time = record
        return f"{int(day)} {calendar.month_abbr[int(month)]} {vault_year}, {time}"
    cases, reference = {}, {}
    for line in text.splitlines():
        cells = [cell.strip() for cell in line.strip("|").split("|")]
        if not cells or cells[0] not in {"P01", "P02", "P03", "P04", "P05", "P07", "P08", "P10", "P11", "P18"}:
            continue
        if len(cells) == 8:
            cid, goal, opening, best, span, score, deal, session = cells
            cases[cid] = {"id": cid, "goal": goal, "opening": money(opening), "target": money(best),
                          "score": money(score), "deal": money(deal), "session": session.strip("`"), "runs": []}
            assert abs(money(opening) - money(best) - money(span)) < 0.02
            assert abs((money(opening) - money(deal)) / money(span) - money(score)) < 0.001
        elif len(cells) in (6, 9):
            reference[cells[0]] = money(cells[-1])
    assert len(cases) == len(reference) == 10
    archived = agent / "analysis/pegasus_data/sessions"
    seen = set()
    for path in sorted(archived.glob("P*.json")):
        record = json.loads(path.read_text())
        result = record["session"].get("result")
        if not result or not result.get("ended"):
            continue
        summary = record["summary"]
        cid, sid = summary["case_id"].removeprefix("case:"), summary["session_id"]
        if cid not in cases or sid in seen:
            continue
        seen.add(sid)
        score = result.get("score")
        assert score is not None and 0 <= score <= 1
        cases[cid]["runs"].append({"score": score, "deal": bool(result.get("deal")), "session": sid})
    for cid, case in cases.items():
        case["reference"] = reference[cid]
        scores = [run["score"] for run in case["runs"]]
        assert scores
        case["median"] = statistics.median(scores)
        case["archive_best"] = max(scores)
        case["deal_count"] = sum(run["deal"] for run in case["runs"])
        case["savings"] = round(case["opening"] - case["deal"], 2)
    sid = "3a0b48ea4e9dae20"
    replay_record = json.loads((archived / f"P01-{sid}.json").read_text())
    result = replay_record["session"]["result"]
    assert result["ended"] and result["deal"] and result["must_haves_ok"]
    spec = importlib.util.spec_from_file_location("published_cost", agent / "arena_kit/cost.py")
    cost = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(cost)
    assert abs(cost.score(result["c_open"], result["c_deal"], result["c_best"]) - result["score"]) < 1e-10
    assert abs(sum(result["cost_breakdown"].values()) - result["c_deal"]) <= 0.02
    points, terms = [], {**result["terms"], "payment_days": 30, "effective_date": "2026-11-01"}
    for item in result["trace"]:
        move = item["move"]
        if item["actor"] == "buyer":
            continue
        terms = {**terms, **move["terms"]}
        points.append({"round": item["round"], "price": terms["unit_price"],
                       "payment_days": terms["payment_days"], "effective_date": terms["effective_date"],
                       "verified": sum(c["result"] == "verified" for c in move.get("claim_results", []))})
    assert [point["price"] for point in points] == [138.55, 137.9, 132.4, 131.7, 131.2]
    assert sum(point["verified"] for point in points) == 5
    return {"vault_commit": vault_commit,
            "agent_commit": agent_commit,
            "vault_snapshot": snapshot_label(snapshots[0]), "reference_snapshot": snapshot_label(snapshots[1]),
            "archived_runs": len(seen), "cases": list(cases.values()),
            "source": f"https://github.com/IchamRaison/ehl-finale-vault/blob/{vault_commit}/" + quote(str(note.relative_to(vault))),
            "replay": {"session": sid, "score": result["score"], "opening": result["c_open"],
                       "deal": result["c_deal"], "target": result["c_best"],
                       "savings": round(result["c_open"] - result["c_deal"], 2),
                       "points": points, "breakdown": result["cost_breakdown"],
                       "url": f"https://arena.tacto.ai/replay/{sid}", "commit": "b09063f"}}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--vault", type=Path, required=True)
    parser.add_argument("--agent", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=Path(__file__).with_name("negotiation-chart-data.json"))
    args = parser.parse_args()
    data = compile_data(args.vault, args.agent)
    args.output.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    print(f"Verified {len(data['cases'])} cases, {data['archived_runs']} archived sessions, and the P01 replay.")
