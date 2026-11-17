# Verification — 17 November 2026

Same localhost homepage, default mobile Lighthouse simulation, same installed Brave executable/headless flags. Baseline captured at 20:41:17 UTC before edits; final after edits. These are single lab runs with warm/cold-cache and animation timing variability, not field Core Web Vitals or proof of causal ranking improvement.

| Category | Before | Final | Difference |
|---|---:|---:|---:|
| Performance | 63 | 88 | +25 |
| Accessibility | 96 | 96 | 0 |
| Best Practices | 100 | 100 | 0 |
| SEO | 100 | 100 | 0 |

| Lab metric | Before | Final |
|---|---:|---:|
| LCP | 3.9 s | 3.9 s |
| TBT | 1,310 ms | 40 ms |
| CLS | 0.028 | 0.034 |

An intermediate run scored 87 Performance / TBT 90ms. No claim is made that metadata caused the performance increase: LCP is unchanged and animation timing can affect TBT. LCP still needs improvement. Field INP was not measured. Production may differ from Python's uncompressed local static server. Contrast, CSS payload and image-delivery findings remain; no visual colour change was made in this SEO pass.

Reproduce: `CHROME_PATH='/Applications/Brave Browser.app/Contents/MacOS/Brave Browser' npx --yes lighthouse http://localhost:8000/ --chrome-flags='--headless --no-sandbox' --output=json --output-path=/tmp/lighthouse.json --quiet`.

Structural audit: 15 canonical sitemap pages pass `npm run check-seo`. Checks include uniqueness, canonicals, noindex exclusion, H1 count, image alt presence, social tags and JSON-LD parsing. `npm run validate-content` passed. Added checks to the normal build so publishing regressions fail the build. Existing admin slug edits were preserved, not included in SEO changes.

HTTP verification: all three alternate homepage domain/protocol combinations 301 to HTTPS www; canonical homepage 200. robots.txt and sitemap fetched successfully from production. No deployment was performed; production has not been re-audited after these local fixes.

Files: `changed-files.txt` lists every file changed/added in this SEO pass, including generated HTML and reports. robots.txt and sitemap.xml were regenerated but their content remained identical, so Git records no diff for those two artifacts.
