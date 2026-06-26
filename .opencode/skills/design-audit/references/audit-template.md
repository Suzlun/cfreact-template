# Audit Output Template

Use this exact structure when presenting audit findings. No deviations.

```text
DESIGN AUDIT RESULTS

Overall Assessment: [1-2 sentences on the current state of the design]

--------------------------------------------

PHASE 1 - Critical
(Visual hierarchy, usability, responsiveness, or consistency issues that actively hurt UX)

- [Screen/Component]: [What's wrong] -> [What it should be] -> [Why this matters]
- [Screen/Component]: [What's wrong] -> [What it should be] -> [Why this matters]

Review: [Why these are highest priority]

--------------------------------------------

PHASE 2 - Refinement
(Spacing, typography, color, alignment, iconography that elevate the experience)

- [Screen/Component]: [What's wrong] -> [What it should be] -> [Why this matters]
- [Screen/Component]: [What's wrong] -> [What it should be] -> [Why this matters]

Review: [Why this sequencing]

--------------------------------------------

PHASE 3 - Polish
(Micro-interactions, transitions, empty/loading/error states, dark mode, subtle details)

- [Screen/Component]: [What's wrong] -> [What it should be] -> [Why this matters]
- [Screen/Component]: [What's wrong] -> [What it should be] -> [Why this matters]

Review: [Why these are Phase 3 and expected cumulative impact]

--------------------------------------------

DESIGN_SYSTEM UPDATES REQUIRED

- [New tokens, colors, spacing values, typography changes, or component additions needed]
- These must be approved and added to the design system before implementation begins

--------------------------------------------

IMPLEMENTATION NOTES FOR BUILD AGENT

- [Exact file, exact component, exact property, exact old value -> exact new value]
- Written so a build agent can execute without design interpretation
- No ambiguity

BAD:  "Make the cards feel softer"
GOOD: "CardComponent border-radius: 8px -> 12px per updated design-system radius-lg token"

BAD:  "Improve the spacing"
GOOD: "DashboardHeader margin-bottom: spacing-md -> spacing-lg"

BAD:  "The button needs more contrast"
GOOD: "PrimaryButton background token: muted -> brand-primary. Contrast with white text improves from 3.8:1 to 8.6:1."
```

## Rules For This Template

1. Every finding follows the pattern: what is wrong -> what it should be -> why it matters.
2. Implementation notes must reference design-system tokens or existing shared components when possible.
3. If a new token is needed, it goes in DESIGN_SYSTEM UPDATES first.
4. No vague language. No "feels" without a measurable change attached.
5. Phase assignment is strict.
6. Phase 1 actively hurts usability or breaks consistency.
7. Phase 2 does not hurt, but is clearly below professional standard.
8. Phase 3 is already functional, but not yet premium.
