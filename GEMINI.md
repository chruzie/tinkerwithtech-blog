# TinkerWithTech Blog — Gemini Context

This is the Next.js blog for **TinkerWithTech**, a content channel teaching cloud-native /
CNCF engineering through short, demo-driven tutorials. Posts live in
`src/content/blog/epNN-slug.mdx` and auto-deploy on push to `main`.

## Content workflow

Run `/content` to drive the full content pipeline (research → anti-AI blog → tutorial →
live validation → website MDX → LinkedIn copy). Triggers:

- `/content RESEARCH` — propose ranked CNCF episode topics
- `/content EPISODE: <topic or tool>` — full pipeline for a chosen topic
- `/content BLOG ONLY: <topic>` — just the blog tutorial
- `/content LINKEDIN ONLY: <topic>` — just the LinkedIn post

### Validation Requirements

1. **Dry-Run:** Run `/validate epNN` for deterministic static checks (frontmatter, structure,
   code fences).
2. **Live Validation:** Before finalization, the producer MUST attempt to execute every 
   command in the tutorial on a local `k3d` or `vCluster` instance. Identify and fix 
   hallucinated flags, schema mismatches, or timing issues during this phase.

The LIVE blog walkthrough (running every command to confirm it works) must pass 
end-to-end before the post is marked as "ready for publishing".

## Hard rules for any blog post

- **Frontmatter** always sets `published: false`. Flip to `true` + git push to release.
- **Mandatory Live Validation:** No tutorial is complete until the producer has verified 
  the "hero moment" on a local Kubernetes instance.
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
