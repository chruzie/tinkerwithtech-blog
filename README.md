# TinkerWithTech Blog

Source for [blog.tinkerwithtech.io](https://blog.tinkerwithtech.io) — technical deep-dives for every TinkerWithTech episode.

## Local development

**Prerequisites:** Node.js 20+

```bash
# 1. Clone
git clone https://github.com/chruzie/tinkerwithtech-blog.git
cd tinkerwithtech-blog

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The dev server hot-reloads on file changes — editing an MDX file in `src/content/blog/` updates the page instantly.

## Other commands

```bash
npm run build   # build static export → out/
npm run lint    # run ESLint
```

## Adding or editing a blog post

Posts live in `src/content/blog/` as `.mdx` files. Each file starts with frontmatter:

```yaml
---
title: "Your Post Title"
date: "2026-02-27"
description: "One or two sentence summary."
season: 1
episode: 1
tags: ["kubernetes", "cncf"]
published: false        # flip to true when ready to release
---
```

`published: false` hides the post from the episodes page. Change it to `true` and push to make it live.

## Content workflow (Gemini CLI)

This repo ships a Gemini CLI command that drives the whole content pipeline — topic
research, an anti-AI blog draft, the tutorial/demo script, a dry-run validation pass, the
website MDX, and LinkedIn copy.

**Prerequisites:** [Gemini CLI](https://github.com/google-gemini/gemini-cli) installed
(`brew install gemini-cli`).

```bash
cd tinkerwithtech-blog
gemini
```

Launching from the repo root auto-loads [`GEMINI.md`](GEMINI.md) (channel context + hard
rules) and the `/content` command from `.gemini/commands/`. Drive it with a trigger:

| Command | What it does |
|---------|--------------|
| `/content RESEARCH` | Proposes ranked CNCF topics (homelab-demosable, clear hero moment) |
| `/content EPISODE: <topic>` | Full pipeline — writes `src/content/blog/epNN-slug.mdx` |
| `/content BLOG ONLY: <topic>` | Just the blog tutorial |
| `/content LINKEDIN ONLY: <topic>` | LinkedIn post + an X/Threads one-liner |
| `/validate epNN` | Dry-run validate a finished post (static checks + hallucination audit) |

It pauses at each stage for approval — reply in chat to approve or request changes, then
fire the next trigger. Drafts are always written with `published: false`.

### Dry-run validation

`/validate epNN` runs [`scripts/dry-run-validate.sh`](scripts/dry-run-validate.sh) — a
deterministic static check (frontmatter limits, required sections, balanced code fences,
language tags, leftover placeholders, extracted shell commands) — then has Gemini audit the
commands for invented flags, fabricated output, and unverified versions. Run the script on
its own anytime:

```bash
scripts/dry-run-validate.sh ep10        # epNN, epNN-slug, or a path all work
```

It exits non-zero on hard blockers, so it also works in CI or a pre-commit hook.

**What stays manual:** Gemini writes the words and commands but can't touch the homelab.
Stage 4 (and `/validate`) emits a `[VERIFY]` list of commands to run yourself (or have
Claude Code execute the live blog walkthrough) before publishing.

## Deployment

Pushes to `main` deploy automatically via GitHub Actions → GCS bucket → [blog.tinkerwithtech.io](https://blog.tinkerwithtech.io).

See [infra/README.md](infra/README.md) for the full infrastructure setup.
