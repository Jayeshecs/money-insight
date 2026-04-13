# UI Wireframes and UX Specifications – v2.0

**Version:** 2.0  
**Date:** 2026-04-13  
**Status:** Draft  
**Supersedes:** `ux_design_1.0.md`

> For functional requirements see `fsd_2.0.md`. This document covers wireframes, interaction specifications, component anatomy, Material Icons usage, responsive breakpoints, and ad placement diagrams.

---

## Revision Note

v1.0 (`ux_design_1.0.md`) specified a sidebar-based dashboard with a Net Flow widget, Income vs Expense bar chart, Category Breakdown pie chart, and a Recent Transactions preview table.

v2.0 replaces the sidebar and chart-based Dashboard with a **full-width, four-section vertical layout** modelled on the reference Bootstrap 5.3 responsive design. The three non-Dashboard screens (Import & Processing, Transaction Review, Settings) are largely unchanged from v1.0 except for the removal of the sidebar ad skyscraper and the addition of the Ad Visibility toggle in Settings.

---

## Global: App Header (Replaces v1.0 Sidebar)

### Design Intent

A pinned blue topbar replaces the v1.0 left sidebar. Navigation links are positioned inline on desktop. On mobile, they collapse into a hamburger menu to preserve vertical space for data.

### Desktop (≥ 992 px)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [💰 MoneyInsight]   Dashboard  Transactions  Import  Settings     [👤 Jayesh ▾ ✓Drive] │
└──────────────────────────────────────────────────────────────────────────┘
   bg: #1565C0 (Bootstrap bg-primary)  text: white  font-weight: 600
```

- Left: Logo/title — `MoneyInsight` in white bold text, optionally preceded by a money-bag Material Icon (`payments`).
- Centre: Nav links — `Dashboard`, `Transactions`, `Import`, `Settings` — white text, no underline, hover underline.
- Right: `account_circle` icon + user display name + Google Drive connection status chip (green "Connected" / red "Offline").

### Mobile (< 992 px)

```
┌────────────────────────────────────────────────┐
│  [💰 MoneyInsight]                        [☰] │
└────────────────────────────────────────────────┘
       ↓ Tap [☰]
┌────────────────────────────────────────────────┐
│  Dashboard                                     │
│  Transactions                                  │
│  Import                                        │
│  Settings                                      │
│  ───────────                                   │
│  [👤] Jayesh Kumar                             │
│  ✓ Drive Connected                             │
│  [ Sign Out ]                                  │
└────────────────────────────────────────────────┘
```

- Material Icons: `menu` (hamburger), `close` (dismiss), `account_circle` (user), `check_circle` / `cloud_off` (Drive status).

---

## Screen: Dashboard v2.0 (Home)

**Goal:** Financial health overview with drill-down capability, all on a single scrollable page.  
**Data Source:** IndexedDB (aggregated by `DashboardStateService` from cached `Transaction[]`)

### Full Desktop Layout (≥ 1200 px)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  APP HEADER (blue bar — see above)                                           │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  SECTION 1 — GRANULARITY BAR                                                 │
│                                                                              │
│  Granularity: [ Monthly ▼ ]  2023-01 [◄══════════════════════►] 2024-12  [ Apply ] │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  SECTION 2 — OVERALL SUMMARY BAR                                             │
│                                                                              │
│  [↑ trending_up] Income        [↓ trending_down] Expense                    │
│    ₹35,32,257.27  (green)        ₹24,95,947.53  (red)                       │
│                                                                              │
│  [savings] Investment          [swap_horiz] Transfer        [filter_list ▾ HDFC(4)] │
│    ₹8,55,865.00  (blue)          ₹69,22,559.45  (grey)                      │
└──────────────────────────────────────────────────────────────────────────────┘

┌─── AD SLOT A ────────────────────────────────────────────────────────────────┐
│  [ AD PLACEHOLDER — 728×90 — dashboard-summary-banner ]                     │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  SECTION 3 — WIDGETS GRID  (Bootstrap: col-sm-6 col-xl-3)                   │
│                                                                              │
│  ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐ │
│  │ ↓ Expenses [Auto ○] │ │ 💼 Investment [Auto ○]│ │ ↑ Income  [Auto ○]  │ │ ⇄ Transfer [Auto ○] │ │
│  │ ─────────────────── │ │ ─────────────────────│ │ ─────────────────── │ │ ─────────────────── │ │
│  │ › Lifestyle  ₹4.7L  │ │ › Mutual Fd  ₹3.9L  │ │ › Salary   ₹33.1L  │ │ › A/c→A/c  ₹69.2L  │ │
│  │   Clothing  ₹1.2L   │ │   Direct    ₹3.9L   │ │   Finastra ₹28.7L  │ │                     │ │
│  │ › Rent      ₹2.9L   │ │ › Gold      ₹2.6L   │ │   Intl     ₹5.1L   │ │                     │ │
│  │   Home Rent ₹2.9L   │ │ › SSY       ₹1.1L   │ │ › Rent     ₹1.4L   │ │                     │ │
│  │ › Family    ₹2.5L   │ │ › PPF       ₹1.0L   │ │ › Dividend ₹0.6L   │ │                     │ │
│  │ ...                 │ │ ...                  │ │ ...                 │ │                     │ │
│  └──────────────────────┘ └──────────────────────┘ └──────────────────────┘ └──────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘

┌─── AD SLOT B ────────────────────────────────────────────────────────────────┐
│  [ AD PLACEHOLDER — 728×90 — dashboard-widgets-banner ]                     │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  SECTION 4 — TRANSACTIONS PANEL                                              │
│                                                                              │
│  Income Transactions — Salary / Finastra         Records: 36 / 1,647  [🔍]  │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Acct/Src  Category  Sub-cat      Date        Amount        Narration        │
│  SA1668    Salary    Finastra     2024-03-22  ₹2,39,536.00  NEFT CR...      │
│  SA1668    Salary    Finastra     2024-02-22  ₹2,39,437.00  NEFT CR...      │
│  SA1668    Salary    Finastra     2024-01-22  ₹2,38,991.00  NEFT CR...      │
│  ...                                                                         │
│                                            [ ‹ Prev ]  Page 1 / 2  [ Next › ]│
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### Mobile Layout (< 576 px)

```
┌──────────────────────────┐
│  APP HEADER (blue bar)   │
│  MoneyInsight      [☰]  │
└──────────────────────────┘

┌──────────────────────────┐  SECTION 1
│ Granularity: [Monthly ▼] │
│ 2023-01 [══Slider══] 2024-12 │
│ [Start] ──────── [End]   │
│          [ Apply ]        │
└──────────────────────────┘

┌──────────────────────────┐  SECTION 2
│ ↑ Income   ₹35,32,257   │
│ ↓ Expense  ₹24,95,947   │
│ 💼 Invest  ₹8,55,865    │
│ ⇄ Transfer ₹69,22,559   │
│ [filter_list Account (4) ▾] │
└──────────────────────────┘

┌──────────────────────────┐  SECTION 3 (single column)
│ ↓ Expenses   [Auto ○]   │
│ › Lifestyle  ₹4,70,118  │
│   Clothing   ₹1,20,400  │
│ › Rent       ₹2,91,600  │
└──────────────────────────┘

┌──────────────────────────┐
│ 💼 Investment [Auto ○]  │
│ › Mutual Fund ₹3,92,625 │
└──────────────────────────┘

┌──────────────────────────┐
│ ↑ Income     [Auto ○]   │
│ › Salary   ₹33,05,687   │
└──────────────────────────┘

┌──────────────────────────┐
│ ⇄ Transfer   [Auto ○]   │
│ › A/c→A/c  ₹69,22,559   │
└──────────────────────────┘

                            (AD SLOTS A & B: hidden on mobile)

┌──────────────────────────┐  SECTION 4 (mobile cards)
│ All Transactions         │
│ Records: 1647 / 1647 [🔍]│
│ Order by: [Date ▼]       │
│ ┌──────────────────────┐ │
│ │ 2024-03-22  ₹2,39,536│ │  ← green
│ │ Salary / Finastra    │ │
│ │ SA1668               │ │
│ │ NEFT CR FINASTRA...  │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ 2024-03-21  ₹1,850   │ │  ← red
│ │ Lifestyle / Dining   │ │
│ │ SA1668               │ │
│ │ UPI SWIGGY BANGA...  │ │
│ └──────────────────────┘ │
└──────────────────────────┘

┌──────────────────────────┐  MOBILE STICKY AD (AppComponent level)
│ [AD — 320×50 — mobile-sticky-footer] │
└──────────────────────────┘
```

---

## Section 1: Granularity Bar — Component Specification

### Component: `GranularityBarComponent`

**File:** `src/client/src/app/features/dashboard/granularity-bar/granularity-bar.component.ts`

| Element | CSS class / data-testid | Notes |
|---------|------------------------|-------|
| Container | `granularity-bar` | Bootstrap `card card-body p-2` |
| Granularity dropdown | `data-testid="granularity-select"` | `<select>` with options: Yearly / Quarterly / Monthly |
| Start date input | `data-testid="period-start"` | `<input type="text">` or `<input type="month">` |
| Range slider track | `data-testid="period-range-slider"` | noUiSlider or CDK drag; two handles |
| End date input | `data-testid="period-end"` | `<input type="text">` or `<input type="month">` |
| Apply button | `data-testid="apply-period-btn"` | Bootstrap `btn btn-primary btn-sm` |

**Interaction flow:**
1. User changes Granularity → both slider handles reset to full available date range; step size updated.
2. User drags left handle → `period-start` updates in real time (no data refresh).
3. User drags right handle → `period-end` updates in real time (no data refresh).
4. User edits `period-start` directly → left slider handle moves to match.
5. User clicks Apply → `DashboardStateService.applyPeriod()` called; Sections 2, 3, 4 recompute.

---

## Section 2: Overall Summary Bar — Component Specification

### Component: `OverallSummaryBarComponent`

**File:** `src/client/src/app/features/dashboard/overall-summary-bar/overall-summary-bar.component.ts`

| Element | CSS class / data-testid | Material Icon | Colour |
|---------|------------------------|---------------|--------|
| Income chip | `data-testid="overall-income"` | `trending_up` | `#2E7D32` (Bootstrap `text-success`) |
| Expense chip | `data-testid="overall-expense"` | `trending_down` | `#C62828` (Bootstrap `text-danger`) |
| Investment chip | `data-testid="overall-investment"` | `savings` | `#1565C0` (Bootstrap `text-primary`) |
| Transfer chip | `data-testid="overall-transfer"` | `swap_horiz` | `#616161` (Bootstrap `text-secondary`) |
| Account filter | `data-testid="account-source-filter"` | `filter_list` + `expand_more` | Default |

**Stat chip anatomy:**
```
┌─────────────────────────┐
│  [trending_up icon]     │
│  Income                 │
│  ₹35,32,257.27          │
└─────────────────────────┘
```

**Account/Source multiselect dropdown:**
- Trigger button: `[filter_list] Account/Source (4) [expand_more]`
- Opens a Bootstrap dropdown with a checkbox list of all unique `accountSource` values from IndexedDB.
- Checking/unchecking any account immediately triggers re-aggregation (no Apply required).
- Badge on trigger button shows count of currently selected accounts.

---

## Section 3: Analytical Widget — Component Specification

### Component: `AnalyticalWidgetComponent`

**File:** `src/client/src/app/features/dashboard/widgets/analytical-widget/analytical-widget.component.ts`

**Bootstrap grid wrapper (in `DashboardComponent` template):**
```html
<div class="row g-3" id="widgets-grid">
  <div class="col-sm-6 col-xl-3">
    <app-analytical-widget type="expense" ...></app-analytical-widget>
  </div>
  <div class="col-sm-6 col-xl-3">
    <app-analytical-widget type="investment" ...></app-analytical-widget>
  </div>
  <div class="col-sm-6 col-xl-3">
    <app-analytical-widget type="income" ...></app-analytical-widget>
  </div>
  <div class="col-sm-6 col-xl-3">
    <app-analytical-widget type="transfer" ...></app-analytical-widget>
  </div>
</div>
```

**Widget internal layout:**
```
┌─────────────────────────────────────┐
│  [icon] Type Label         [Auto ○] │  ← widget header
│  ─────────────────────────────────  │
│  Category Name              ₹X,X,X  │  ← Level 1 row (bold, chevron ›)
│    Sub-category              ₹X,X,X │  ← Level 2 row (indented, hidden by default)
│  Category Name              ₹X,X,X  │
│  ...                                │
└─────────────────────────────────────┘
```

**Row states:**
| State | Visual |
|-------|--------|
| Default | White background, normal text |
| Hover | Light grey background (`#F5F5F5`) |
| Selected | Light blue tint (`#E3F2FD`), `aria-selected="true"` |
| Category expanded | Chevron rotated 90°, sub-category rows visible |

**Auto toggle — HTML pattern:**
```html
<label class="form-check form-switch mb-0">
  <input class="form-check-input" type="checkbox" role="switch"
         data-testid="widget-auto-toggle" aria-checked="false">
  <span class="form-check-label">Auto</span>
</label>
```

**Empty state:**
```html
<div data-testid="widget-empty-state" class="text-muted text-center py-3">
  No data for selected period
</div>
```

---

## Section 4: Transactions Panel — Component Specification

### Component: `TransactionsPanelComponent`

**File:** `src/client/src/app/features/dashboard/transactions-panel/transactions-panel.component.ts`

### Panel Header Layout

```
┌──────────────────────────────────────────────────────┐
│  Income Transactions — Salary / Finastra             │
│  Records: 36 / 1,647                          [search]│
└──────────────────────────────────────────────────────┘
```

With search expanded:
```
┌──────────────────────────────────────────────────────┐
│  Income Transactions — Salary / Finastra             │
│  Records: 36 / 1,647  [NEFT___________________] [✕] │
└──────────────────────────────────────────────────────┘
```

### Desktop Table

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Acct/Src │ Category │ Sub-category │ Date       │ Amount      │ Narration    │
├──────────┼──────────┼──────────────┼────────────┼─────────────┼──────────────┤
│ SA1668   │ Salary   │ Finastra     │ 2024-03-22 │ ₹2,39,536 ↑│ NEFT CR F...│
│ SA1668   │ Expense  │ Dining       │ 2024-03-21 │ ₹1,850    ↓│ UPI SWIGG...│
│ SA1668   │ Transfer │ A/c to A/c   │ 2024-03-20 │ ₹50,000   ⇄│ IMPS CR ...│
└──────────┴──────────┴──────────────┴────────────┴─────────────┴──────────────┘
                                        [ ‹ Prev ]  Page 1 / 82  [ Next › ]
```

Amount colour coding:
- INCOME: `#2E7D32` (green)
- EXPENSE: `#C62828` (red)
- INVESTMENT: `#1565C0` (blue)
- TRANSFER: `#616161` (grey)

### Mobile Card

```
┌──────────────────────────┐
│ 2024-03-22   ₹2,39,536  │  ← Date (left, bold) | Amount (right, green, bold)
│ Salary / Finastra        │  ← Category / Sub-cat
│ SA1668 · HDFC Savings    │  ← Account/Source
│ NEFT CR FINASTRA TECH... │  ← Narration (2-line max, truncated)
└──────────────────────────┘
```

---

## Ad Placement Diagrams

### Dashboard Ad Slots (Desktop Only)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  SECTION 1: Granularity Bar                                                  │
└──────────────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────────────────┐
│  SECTION 2: Overall Summary Bar                                              │
└──────────────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────────────────┐
│  ████████████████████████  AD SLOT A — 728×90  █████████████████████████████│
│  "Best Mutual Funds of 2026 — Start Investing Today"                         │
│  [data-placement="dashboard-summary-banner"]                                 │
└──────────────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────────────────┐
│  SECTION 3: Widgets Grid (4 columns on xl)                                   │
└──────────────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────────────────┐
│  ████████████████████████  AD SLOT B — 728×90  █████████████████████████████│
│  "HDFC Best Dining Credit Card — Get 5× Rewards"                             │
│  [data-placement="dashboard-widgets-banner"]                                 │
└──────────────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────────────────┐
│  SECTION 4: Transactions Panel                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Contextual copy strategy:**
- Ad Slot A fires before the user drills into any category — financial product ads are broadly relevant.
- Ad Slot B fires after the user has selected a specific category — the active `WidgetSelection` object (type + category) can be passed as contextual signals to AdSense to serve highly relevant creative (e.g., a "Dining" category selection triggers dining credit card ads).

### Import Processing Ad Placement

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Import New Statement                                                   [✕] │
│  Select Bank: [ HDFC ▼ ]                                                    │
│  Upload: [ Drag & Drop or Browse ]                                          │
│  ──────────────────────────────────────────────────────────────────────────  │
│  STATUS: Parsing transactions... ████████████░░░░  75%                      │
│  > Auto-detecting parser...                                                  │
│  > Applying ML categorization...                                             │
│                                                                              │
│  ┌────────────────────────────────────┐                                      │
│  │  ████████  AD — 300×250  █████████│                                      │
│  │  [data-placement="import-processing"]                                     │
│  └────────────────────────────────────┘                                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

*UX Note:* The user is waiting 5–15 s for the WASM engine. A Medium Rectangle (300×250) here achieves maximum dwell time and CPM. The ad loads once the progress bar advances past the initial spinner, avoiding distraction from the "file accepted" confirmation moment.

### Transaction Review In-Feed Ads

**Desktop:**
```
│  [ ] Date  │ Description           │ Amount   │ Category      │ Confidence │
│────────────┼───────────────────────┼──────────┼───────────────┼────────────│
│  01/10     │ UPI-SWIGGY-12345      │ ₹450.00  │ [Food ▼]      │ ● High     │
│  01/11     │ NEFT-LANDLORD-RENT    │ ₹15,000  │ [Rent ▼]      │ ● High     │
│────────────────────────  [AD] Native In-Feed  ────────────────────────────│
│  01/12     │ UNKNOWN-MERCHANT-XYZ  │ ₹2,000   │ [Select… ▼]   │ ● Low (!) │
```

**Mobile (Card):**
```
│ ┌──────────────────────┐ │
│ │ SWIGGY BANGALORE     │ │
│ │ ₹ 450.00             │ │
│ │ Cat: [ Food   ▼ ]    │ │
│ │ [ Confirm ]          │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │    [AD — Native]     │ │  ← styled identically to transaction cards
│ │ "Best Food Delivery  │ │
│ │  Card — Apply Now"   │ │
│ └──────────────────────┘ │
```

---

## Screen: Import & Processing (Unchanged from v1.0)

*Refer to `ux_design_1.0.md` § "Screen: Import & AI Processing" for the full modal specification.*

Key differences from v1.0:
- The modal no longer references "Pyodide" or Python (the engine is Rust WASM).
- Status messages updated: `> Loading Rust WASM engine…`, `> Auto-detecting parser plugin…`, `> Applying ML rules…`.
- The ad placeholder respects the global Ad Visibility setting (`UserPreferencesService.showAds`).

---

## Screen: Transaction Review (Unchanged from v1.0)

*Refer to `ux_design_1.0.md` § "Screen: Transactions (The ML Training Ground)" for the full layout.*

Key differences from v1.0:
- In-feed ad is now governed by the Ad Visibility setting.
- Mobile sticky footer ad (320×50) is rendered in `AppComponent`, not in this screen's template.

---

## Screen: Settings (New in v2.0)

### Goal

Provide user-configurable preferences stored in `localStorage`.

### Layout

```
┌──────────────────────────────────────────────────────────┐
│  APP HEADER                                              │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  Settings                                                │
│                                                          │
│  ── Ad Preferences ──────────────────────────────────── │
│                                                          │
│  [data-testid="ad-preferences-section"]                  │
│                                                          │
│  Show ad placeholders                                    │
│  [data-testid="show-ads-label"]                          │
│                                                          │
│  [   OFF   ●  ]  ← role="switch" aria-checked="false"   │
│  [data-testid="show-ads-toggle"]                         │
│                                                          │
│  When enabled, ad placeholders appear in the Import      │
│  screen, Dashboard, and Transaction Review screen.       │
│                                                          │
│  ── Theme ────────────────────────────────────────────  │
│  [Coming Soon]                                           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Interaction Specs: Machine Learning Feedback Loop (Updated from v1.0)

The ML feedback loop interaction is unchanged in principle from v1.0 but now runs entirely in the Rust WASM engine (not Python/Pyodide).

### Confidence Indicators

| Dot | Colour | Meaning |
|-----|--------|---------|
| ● | Green | AI confidence > 90% |
| ● | Yellow | AI confidence 50–90% (guessing) |
| ● | Red | AI confidence < 50% (uncertain) |

- Default filter: show Red → Yellow → Green items at the top of the Transaction Review table.
- Red items show a `(!)` warning icon next to the category dropdown.

### Sync & Train Action

| Device | Location | Icon |
|--------|----------|------|
| Mobile | Floating Action Button (bottom-right) | `add_task` |
| Desktop | Header button (top-right of Transaction Review screen) | `sync` |

**Behaviour sequence:**
1. User clicks "Sync & Train".
2. App POSTs corrected categories to Google Sheets "Transactions" tab.
3. App POSTs new rule mappings to Google Sheets "Rules" tab.
4. WASM worker calls `model.partial_fit()` on new labelled data.
5. Updated model `.pkl` is saved back to Google Drive.
6. Toast message: *"Sync complete. Your AI just got smarter!"*

---

## Responsive Breakpoint Summary

| Breakpoint | Viewport | Dashboard Widgets | Transaction Display | Header Nav |
|------------|----------|-------------------|--------------------|-----------
| xs | < 576 px | 1 column (stacked full-width) | Mobile cards | Hamburger dropdown |
| sm | 576–767 px | 2 columns (col-sm-6) | Mobile cards | Hamburger dropdown |
| md | 768–991 px | 2 columns (col-sm-6) | Desktop table | Hamburger dropdown |
| lg | 992–1199 px | 2 columns (col-sm-6) | Desktop table | Inline nav links |
| xl | ≥ 1200 px | 4 columns (col-xl-3) | Desktop table | Inline nav links |

---

## Material Icons Reference

| Context | Icon name | Usage |
|---------|-----------|-------|
| Header: Logo | `payments` | App brand mark |
| Header: User | `account_circle` | User profile |
| Header: Menu | `menu` | Mobile hamburger open |
| Header: Close menu | `close` | Mobile hamburger dismiss |
| Header: Drive OK | `check_circle` | Drive Connected status |
| Header: Drive offline | `cloud_off` | Drive not connected |
| Summary: Income | `trending_up` | Income stat chip |
| Summary: Expense | `trending_down` | Expense stat chip |
| Summary: Investment | `savings` | Investment stat chip |
| Summary: Transfer | `swap_horiz` | Transfer stat chip |
| Summary: Account filter | `filter_list` | Account/Source multiselect trigger |
| Widget: Expenses | `trending_down` | Widget header icon |
| Widget: Investment | `savings` | Widget header icon |
| Widget: Income | `trending_up` | Widget header icon |
| Widget: Transfer | `swap_horiz` | Widget header icon |
| Widget: Expand row | `chevron_right` | Category row expand chevron (rotates 90° when open) |
| Panel: Search | `search` | Transactions Panel search button |
| Panel: Close search | `close` | Collapse search input |
| Sync & Train (mobile) | `add_task` | FAB icon |
| Sync & Train (desktop) | `sync` | Header button icon |
| Drive sync in progress | `sync` (animated) | Indicates background sync activity |

---

## Colour Tokens

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-header` | `#1565C0` | App header background |
| `--color-income` | `#2E7D32` | Income amounts, INCOME transaction rows |
| `--color-expense` | `#C62828` | Expense amounts, EXPENSE transaction rows |
| `--color-investment` | `#1565C0` | Investment amounts, INVESTMENT transaction rows |
| `--color-transfer` | `#616161` | Transfer amounts, TRANSFER transaction rows |
| `--color-selected-row` | `#E3F2FD` | Widget row selected state background |
| `--color-hover-row` | `#F5F5F5` | Widget row hover state background |
| `--color-ad-placeholder` | `#F5F5F5` | Ad placeholder background (non-prod) |
| `--color-confidence-high` | `#2E7D32` | Green confidence dot |
| `--color-confidence-med` | `#F57F17` | Yellow/amber confidence dot |
| `--color-confidence-low` | `#C62828` | Red confidence dot |
