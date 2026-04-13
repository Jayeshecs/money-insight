# Functional Specification Document (FSD) – MoneyInsight v2.0

**Version:** 2.0  
**Date:** 2026-04-13  
**Status:** Draft  
**Supersedes:** `fsd_1.0.md`

---

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | — | Initial specification (WASM engine, IndexedDB, Google Sheets sync, basic dashboard) |
| 2.0 | 2026-04-13 | Dashboard redesign: Bootstrap 5.3 layout, Blue header, Granularity slicer, Cashflow summary bar, 4 analytical tree-table widgets, embedded Transactions Panel, ad placement update, Ad visibility setting |

---

## 1. Overview

MoneyInsight is a privacy-first, serverless personal finance platform. It enables users to upload bank statements, auto-categorize transactions using a Rust WASM engine, and visualize their financial health—all while keeping data in their own Google Drive (Google Sheets). The platform is built with:

- **Frontend:** Angular 21 SPA (Bootstrap 5.3 for layout, Material Icons for iconography)
- **Engine:** Rust compiled to WebAssembly (WASM) for all parsing and ML logic
- **Data Persistence:** Google Sheets (user-owned) as primary storage; IndexedDB as offline-first browser cache
- **Privacy:** All processing (parsing, categorization) occurs in-browser; no raw data is sent to any server

---

## 2. Core Modules & Functional Requirements

### 2.1 Ingestion & Intelligence Layer (WASM Engine)

- **File Input:** Users can upload Excel (.xlsx/.xls) or CSV files exported from supported banks (e.g., HDFC Savings, HDFC Credit Card, SBI Savings).
- **Password Handling:** If a statement is password-protected or encrypted, show a clear error message to the user. Encrypted/password-protected statements are not supported.
- **Plugin Architecture:** The Rust WASM engine uses a `Parser` trait. Each bank/format is a plugin implementing:
  - `identify(&self, data: &str) -> bool`
  - `parse(&self, data: &str) -> Vec<Transaction>`
- **Auto-Detection:** On upload, the engine iterates through registered plugins to auto-detect the correct parser based on file headers or unique patterns.
- **AI Categorization:** Transactions are categorized using an ML model integrated into the WASM engine. Confidence levels (High/Medium/Low) are surfaced in the UI via colour-coded indicators.
- **User Feedback Loop:** When users correct a category, the mapping is saved to the "Rules" tab in Google Sheets and triggers incremental model training (`model.partial_fit()`).

### 2.2 Data Management & Caching

- **IndexedDB First:** Parsed data is written to IndexedDB immediately for offline-first access and instant UI updates.
- **Google Sheets Sync:** A background Angular service syncs IndexedDB changes to the user's Google Sheets spreadsheet:
  - **Transactions Tab:** All parsed and categorized transactions
  - **Rules Tab:** User-defined categorization rules (corrections)
  - **Dashboard_Data Tab:** Aggregated data for historical reference
- **State Management:** Angular `signal()`-based reactive state (`DashboardStateService`) propagates period, account filter, and widget selection changes across all dashboard sections in real time.

### 2.3 Visualization Dashboard (v2.0 — see §4 for full specification)

The Dashboard is the primary screen providing a financial health overview. v2.0 replaces the v1.0 chart-based layout with a structured, four-section full-width layout:

| Section | Name | Description |
|---------|------|-------------|
| Header | App Header | Blue topbar with app name, navigation, and user info |
| Section 1 | Granularity Bar | Time-period slicer with granularity selector and dual-handle range slider |
| Section 2 | Overall Summary Bar | Horizontal cashflow totals (Income, Expense, Investment, Transfer) + Account filter |
| Ad Slot A | Summary → Widgets Banner | 728×90 AdSense banner (desktop only) |
| Section 3 | Analytical Widgets Grid | Four tree-table widgets in a Bootstrap responsive grid |
| Ad Slot B | Widgets → Transactions Banner | 728×90 AdSense banner (desktop only) |
| Section 4 | Transactions Panel | Embedded drilldown panel showing individual transactions |

**Responsive Design:** Bootstrap 5.3 grid system governs all layout. The dashboard is fully responsive across mobile (< 576 px), tablet (576–991 px), and desktop (≥ 992 px) breakpoints.

**Data Source:** All dashboard data is aggregated from `Transaction[]` stored in IndexedDB. No server round-trip is required to render the Dashboard.

### 2.4 Transaction Review

- **Editable Table (Desktop/Tablet):** Full transaction table with inline category dropdowns, confidence indicators, and bulk selection for "Sync & Train".
- **Card View (Mobile):** Each transaction is rendered as a card with a tap-to-change category dropdown and a "Confirm" action.
- **ML Loop UI:**
  - Confidence indicators: Green dot (> 90% confidence), Yellow dot (medium), Red dot (AI uncertain)
  - Default filter: show "Needs Review" (red/yellow) items first
  - "Sync & Train" action: Floating Action Button on mobile, header button on desktop

### 2.5 Settings

- **Ad Preferences:** A toggle in the Settings screen controls visibility of all ad placeholders (`mi_show_ads` key in `localStorage`, default `false`). When disabled, ad containers are removed from the DOM entirely (no blank space reserved).
- **Theme:** "Trust Blue" or Dark Mode (user preference, persisted in `localStorage`).
- **Coming Soon:** Additional preference panels planned for future sprints.

---

## 3. Monetization & Ad Placement

All ad placements are implemented as `AdPlaceholderComponent` instances that render AdSense units in production or a labelled grey placeholder in non-production environments. All ad containers respect the global "Show ad placeholders" preference (§2.5).

### 3.1 Ad Placement Registry

| Slot ID | Screen | Location | Format | Desktop | Mobile |
|---------|--------|----------|--------|---------|--------|
| `import-processing` | Import / Processing | Below progress bar | 300×250 Medium Rectangle | ✓ | ✓ |
| `dashboard-summary-banner` | Dashboard | Between Section 2 and Section 3 | 728×90 Leaderboard | ✓ | ✗ |
| `dashboard-widgets-banner` | Dashboard | Between Section 3 and Section 4 | 728×90 Leaderboard | ✓ | ✗ |
| `mobile-sticky-footer` | All screens | Fixed bottom of viewport | 320×50 Mobile Banner | ✗ | ✓ |
| `transactions-infeed` | Transaction Review | After every 20th row (desktop) or card (mobile) | Native In-Feed | ✓ | ✓ |

> **Retired slots (v1.0 → v2.0 migration):** `sidebar-skyscraper` (160×600) and `dashboard-banner` (728×90, v1 position between pie chart and recent transactions) are removed. The Dashboard no longer has a sidebar.

### 3.2 AdSense Compliance

- Ad containers reserve their exact dimensions via inline CSS before AdSense loads (Cumulative Layout Shift = 0).
- Ads are placed at high-engagement "decision moments": during import processing (captive user), between cashflow summary and category drill-down, and between category drill-down and individual transactions.
- In-feed ads in the Transactions Review screen appear as native cards indistinguishable in styling from transaction cards (except the `[AD]` label).
- Mobile sticky footer is present on the `AppComponent` level to persist across all screens.

---

## 4. Dashboard v2.0 — Detailed Specification

### 4.1 App Header

**Purpose:** Global navigation and user identity.

**Layout:** Full-width blue bar (`#1565C0` or Bootstrap `bg-primary`) pinned to the top of the viewport.

| Element | Desktop (≥ 992 px) | Mobile (< 992 px) |
|---------|-------------------|--------------------|
| Left side | App title "MoneyInsight" (white, bold) with logo icon | Same |
| Right side — nav links | Dashboard, Transactions, Import, Settings (inline links, white text) | Collapsed into hamburger menu (≡) |
| Right side — user info | `account_circle` Material Icon + user display name + Google Drive status chip | `account_circle` icon only; tap opens a dropdown with name, Drive status, and sign-out |
| Hamburger state | Hidden (nav links always visible) | Tapping ≡ toggles a full-width dropdown below the header listing nav items |

**Material Icons used:** `account_circle`, `menu` (hamburger), `close` (dismiss).

### 4.2 Section 1 — Granularity Bar (Time-Series Slicer)

**Purpose:** Control the time period and granularity applied to all downstream sections.

**Layout:** Full-width card/panel below the header. Single row on desktop; two rows on mobile.

| Element | Data-testid | Type | Behaviour |
|---------|-------------|------|-----------|
| Granularity selector | `granularity-select` | `<select>` | Options: `yearly`, `quarterly`, `monthly`; default `monthly` |
| Period start input | `period-start` | Date text input | ISO string `YYYY-MM` (or `YYYY` / `YYYY-Q#` per granularity); synced with left slider handle |
| Range slider | `period-range-slider` | noUiSlider dual-handle | Visual drag; left = start, right = end; step = one granularity unit |
| Period end input | `period-end` | Date text input | ISO string; synced with right slider handle |
| Apply button | `apply-period-btn` | Primary button | Triggers data refresh for Sections 2, 3, and 4; only action that causes refresh |

**Rules:**
- Changing the granularity resets both handles to the full available data range (earliest → latest transaction date), snapped to the nearest valid boundary for the new granularity.
- Moving a slider handle updates the corresponding date input in real time; editing an input moves the corresponding handle.
- The left handle cannot exceed the right handle; date inputs enforce the same constraint.
- Dashboard sections do **not** refresh when the user drags the slider or edits dates — only when Apply is clicked.

**Responsive (< 768 px):**
- Row 1: `[Granularity ▼]`
- Row 2: `[Start input]` `[══Slider══]` `[End input]` `[Apply]`
- Date inputs open the native browser date picker on tap.

**Material Icons used:** None required (slider handles are CSS styled).

### 4.3 Section 2 — Overall Summary Bar (Cashflow Summary)

**Purpose:** Show aggregated financial totals for the selected period at a glance, and provide an account-level filter.

**Layout:** Horizontal flex bar, full-width. Each total is a "stat chip" with icon, label, and INR amount.

| Chip | Data-testid | Icon (Material) | Colour | Value |
|------|-------------|-----------------|--------|-------|
| Income | `overall-income` | `trending_up` | Green (`#2E7D32`) | Sum of all INCOME transactions |
| Expense | `overall-expense` | `trending_down` | Red (`#C62828`) | Sum of all EXPENSE transactions |
| Investment | `overall-investment` | `savings` | Blue (`#1565C0`) | Sum of all INVESTMENT transactions |
| Transfer | `overall-transfer` | `swap_horiz` | Grey (`#616161`) | Sum of all TRANSFER transactions |
| Account/Source filter | `account-source-filter` | `filter_list` | Default | Multiselect dropdown; badge = count of selected accounts |

**Amount Format:** INR with Indian thousands separator — `₹X,XX,XXX.XX` (using `en-IN` locale).

**Rules:**
- Totals update immediately when Apply is pressed (Section 1) or when the Account/Source filter changes (no Apply required for account filter).
- Account/Source filter defaults to "All" (all accounts selected); badge shows total account count.
- Deselecting an account immediately re-aggregates Sections 2, 3, and 4.
- Empty state (`dashboard-empty-state`) is shown when the selected period contains zero transactions.

**Responsive (< 768 px):**
- Row 1: Income + Expense (two equal columns)
- Row 2: Investment + Transfer (two equal columns)
- Row 3: Account/Source multiselect (full width)

### 4.4 Ad Slot A — Summary → Widgets Banner

**Data-testid:** `ad-placeholder` with `data-placement="dashboard-summary-banner"`

- Format: 728×90 Leaderboard
- Positioned between Section 2 (`</app-overall-summary-bar>`) and the widgets grid container
- Visible only at viewport ≥ 768 px (`display: none` at < 768 px)
- Container has `min-height: 90px; width: 728px` to prevent CLS
- Has `role="complementary"` and `tabindex="-1"`
- Contextual intent: user has just reviewed total cashflow figures → financial product ads (credit cards, mutual funds) have peak relevance

### 4.5 Section 3 — Analytical Widgets Grid

**Purpose:** Show category-level financial aggregations for each transaction type, with expandable sub-categories and drill-down capability.

#### 4.5.1 Grid Layout

The four widgets are arranged using the Bootstrap 5.3 grid:

```html
<div class="row g-3">
  <div class="col-sm-6 col-xl-3"><!-- Expenses widget --></div>
  <div class="col-sm-6 col-xl-3"><!-- Investment widget --></div>
  <div class="col-sm-6 col-xl-3"><!-- Income widget --></div>
  <div class="col-sm-6 col-xl-3"><!-- Transfer widget --></div>
</div>
```

| Viewport | Columns per row | Breakpoint |
|----------|-----------------|------------|
| < 576 px (xs) | 1 (stacked, full-width) | Default (col) |
| 576–991 px (sm/md) | 2 | col-sm-6 |
| ≥ 1200 px (xl) | 4 | col-xl-3 |

Widget order: Expenses, Investment, Income, Transfer (left to right on desktop; top to bottom on mobile).

#### 4.5.2 Widget Anatomy

Each of the four `AnalyticalWidgetComponent` instances contains:

| Element | Data-testid | Description |
|---------|-------------|-------------|
| Widget title | — | Material icon + label (e.g., `trending_down` + "Expenses") |
| Auto toggle | `widget-auto-toggle` | Switch; `aria-checked="false"` by default; mutually exclusive across widgets |
| Tree table rows (Level 1) | `widget-row-category` | Category name + chevron (`chevron_right`) + aggregated total; bold |
| Tree table rows (Level 2) | `widget-row-subcategory` | Indented sub-category name + sub-category total; hidden (collapsed) by default |
| Empty state | `widget-empty-state` | Shown when no transactions of this type exist in the selected period |

**Widget Material Icons:**

| Widget | Icon | Label |
|--------|------|-------|
| Expenses | `trending_down` | Expenses |
| Investment | `savings` | Investment |
| Income | `trending_up` | Income |
| Transfer | `swap_horiz` | Transfer |

#### 4.5.3 Tree Table Rules

- **Sorting:** Category rows sorted by total amount descending; sub-category rows sorted within their parent category by amount descending.
- **Expand/Collapse:** Clicking a Level 1 row toggles its sub-category rows; the chevron rotates 90° when expanded.
- **Row Selection:** Clicking any row marks it as selected (`aria-selected="true"`); only one row across all four widgets can be selected simultaneously.
- **Auto toggle:** Only one widget's Auto toggle can be ON at a time (enabling one disables the others). When a widget's Auto toggle is ON, selecting a row in that widget immediately refreshes the Transactions Panel (Section 4). When OFF, selection is tracked visually but does not trigger a panel refresh.
- **Amount format:** `₹X,XX,XXX.XX` (en-IN locale) for all widget amounts.

### 4.6 Ad Slot B — Widgets → Transactions Banner

**Data-testid:** `ad-placeholder` with `data-placement="dashboard-widgets-banner"`

- Format: 728×90 Leaderboard
- Positioned between the widgets grid closing tag and `<app-transactions-panel>`
- Visible only at viewport ≥ 768 px
- Container has `min-height: 90px; width: 728px; display: flex; justify-content: center`
- Has `role="complementary"` and `tabindex="-1"`
- Contextual intent: user has selected a spending category → category-contextual ads (e.g., dining credit cards for "Food" selection) have peak relevance

### 4.7 Section 4 — Transactions Panel (Drilldown)

**Purpose:** Display the individual transactions that make up the current widget selection (or all transactions when no selection is active).

#### 4.7.1 Panel Header

| Element | Data-testid | Default | When category selected | When sub-category selected |
|---------|-------------|---------|----------------------|--------------------------|
| Panel title | `transactions-panel-title` | "All Transactions" | `<Type> Transactions — <Category>` | `<Type> Transactions — <Category> / <Sub-category>` |
| Record count | `transactions-record-count` | `Records: X / Y` | Same format | Same format |
| Search button | `transactions-search-btn` | `search` Material icon, visible | Same | Same |

**Record count:** X = current filtered row count (after widget selection + search); Y = total transactions for the active period + account filter.

#### 4.7.2 Search

- `transactions-search-btn` (search icon) clicked → `transactions-search-input` appears inline, focused.
- Typing in `transactions-search-input` filters rows in real time by case-insensitive substring match across: Narration, Category, Sub-category, Account/Source, Date (formatted as displayed), Amount (as displayed string).
- Pressing Escape (or clicking the search button again) collapses the input and resets the filter.
- `transactions-record-count` X-value updates in real time as the user types.

#### 4.7.3 Desktop/Tablet Table (≥ 768 px)

**Data-testid:** `transactions-table`

| Column | Notes |
|--------|-------|
| Account/Source | Text |
| Category | Text |
| Sub-category | Text |
| Date | `YYYY-MM-DD` |
| Amount | Colour-coded: green (INCOME), red (EXPENSE), blue (INVESTMENT), grey (TRANSFER) |
| Narration | Truncated with ellipsis; full text in `title` tooltip |

- Default sort: Date descending.
- Click column header to sort.

#### 4.7.4 Mobile Cards (< 768 px)

**Data-testid:** `transaction-card` (hidden `transactions-table`)

Each card shows:
- **Date** (bold, top left)
- **Amount** (bold, colour-coded, top right)
- **Category / Sub-category** (secondary line)
- **Account/Source** (secondary line)
- **Narration** excerpt (max 2 lines, truncated)

On mobile, a `<select>` dropdown labeled "Order by" allows the user to choose the sort column.

#### 4.7.5 Pagination

- 20 rows (or cards) per page.
- `transactions-pagination-prev` disabled on page 1; `transactions-pagination-next` disabled on last page.
- Changing widget selection or period resets to page 1.
- Search text and widget selection persist across page navigation.
- Empty state (`transactions-panel-empty-state`) shown when zero results.

---

## 5. User Flow (Updated)

1. **Onboarding:** User logs in with Google OAuth; app creates a dedicated Google Sheets spreadsheet.
2. **Import:** User uploads a statement file (Excel or CSV, not password-protected). Bank is auto-detected; progress bar and ad are shown during WASM processing.
3. **Review:** User reviews AI-categorized transactions; confidence indicators surface low-confidence items first; user corrects categories inline.
4. **Sync & Train:** User clicks "Sync & Train"; changes are saved to Google Sheets; the WASM model retrains incrementally; toast message confirms.
5. **Dashboard:** User views the v2.0 Dashboard:
   a. Sets time period and granularity in the Granularity Bar; clicks **Apply**.
   b. Reviews cashflow totals in the Summary Bar; optionally filters by Account/Source.
   c. Inspects category-level aggregations in the four widgets; expands sub-categories.
   d. Enables **Auto** on a widget; clicks a category row → Transactions Panel updates.
   e. Activates inline search to find specific transactions.

---

## 6. Error Handling & Edge Cases

- **Unsupported Format:** If no parser plugin matches, show a "Report Broken Format" option in the Import screen.
- **Encrypted File:** Show error: "This statement appears to be password-protected. Please decrypt the file before uploading."
- **Sync Failures:** Queue changes for retry and notify the user with a dismissible error banner.
- **Empty Dashboard:** If IndexedDB contains no transactions, show a full-page empty state with a CTA to import a statement.
- **Widget Empty State:** Each widget independently shows "No data for selected period" when its transaction type has no data in the selected period.
- **Slider Constraint:** The left handle of the range slider cannot exceed the right handle; inputs enforce the same constraint.

---

## 7. Privacy & Security

- **Client-Side Processing:** All parsing and ML inference happen in-browser via the Rust WASM engine; no raw transaction data is transmitted to any server.
- **Google Sheets Storage:** Only the user's own Google Drive is used for persistent storage; the app requests only the `drive.file` OAuth scope.
- **IndexedDB:** Stored only in the user's own browser; cleared when the user signs out.
- **Ad Networks:** Ad placeholder iframes load only when the user has opted in (§2.5 Ad Preferences setting). AdSense scripts do not receive any transaction data.

---

## 8. Technical Constraints

- **Supported Formats:** Only Excel (.xlsx/.xls) and CSV. No PDF support.
- **Browser Support:** Modern evergreen browsers (Chrome 110+, Firefox 115+, Safari 16+, Edge 110+).
- **Styling Framework:** Bootstrap 5.3 for all layout and responsive grid.
- **Icon Library:** Google Material Icons (Material Symbols, icon font or SVG sprite).
- **Extensibility:** New bank formats can be added as Rust plugins implementing the `Parser` trait.
- **Performance:** IndexedDB caching ensures offline access and <1 s dashboard render time from cached data.
- **Accessibility:** WCAG 2.1 AA compliance; all interactive elements keyboard and screen-reader accessible; `aria-label`, `role`, and `data-testid` attributes on all interactive elements.

---

## 8. UX & Accessibility

Refer to `ux_design_2.0.md` for complete wireframes, component specifications, interaction flows, and ad placement diagrams. Key highlights:

### 8.1 Navigation & Layout

- **Header:** Blue Bootstrap navbar pinned top; inline nav links on desktop, hamburger dropdown on mobile.
- **No Sidebar:** The v2.0 Dashboard is a full-width single-column layout. The sidebar from v1.0 is removed.
- **Responsive Breakpoints:**
  - `< 576 px` (xs): Single-column stack; all widgets full-width; cards for transactions.
  - `576–991 px` (sm/md): 2-column widget grid; table for transactions.
  - `≥ 1200 px` (xl): 4-column widget grid; full transaction table.

### 8.2 Theme & Colour

| Usage | Colour | Hex |
|-------|--------|-----|
| Header background | Trust Blue | `#1565C0` |
| Income | Green | `#2E7D32` |
| Expense | Red | `#C62828` |
| Investment | Blue | `#1565C0` |
| Transfer | Grey | `#616161` |
| Ad placeholder background | Light grey | `#F5F5F5` |

Dark mode colours follow the same semantic mapping.

### 8.3 Interaction Design

- Transaction category corrections show a confidence indicator (green/yellow/red dot) and an inline category `<select>` dropdown.
- "Sync & Train" is a primary action: FAB (`add_task` icon) on mobile, a header button on desktop.
- Widget row selection is visually indicated with a tinted background highlight (`#E3F2FD` for the selected row).
- Auto toggle uses `role="switch"` and `aria-checked` for accessibility.
- All amounts use `en-IN` locale formatting with the ₹ symbol.
- Toast messages ("Sync complete. Your AI just got smarter!") appear as non-blocking overlays at the top-right of the screen.

---

## 9. Release & Roadmap

| Sprint | Stories | Goal |
|--------|---------|------|
| Sprint 1 | 001, 002, 003, 004 | WASM PoC (HDFC Savings/Credit Card, IndexedDB, Google Sheets sync) |
| Sprint 2 | 005, 006, 007, 008 | Basic Dashboard, Import UX, Transaction Review, Ad placeholders |
| Sprint 3 | 009, 010, 011, 012 | ML Feedback Loop, Mobile optimization, SBI plugin |
| Sprint 4 | 013, 014, 015, 016 | Sync & Train, Advanced Analytics, In-feed Ads, PWA |
| Sprint 5 | 017, 018, 019, 020 | **Dashboard v2.0:** Granularity Bar, Widget Grid, Transactions Panel, Ad Placement Update |
| Sprint 6 | 021, … | Ad Visibility Setting, future enhancements |

---

## 10. Stories Reference

| Story | Title | Status |
|-------|-------|--------|
| 001 | Upload and Parse Bank Statement | Done |
| 002 | Auto-Detect and Apply Correct Parser Plugin | Done |
| 003 | Store Parsed Transactions in IndexedDB | Done |
| 004 | Sync Transactions to Google Sheets | Done |
| 005 | WASM Engine Emits JSON for Dashboard | Done |
| 006 | Ad Placeholder on Import Processing Screen | Done |
| 007 | Dashboard Charts and Widgets (v1.0) | Done |
| 008 | Full Transactions Review Screen | Done |
| 009 | Category Correction and Rules Engine | Done |
| 010 | Dashboard Ad Placements (v1.0 — retired) | Done |
| 011 | Mobile Responsive UI | Done |
| 012 | SBI Savings Bank Parser Plugin | Done |
| 013 | Sync and Train ML Feedback Loop | Done |
| 014 | Advanced Analytics | To Do |
| 015 | In-Feed Ads — Transactions Screen | Done |
| 016 | Progressive Web App | To Do |
| 017 | Dashboard v2.0 — Granularity Bar & Summary Bar | To Do |
| 018 | Dashboard v2.0 — Analytical Tree-Table Widgets | To Do |
| 019 | Dashboard v2.0 — Integrated Transactions Panel | To Do |
| 020 | Dashboard v2.0 — Ad Placement Updates | To Do |
| 021 | Ad Visibility Setting | To Do |
