---
name: openspec-proposer-workflow
description: Governs owner dialogue, routing, Request updates, artifact authorship, and convergence for the user-selected openspec/proposer primary agent.
compatibility: Requires openspec CLI.
---

# OpenSpec Proposer Workflow

Use this repository-specific contract with the generated `openspec-propose`
skill. The generated skill owns store selection, status, instructions,
dependency traversal, and artifact path resolution. This contract owns the
repository's product and planning semantics.

## Primary ownership

The user selects `openspec/proposer` as the primary agent. This agent alone owns:

- route classification;
- owner interviews and questions;
- initial and incremental `request.md` updates;
- proposal, Specs, architecture design, and coarse tasks;
- validation and semantic convergence.

Do not delegate owner questions or artifact authorship. Delegates may provide
read-only evidence or decision support only.

## Route before creating

Classify independently:

```text
lane: DIRECT | BEHAVIOR | ARCHITECTURE
ux_mode: NONE | CONTINUITY | SHAPE
review_depth: STANDARD | DEEP
```

- `DIRECT` changes neither established observable behavior nor material
  architecture. Create no Change and return `NO_OPENSPEC_REQUIRED` with the
  responsible implementation route.
- `BEHAVIOR` changes observable behavior or an externally owned contract without
  a material architecture decision. Explicitly use `behavior-change`.
- `ARCHITECTURE` requires a material boundary, security, data, dependency,
  runtime, migration, rollback, or cross-domain decision. Explicitly use
  `architecture-change`.

Never infer a lane from a named solution. Treat technologies, structures, and
procedures as required or candidate means until owner-confirmed outcomes prove
otherwise. Never omit `--schema` when creating a Change.

## Background and Motivation interview

Before requesting a concrete solution, ask one focused question at a time to
understand:

1. who is affected and in what context;
2. the current situation;
3. the Motivation for change;
4. the expected value; and
5. the desired outcome.

Motivation includes negative drivers such as pain points, friction, or
limitations and positive drivers such as opportunities, aspirations, curiosity,
or unexplored possibilities.

If the input names a solution, trace it back to Background, Motivation, and the
desired outcome before recording it. A named solution becomes a required means
only when the owner explicitly makes it binding.

Present one complete Request candidate containing only owner-confirmed
Background, Motivation, requested outcomes, outcome constraints, and required
means. Exclude inferred improvements, common companion features, candidate
means, non-goals, rejected interpretations, repository evidence, and design
decisions. Create the Change and `request.md` only after explicit confirmation.
Never create a pending or draft Request file.

## Incremental confirmation

During artifact work, treat a semantic statement as self-evident only when it is
directly entailed by the confirmed Request or deterministically established by
an authoritative repository or external-contract source.

For every other artifact-level semantic choice, stop and ask the owner one
focused question. This includes choices that can change Motivation, expected
value, outcomes, constraints, external contracts, Requirements, Scenarios,
material architecture, security, data, dependencies, UX direction, scope, or a
Work Package outcome.

Classify each owner answer:

- confirmed context goes to Background;
- pain points, limitations, opportunities, aspirations, curiosity, unexplored
  possibilities, or expected value go to Motivation;
- desired outcomes and outcome constraints go to Request or Constraints;
- owner-mandated mechanisms go to Required Means;
- factual clarifications that are not owner requirements remain evidence;
- non-binding candidate choices remain design candidates.

An unambiguous answer is its own confirmation evidence and is added immediately
to `request.md`. Ask a follow-up before writing when meaning or binding force is
unclear. After every Request update, re-read the complete Request and reconcile
all completed downstream artifacts.

Do not ask about files, private APIs, helpers, fixtures, policy-compliant test
organization, concrete representations within a resolved contract, or
ready-package implementation order. Those remain apply-time freedom.

## Artifact routing

- `request.md` stores only owner-confirmed Background, Motivation, Request,
  outcome constraints, required means, and confirmation evidence.
- `proposal.md` derives why the requested outcome is worth pursuing, the positive
  Change boundary, Spec Units when any, UX impact, material constraints,
  repository evidence, and observable success.
- Specs contain only positive customer-valued terminal outcomes and externally
  observable constraints directly entailed by the Request.
- Technologies, packages, files, procedures, negative non-goals, absent legacy
  behavior, and implementation techniques do not belong in Specs.
- Authorization and confidentiality use positive guarantees; rejection
  Scenarios may demonstrate those guarantees.
- Obsolete behavior uses `REMOVED Requirements`, never an inverse Requirement.
- `design.md` owns material architecture, security, data, dependency, runtime,
  migration, rollback, failure, risk, reuse, and revisit decisions.
- `tasks.md` is a coarse Work Package ledger with objective repository-local or
  CI completion evidence.

For `ARCHITECTURE` without observable behavior change, set `skip_specs: true`.
Create no delta Specs, Requirements, Scenarios, Spec Units, Reuse Assessment
rows, or corresponding research reports. Remove `skip_specs` only when the
confirmed Request changes observable behavior.

## Schema traversal

For a registered store, resolve and preserve its `--store` flag. Otherwise use
the nearest repository-local OpenSpec root.

1. Create a new Change only through `pnpm exec openspec new change` with the
   explicit repository schema.
2. Run status and follow its resolved planning root, artifact paths,
   `applyRequires`, statuses, and dependency edges.
3. Before each ready artifact, run its JSON instructions and re-read every
   completed dependency.
4. Apply returned context and rules as constraints without copying them into the
   artifact.
5. Apply the owner-question boundary before every non-self-evident semantic
   statement.
6. Rerun status after every artifact until the transitive required set is done or
   skipped.

Never create a skipped artifact. Skip a conditional artifact only when its own
instruction says the condition does not apply.

## Evidence support

- Use `ux/shaper` only for `UX Mode: SHAPE`; unresolved UX meaning returns to an
  owner question.
- For each actual architecture delta Spec Unit, investigate reusable repository
  code, workspace packages, direct dependencies, repository-adopted packages,
  transitive-only packages, established external packages, and updates.
- Use applicable architects only for one exact material decision-support
  question not already resolved by repository evidence.
- Treat every delegate result as evidence or a candidate decision, never as
  Request authority.

## Convergence

Run strict Change validation, selected Scenario validation, global active-Change
validation, and `pnpm lint:openspec`. Then invoke `openspec/analyzer` in `SELF`
mode by default. Use `TARGETED` or `DEEP` only for evidenced risk.

Return to the owner question loop for any finding that needs a semantic
decision. Apply artifact-only corrections directly only when they follow
mechanically from the confirmed Request and repository rules.

Finish when deterministic validation passes, semantic review returns
`APPROVED`, and `Planning Ready: YES` is justified. Stop before implementation
and tell the user to select the `openspec/applier` primary agent.
