#!/usr/bin/env python3
"""Create plan.md from the bundled template.

This script is intentionally stdlib-only.
"""

from __future__ import annotations

import argparse
import sys
from datetime import date
from pathlib import Path
from string import Template


def _repo_root_from_script(script_path: Path) -> Path:
    # <repo>/.opencode/skills/build-plan/scripts/new_plan.py
    return script_path.parents[4]


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Create plan.md from a standard template"
    )
    parser.add_argument(
        "--dir",
        required=True,
        help="Target directory. Relative paths are resolved from the repo root.",
    )
    parser.add_argument(
        "--title",
        default="TODO",
        help="Plan title (written into the template).",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite an existing plan.md if present.",
    )
    parser.add_argument(
        "--allow-outside-root",
        action="store_true",
        help="Allow writing outside the repo root (not recommended).",
    )
    args = parser.parse_args()

    script_path = Path(__file__).resolve()
    skill_dir = script_path.parents[1]
    repo_root = _repo_root_from_script(script_path)

    out_dir = Path(args.dir)
    out_dir = (
        (repo_root / out_dir).resolve()
        if not out_dir.is_absolute()
        else out_dir.resolve()
    )

    if not args.allow_outside_root and not out_dir.is_relative_to(repo_root):
        sys.stderr.write(f"Error: target dir is outside repo root: {out_dir}\n")
        return 2

    out_dir.mkdir(parents=True, exist_ok=True)
    plan_path = out_dir / "plan.md"
    if plan_path.exists() and not args.force:
        sys.stderr.write(f"Error: already exists: {plan_path} (use --force)\n")
        return 2

    template_path = skill_dir / "assets" / "plan.template.ja.md"
    try:
        template_text = template_path.read_text(encoding="utf-8")
    except OSError as e:
        sys.stderr.write(f"Error: failed to read template: {template_path}: {e}\n")
        return 1

    target_dir_label: str
    try:
        target_dir_label = str(out_dir.relative_to(repo_root))
    except ValueError:
        target_dir_label = str(out_dir)

    rendered = Template(template_text).safe_substitute(
        title=args.title,
        date=date.today().isoformat(),
        target_dir=target_dir_label,
    )
    if not rendered.endswith("\n"):
        rendered += "\n"

    try:
        with plan_path.open("w", encoding="utf-8", newline="\n") as f:
            f.write(rendered)
    except OSError as e:
        sys.stderr.write(f"Error: failed to write: {plan_path}: {e}\n")
        return 1

    sys.stdout.write(str(plan_path) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
