## Test Cases for Story: Ad Placeholder on Import Processing Screen

**Story Reference:** [story_006_Ad_Placeholder_on_Import_Processing_Screen.md](../stories/story_006_Ad_Placeholder_on_Import_Processing_Screen.md)  
**Date:** 2026-02-26  
**Author:** QA Automation Engineer

---

### Test Case 1: Ad Placeholder is Visible During File Upload and Processing
**Objective:** Verify that the 300x250 ad placeholder element is rendered and visible on the import/processing screen when a file upload is in progress.

#### Steps
1. Navigate to the import screen.
2. Select a valid bank statement file (`SA3234_FY2025_20251221.xls`) but do not yet confirm.
3. Confirm the upload; observe the screen during processing.
4. Inspect the DOM for the ad placeholder element (`[data-testid="ad-placeholder"]` or `.ad-placeholder`).

#### Test Data
- `story_001_testdata/SA3234_FY2025_20251221.xls`

#### Expected Result
- An ad placeholder element is visible in the import/processing screen during file parsing.
- The element has the correct `data-testid` attribute (`ad-placeholder`) or equivalent selector.
- The placeholder is rendered in the DOM as soon as processing begins.
- The placeholder displays appropriate placeholder content (e.g., "Advertisement" label or branded placeholder image).

---

### Test Case 2: Ad Placeholder Dimensions Are 300x250 Pixels
**Objective:** Verify that the ad placeholder element meets the required 300x250 pixel dimensions (standard Medium Rectangle ad unit).

#### Steps
1. Navigate to the import screen.
2. Upload a valid bank statement to trigger the processing screen.
3. While the processing screen is active, open browser DevTools → Elements.
4. Inspect the computed dimensions of the ad placeholder element.

#### Test Data
- `story_001_testdata/SA3234_FY2025_20251221.xls`

#### Expected Result
- `element.getBoundingClientRect().width` = `300` (px).
- `element.getBoundingClientRect().height` = `250` (px).
- The element's CSS `min-width` and `min-height` prevent shrinking below 300x250.
- The placeholder does not overflow or break the page layout.

---

### Test Case 3: Ad Placeholder Does Not Block File Input or Upload Controls
**Objective:** Verify that the presence of the ad placeholder does not cover or disable the file upload input, action buttons, or any other interactive upload controls.

#### Steps
1. Navigate to the import screen.
2. Verify that the file input (`<input type="file">`) and upload button are clickable.
3. Confirm the ad placeholder is positioned such that it does not overlap the upload controls.
4. Complete a file upload cycle from start to finish.

#### Test Data
- `story_001_testdata/SA3234_FY2025_20251221.xls`

#### Expected Result
- The file input is fully clickable and opens the OS file picker.
- The upload/parse button is clickable and triggers parser execution.
- No interactive element (file input, button, progress bar) is obscured by the ad placeholder.
- UI z-index ordering keeps file upload controls above the ad placeholder.

---

### Test Case 4: Ad Placeholder Does Not Block Success or Error Messages
**Objective:** Verify that the ad placeholder element does not visually overlap or obscure success banners, error messages, or status notifications shown after upload completes.

#### Steps
1. Navigate to the import screen.
2. Upload a valid bank statement and allow parsing to complete.
3. Observe the success notification/banner position relative to the ad placeholder.
4. Upload an invalid/unsupported file and observe the error notification position.

#### Test Data
- `story_001_testdata/SA3234_FY2025_20251221.xls` (success case)
- A `.txt` file renamed to `.xls` (error case)

#### Expected Result
- Success message (e.g., "Parsing complete — 17 transactions found") is fully visible and not obscured.
- Error message (e.g., "Unsupported file format") is fully visible and not obscured.
- Screen layout adapts so status messages and the ad placeholder coexist without overlap.
- Users can dismiss or read all notifications without interacting with the ad placeholder.

---

### Test Case 5: Ad Placeholder is Visible During Progress Bar Display
**Objective:** Verify that the ad placeholder is co-visible with the parsing progress bar, providing an "engage the user" moment during processing wait time.

#### Steps
1. Navigate to the import screen.
2. Upload a bank statement that takes a measurable amount of time to process (large file preferred).
3. Observe the screen while the progress bar is active.

#### Test Data
- `story_001_testdata/SA3234_FY2025_20251221.xls`

#### Expected Result
- Both the progress bar and the ad placeholder are simultaneously visible on the screen.
- The progress bar (if present) is not hidden behind the ad placeholder.
- Page layout is stable — no element shifts or jumps while the progress bar updates.

---

### Test Case 6: Ad Placeholder Does Not Interfere with Keyboard Navigation
**Objective:** Verify that the ad placeholder does not trap keyboard focus or interfere with tab-order navigation for accessibility compliance.

#### Steps
1. Navigate to the import screen using keyboard only (Tab key).
2. Tab through all interactive elements on the page.
3. Note whether any Tab stop lands inside the ad placeholder.
4. Verify that pressing Tab after the last file-upload element moves to the next logical UI section.

#### Test Data
- (No file upload needed — keyboard navigation test)

#### Expected Result
- The ad placeholder does not receive keyboard focus.
- Tab order follows logical reading order: file input → upload button → result area.
- No "focus trap" occurs inside the ad placeholder region.
- Screen reader announces no unexpected or unlabeled interactive element from the placeholder.

---

### Test Case 7: Ad Placeholder Behavior After Processing Completes
**Objective:** Verify the defined behavior of the ad placeholder after import processing has completed — either it remains visible in a results context or is hidden.

#### Steps
1. Upload and fully parse a bank statement.
2. Wait for the success confirmation to appear.
3. Observe the state of the ad placeholder after processing is complete.

#### Test Data
- `story_001_testdata/SA3234_FY2025_20251221.xls`

#### Expected Result
- The ad placeholder behaves as per story acceptance criteria:
  - **If it should remain:** The placeholder is still visible in the post-import results view.
  - **If it should hide:** The placeholder is no longer visible and no empty white box remains.
- No CSS flickers or layout shift occurs during the transition.
- The placeholder state is consistent across multiple consecutive uploads.

---

### Test Case Summary

| TC | Description | Priority | Status |
|----|-------------|----------|--------|
| TC1 | Ad placeholder visible during processing | High | Not Executed |
| TC2 | Ad placeholder dimensions are 300x250 px | High | Not Executed |
| TC3 | Ad does not block upload controls | High | Not Executed |
| TC4 | Ad does not block success/error messages | High | Not Executed |
| TC5 | Ad visible during progress bar display | Medium | Not Executed |
| TC6 | Ad does not interfere with keyboard nav | Medium | Not Executed |
| TC7 | Ad behavior after processing completes | Medium | Not Executed |
