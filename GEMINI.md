# TinkerWithTech Blog — Gemini Context

This is the Next.js blog for **TinkerWithTech**, a content channel teaching cloud-native /
CNCF engineering through short, demo-driven tutorials. Posts live in
`src/content/blog/epNN-slug.mdx` and auto-deploy on push to `main`.

## Content workflow

Run `/content` to drive the full content pipeline (research → anti-AI blog → tutorial →
dry-run validation → website MDX → LinkedIn copy). Triggers:

- `/content RESEARCH` — propose ranked CNCF episode topics
- `/content EPISODE: <topic or tool>` — full pipeline for a chosen topic
- `/content BLOG ONLY: <topic>` — just the blog tutorial
- `/content LINKEDIN ONLY: <topic>` — just the LinkedIn post

Run `/validate epNN` to dry-run a finished post: it runs `scripts/dry-run-validate.sh`
(deterministic static checks — frontmatter, structure, code fences, leftovers, command
extraction) and then audits the commands for invented flags / fake output, emitting a
`[VERIFY]` list. No homelab needed. You can also run the script directly:

```bash
scripts/dry-run-validate.sh ep10
```

The homelab demo and the live blog walkthrough (running every command to confirm it works)
happen in Claude Code on the homelab, not in Gemini.

## Hard rules for any blog post

- **Frontmatter** always sets `published: false`. Flip to `true` + git push to release.
- Post structure: Introduction → Prerequisites → Architecture Overlay → Step-by-Step
  Implementation → POC/Verification.
- Code blocks always specify a language (`bash`, `yaml`, `json`, `go`, `hcl`).
- Commands must be real and runnable — never invent flags or output. Mark anything
  unverified as `[VERIFY]`.
- **Anti-AI voice is mandatory.** Cut filler ("dive into", "seamlessly", "powerful",
  "leverage"), vary sentence rhythm, no binary "It's not X, it's Y" contrasts, no
  rhetorical-question setups, state the problem directly.

## Constraints on topics

Every topic must be **homelab-demosable** (k3d/vCluster, no cloud accounts, no GPU) and have
a **clear hero moment** describable in one sentence.
