---
name: openspec-review
description: Review schema-specific OpenSpec Changes for purpose and means separation, contradictions, excess requirements, misinterpretation, and material omissions.
compatibility: Requires openspec CLI.
---

# OpenSpec Change Review

This is the shared semantic contract for `openspec/planner` self-check and
`openspec/architect` final implementability and semantic review in `READINESS_REVIEW`.
Review is read-only. Planner self-check supports authoring but does not grant
Planning Ready approval.

## Source precedence

1. `AGENTS.md` and enforced repository rules.
2. `openspec/config.yaml` and the selected schema.
3. OpenCode-managed, owner-confirmed `Request-Status: CONFIRMED` in `request.md`.
4. Repository evidence relevant to the confirmed Request.
5. Proposal, Specs, architecture design when defined by the schema, and coarse
   tasks.

Require only artifacts defined by the selected schema. Deterministic validators
own structural checks.

`request.md` is owner-controlled evidence, not a downstream planning artifact.
Return `FAILED` when its confirmed `背景`, `変更の動機`, `要求`, or confirmation
evidence is missing, unconfirmed, unreadable, or internally inconsistent. Never
create, edit, supplement, or reinterpret it during review.

## Purpose and means

- Desired outcomes and outcome constraints may become Requirements and
  Scenarios only when they follow directly from the confirmed Request.
- Confirmed `背景` and `変更の動機` content explains why the Request exists but
  never creates a Requirement, Scenario, or outcome constraint by itself.
- Technologies, components, dependencies, structures, algorithms, procedures,
  migrations, tools, files, commands, tests, and implementation sequences are
  means.
- Required means constrain architecture or tasks. Candidate means remain
  options. Neither becomes observable behavior merely because the owner named
  or mandated it.
- `proposal.md` is a fallible change proposal derived from the Request. It is
  not authoritative for what the owner requested.
- `design.md` exists only for `architecture-change` and contains material
  decisions, not local implementation decomposition.
- `tasks.md` is a coarse work-package ledger, not a file or test-layer plan.
- Request's optional `UIモック参照` supplies design evidence through exact
  Storybook story references, not product outcomes. `SHAPE` requires its actual
  relevant viewpoints. Proposal's existing `Design Source` complements those
  references with adopted scope and owner approval; keep purpose and outcomes in
  owner-confirmed Request prose and required means at their design boundary.
- Standards, RFC compliance, packages, and implementation techniques remain
  means unless the customer explicitly requires their externally observable
  effect. A visible UI composition or placement may be an Outcome Constraint
  when it directly expresses the requested experience; an internal component
  structure remains a means.
- An `architecture-change` design inventories relevant repository assets,
  installed packages, and established external packages, selects the earliest
  viable reuse level, and justifies independent implementation only when none of
  those candidates can satisfy the confirmed outcome within repository rules.
- Every delta Spec Unit in an `architecture-change` has one or more reuse
  decisions, split by generic capability that repository code or a package can
  provide. Requirement traceability does not prove package-candidate coverage.
- Each reuse decision distinguishes repository code, workspace packages, direct
  dependencies, packages adopted elsewhere in the repository, transitive-only
  dependencies, new external packages, and updates. Transitive resolution alone
  is not direct adoption.
- Research evidence supports a reuse decision only when the report's stated
  investigation scope explicitly covers that generic capability. A narrow
  report cannot be generalized to an uninvestigated capability.
- Repository evidence, common practice, security recommendations,
  implementation necessity, downstream artifacts, and tests may constrain
  design but never create product behavior.
- Request, proposal, and Specs state positive requested outcomes. They do not
  preserve non-goals, rejected alternatives, absent legacy behavior, absent
  implementation, or technologies and features that will not be added.
- A confirmed authorization or confidentiality outcome is expressed as a
  positive guarantee, such as the actors allowed to change state or the fields
  allowed in a response. A rejection Scenario may demonstrate that guarantee.

## Finding categories

Before reporting, establish the exact confirmed customer outcome or external
contract, actual customer harm, no-fix consequence, severity, likelihood, scope,
indispensability, and a proportionate correction. Consider removing unnecessary
implementation and planning content, not only adding missing content. Drop
unsupported or unnecessary findings entirely, including warnings. Binding
contracts and architecture constrain in-scope work without expanding scope.
The facilitator independently re-evaluates these grounds before adopting findings.

- `CONTRADICTION`: applicable sources require materially incompatible outcomes
  or plans.
- `OVERREQUIREMENT`: an artifact requires behavior, structure, work, or an
  operational condition not directly justified by the confirmed Request or an
  applicable repository constraint at that artifact layer.
- `MISINTERPRETATION`: the Change changes the meaning of the confirmed Request,
  promotes means into behavior, adds behavior absent from the Request, or
  presents assumptions as facts.
- `MATERIAL_OMISSION`: missing information leaves a pre-implementation decision
  that can materially change a confirmed customer-valued outcome, externally
  owned contract meaning, architecture, security, data, dependency, runtime,
  scope, or material UX direction.

Files, private APIs, helper decomposition, test layers, fixture layout, and
within-ready-package order are not material omissions when resolved boundaries
permit local choice. A choice is not a planning omission merely because the
contract source of truth or implementation must make it when the choice
preserves the confirmed Request, externally owned contract meaning, and every
material boundary.

## Artifact routing

- Accept a candidate omission only after identifying the exact confirmed
  customer outcome or external contract whose protection makes the missing
  consideration indispensable, and the artifact or owner decision that must
  resolve it before implementation. A material boundary alone does not expand scope.
- Specs own customer-valued terminal outcomes and confirmed externally
  observable constraints. `design.md` owns only material architecture,
  security, data, dependency, and runtime decisions.
- The repository's contract source of truth, `tasks.md`, and progressive
  implementation own concrete representations, local construction,
  verification details, and choices within resolved boundaries. Reject
  completeness requests that cannot pass the material-omission test.
- An obsolete Requirement is removed through `REMOVED Requirements`. Do not
  replace removed or unrequested behavior with an inverse Requirement that
  requires its absence.

## Design diagrams

- Evaluate diagrams in `design.md` by whether they prevent a material design
  misunderstanding. Text or tables may suffice; zero diagrams is valid.
  Before alleging a missing diagram, identify the exact material decision that
  would be misread and the confirmed outcome or contract that makes correction
  indispensable. Counts or a fixed set of diagram types are not acceptance criteria.
- For present diagrams, check GitHub-compatible `mermaid` syntax and whether
  relationships, directions, message order, transition conditions, multiplicity,
  and ownership accurately express the adopted design. `flowchart` structure
  views need not use strict UML notation.
- Read diagrams and prose together. Resolve contradictions as design
  inconsistencies rather than silently preferring one representation. Confirm
  elements and branches derive from confirmed outcomes and adopted decisions;
  apply the same scope and implementation-detail limits as prose.
- Consider removing redundant views and excessive detail. Each diagram should
  address one principal question within the change and its necessary context;
  prose should add rationale or constraints rather than repeat the diagram.
  Apply the common finding filter before reporting any defect.

## UX review

- `NONE`: no visible work may be introduced.
- `CONTINUITY`: read the existing production evidence identified by
  `Continuity Source` and verify preservation of that experience.
- `SHAPE`: follow Request's `UIモック参照`, such as
  `mockups/main/src/App.stories.tsx#Home`, and proposal's `Design Source` approval scope.
  Both references must identify the applicable app through its path.
  Read actual `mockups/<app>/src/**` and referenced Storybook states, including
  the story args and desktop/mobile widths.
  Verify the adopted screen, flow, and state scope and owner approval. Verify mutual
  completeness, rationale, and consistency between confirmed Request and the
  approved mock. The mock realizes confirmed outcomes and constraints; its
  product semantics must be authorized by Request. Verify fidelity to the
  accepted composition, hierarchy, actions, navigation, copy, states,
  responsiveness, and visual direction.

The OpenCode primary owns owner dialogue, `request.md`, and app prototypes under
root `mockups/`, and orchestrates delegated planning in the same repository. Each publicly exposed
`apps/<app>` pairs with one integrated `mockups/<app>` prototype. Each app's N
routes/scenarios may relate to M Changes. A Change references multiple app prototypes
only when its confirmed outcomes require them. On shared UI or viewpoint changes,
trace affected apps, Request references, and proposal scopes and recheck their rationale and consistency.
After user-visible Request changes, re-evaluate the related viewpoints. The prototype
uses public UI, fixtures, and local state as design evidence and remains outside
Change directories and archives. Production implementation formalizes approved UI
into the scoped `apps/<app>` and `packages/ui` rather than importing `mockups/`.

Do not run a second shaping pass during semantic review. Report only a material
contradiction, excess, misinterpretation, or omission.
Return corrections through the primary: product meaning goes to owner dialogue;
proposal, Specs, task scope, and applicable `skip_specs` metadata go to
`openspec/planner`; `design.md` goes to `openspec/architect` in `DESIGN`.
Planner and architect never call each other. During implementation, missing or
contradictory planning inputs require `PLANNING_REQUIRED`.

## Procedure

1. Read the confirmed Request, all schema-returned `contextFiles`, and relevant
   repository evidence.
2. Separate outcomes, constraints, and required means stated in the Request
   from candidate means introduced downstream.
3. Trace every proposal outcome, Requirement, and Scenario directly to the
   confirmed Request. Reject behavior justified only by usefulness, common
   practice, security recommendation, repository evidence, implementation
   necessity, downstream artifacts, or tests. Reject an RFC, standard, package,
   implementation technique, non-goal, rejected alternative, or absent
   implementation represented as behavior.
4. For every candidate omission, prove the exact confirmed customer outcome or
   external contract it is indispensable to protect and identify its resolution owner. Reject
   contract-completeness and implementation-choice findings that do not pass
   this test.
5. For `architecture-change`, derive the delta Spec Unit set from the actual
   `specs/**/spec.md` paths. Verify every Spec Unit is represented in `Reuse
Assessment`, its generic capabilities are not collapsed into one
   customer-specific Requirement, and each decision has a valid source
   classification, selected target and version, and current scoped research
   evidence. Assess a missing capability, out-of-scope research citation,
   unexamined package state, or missing candidate selection as
   a candidate `MATERIAL_OMISSION`, and unjustified `LIMITED_COMPLEMENT` as a
   candidate `OVERREQUIREMENT`; report only findings that meet the grounds above.
6. Verify each work package has justified coverage and objective evidence while
   leaving local implementation choices open.
7. Verify every work package causes an outcome required by the Request rather
   than merely satisfying downstream wording.
8. Consider removing unnecessary content. Group one root cause into one finding,
   try to disprove it, and establish all finding grounds before reporting.

## Results

The following verdicts apply to the architect's `READINESS_REVIEW` after the
planner completes the plan. Planner self-check reports its result to the primary
without granting approval.

- `APPROVED`: required validation passes, material decisions are resolved,
  artifacts and applicable UX evidence are consistent, and no actionable finding remains.
- `CHANGES_REQUIRED`: artifact edits can resolve all findings without a new
  material decision.
- `DECISION_REQUIRED`: a material decision in the omission boundary is needed.
- `FAILED`: required evidence cannot be read or evaluated.

Only `APPROVED` from `openspec/architect` in `READINESS_REVIEW` grants Planning
Ready under `docs/change-operation.md`. CLI artifact completion and planner
self-check do not. Approval applies to the reviewed plan; material revisions
require rechecking affected artifacts. Use the existing review result, never a
new persistent approval file. Implementation may decide concrete representations,
files, private APIs, helpers, test layers, fixtures, and ready-package order when
those choices preserve the confirmed Request.

## Finding format

```text
Category: CONTRADICTION | OVERREQUIREMENT | MISINTERPRETATION | MATERIAL_OMISSION
Evidence:
- <path:line observed fact>
Proposal impact: <exact outcome or boundary affected>
Material consequence: <wrong, unsafe, or unverifiable result>
Customer harm / no-fix consequence: <evidence-backed effect on the confirmed outcome or contract>
Severity / likelihood / scope: <evidence-backed assessment>
Indispensability / proportionality: <why correction is necessary and its cost is justified>
Required outcome: <artifact state needed>
Decision required: none | <exact material decision and owner>
```

Do not emit preference-only warnings or duplicate deterministic failures as
semantic findings.
