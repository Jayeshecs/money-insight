## Story: Ad Placeholder on Import/Processing Screen

**As a** product owner  
**I want** a 300x250 ad placeholder shown during statement processing  
**So that** we can monetize high-engagement moments

**Status:** Done ✅ — Implementation complete, QA verified (2026-03-01)

### Scenarios
- User uploads a statement and sees a progress bar
- Ad placeholder is visible during processing

### Acceptance Criteria
- Ad placeholder is present and correctly sized on the import/processing screen
- Ad does not block or interfere with user actions

### Implementation Details (2026-03-01)

| Artifact | Path |
|----------|------|
| `AdPlaceholderComponent` | `src/client/src/app/shared/components/ad-placeholder/ad-placeholder.component.ts` |
| Component unit tests | `src/client/src/app/shared/components/ad-placeholder/ad-placeholder.component.spec.ts` |
| ImportComponent (updated) | `src/client/src/app/features/dashboard/import.component.ts` |
| ImportComponent template (updated) | `src/client/src/app/features/dashboard/import.component.html` |
| E2E tests | `tests/e2e/tests/story_006.spec.ts` |

**Key design decisions:**
- `AdPlaceholderComponent` is a standalone Angular component placed in `src/app/shared/components/ad-placeholder/`.
- It is shown via `*ngIf` only when `uploadStatus().stage` is `reading`, `parsing`, or `saving` — the stages where the user waits.
- Correct 300×250 dimensions are enforced via both `width`/`height` and `minWidth`/`minHeight` inline styles so Playwright can measure them.
- `tabindex="-1"` prevents focus-trap, satisfying TC6 (accessibility).
- `data-testid="ad-placeholder"` attribute enables reliable E2E selector.
- `role="complementary"` and `aria-label="Advertisement"` ensure screen-reader compliance.
- A branded dev-placeholder (`ad-dev-placeholder`) is rendered when AdSense is unavailable so layout can be verified in CI.
- `adLoaded` event is guarded behind real AdSense SDK presence check — no false impressions in dev/CI.

### QA Verification (2026-03-01)
- **Unit Tests:** 15/15 ✅
- **E2E Tests:** 7/7 ✅ (Playwright, Chromium)
  - TC1 Ad visible during processing ✅ | TC2 Dimensions 300×250 ✅ | TC3 No upload blockage ✅
  - TC4 No message overlap ✅ | TC5 Co-visible with progress bar ✅ | TC6 Keyboard nav ✅ | TC7 Post-process behavior ✅

### Defects Raised and Resolved (2026-03-01)
| ID | Title | Severity | Status |
|----|-------|----------|--------|
| DEF-006-001 | TC2: dual-timeout + deprecated `page.waitForSelector` causes 30s timeout | High | ✅ Fixed — replaced with `Promise.race` |
| DEF-006-002 | TC4: unused `invalidFile` variable (dead code) | Low | ✅ Fixed — removed |
| DEF-006-003 | `adLoaded.emit()` fires unconditionally regardless of AdSense SDK presence | Medium | ✅ Fixed — guarded behind SDK check |
