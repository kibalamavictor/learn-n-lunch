# Learn N' Lunch — Design System

> **Binding reference** for all current and future work on this project, including the CMS admin panel.  
> Extracted from `SCSS/` and `dist/style.css` — do not invent tokens outside this document without approval.

---

## 1. Brand & Visual Identity

Learn N' Lunch uses a **bold, editorial, student-movement aesthetic**: heavy black borders, offset box-shadows (neo-brutalist), uppercase Anton headlines, rotated photo collages, and scrolling marquee banners. Color is used in large accent blocks (yellow, cyan, light blue) rather than subtle UI chrome.

---

## 2. Color Palette

### 2.1 CSS Custom Properties (`SCSS/globals/_colors.scss`)

| Token | Value | Usage |
|-------|-------|-------|
| `--button-color` | `#0784C8` | Primary button (defined, lightly used) |
| `--button-hover-color` | `#0673ad` | Button hover |
| `--orange-bar` | `#ff6b35` | Accent bar (defined) |
| `--gary-scroll-color` | `#242323` | Scroll/marquee dark gray |
| `--darker-blue` | `#157DA6` | Team card override, deep cyan-blue |
| `--mm-yellow` | `#f6c33c` | Story tags, CTA buttons, value highlights |
| `--text-dark` | `#000` | Body text, borders |
| `--border-dark` | `#000` | Borders |
| `--white` | `#fff` | Backgrounds, cards |
| `--bg-light-linen-blue` | `#D3EEFF` | Hero bg, nav (home), story sections, vision accent |
| `--greenish` | `#2F9F82` | Accent (defined) |

### 2.2 Section & Component Accent Colors (in SCSS/HTML)

| Name | Hex | Where used |
|------|-----|------------|
| Light blue (nav mobile) | `#D3EEFF` | Home navbar inline override |
| Light blue alt | `#D4E7F5` | Hero mobile nav fallback |
| Hero yellow | `#F5B800` | About Us hero content block |
| Gold gradient start | `#FDB714` | Team banner, yellow member cards |
| Gold gradient end | `#FFD04A` | Team banner, yellow member cards |
| Cyan gradient start | `#4ECDC4` | Cyan team cards |
| Cyan gradient end | `#7FE5DD` | Cyan team cards |
| Mint accent | `#7be4d3` | Model-work tags, filter reference |
| Yellow accent | `#fdc039` / `#f6b931` / `#f6b931` | Model-work tags, filter buttons |
| Peach accent | `#ffd8a8` | Story card tags |
| Testimonial gold | `#f5b941` | Testimonial right panel |
| Filter blue | `#bce2f4` | Stories filter button |
| Filter mint | `#61cdbb` | Stories filter button |
| Filter dark | `#222` | Stories filter button (donor) |
| Campus tag yellow | `#ffcc00` | Campus feature cards |
| CTA sky blue | `#0ea5e9` | Footer/donate CTA buttons |
| CTA sky blue hover | `#0284c7` | CTA button hover |
| Donate teal | `#2d9c8f` | Donate form selected state |
| Donate teal light | `#eaf7f5` | Donate form focus bg |
| Slogan gray | `#464646` | Moments collage scrolling band |
| Body gray | `#333` | Secondary text (donate, students) |
| Near-black | `#1a1a1a` | Borders, text in impact/learn sections |
| Neutral gray | `#E3E3E3` | Stories "More" button override |
| Neutral bg | `#f0f0f0` | Hover states, member image placeholder |
| Neutral bg 2 | `#f5f5f5` | Payment method hover |

### 2.3 Gradients (in use)

- Team banner: `linear-gradient(5deg, #FDB714 0%, #FFD04A 100%)`
- Yellow member card: `linear-gradient(135deg, #FDB714 0%, #FFD04A 100%)`
- Cyan member card: `linear-gradient(135deg, #4ECDC4 0%, #7FE5DD 100%)`
- Makerere CTA: `linear-gradient(135deg, #fbbf24, #f59e0b)`

---

## 3. Typography

### 3.1 Font Families (Google Fonts)

Loaded via:
```
https://fonts.googleapis.com/css2?family=Anton&family=Montserrat:ital,wght@1,600&family=Nunito:ital,wght@0,200..1000;1,200..1000&display=swap
```

| SCSS variable | Family | Role |
|---------------|--------|------|
| `$font-a` / `util.$font-a` | **Anton** | Headlines, section titles, stat numbers, uppercase display |
| `$font-n` / `util.$font-n` | **Nunito** | Body copy, nav links, bios, descriptions, form text |
| `$font-m` / `util.$font-m` | **Montserrat** (italic 600) | Scrolling banners, marquee text |

### 3.2 Default Body

- `font-family: "Anton", sans-serif` on `body` (via boilerplate)
- Most readable text overrides to Nunito in component classes

### 3.3 Type Scale (representative sizes in use)

| Element | Size | Weight | Notes |
|---------|------|--------|-------|
| Hero h1 | `2.5rem` → `2rem` mobile | 700 | Uppercase, letter-spacing `2px` |
| Section titles (`.mm-title`, `.team-title`) | `2.5rem` | 900 | Uppercase |
| Bold statement | `6rem` → `3.5rem` mobile | 900 | `.bold-statement` |
| Bold statement 2 | `3.5rem` → `1.8rem` mobile | 900 | About page |
| Values title | `5.5rem` → `3rem` mobile | — | `.lnl-community-title` |
| Stat numbers | `56px` | 900 | `.learn-lunch-stat-number` |
| Footer CTA title | `35px` | — | Anton |
| Body / descriptions | `1rem`–`1.2rem` | 400–500 | Nunito, line-height `1.6`–`1.8` |
| Nav links | `1rem` | 500 | |
| Card headings (`.card h2`) | `2.5em` | 900 | |
| Testimonial quote | `2.5rem` → `1.25rem` mobile | 900 | Uppercase |
| Stories hero | `4rem` → `2.2rem` mobile | 900 | |
| Member name | `1.8rem` | 900 | Uppercase |

### 3.4 Line Heights

- Headlines: `1.1`–`1.3`
- Body: `1.6`–`1.8`
- Display multi-line: `1.5`–`1.7`

### 3.5 Text Treatment Conventions

- **Uppercase** for virtually all headings and CTAs
- **Letter-spacing**: `-3px` to `2px` depending on display size
- Links: `text-decoration: none`, inherit color; no underline by default

---

## 4. Spacing & Layout

### 4.1 Container Max-Widths

| Class / context | Max-width |
|-----------------|-----------|
| `.nav-container` | `1400px` |
| `.hero-content` | `1400px` |
| `.mm-container` | `1300px` |
| `.learn-lunch-container` | `1200px` |
| `.footer-cta-container`, `.our-values-container` | `1500px` |
| `.mission-vision-section` | `1500px` |
| `.lnl-hero-container` | `1500px` |
| `.stories-container` | `1100px` (90% width) |
| `.campus-lunch-section`, `.st-hero-container` | `1140px` |
| `.lnl-challenge-container` | `1100px` |
| `#app` (testimonials) | `1400px` |
| `.exam-story-container` | `1160px` |
| `.donation-form-container` | (donate page) |

### 4.2 Section Padding Patterns

| Pattern | Values |
|---------|--------|
| Hero | `8rem 5%` → `6rem 9%` mobile |
| Story carousel section | `56px 60px 90px` → `18px` sides mobile |
| Footer CTA | `60px 40px` |
| Team section | `40px` title padding |
| About hero | `100px 30px` |
| Values blocks | `60px 20px`, margin `60px auto 150px` |
| Moments | `80px 0` |
| Impact stats | `6rem 2rem` |

### 4.3 Grid & Flex Gaps

| Context | Gap |
|---------|-----|
| Nav menu | `2rem` → `1.5rem` tablet |
| Hero grid | `3.5rem` |
| Mission/vision cards | `100px` → `60px` mobile |
| Team cards grid | `100px` |
| MM carousel cards | `28px` (`--mm-gap`) |
| Learn-lunch stats | `80px` |
| Footer CTA card | `40px` |

### 4.4 Breakpoints (observed)

- `480px`, `640px`, `680px`, `768px`, `900px`, `968px`, `1000px`, `1024px`, `1080px`, `1124px`, `1150px`, `1570px`

---

## 5. Borders, Shadows & Shape

### 5.1 Signature Shadow Pattern

Offset hard shadow (neo-brutalist) — **no blur** in most cases:

```css
box-shadow: 4px 4px 0 #000;          /* buttons, cards */
box-shadow: 3px 3px 0 var(--text-dark); /* nav buttons, smaller elements */
box-shadow: 6px 6px 0px rgba(0, 0, 0, 1); /* hero frame, about image */
box-shadow: 5px 5px 0 0 rgba(0, 0, 0, 1); /* mission/vision cards */
```

Variations: `2px 2px`, `4px 7px`, `7px 3px` for rotated images.

### 5.2 Borders

- Default: `1px solid #000` or `1px solid #1a1a1a`
- Emphasis: `2px solid #000`, `3px solid #000` (forms, donate)
- Team member photos: `14px solid #fff` frame
- Profile/testimonial: `2px solid #000` + shadow

### 5.3 Border Radius

- **Effectively zero** across the design system (`border-radius: 0` on cards)
- **Exception**: circular profile images (`border-radius: 50%`), hamburger menu bars (`2px`), mobile menu toggle only

### 5.4 Rotations & Transforms

- Scrolling banners: `rotate(-3deg)`, `rotate(2deg)`, `rotate(-5.5deg)`, `rotate(-6deg)`
- Team cards: `rotate(15deg)`
- Learn-lunch images: `rotate(-8deg)` / `rotate(8deg)`
- Photo collage: per-photo rotation (`-20deg` to `11deg`)

---

## 6. Component Patterns & CSS Classes

### 6.1 Navigation

| Class | Purpose |
|-------|---------|
| `.navbar` | Fixed top bar, white bg (home: `#D3EEFF` inline) |
| `.nav-container` | Flex row, max-width container |
| `.logo` | 50px height image |
| `.nav-menu` | Centered link list |
| `.nav-link` | Nunito 1rem, weight 500 |
| `.donate-btn` | White bg, black border, `3px 3px 0` shadow |
| `.desktop-donate` / `.mobile-donate` | Responsive donate placement |
| `.mobile-menu-toggle` | Hamburger (3 spans) |
| `.navbar.hide` | Scroll-away transform |
| `.navbar.visible-shadow` | Shadow on scroll |

### 6.2 Buttons & CTAs

| Class | Style |
|-------|-------|
| `.donate-btn` | White + black border + offset shadow |
| `.learn-lunch-cta` | White, Nunito 19px, `4px 4px` shadow |
| `.footer-cta-button` / `.donate-cta-button` | Sky blue `#0ea5e9`, white text, `4px 4px 0 #000` |
| `.mm-cta` | Yellow `--mm-yellow`, `4px 4px 0` shadow |
| `.mm-more` | White bg, `4px 4px` shadow |
| `.makerere-lunch-cta-btn` | Gold gradient, `4px 4px 0` shadow |
| `.campus-feature-button` | `#ffcc00`, `3px 3px #000` |
| `.carousel-btn` / `.mm-nav-btn` / `.mtm-nav-button` | White, black border, small offset shadow |
| `.stories-search-btn` | Black bg, white text |
| `.stories-filter-btn` | Color variants: `.white`, `.blue`, `.yellow`, `.mint`, `.dark` |
| `.amount-option` / `.frequency-btn` | Donate form toggles (teal selected) |

### 6.3 Cards

| Class | Purpose |
|-------|---------|
| `.card` / `.mission-card` / `.vision-card` | Mission/vision/model-work cards |
| `.mm-card` | Story carousel card (520px height) |
| `.mm-box` | White overlay box on story image |
| `.mm-tag` | Small colored accent rectangle on cards |
| `.team-member` + `.member-card` | Team layout |
| `.member-card-yellow` / `.member-card-cyan` | Color variants |
| `.campus-feature-card` / `.campus-mini-card` | Stories grid |
| `.footer-cta-card` / `.donate-cta-card` | Overlay CTA on photo banner |

### 6.4 Stats

| Class | Purpose |
|-------|---------|
| `.learn-lunch-stat` | Home page inline stats |
| `.learn-lunch-stat-number` | Anton 56px |
| `.learn-lunch-stat-label` | Nunito 18px |
| `.stats-showcase-section` | Impact page animated counters |
| `.stats-number-box` | Counter with `data-target` |
| `.stats-text-primary` / `.stats-text-secondary` | Impact headline split |

### 6.5 Testimonials

| Class | Purpose |
|-------|---------|
| `#app` | Testimonial section wrapper |
| `.mtm-testimonial-container` | Grid 1fr 2fr |
| `.mtm-hidden` | Hide inactive slide |
| `.mtm-profile-image` | 280px circle |
| `.mtm-quote` | Large uppercase quote |
| `.mtm-author` / `.mtm-affiliation` | Attribution |

### 6.6 Blog / Story Article (single post)

| Class | Purpose |
|-------|---------|
| `.exam-story-container` | Article wrapper |
| `.category-badge` | Tag pill |
| `.exam-story-title` | Article headline |
| `.exam-story-hero-image` | Featured image |
| `.blog-content` | Prose body |
| `.back-button` | Return to stories |

### 6.7 Footer

| Class | Purpose |
|-------|---------|
| `.footer-cta-section` | Photo banner + CTA card |
| `.footer-cta-bg` / `.footer-cta-overlay` | Background image + tint |
| `.footer-cta-qr` | 120px black square QR holder |
| `.footer-main` | Social + logo + copyright |
| `.footer-social-link` | 32px SVG icons, hover `#0ea5e9` |

### 6.8 Scrolling Banners

| Class | Purpose |
|-------|---------|
| `.scrolling-banner` | Black bg, white Montserrat text |
| `.scrolling-banner-2` | White bg, black text |
| `.team-banner-2` | Yellow gradient, rotated |
| `.banner-text` / `.banner-text-2` | Marquee span |
| `.slogan` / `.scroll-text` | Moments collage band |

---

## 7. Icons & Imagery

### 7.1 SVG Assets (repo root)

| File | Usage |
|------|-------|
| `pixelated-arrow.svg` | Forward/next CTAs |
| `pixelated-arrow-2.svg` | Back/previous |
| `pixelated-arrow-white.svg` | How-it-works flow (commented) |
| `pixelated-arrow-yellow.svg` | Donor flow (commented) |
| `heart-black.svg` | Donate button icon (14px inline) |
| `heart-white.svg` | Footer CTA donate |
| `heart-yellow.svg` | Donor flow CTA (commented) |
| `lnl-favicon.svg` | Favicon |
| `association-form.svg` | Coalition signup QR |
| `logo.png` | Brand logo |

**Icon style**: Simple pixelated/blocky arrows; heart icons for donate affordance. Inline sizing typically `14px`–`20px` via `style="width: …"`.

### 7.2 Social Icons

Inline SVG in footer (TikTok, Instagram, X, LinkedIn). `width="32" height="32"`, `fill="currentColor"`.

### 7.3 Image Treatment

- `object-fit: cover` on hero, cards, team photos
- Photos in collage: absolute positioning with rotation + hard shadow
- Hero carousel: framed with `aspect-ratio: 2/1.3`
- No rounded corners on rectangular photos (except testimonial avatars)

### 7.4 Decorative Elements

- Black squares (`.square`, `.card-decoration`, `.card-accent`)
- Dashed lines (`.dashed-line-horizontal`, `.dashed-line-vertical`)
- Yellow highlight blocks behind value titles (`.lnl-community-highlight*`)

---

## 8. Naming Conventions

### 8.1 Prefix Patterns

| Prefix | Domain |
|--------|--------|
| `lnl-` | Learn N' Lunch about page (hero, community, challenge) |
| `mm-` | "Moments/media" story carousel components |
| `mtm-` | "Moments that matter" testimonials |
| `st-` / `stories-` | Stories listing page |
| `campus-` | Campus lunch feature grid |
| `makerere-lunch-` | Featured story hero block |
| `learn-lunch-` | Home impact section |
| `footer-cta-` / `donate-cta-` | CTA banner sections |
| `stats-` | Impact page statistics |
| `impact-` | Impact page hero |
| `exam-story-` | Single blog post |
| `member-` / `team-` | Team section |
| `donation-` / `amount-` / `frequency-` | Donate form |

### 8.2 Modifier Patterns

- Color variants: `-yellow`, `-cyan`, `-white`, `-blue`, `-mint`, `-dark`
- State: `.active`, `.active-frequency`, `.selected`, `.mtm-hidden`, `.hide`
- Layout: `.main-card`, `.member-2`, `-2` suffix for alternate highlights
- BEM-like but **not strict BEM** — mix of element and block names

### 8.3 SCSS Organization

```
SCSS/
  globals/   _colors.scss, _typography.scss, _boilerplate.scss
  util/      _fonts.scss
  layout/    _hero.scss, _footer.scss, _stories-section.scss, …
  style.scss → dist/style.css
```

---

## 9. Motion & Interaction

| Pattern | Implementation |
|---------|----------------|
| Marquee scroll | CSS `@keyframes scroll` / `scrollText`, 6s–50s linear infinite |
| Carousel | JS opacity toggle (hero) or translateX (mm-carousel) |
| Nav hide on scroll | `.navbar.hide` transform |
| Hover | `scale(1.05)` on logo/photos; CTA color darken; arrow `translateX` |
| Stat counters | IntersectionObserver + animate (impact page, `app.js`) |
| Transitions | Typically `0.2s`–`0.3s ease` |

---

## 10. Page-Specific Section Map

| Page | Key section classes |
|------|---------------------|
| Home | `.hero`, `.scrolling-banner*`, `.learn-lunch-section`, `.mission-vision-section`, `.donate-cta-section`, `.moments-section`, `.bold-statement`, `.mm-section`, `#app` (testimonials), `.footer-cta-section` |
| About | `.lnl-hero-container`, `.bold-statement-2`, `.mission-vision-section`, `.lnl-community-section`, `.lnl-challenge-*`, `.team-section` |
| Impact | `.impact-hero-section`, `.stats-showcase-section` |
| Stories | `.stories-section`, `.st-hero-container`, `.campus-lunch-section`, `.mm-section` |
| Students (post) | `.exam-story-container`, `.blog-content` |
| Donate | `.donation-form-container` |

---

## 11. Rules for New Work

1. **Reuse existing classes** before creating new ones.
2. **Colors**: Only use values listed in §2. Tag accent colors map to: `#d3eeff` (blue), `#fdc039`/`#f6c33c` (yellow), `#7be4d3` (mint), `#ffd8a8` (peach), `#157DA6` (darker blue).
3. **Typography**: Anton for display, Nunito for body, Montserrat italic for marquees.
4. **Buttons**: White or colored fill + `1–2px solid #000` + offset `box-shadow` — never flat/material buttons.
5. **Spacing**: Align to container max-widths and padding scales in §4.
6. **Do not** introduce border-radius, soft shadows, or new font families without approval.
7. **Update this file** when a genuinely new approved pattern is added.

---

*Last extracted: July 2026 — from repository source at project kickoff for CMS integration.*
