# Moments gallery → smiles stroke + 30% bg

**Date:** 2026-09-26  
**Repo:** nutrisafe-website  
**Branch:** `cursor/nav-hero-3269`  
**Commit:** `4d119d6` — Match Moments gallery to smiles stroke and 30% bg  
**Production:** https://nutrisafecommunities.org/about/#gallery  
**Deploy:** `dpl_6LNdgLs5MzGZjtf6RSQKcmJ4mEoR` (Ready)

## Changes (`src/styles/pages/about.css`)

1. **Stroke** — `.about-gallery__shot::after` mirrors `.smiles__shot-tilt::after`:
   - `border: 5px solid #ffffff`
   - `border-radius: 30px`
   - `inset: 0`, `pointer-events: none`, `z-index: 1`, `box-sizing: border-box`
   - `isolation: isolate` on the shot

2. **Background 30%** — `.about-gallery__bg { opacity: 0.3 }`
   - Removed full-opacity CSS `background-image` on `.about-gallery` (would defeat 30%)
   - Solid `#006cac` (hero-bg blue) under the pattern so white titles stay readable

## Verify

Live CSS bundle `about-BkUuN0JG.css` contains:
- `.about-gallery{…background-color:#006cac…}`
- `.about-gallery__bg{…opacity:.3…}`
- `.about-gallery__shot:after{…border:5px solid #fff…}`

## Notes path blocker

Assigned store `/cursor/stores/bc-f71d2ab3-2a3e-4777-91e5-e6a5d505ab94/internal/` is not mounted on this worker (`/cursor` read-only / missing). This file is a local artifact copy for the coordinator.
