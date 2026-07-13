# Editor Guide (Decap CMS)

This guide is for **non-technical editors** who want to update the Learn N’ Lunch website without using Git directly.

## Where you edit the site

- **Admin panel**: `/admin/` (on the live site)
- **What happens when you publish**: Decap CMS commits your changes to GitHub, then the site rebuilds and updates.

## Logging in

1. Go to `/admin/`
2. Click **Login with GitHub**
3. Approve the authorization prompt if requested

If login fails, tell a maintainer. Authentication is handled by a Cloudflare Worker OAuth proxy at `https://learn-n-lunch-auth.learnandlunch.workers.dev`.

## How publishing reaches the live site

When you publish in the CMS, two automated GitHub workflows run:

1. **Build Site from CMS Content** — rebuilds HTML from `content/`, deploys the live site, then opens a short-lived PR to keep the repo’s HTML files in sync.
2. **Deploy static site to GitHub Pages** — redeploys on other repo updates that are not CMS content changes.

You only use `/admin/`; these workflows run automatically in the background.

## Draft vs Published (important)

Decap is set up with an **Editorial Workflow**, which means items can be:

- **Draft**: saved but not live on the website
- **In Review**: ready for someone else to check
- **Published**: live on the website after the build completes

Only **Published** blog posts appear on the public **Stories** page.

## Editing a page (small change example)

1. In `/admin/`, open **Pages**
2. Choose a page (for example: **About Us** or **Impact**)
3. Edit the text you want to change
4. Click **Save**
5. When ready, click **Publish**

Your change will appear on the live site after the automated build finishes.

## Writing a Stories/Blog post

1. In `/admin/`, open **Blog**
2. Click **New Blog**
3. Fill in:
   - **Title**
   - **Slug** (this becomes the URL: `/stories/<slug>/`)
   - **Excerpt**
   - **Cover image** + **Alt text**
   - **Tags** (these drive filtering on the Stories page)
   - **Status**: set to `published` when ready to go live
   - **Published date**
   - **SEO title/description**
   - **OG image** (used for link previews when shared)
4. Write the body using normal markdown:
   - Bullet and numbered lists
   - Links like `[text](https://example.com)`
   - Images like `![alt text](/path/to/image.svg)` (or uploaded images later)
   - Blockquotes like `> quoted text`
5. Click **Save**, then **Publish** when ready

## Tags and Stories filters

The Stories page category buttons are driven by the **first tag** on a post.

Use these tag names exactly:

- `Student Stories`
- `Events & Campus Life`
- `Impact Reports`
- `Donor Highlights`

## IMPORTANT: Placeholder posts currently live

Right now there are **10 posts labeled `[PLACEHOLDER]`** (campus/donor/impact stubs) that exist to fill out the Stories page and ensure all referenced URLs work.

**These should be reviewed and rewritten with real content and real photos before being treated as genuine published posts.**

You can find them in the CMS under **Blog** (their titles include `[PLACEHOLDER]`), and they live as markdown files under `content/blog/`.

## What to do if you don’t see your change live

- Wait a few minutes — the build needs time to run.
- If it still doesn’t appear, tell a maintainer to check the GitHub Actions build logs.

