# Learn N' Lunch Website

This repository contains the Learn N' Lunch static website and its Decap CMS configuration.

## Editing content (non-technical editors)

Use the CMS at `/admin/`.

Start here:

- `docs/EDITOR-GUIDE.md`

## Tech overview (for maintainers)

- Content lives in `content/` (markdown + JSON).
- Decap CMS writes content changes back to GitHub.
- **Build Site from CMS Content** (`build-site.yml`) runs on content changes: validates, builds HTML, deploys to GitHub Pages, then opens an auto-merge PR to sync rendered HTML back to the repo.
- **Deploy static site to GitHub Pages** (`deploy-pages.yml`) redeploys on non-content pushes (workflow or HTML-only changes).
- Stories/Blog posts publish at `/stories/<slug>/`.

## Branch protection note

If HTML sync PRs fail to auto-merge, enable **Allow auto-merge** in repo settings and/or allow `github-actions[bot]` to bypass required pull request rules for the sync PR branch.
