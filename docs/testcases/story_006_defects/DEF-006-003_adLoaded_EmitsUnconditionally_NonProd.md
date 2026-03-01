# DEF-006-003 — `adLoaded` Event Emits Unconditionally in Non-Production Environments

| Field         | Value |
|---------------|-------|
| **ID**        | DEF-006-003 |
| **Story**     | Story #006 — Ad Placeholder on Import/Processing Screen |
| **Severity**  | Medium |
| **Status**    | Open |
| **Reported**  | 2026-03-01 |
| **Component** | `src/client/src/app/shared/components/ad-placeholder/ad-placeholder.component.ts` |
| **Method**    | `pushAd()` |

---

## Description

The `adLoaded` `EventEmitter` is fired inside `pushAd()` immediately after calling `adsbygoogle.push({})`, regardless of whether an actual Google AdSense slot was filled. In development (and in all test environments), the AdSense SDK is never loaded, yet `adLoaded` still emits on every component initialization.

This means any consumer of `(adLoaded)` — such as analytics integrations or unit tests — receives a **false positive signal** that an advertisement was successfully served when no ad was actually shown.

---

## Code Location

`src/client/src/app/shared/components/ad-placeholder/ad-placeholder.component.ts`, `pushAd()` method:

```typescript
private pushAd(): void {
  const container = document.getElementById(this.adContainerId);
  if (!container) { return; }

  const dims = this.dimensions;
  const ins = document.createElement('ins');
  // ...
  container.appendChild(ins);

  try {
    ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    this.adLoaded.emit();   // ← emitted even when adsbygoogle is just an Array
  } catch {
    // AdSense not available (dev environment) — placeholder remains visible
  }
}
```

**The flaw:** When the real AdSense SDK is absent, `window.adsbygoogle` is `undefined`. The expression:

```typescript
(window as any).adsbygoogle = (window as any).adsbygoogle || []
```

initialises it to a plain `Array`. Calling `.push({})` on a plain array **never throws**. Therefore the `catch` block is never reached, and `this.adLoaded.emit()` is always called — including in dev, ci, and unit-test environments.

---

## Steps to Reproduce

1. Open `src/client/src/app/shared/components/ad-placeholder/ad-placeholder.component.spec.ts`.
2. Add a spy on `adLoaded` in the `beforeEach` / `createComponent` helper.
3. After `fixture.detectChanges()`, observe that `adLoaded` has already been emitted once (during `ngOnInit → initAdSense → pushAd`).

OR, in a running app (dev mode):

1. Open the import page.
2. Upload any valid file.
3. Check browser `console` or add a `tap` on `adLoaded`: it fires for every processing screen render, even though no ad is visible.

---

## Expected Result

`adLoaded` should only emit when the AdSense SDK confirms the slot is **filled** (i.e. a real ad impression occurred). In non-production environments where the SDK is absent, `adLoaded` should either:
- **Not emit** (preferred — truthful about ad fill status), OR
- Emit with a clear "dev-mode placeholder" flag so consumers can differentiate.

---

## Actual Result

`adLoaded` emits on **every call** to `pushAd()` in every environment, including unit tests and local development, making it a noisy signal that cannot be used for reliable ad-impression analytics or fill-rate tracking.

---

## Root Cause

The try/catch is intended to guard against the AdSense SDK not being present. However, the guard condition is wrong: initialising `adsbygoogle` to `[]` and calling `Array.push` does not throw, so the catch is dead code in dev/test. The `adLoaded.emit()` call was placed inside the try block **after** the push, under the (incorrect) assumption that the push would throw when the SDK is absent.

---

## Impact

- **Analytics hooks** (future `AdAnalyticsService`) would record phantom impressions.
- **Unit tests** may receive unexpected `adLoaded` events during component creation (`ngOnInit`), potentially causing false assertion failures if tests subscribe to `adLoaded` before `createComponent()`.
- The `import.component.ts` handler `onProcessingAdLoaded()` (currently a no-op) would fire on every processing screen in dev, inflating future impression counters.

---

## Suggested Fix

Guard the emit behind a real SDK-presence check:

```typescript
private pushAd(): void {
  const container = document.getElementById(this.adContainerId);
  if (!container) { return; }

  const dims = this.dimensions;
  const ins = document.createElement('ins');
  ins.className = 'adsbygoogle';
  ins.style.display = 'inline-block';
  ins.style.width = dims.width;
  ins.style.height = dims.height;
  container.appendChild(ins);

  // Only proceed if the real AdSense SDK has loaded
  const adsbygoogle = (window as any).adsbygoogle;
  if (!adsbygoogle || typeof adsbygoogle.loaded === 'undefined') {
    // SDK not present — dev/test placeholder remains; do NOT emit adLoaded
    return;
  }

  try {
    adsbygoogle.push({});
    // adLoaded will be emitted once AdSense confirms fill via the SDK callback
    // For now emit here as a best-effort signal
    this.adLoaded.emit();
  } catch {
    // SDK present but push failed — do not emit adLoaded
  }
}
```

Alternatively, emit `adLoaded` only when the `ins` element's `data-ad-status` attribute is set to `"filled"` by the AdSense SDK (observe the attribute mutation via `MutationObserver`).

---

## Files to Change

- `src/client/src/app/shared/components/ad-placeholder/ad-placeholder.component.ts` — update `pushAd()` to guard `adLoaded.emit()` behind real SDK detection.
- `src/client/src/app/shared/components/ad-placeholder/ad-placeholder.component.spec.ts` — add a test that verifies `adLoaded` is **not** emitted when the AdSense SDK is absent (dev environment).
