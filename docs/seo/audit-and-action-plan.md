# SEO audit and action plan — 17 November 2026

Scope: local static output and generators, live domain/robots/sitemap requests, mobile Lighthouse on localhost. No Search Console access, field Core Web Vitals, full live URL crawl or ranking baseline was available. Changes are local and not deployed. Ranking #1 cannot be guaranteed.

## Audit findings, ranked by impact (before editing)

1. **High — branded identity:** metadata used “Learn And Lunch”, settings lacked the requested alternate brand name, and WebSite/NGO schema lacked alternateName and stable entity IDs. Homepage did describe student food security in Uganda, but its title omitted the topic/location. Fixed naming, aliases and homepage title. NGO is a subtype of Organization; existing logo, contact and social sameAs data were retained.
2. **High — content coverage:** Campus Gardens is a one-sentence programme listing (`hasPage: false`); Campus Stride has no content in the repository. Nutrition has a dedicated programme page; stories and impact already have substantial HTML content. No fabricated programme pages or results were added. See content brief below.
3. **High — performance/mobile:** Lighthouse baseline homepage Performance 63; LCP 3.9s, TBT 1,310ms. It flags image sizing/delivery, unused CSS (~136 KiB), render blocking and main-thread work. Shared logo now reserves intrinsic dimensions. Remaining speed work includes splitting route CSS, profiling animation/layout work, and image delivery optimisation. Avoid assuming metadata changes improve speed. Local server lacks production compression/cache behaviour; CDN headers are a hosting concern, not something .htaccess fixes on GitHub Pages.
4. **Medium — stale/duplicate URLs:** `/donations/` duplicates `/donate/` but already canonicalizes to `/donate/` and is excluded from sitemap; preserved. A stale `/stories/campus-welfare-dialogue-outcomes/` HTML page is absent from current published content/sitemap; replaced with a noindex archive redirect to Stories. This is an HTML refresh, not an HTTP 301; GitHub Pages does not offer arbitrary per-route redirect rules. Legacy students/summit routes already have intentional noindex redirects. Published URLs were not renamed.
5. **Medium — schema:** Article/BlogPosting, breadcrumbs and Organization markup already exist on stories. Impact lacked page-specific markup; added WebPage schema tied to the organization. No unsupported impact numbers, ratings or eligibility claims added. WebSite/Organization aliases support brand interpretation; they do not guarantee a chosen Google site name.
6. **Medium — accessibility and headings:** About had two H1s; the team heading is now H2. Three decorative Impact images lacked alt attributes; now empty alt and aria-hidden. Homepage flow buttons had accessible names that excluded their visible labels; fixed. Blog back button now has an accessible name. Existing mobile viewport/responsive CSS and share-button fix are retained. Mobile Lighthouse is not a complete manual device usability test; site contrast findings remain pending a design decision.
7. **Low — crawl-file maintenance:** sitemap is already generated from published local stories and enabled programme detail pages, excluding external news links and noindex tools. robots.txt allowed crawling and referenced the correct sitemap, but was static; it is now generated with the same site URL. 15 canonical pages pass generated-output checks. No arbitrary crawl blocks added.

## Already working / verified

- Key pages and story text are pre-rendered HTML; JavaScript is not needed to discover their primary content or links. Interactive map/filter features remain enhancements.
- HTTP bare-domain, HTTPS bare-domain and HTTP www homepage requests returned 301 to `https://www.learnandlunch.org/`, which returns 200. CNAME and canonical settings agree. Preserve that existing host.
- Live robots.txt allows crawling; live sitemap is accessible. Main canonical pages have index/follow. 404, closed forms, dashboard and legacy redirects intentionally use noindex.
- Existing Open Graph and Twitter cards, responsive viewport, Article schema, logo and social profiles were retained. Metadata uniqueness was checked over canonical sitemap pages, excluding intentional aliases/redirects.
- Navigation links to About, Programmes, Impact, Stories and Contact are real HTML links. Programme cards and article links are crawlable. No new About/FAQ page is necessary: About and FAQ content already exist.
- All generated sitemap pages now have one H1, unique titles/descriptions, matching canonical, alt attributes, social tags and parseable JSON-LD (`node scripts/check-seo.js`). This is a structural check, not a Google rich-result eligibility guarantee.

## Copy/design scope

Flagged before editing: standardized existing brand mentions to “Learn and Lunch”; homepage search title now states campus hunger/student food security in Uganda. Schema includes “Learn N' Lunch” and “Learn N’ Lunch”. No keyword lists in visible copy, no hidden text, no visual redesign. Lower heading level preserves its CSS class. Contrast colours were not changed without a design discussion.

## Real content gaps to address

- **Campus Gardens:** commission an accurate dedicated page explaining whether work is exploratory/pilot/active, participating campuses, what students do, dates, responsible partners, evidence/photos and how to join. Until facts exist, keep the current honest listing. Link to it from nutrition stories and programmes when published. Use “campus gardening” naturally in that explanatory text.
- **Campus Stride:** confirm what it is, who runs it, where/when it happens and the verified connection to student food security. Then create a useful programme/event page with participation details and related stories. Do not publish a thin placeholder merely to target the name.
- **Impact:** continue dated reporting with denominators, methodology and linked source reports. Distinguish students reached from measurable food-security outcomes; don't invent outcomes for schema.
- Improve generic homepage photo alt descriptions after identifying the actual photographs. Current generic alt is present but not descriptive enough to justify inventing a scene description.

## Off-site checklist (owner actions)

- [ ] Verify a **Domain property** for learnandlunch.org in Google Search Console using the provided DNS TXT record. Keep the record. Inspect HTTPS www homepage and key URLs; compare declared vs Google-selected canonical and rendered page content.
- [ ] Submit `https://www.learnandlunch.org/sitemap.xml`. After deployment request indexing for home, About, Programmes, Nutrition, Impact and Stories. Check Pages indexing, crawl failures, manual actions and security issues. No need to repeatedly request indexing.
- [ ] Google Business Profile: create/claim only if the organization meets Google's in-person eligibility requirements. Confirm a staffed real location or qualifying service-area operation; do not invent an office, address or opening hours. Online-only organizations are not eligible.
- [ ] Standardize social display names to **Learn and Lunch**; mention **Learn N' Lunch** naturally in bios if it is an established alternate name. Use the canonical HTTPS www website link, consistent logo and actual contact details. Clean tracking parameters from profile links when practical.
- [ ] Ask university partners (KIU, Kyambogo and other confirmed collaborators) for factual programme/partner pages linking to the relevant initiative or report.
- [ ] Ask Body & Soil, Nutri-Safe and confirmed partners to credit collaborations with editorial links; request links from existing news coverage where attribution is missing.
- [ ] Seek legitimate Uganda education, food-security and NGO directories with real editorial standards. Offer original research summaries and methodology to university libraries/student welfare teams. Avoid paid ranking links, bulk directories and reciprocal link schemes.

## Expectations and monitoring

Deployment comes first. Google says recrawling/reprocessing can take days to weeks. Branded visibility is a realistic early priority, not a promised #1 position. Broader topical visibility often needs sustained evidence, useful pages and independent references over months; domain history, competitors and backlinks are outside this code change.

Week 1: verify deployment, sitemap processing and canonical/indexing status. Weeks 2–4: compare Search Console impressions, clicks, CTR and average position for all brand spellings, and separately campus hunger Uganda/student nutrition/campus gardening/Campus Stride. Segment by page, country and device. Low-volume queries may not be reported. Inspect missing URLs before writing more content. Review referring domains and university/news links monthly.

Monitor field LCP ≤2.5s, INP ≤200ms and CLS ≤0.1 at the 75th percentile where enough data exists. Lighthouse TBT is a lab diagnostic, not INP. Search Console/CrUX may lack enough traffic; do not report that as a pass. Rankings and indexing cannot be measured by a Lighthouse SEO score.

## References

- Google site names: https://developers.google.com/search/docs/appearance/site-names
- Google organization schema: https://developers.google.com/search/docs/appearance/structured-data/organization
- Business Profile eligibility: https://support.google.com/business/answer/13762416
- Core Web Vitals: https://web.dev/articles/vitals

See `verification.md` for measurements and `changed-files.txt` for the exact file list. Existing admin/config.yml and admin/publishing.js changes belong to the earlier blog-slug request and were preserved.
