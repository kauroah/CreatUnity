# CREATUNITY official logo — update

The supplied official CREATUnity wordmark replaces the old text-based logo in the shared header and footer.

- `public/brand/creatunity-logo.png` — transparent background asset, used in the header and footer.
- `src/components/chrome.tsx` — shared Logo component updated.
- `src/app/globals.css` — responsive widths, 200 ms interaction, white logo on black footer.
- `src/app/icon.png` — app favicon based on the official wordmark.
- `src/app/layout.tsx` — social preview metadata points to the official logo.

To install: use this cumulative package or copy the changed files into the current Phase 6 site. Retain your local `.env.local`; no database migration is needed.

To verify: run `npm install` then `npm run dev`; inspect header, footer and mobile view. For a stale favicon, hard-refresh/clear the favicon cache.

The logo has been made transparent from the supplied off-white-backed PNG; this is a derived asset, not a vector trace.
