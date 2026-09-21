---
description: Split a multi-part request by operation lane and dependencies, then orchestrate delegated non-DIRECT planning.
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

Present each unit's caller-provided `背景`, `変更の動機`, requested outcome,
classification and dependencies. Ask focused questions for missing or ambiguous
Request meaning. Use the official OpenSpec planning skills after confirming the
scope, and record owner-confirmed content as the dialogue progresses.

For every non-DIRECT unit, conduct planning in this OpenCode session.
The primary agent owns owner dialogue, `request.md`, integrated mocks, and orchestration.
Delegate proposal, Specs (including requested main-spec sync), `tasks.md` scope,
and applicable `.openspec.yaml` `skip_specs` metadata to `openspec/planner`.
After proposal/Specs, an `architecture-change` goes to `openspec/architect` in
`DESIGN` to write only unified frontend/backend `design.md`, then back through
the primary to the planner for tasks. A `behavior-change` has no design artifact;
the planner completes proposal/Specs/tasks. Planner and architect never call
each other. The architect delegates research to `researcher` only when indispensable.
The primary then requests the architect's read-only `READINESS_REVIEW` of the
completed plan for implementability and shared `openspec-review` semantic checks.
Planning Ready requires that review's `APPROVED`, not CLI completion or planner
self-check. Approval applies to the reviewed plan; material revisions require
rechecking affected artifacts, using the existing review result without a new
persistent approval file. Generated skills and entry commands are generic
traversal, not authority for the primary to author delegated artifacts. The
primary retains archive orchestration.
For `SHAPE`, Request and the owner-approved mock must converge with a readable
`Design Source`; `CONTINUITY` preserves identified existing production evidence.
Planning Ready Changes pass to OpenCode or the user-selected `openspec/applier`
primary agent for implementation. Missing product decisions or contradictory
planning inputs return `PLANNING_REQUIRED` to the primary, which routes product
meaning to owner dialogue, planner artifact defects to the planner, and design
defects to the architect. Do not
implement from this command.
