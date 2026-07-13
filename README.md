# Learn N' Lunch Website

This repository contains the Learn N' Lunch static website and its Decap CMS configuration.

## Editing content (non-technical editors)

Use the CMS at `/admin/`.

Start here:

- `docs/EDITOR-GUIDE.md`

## Tech overview (for maintainers)

- Content lives in `content/` (markdown + JSON).
- Decap CMS writes content changes back to GitHub.
- GitHub Actions rebuilds the site and commits rendered HTML.
- Stories/Blog posts publish at `/stories/<slug>/`.

