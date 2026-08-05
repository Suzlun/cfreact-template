---
description: 'Implement tasks from an OpenSpec change (Experimental)'
agent: openspec/applier
---

Implement tasks from an OpenSpec change.

Load `openspec-apply-change` and follow it as the execution contract. Do not load a semantic review workflow or perform a second semantic review.

**Store selection:** If the user names a store (a store is a standalone OpenSpec repo registered on this machine) or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`, `view`). Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `openspec/` root.

**Input**: Optionally specify a change name (e.g., `/opsx-apply add-auth`). If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

**Steps**

1. **Select the change**

   If a name is provided, use it. Otherwise:
   - Infer from conversation context if the user mentioned a change
   - Auto-select if only one active change exists
   - If ambiguous, run `openspec list --json` to get available changes and ask the user to select one

   Always announce: "Using change: <name>" and how to override (e.g., `/opsx-apply <other>`).

2. **Check status to understand the schema**

   ```bash
   openspec status --change "<name>" --json
   ```

   Parse the JSON to understand:
   - `schemaName`: The workflow being used (e.g., "spec-driven")
   - `planningHome`, `changeRoot`, and `actionContext`: planning scope and edit constraints
   - Which artifact contains the tasks (typically "tasks" for spec-driven, check status for others)

3. **Get apply instructions**

   ```bash
   openspec instructions apply --change "<name>" --json
   ```

   This returns:
   - `contextFiles`: artifact ID -> array of concrete file paths (varies by schema)
   - Progress (total, complete, remaining)
   - Task list with status
   - Dynamic instruction based on current state
   - Optional `context`: current required project instruction input from the selected root
   - Optional `operationGuidance`: current advisory guidance for apply

   **Handle states:**
   - If `state: "blocked"` (missing artifacts): return `BLOCKED` with the missing-artifact evidence and stop without delegating artifact creation or repair
   - If `state: "all_done"`: skip implementation delegation and proceed to final build review
   - Otherwise: proceed to implementation

   Treat `context` as a required prompt-level input. Read and consider it, and
   apply relevant project facts, conventions, and constraints while implementing.
   Treat `operationGuidance` as optional additive advice. Read and consider every
   entry, and follow entries that are applicable and compatible with the built-in
   workflow.

   Keep both fields separate from CLI-returned state, missing artifacts, tasks,
   progress, `contextFiles`, and the built-in `instruction`. They are not
   evidence of task completion, do not replace the built-in instruction, and do
   not permit bypassing a blocked state. If context conflicts with the built-in
   instruction, an explicit user choice, or a CLI-controlled value, report the
   conflict and preserve the controlling value. If guidance is inapplicable or
   conflicts with those controlling inputs, do not follow it and explain why.
   These are prompt-level behavior contracts, not enforceable checks.

4. **Read context files**

   Read every file path listed under `contextFiles` from the apply instructions output.
   The files depend on the schema being used:
   - **spec-driven**: proposal, specs, design, tasks
   - Other schemas: follow the contextFiles from CLI output

   If a required artifact is missing or a `contextFiles` path is unreadable, return `BLOCKED` with exact path evidence. Do not delegate planning-artifact creation or repair.

   Do not copy `context` or `operationGuidance` verbatim into implementation
   files or planning artifacts unless the user separately asks for that content.

5. **Verify approval handoff**

   Require a current `APPROVED` result from `openspec/proposer` or `openspec/analyzer` for this Change and current artifact contents. If approval evidence is absent, stale, or for another Change, return `ANALYZER_REVIEW_REQUIRED` through the caller. Do not review the Change yourself.

6. **Show current progress**

   Display:
   - Schema being used
   - Progress: "N/M tasks complete"
   - Remaining tasks overview
   - Dynamic instruction from CLI

7. **Delegate tasks (loop until done or blocked)**

   At each iteration:
   - Determine task ownership and split work only when needed for safe execution
   - Compute dependencies, file or generated-artifact conflicts, and the dependency-safe parallel ready set
   - Delegate frontend work to `unit/frontend/engineer`, backend work to `unit/backend/engineer`, and other repository work to `unit/build/builder`
   - Launch independent ready work in parallel and record why any ready work must be serialized
   - Require applicable `unit/frontend/reviewer` and `unit/backend/reviewer` approval evidence
   - Mark a task complete only after implementation, verification, and required reviewer evidence are accepted: `- [ ]` → `- [x]`
   - Re-run apply instructions after each accepted batch and continue until `all_done`

   **Pause if:**
   - A dependency or version addition, permission-boundary change, destructive operation, or external operation is required → stop the affected work and report evidence
   - A required artifact is missing or unreadable → stop without delegating artifact repair
   - Implementation reveals a material unresolved product, contract, architecture, security, data, dependency, or visible-surface decision → return evidence to Proposer for the affected work
   - Error or blocker encountered → report evidence
   - User interrupts

   Continue independent approved tasks that cannot be affected by a stopped task or unresolved decision. Do not report the Change complete while blocked work remains.

8. **Run final review and show status**

   When the CLI reports `all_done`, request final review from `unit/build/reviewer`. Route correctable implementation findings back to the responsible implementer and repeat affected unit review. Report archive-ready only after final approval.

   Display:
   - Tasks completed this session
   - Overall progress: "N/M tasks complete"
   - If all done: suggest archive
   - If paused: explain why and wait for guidance

**Output During Implementation**

```
## Implementing: <change-name> (schema: <schema-name>)

Working on task 3/7: <task description>
[...implementation happening...]
✓ Task complete

Working on task 4/7: <task description>
[...implementation happening...]
✓ Task complete
```

**Output On Completion**

```
## Implementation Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Progress:** 7/7 tasks complete ✓

### Completed This Session
- [x] Task 1
- [x] Task 2
...

Final build review approved. This change is archive-ready and can be archived with `/opsx-archive`.
```

**Output On Pause (Issue Encountered)**

```
## Implementation Paused

**Change:** <change-name>
**Schema:** <schema-name>
**Progress:** 4/7 tasks complete

### Issue Encountered
<description of the issue>

**Options:**
1. <option 1>
2. <option 2>
3. Other approach

What would you like to do?
```

**Guardrails**

- Keep going through tasks until done or blocked
- Always read context files before starting (from the apply instructions output)
- Require current approval evidence; otherwise request Analyzer review without self-review
- Do not load a semantic review workflow
- Compute task ownership, splitting, dependencies, conflicts, and parallel groups at execution time
- Continue unaffected independent tasks when one task is stopped
- Update task checkbox immediately after completing each task
- Stop affected work on safety boundaries or material unresolved decisions; do not guess
- Use contextFiles from CLI output, don't assume specific file names
- Do not use context or operation guidance as proof that a task is complete
- Apply relevant project context; report conflicts with controlling workflow inputs
- Consider every guidance entry; explain any inapplicable or conflicting advice
- Do not copy runtime context or operation guidance into implementation files or planning artifacts
- Preserve CLI-controlled blocked/ready/all-done behavior and completion criteria

**Fluid Workflow Integration**

This skill supports the "actions on a change" model:

- **Can be invoked anytime**: Before all artifacts are done (if tasks exist), after partial implementation, interleaved with other actions
- **Allows artifact updates**: If implementation reveals design issues, suggest updating artifacts - not phase-locked, work fluidly
