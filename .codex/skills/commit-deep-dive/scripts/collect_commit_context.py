#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path


def run_git(repo: Path, args: list[str]) -> str:
    result = subprocess.run(
        ["git", *args],
        cwd=repo,
        text=True,
        capture_output=True,
        check=True,
    )
    return result.stdout.strip()


def try_git(repo: Path, args: list[str]) -> str:
    result = subprocess.run(
        ["git", *args],
        cwd=repo,
        text=True,
        capture_output=True,
        check=False,
    )
    return result.stdout.strip()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Collect structured context for a git commit deep-dive note.",
    )
    parser.add_argument("--repo", default=".", help="Path to the git repository.")
    parser.add_argument("--rev", default="HEAD", help="Commit-ish to inspect.")
    parser.add_argument(
        "--patch-lines",
        type=int,
        default=160,
        help="Maximum number of patch lines to include in the excerpt.",
    )
    args = parser.parse_args()

    repo = Path(args.repo).resolve()
    rev = args.rev

    repo_root = run_git(repo, ["rev-parse", "--show-toplevel"])
    full_sha = run_git(repo, ["rev-parse", rev])
    short_sha = run_git(repo, ["rev-parse", "--short", rev])

    subject = run_git(repo, ["show", "-s", "--format=%s", rev])
    body = try_git(repo, ["show", "-s", "--format=%b", rev])
    author_date = run_git(repo, ["show", "-s", "--format=%cs", rev])

    name_status_raw = try_git(repo, ["show", "--name-status", "--format=", rev])
    files = []
    for line in name_status_raw.splitlines():
        if not line.strip():
            continue
        parts = line.split("\t", maxsplit=1)
        status = parts[0]
        path = parts[1] if len(parts) > 1 else ""
        files.append({"status": status, "path": path})

    numstat_raw = try_git(repo, ["show", "--numstat", "--format=", rev])
    stats = []
    for line in numstat_raw.splitlines():
        if not line.strip():
            continue
        parts = line.split("\t")
        if len(parts) < 3:
            continue
        additions, deletions, path = parts[0], parts[1], parts[2]
        stats.append(
            {
                "path": path,
                "additions": additions,
                "deletions": deletions,
            }
        )

    diff_stat = try_git(repo, ["show", "--stat", "--format=", rev])
    patch = try_git(repo, ["show", "--format=", "--unified=3", rev])
    patch_lines = patch.splitlines()[: args.patch_lines]

    output = {
        "repo_root": repo_root,
        "rev": rev,
        "full_sha": full_sha,
        "short_sha": short_sha,
        "subject": subject,
        "body": body,
        "author_date": author_date,
        "files": files,
        "stats": stats,
        "diff_stat": diff_stat,
        "patch_excerpt": "\n".join(patch_lines),
        "suggested_note_path": str(
            Path(repo_root) / "docs" / "learning" / f"{author_date}-{short_sha}.md"
        ),
    }

    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
