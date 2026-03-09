# PWA Icons

Place the following icon files in this directory:

| File | Size | Purpose |
|---|---|---|
| `icon-192x192.png` | 192 × 192 px | Android launcher icon / PWA install prompt |
| `icon-512x512.png` | 512 × 512 px | Splash screen / Lighthouse PWA audit |

## Design Guidelines
- Background colour: `#1976d2` (Trust Blue)
- Foreground: white "₹" or MoneyInsight logo mark
- Transparent or solid background acceptable

## Generating Placeholder Icons (Sprint 3)
Placeholder PNG files (`icon-192x192.png`, `icon-512x512.png`) are generated automatically
by the `generate-icons.js` script at `src/client/scripts/generate-icons.js`.

Run from `src/client/`:
```sh
node scripts/generate-icons.js
```

Requires Node.js only — no extra dependencies.

## Production
Replace placeholders with final brand assets before Lighthouse audit / production deployment.
