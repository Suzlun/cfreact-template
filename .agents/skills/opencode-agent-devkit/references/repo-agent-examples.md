# Repo Agent Examples

This repository already contains several well-structured agent definitions under `.opencode/agents/`.

Useful examples:

- `.opencode/agents/orchest.md`
  - Primary delegator with strict permissions.
  - Uses `permission.task` allowlist to prevent unexpected agents / infinite loops.
- `.opencode/agents/openspec/applier.md`
  - User-selected primary agent implementing only Planning Ready Changes.
  - Planning-file edits are limited to `tasks.md` progress.
- `.opencode/agents/openspec/planner.md`
  - Planning subagent owning proposal, Specs, requested main-spec sync, task scope, and applicable `skip_specs` metadata.
- `.opencode/agents/openspec/architect.md`
  - Unified frontend/backend design author in `DESIGN` and read-only final reviewer in `READINESS_REVIEW`.
  - Optional `IMPLEMENTATION_REVIEW` addresses an exact design question after implementation.
- `.opencode/agents/unit/build/builder.md`
  - Implementer subagent.
  - Uses `permission.skill` allowlist and a scoped `permission.bash` policy.
- `.opencode/agents/unit/build/reviewer.md`
  - Hidden review-only subagent.
  - Good "final verdict" output contract.

Patterns to copy:

- Keep `description` short and specific (it is used for agent selection).
- Allow ordinary capabilities and deny only destructive or external-write operations (e.g. `rm *`, `git push*`).
- If enabling Task, use allowlist-style `permission.task` (`"*": deny` first) and never allow self.
- Use a structured prompt body: First action -> Mission -> Inputs -> Protocol -> Output format.
