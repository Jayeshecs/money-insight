# DEF-006-002 — Dead Code Variable `invalidFile` in TC4

| Field         | Value |
|---------------|-------|
| **ID**        | DEF-006-002 |
| **Story**     | Story #006 — Ad Placeholder on Import/Processing Screen |
| **Severity**  | Low |
| **Status**    | Open |
| **Reported**  | 2026-03-01 |
| **Test File** | `tests/e2e/tests/story_006.spec.ts` |
| **Test**      | TC4 — Ad placeholder does not obscure success or error messages |

---

## Description

In TC4, a `File` object named `invalidFile` is constructed but **never used**. The variable occupies a line and can mislead maintainers into thinking it is passed to the `setInputFiles` call that follows.

---

## Code Location

`tests/e2e/tests/story_006.spec.ts`, inside the TC4 test body:

```typescript
// Error case: upload an invalid file
await page.goto('/import');
const invalidFile = new File(['not-valid-content'], 'test.txt', { type: 'text/plain' });  // ← NEVER USED

// Use a data transfer to simulate an invalid file  
await page.locator('input[type="file"]').setInputFiles({
  name: 'invalid.txt',
  mimeType: 'text/plain',
  buffer: Buffer.from('not valid content')
});
```

The `invalidFile` variable is declared on one line and then `setInputFiles` is called with a separate inline object. The `File` constructor call is dead code.

---

## Steps to Reproduce

1. Open `tests/e2e/tests/story_006.spec.ts`.
2. Search for `const invalidFile = new File`.
3. Observe that `invalidFile` is never referenced again in the test.

---

## Expected Result

No unused variables; every declared variable is referenced at least once.

---

## Actual Result

`invalidFile` is declared but never consumed, producing dead code. TypeScript / ESLint would surface a `no-unused-vars` warning if strict linting were applied to the E2E test files.

---

## Root Cause

During development of TC4, an early draft used the Web `File` API to create an in-memory file object, then the implementation was switched to Playwright's `setInputFiles` with an inline descriptor object. The `invalidFile` declaration was not cleaned up.

---

## Suggested Fix

Remove the dead `invalidFile` line:

```typescript
// Before (line with dead code)
const invalidFile = new File(['not-valid-content'], 'test.txt', { type: 'text/plain' });

// After — simply delete that line; the setInputFiles call below is correct
await page.locator('input[type="file"]').setInputFiles({
  name: 'invalid.txt',
  mimeType: 'text/plain',
  buffer: Buffer.from('not valid content')
});
```

---

## Files to Change

- `tests/e2e/tests/story_006.spec.ts` — remove the `const invalidFile = ...` line in TC4.
