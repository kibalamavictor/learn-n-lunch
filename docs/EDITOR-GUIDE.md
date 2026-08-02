# Editor Guide (Decap CMS)

This guide is for **non-technical editors** who want to update the Learn N’ Lunch website without using Git directly.

## Where you edit

- **Admin panel**: `/admin/`
- **Look & feel**: Clean, simple admin UI — easy to scan and edit, with light brand accent only
- **What happens when you publish**: Decap commits your changes to GitHub, then the site rebuilds automatically.

## Logging in

1. Go to `/admin/`
2. Click **Login with GitHub**
3. Approve the authorization prompt if asked

If login fails, tell a maintainer. Auth is handled by a Cloudflare Worker at `https://learn-n-lunch-auth.learnandlunch.workers.dev`.

## What’s in the sidebar (where to click)

| Section | Use it for |
| --- | --- |
| **Website Pages** | Home, About, Impact, Stories listing, Donate, Get Involved, Contact |
| **Stories** | Individual story posts on `/stories/` |
| **Reports & PDFs** | Impact reports and downloadable PDFs |
| **Team Members** | About page team cards |
| **Testimonials** | Homepage quote carousel |
| **Numbers & Stats** | Home/Impact counters and the campus map |
| **Site Settings** | Site name, nav links, footer social links |

Tip: On long pages (especially **Home**), sections are numbered (`1 · Hero`, `2 · Mission Banner`, …) and many blocks start **collapsed** — open only the section you need.

## Draft vs Published

Decap uses an **Editorial Workflow**:

- **Draft** — saved, not live
- **In Review** — ready for someone else to check
- **Published** — live after the build finishes

Only **Published** stories appear on the public Stories page.

## Editing a page

1. Open **Website Pages**
2. Choose a page (e.g. **Home** or **Impact**)
3. Expand the section you want (e.g. `1 · Hero`)
4. Edit text/images
5. **Save**, then **Publish** when ready

## Writing a Story

1. Open **Stories** → **New Story**
2. Fill in:
   - **Title**, **Slug** (URL becomes `/stories/<slug>/`)
   - **Excerpt**, **Cover image** + alt text
   - **Category Tags** — the **first** tag drives Stories filters
   - **Status**: `published` when ready
   - **Story Body** (markdown)
3. **Save**, then **Publish**

### Category tags (use exactly)

- `Student Stories`
- `Events & Campus Life`
- `Impact Reports`
- `Donor Highlights`

## Reports / PDFs

1. Open **Reports & PDFs**
2. Upload the PDF, set cover image + excerpt
3. Set **Status** to `published` when ready

## Publishing to the live site

When you publish, GitHub Actions rebuilds the site from `content/` and deploys it. You only use `/admin/`; builds run in the background.

## If you don’t see your change live

- Wait a few minutes for the build
- Confirm the entry is **Published** (not Draft)
- If it’s still missing, ask a maintainer to check GitHub Actions logs
