---
name: ux-quality
description: Implement or review production UI for material fidelity to approved designs, Request/Specs conformance, scoped state completeness, responsiveness, and accessibility.
---

# UX Quality

Evaluate the running production UI against Request/Specs and the adopted design.
OpenDesign owns product shaping and Planning Ready Changes; OpenCode implements
and reviews without repairing Request, proposal, Specs, or design. Use this skill
only within confirmed scope, never as independent authority to redesign a product.

## Evidence Order

1. Confirmed Request and applicable Specs
2. `SHAPE`: Request's `UI Mock References` to exact static artifact routes/scenarios such as
   `mockups/main/index.html?scenario=default#/`, plus proposal's `Design Source` with adopted
   screens, flows, states, and owner approval. Both identify the applicable app through its path.
   Read actual `mockups/<app>/src/**` and
   the referenced artifact's query, hash route, and desktop/mobile states;
   `CONTINUITY`: identified
   existing production surface; `NONE`: no mock and no visible work
3. Target route, relevant current conventions, tokens, shared UI, and Storybook
4. Implementation code and reachable states in scope
5. The running local UI on desktop and mobile
6. Findings grouped by user impact and root cause

Missing, unreadable, unapproved, or contradictory planning evidence returns
`OPENDESIGN_PLANNING_REQUIRED`. Direction prose alone does not replace an approved
mock for `SHAPE`.

## Implementation Sequence

The caller serializes each surface through `PRODUCTION_UI -> WIRING ->
POLISH -> REVIEW`. The designer formalizes approved React prototype UI into app
code and `packages/ui`, owning all `packages/ui/**` edits; the frontend engineer
only wires data, actions, routes, and states. The designer then completes necessary
deducible production states, followed by independent review.

OpenDesign owns whole-product `PRODUCT.md`, one integrated `mockups/<app>` prototype
per publicly exposed `apps/<app>` under root `mockups/`, and planning artifacts. Production
imports formalized UI in the scoped `apps/<app>` and shared UI rather than prototype source.
Shared UI or viewpoint updates require tracing affected apps, Requests, and Changes and rechecking their approved
scope; prototype fixtures/local state do not authorize new outcomes.

## Quality Standard

Preserve composition, hierarchy, actions, navigation, interaction, copy, states,
density, responsive priority, and distinctive visuals. Material fidelity and
production completeness are joint criteria, not pixel-perfect matching. The
checks below diagnose scoped defects; they do not authorize product changes.

### Primary Task and Action

- The purpose is quickly understandable.
- One primary action is clear and secondary actions do not compete with it.
- The result and available next step are understandable.
- Destructive or irreversible actions preserve the confirmed context and outcome.

### Hierarchy and Density

- Visual weight matches functional importance.
- Headings, body copy, and supporting context establish a useful reading order.
- Related items are close and unrelated regions are clearly separated.
- Preserve adopted visual distinctions instead of flattening them into uniform
  cards, borders, spacing, and type.

### States

- Cover reachable default, loading, empty, success, error, disabled, and permission
  states required by Request/Specs. Complete a state absent from the mock only
  when deducible from those contracts and current conventions within scope.
- Loading communicates purpose and progress.
- Empty states explain facts and return users to the primary task when possible.
- Error states avoid invented causes and preserve confirmed recovery behavior.
- Disabled states do not rely on color alone and make the reason understandable.
- State changes avoid unnecessary layout shifts and focus loss.

Product semantics, retries, fallbacks, or recovery paths not established by that
evidence, and responsive changes to the primary task, return
`OPENDESIGN_PLANNING_REQUIRED`; production completion is not blanket permission
to introduce them.

### Responsive Behavior

- Preserve task order and priority across mobile, tablet, and desktop.
- Avoid clipping, overlap, unnecessary horizontal scrolling, and unusable
  controls.
- Adapt tables, long strings, and action groups for narrow widths.
- Keep touch targets large enough and adequately separated.
- Never add columns or cards merely to fill desktop space.

### Accessibility

- Use correct HTML semantics, heading order, landmarks, and form labels.
- Do not communicate meaning through color alone.
- Check 4.5:1 contrast for normal text and 3:1 for large text and essential
  graphical controls.
- Make all primary actions keyboard-operable.
- Keep visible focus distinguishable and focus order aligned with visual order.
- Manage initial focus, closing focus, and focus return for transient UI.
- Announce important asynchronous loading, success, and error changes when
  needed.
- Use motion to support meaning and respect `prefers-reduced-motion`.

### Current System Consistency

- Prefer existing tokens, shared components, component APIs, state patterns,
  and product vocabulary.
- Represent the same concept with the same appearance and interaction.
- Do not duplicate presentation that belongs in shared UI.
- Add shared presentation only when indispensable to the adopted design and
  confirmed scope; repetition alone does not authorize an abstraction.

### Product Specificity

- Preserve the adopted product-specific composition, typography, color, imagery,
  shape, and motion rather than replacing them with generic templates.
- Ground completion details in the approved source and existing conventions.

## Browser Review

- Exercise the implemented local UI in a real browser on desktop and mobile.
- Run primary Scenarios from start to finish.
- Test primary actions, secondary actions, and recovery with mouse and keyboard.
- Check both mobile and desktop widths.
- Reproduce required loading, empty, and error states with safe local data or fixtures.
- Screenshots may evidence hierarchy and responsiveness, but never prove
  interaction quality.
- Record every unperformed check as residual risk.
- Required browser evidence unavailable means `BLOCKED`, not approval by static
  inspection.

## Findings

Each finding includes severity, route/state/viewport/input method, impact on the
primary task, `path:line` or browser reproduction evidence, and a correction
consistent with Request/Specs and the adopted source. Do not request preference-only
changes, mechanical Requirement-to-control conversion, or unapproved features.
