---
name: build-plan
description: 'Create plan.md in a target directory and fully fill it with file list, diagrams, and a dependency-ordered implementation plan.'
compatibility: 'opencode'
---

# Build Plan

Create `plan.md` in a target directory and fully fill it.

## What I do

- Create `<target-dir>/plan.md` from a bundled template
- Fill every section with concrete content for the specific change
- Keep the file list table and directory tree consistent
- Ensure `plan.md` contains no `TODO`
- Refuse to overwrite unless `--force` is passed

## When to use me

- You want a repeatable planning doc before implementation
- You want one place to capture file changes, diagrams, and an implementation dependency graph

## Inputs I need

- Target directory path where `plan.md` will be created
- Plan title
- References to the change docs to ground the plan

## Outputs

- `plan.md` created in the specified directory
- All major sections are filled with concrete content
- No `TODO` remains

## Workflow

1. Gather context
   - Read the OpenSpec change and related docs
   - Make the planned file additions and edits explicit

2. Create `plan.md`

   ```bash
   python3 .opencode/skills/build-plan/scripts/new_plan.py \
     --dir <target-dir> \
     --title "<title>"
   ```

3. Fill `plan.md` in detail
   - Directory tree, file list table
   - Mermaid diagrams
   - Package level detailed design
   - Implementation plan as a dependency graph

4. Final checks
   - No `TODO` remains
   - The tree matches the file list
   - The implementation plan matches the file list and tasks

## Guardrails

- By default, refuses to write outside the repo root
- Does not overwrite existing `plan.md` unless `--force` is provided
- This skill only produces `plan.md` content. It does not implement product code

## Bundled resources

- Template: `.opencode/skills/build-plan/assets/plan.template.ja.md`
- Generator: `.opencode/skills/build-plan/scripts/new_plan.py`

## Troubleshooting

- If the skill does not show up, verify:
  - `SKILL.md` is spelled in all caps
  - `name` and `description` exist in YAML frontmatter
  - The directory name matches `name`
  - The name is unique across project/global locations
  - Permissions: `permission.skill` is not set to `deny`
