---
description: Split a multi-part request by operation lane and dependencies, then route non-DIRECT planning to OpenDesign.
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
classification, dependencies, and safe parallel groups. Keep missing or
ambiguous Request meaning explicit rather than interviewing the owner or
completing it in this command. Do not create or edit an OpenSpec Change.

For every non-DIRECT unit, direct the user to OpenDesign with that unit as input.
OpenDesign owns owner dialogue, confirmed Request, and all planning artifacts.
For `SHAPE`, Request and the owner-approved mock must converge with a readable
`Design Source`; `CONTINUITY` preserves identified existing production evidence.
Planning Ready Changes pass to OpenCode or the user-selected `openspec/applier`
primary agent for implementation. Missing product decisions or contradictory
planning inputs return `OPENDESIGN_PLANNING_REQUIRED` to OpenDesign. Do not
implement from this command.
