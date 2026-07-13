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

HTML sync needs **one** of these configured in GitHub repo settings:

1. **Direct push (simplest):** Settings → Branches → `main` → edit protection → under “Bypass list”, add **`github-actions`** (or allow the bot to push to `main`).
2. **PR auto-merge fallback:** Settings → General → Pull Requests → enable **Allow auto-merge**, and Settings → Actions → General → enable **Allow GitHub Actions to create and approve pull requests**.

If sync fails, check the “Sync rendered HTML back to repo” step log in Actions.
