---
name: write-commit-message
description: Generate or refine git commit messages from staged changes, working tree diffs, or a specific revision. Use when the user asks for a commit message, wants Conventional Commit style suggestions, or wants a better subject/body grounded in the actual diff.
---

# Write Commit Message

Use this skill when the user wants a commit message that is grounded in actual git changes, not guessed from a vague summary.

Prefer this skill when the user asks things like:
- "커밋 메시지 추천해줘"
- "지금 변경사항으로 커밋 메시지 써줘"
- "staged diff 기준으로 commit message 만들어줘"
- "이 커밋 메시지 다듬어줘"

## Workflow

1. Identify the target change set.
   - Default to `auto` mode: inspect staged changes first.
   - If staged changes are empty, automatically fall back to the working tree.
   - If the user names a revision, analyze that revision instead.
   - If the user explicitly asks for staged-only or working-only, respect that.

2. Collect git context first.
   - Run `python3 .codex/skills/write-commit-message/scripts/collect_commit_message_context.py`
   - This defaults to staged-first, working-tree fallback.
   - Use `--staged`, `--working`, or `--rev <rev>` only when the user is explicit.
   - Read the JSON before drafting any message.

3. Match repo style before inventing a format.
   - Check `recent_subjects` from the script output.
   - Follow the existing repo tone if it is clear.
   - In this repo, the visible history currently matches `type: Korean summary`, so default to that unless the user asks for English.

4. Draft commit messages grounded in the diff.
   - Choose the narrowest accurate type: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`, `perf`, `build`, `ci`.
   - Keep the subject specific and concrete.
   - Add a body only when the change has multiple important parts or tradeoffs worth preserving.

5. Report briefly.
   - Give one recommended message first.
   - Then give 2-4 alternatives only if useful.
   - If confidence is low, say what is ambiguous.

## Output shape

Use this shape unless the user asks for something else:

```md
추천:
`type: summary`

대안:
1. `type: summary`
2. `type: summary`

근거:
- ...
```

If a body is useful, format it like:

```text
type: summary

- point 1
- point 2
```

## Quality bar

- Do not invent user intent that is not visible in the diff.
- Do not claim a feature change when the diff is mostly setup or cleanup.
- Prefer a precise `chore` or `refactor` over an inflated `feat`.
- Keep the recommended subject to one line.
- If the diff mixes unrelated concerns, call that out instead of hiding it.
- Never run `git commit` unless the user explicitly asks.

## Notes

- For large diffs, summarize the dominant change rather than enumerating every file.
- If the user gives a draft message, evaluate it against the diff and improve only what is weak.
- If there are no relevant changes to inspect even after fallback, say so directly and ask for a staged diff or revision only when needed.
