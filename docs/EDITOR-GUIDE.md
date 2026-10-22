# Editor Guide (Decap CMS)

This guide is for **non-technical editors** who want to update the Learn And Lunch website without using Git directly.

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

## Publish in one step

When your edits are ready, click **Publish** in the editor toolbar. This saves your changes and starts the website update in one action. There is no separate Save, review, or approval step.

Stories and reports are marked as published automatically. Existing draft stories stay off the website until you open and publish them. If their publication date is blank, publishing fills it in automatically.

Wait a few minutes for the website to rebuild after publishing. To leave unfinished work unpublished, keep editing without clicking Publish.

## Editing a page

1. Open **Website Pages**
2. Choose a page (e.g. **Home** or **Impact**)
3. Expand the section you want (e.g. `1 · Hero`)
4. Edit text/images
5. Click **Publish** once when ready

## Writing a Story

1. Open **Stories** → **New Story**
2. Fill in:
   - **Title**, **Slug** (URL becomes `/stories/<slug>/`)
   - **Excerpt**, **Cover image** + alt text
   - **Cover Photo Credit** (optional) — shown under the cover image
   - **Category Tags** — the **first** tag drives Stories filters
   - **Story Body** (markdown)
3. Click **Publish** once

For images inside the story body, open the image insert dialog and fill **Title** with the photo credit (e.g. `Photo: Mercy Lawino`). That credit appears under the image on the live page.

### Quotes

Use the **quote** button in the body toolbar. There are two styles, and the site picks one automatically:

**1. Quote from a person** — a blue box with the speaker underneath. Put the quote first, then the speaker on its **own last line starting with a hyphen (`-`)**:

```markdown
> We do not need perfection. We need consistency students can plan around.
>
> - Student guild representative, Makerere
```

**2. Pull quote** — a large headline-style line between two rules, used to highlight a key sentence from the story itself. Just leave out the `-` line:

```markdown
> Ending campus hunger is not about charity. It is about equal opportunity.
```

Tips:

- No need to type quotation marks — the design adds a large opening quote mark. If you paste a quote that already has them, they're removed automatically.
- Quotes can be as long as you need, and can span several paragraphs (leave a blank `>` line between them).
- Always credit people you quote. If a student prefers not to be named, use their role and campus (e.g. `— Second-year student, Kyambogo`).
- If the editor turns your `- Name` line into a bullet point, that's fine — a single bullet at the end of a quote is still shown as the speaker.
- `--`, `–` and `—` also work in place of `-`.
- Only use pull quotes for sentences from your own story, never for words someone else said.

### Category tags (use exactly)

- `Student Stories`
- `Events & Campus Life`
- `Impact Reports`
- `Donor Highlights`

## Uploading and choosing images

Image fields use the Cloudinary media library connected to the Learn And Lunch account (`jxgiku8t`).

1. Click the image field's media picker.
2. If prompted, log in to the Cloudinary account with access to this library. This is separate from your GitHub CMS login.
3. Upload a photo or choose an existing asset, then insert it into the field.
4. Add descriptive alt text, then click **Publish** once.

The CMS saves the full HTTPS Cloudinary URL in the content. Existing images stored on the website continue to work; they have not been moved to Cloudinary. You can organize new assets into folders for stories, programmes, people, and website pages.

Uploading an image does not publish a page. Avoid deleting or renaming assets used by published pages, as their saved URLs can stop working. Uploads are stored in Cloudinary even if you later discard your unsaved edits.

If the media library cannot open, check that you are signed into the correct Cloudinary account and allow its login popup if your browser blocks it. Ask a maintainer if access is still denied. Never enter an API secret into the CMS configuration.

## Reports / PDFs

1. Open **Reports & PDFs**
2. Upload the PDF, set cover image + excerpt
3. Click **Publish** once when ready

## Publishing to the live site

When you publish, GitHub Actions rebuilds the site from `content/` and deploys it. You only use `/admin/`; builds run in the background.

## If you don’t see your change live

- Wait a few minutes for the build
- Confirm the CMS reported that publishing succeeded
- If it’s still missing, ask a maintainer to check GitHub Actions logs
