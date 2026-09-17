---
description: Split a multi-part request by operation lane and dependencies, then route non-DIRECT planning to OpenCode.
agent: orchest
---

Input:

```text
$ARGUMENTS
```

Classify each work unit independently from repository evidence as
`lane: DIRECT | BEHAVIOR | ARCHITECTURE` and
`ux_mode: NONE | CONTINUITY | SHAPE`.

- `DIRECT`: create no Change; identify the implementation owner and verification boundary.
- `BEHAVIOR`: use `behavior-change`.
- `ARCHITECTURE`: use `architecture-change`.

Present each unit's caller-provided Background, Motivation, requested outcome,
classification and dependencies. Ask focused questions for missing or ambiguous
Request meaning. Use the official OpenSpec planning skills after confirming the
scope, and record owner-confirmed content as the dialogue progresses.

For every non-DIRECT unit, conduct planning in this OpenCode session.
The primary agent owns dialogue, confirmed Request, mocks, and planning artifacts.
For `SHAPE`, Request and the owner-approved mock must converge with a readable
`Design Source`; `CONTINUITY` preserves identified existing production evidence.
Planning Ready Changes pass to OpenCode or the user-selected `openspec/applier`
primary agent for implementation. Missing product decisions or contradictory
planning inputs return `PLANNING_REQUIRED` to OpenCode. Do not
implement from this command.
