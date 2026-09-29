---
name: research-report
description: Use ONLY by the researcher subagent when an explicitly requested or indispensable persistent report is needed for current external evidence or deep research beyond the codebase. Never use for repository-only investigation or template maintenance.
compatibility: opencode
---

# Research Report

Only `researcher` uses this skill to create a required persistent report. Repository-only investigation and template maintenance do not produce reports. Prior reports are leads, not durable truth.

## Required workflow

1. Read `docs/report/research/README.md` and this skill's `assets/report-template.md`.
2. Search `docs/report/research/**` for prior reports related to the request before collecting new evidence.
3. Assess each relevant prior report against:
   - its investigation and source retrieval dates;
   - the expected rate of change and useful lifetime of each material claim;
   - repository, dependency, standard, policy, law, market, or platform drift;
   - consistency with the current request and caller-provided facts;
   - source authority, coverage, contradictions, and unresolved uncertainty.
4. Treat prior reports as leads, never as authority. Re-verify every material reused claim against current primary evidence. A recent report may support the answer only after confirmation.
5. For web evidence, use Agent Browser exclusively. Do not use `webfetch` or `websearch`.
6. Collect primary evidence, cross-check material claims, and distinguish observations from inferences and assumptions.
7. Write one report for the assigned investigation only when a persistent report is explicitly requested or indispensable to the confirmed task. `FACTS_ONLY`, inconclusive, or blocked work does not by itself require a report.
8. Save the report before replying to the caller.

## Storage

- Use `docs/report/research/YY/MM/DD/<HHMMSS>-<topic-slug>.md`, based on the local investigation completion date and time.
- Use a short lowercase ASCII kebab-case topic slug.
- Never overwrite an existing report. If a path collides, add a short distinguishing suffix.
- Follow `assets/report-template.md` without deleting sections. Write `なし（理由: ...）` when a section has no applicable content.
- Write report prose in natural Japanese. Preserve exact identifiers, URLs, commands, file paths, versions, quoted text, and official product names as required for accuracy.

## Evidence rules

- Web sources require the exact URL, retrieval date, publisher or issuer, and relevant version or effective date when available.
- Repository sources require paths and line numbers when possible, plus the inspected revision or branch when it affects the claim.
- Record how prior reports were found, assessed, and re-verified, including reports rejected as stale or contradictory.
- Record contradictions, limitations, unknowns, and confidence. Do not turn an inference into a verified fact.
- Keep quotations minimal and attribute them directly.

## Safety

- Never record secrets, credentials, tokens, cookies, browser state, private authentication data, personal data, or unnecessary sensitive content.
- Do not use authenticated browser profiles or export browser state for research.
- A report is an unmaintained, degrading research log. Never present its existence as proof that a claim remains true.

## Completion check

- Existing reports were searched before new evidence was collected.
- Relevant existing reports received an explicit freshness and reliability assessment.
- Material claims are backed by current primary evidence.
- Every web source was accessed through Agent Browser.
- When a report was required, it exists at the dated path and follows the complete template; the caller response cites its path.

## Bundled resources

- `assets/report-template.md`: required report structure.
