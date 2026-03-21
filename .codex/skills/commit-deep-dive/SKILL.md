---
name: commit-deep-dive
description: Summarize a recent git commit, extract what changed and why it matters, identify study keywords and deep-dive questions, and write a learning note into the current project. Use when the user asks to review a commit, make a study log, capture learning points after implementation, or turn recent code changes into interview-ready understanding.
---

# Commit Deep Dive

Use this skill to turn a recent commit into a reusable learning artifact.

Prefer this skill when the user wants more than a plain diff summary:
- explain the core change in simple language
- record what should be studied next
- preserve deep-dive questions in a project document
- convert implementation work into interview or portfolio talking points

## Workflow

1. Identify the target commit.
   - Default to `HEAD` unless the user names a commit, branch, range, or message.
   - If there are uncommitted changes and the user asks for "this change" rather than "this commit", say that this skill is commit-oriented and either use `HEAD` or tell the user to commit first.

2. Collect structured commit context.
   - Run `python3 .codex/skills/commit-deep-dive/scripts/collect_commit_context.py --rev <rev>`.
   - Read the JSON output.
   - If the commit is too large, inspect the key changed files directly before summarizing.

3. Synthesize the learning note.
   - Keep the note grounded in the actual diff.
   - Prefer project-specific concepts over generic CS buzzwords.
   - Separate "what changed" from "what to study".

4. Write or update the note file.
   - Default directory: `docs/learning/`
   - Default filename: `<date>-<shortsha>.md`
   - If the user requests append behavior, append a new section instead of replacing.

5. Report back briefly.
   - Tell the user which commit was analyzed.
   - Tell the user where the note was written.
   - Surface 2-4 high-value study keywords in chat.

## Required note structure

Write the learning note with these sections in this order:

1. `# Commit Deep Dive - <date> - <shortsha>`
2. `## Commit`
3. `## What changed`
4. `## Why it matters`
5. `## Key files`
6. `## Concepts to study`
7. `## Deep dive questions`
8. `## Interview framing`
9. `## Next study actions`

## Section guidance

### `## Commit`

Include:
- full SHA
- short SHA
- commit subject
- commit date

### `## What changed`

Write 3-6 bullets focused on concrete behavior or structure changes.

Good:
- Added Tiptap dependencies and validated the project still builds.
- Replaced the default Next.js landing page with a ThinkWrite editor shell.

Avoid:
- Changed some files.
- Updated configuration.

### `## Why it matters`

Explain product or architecture impact in plain language.
Tie it to the repo's actual direction when possible.

### `## Key files`

List the most important changed files only.
For each file, add one sentence about what is worth learning from it.

### `## Concepts to study`

List 3-7 concepts.
Each concept must be specific enough to search or study directly.

Good:
- Next.js App Router server vs client components
- Tiptap StarterKit composition
- ProseMirror decorations for ghost text

Weak:
- frontend
- backend
- optimization

### `## Deep dive questions`

Write 3-5 questions that require explanation, comparison, or reasoning.
Prefer "why / when / tradeoff / alternative" questions.

### `## Interview framing`

Write 2-4 bullets the user could reuse in an interview, retrospective, or portfolio explanation.
Focus on decisions and tradeoffs, not vanity phrasing.

### `## Next study actions`

Split into:
- `15 min`
- `30 min`
- `60 min`

Each item should be concrete and achievable.

## Quality bar

- Do not invent motivations that are not supported by the diff or nearby project docs.
- Do not overstate understanding; call out uncertainty when a commit suggests a topic but does not fully show it.
- Prefer fewer, sharper study keywords over long generic lists.
- If the commit is mostly setup, extract setup-related learning points rather than pretending there was deep product logic.
- Keep the note readable by a future version of the user who has forgotten the context.

## Output example

Use this shape:

```md
# Commit Deep Dive - 2026-03-21 - abc1234

## Commit
- Full SHA: abc1234...
- Short SHA: abc1234
- Subject: chore: bootstrap project setup and install Tiptap
- Date: 2026-03-21

## What changed
- ...

## Why it matters
- ...

## Key files
- `package.json`: ...

## Concepts to study
- ...

## Deep dive questions
- ...

## Interview framing
- ...

## Next study actions
### 15 min
- ...

### 30 min
- ...

### 60 min
- ...
```

## Resource

### `scripts/collect_commit_context.py`

Use this script first. It provides structured commit metadata, changed files, diff stats, and a bounded patch excerpt so you can stay grounded before writing the learning note.
