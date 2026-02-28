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

## Deployment

Pushes to `main` deploy automatically via GitHub Actions → GCS bucket → [blog.tinkerwithtech.io](https://blog.tinkerwithtech.io).

See [infra/README.md](infra/README.md) for the full infrastructure setup.
