# MoneyInsight UI/UX Implementation Design

## 1. Screen Specifications

### 1.1 Dashboard (Home) Screen

**Purpose:** Provide an analytical financial health overview with drill-down into categorised transaction data.

**Data Source:** IndexedDB (aggregated by Angular service from stored `Transaction[]`)

**Design Revision:** v2.0 — Four-section vertical layout replacing chart-based v1.0 design.

---

#### Section Layout Overview (All Devices)

The Dashboard is organised into **four stacked sections** (top to bottom). On mobile they all stack full-width; on desktop the Widgets section uses a 2×2 grid.

```
┌────────────────────────────────────────────────────────────────────┐
│  SECTION 1 — GRANULARITY BAR                                       │
│  Granularity: [Monthly ▼]  [◄] [2023-04]════════════[2024-03] [►]  [Apply] │
└────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────┐
│  SECTION 2 — OVERALL SUMMARY BAR                                   │
│  ↑ Income ₹3,532,257.27  ↓ Expense ₹2,495,947.53                  │
│  💼 Investment ₹855,865.00  ⇄ Transfer ₹6,922,559.45              │
│                                          [⊞ Account/Source (4) ▼] │
└────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────┐
│  SECTION 3 — WIDGETS GRID (2×2 desktop, stacked mobile)            │
│  ┌──────────────────────────┐  ┌──────────────────────────┐        │
│  │ ↓ Expenses   [Auto ○]   │  │ 💼 Investment [Auto ○]   │        │
│  │ Category         Amount  │  │ Category         Amount  │        │
│  │ ─────────────────────── │  │ ─────────────────────── │        │
│  │ Lifestyle   ₹470,118.99 │  │ Mutual Fund ₹392,625.00  │        │
│  │  › Clothing ₹120,400.00 │  │  › Direct   ₹392,625.00  │        │
│  │ Rent        ₹291,600.00 │  │ Gold        ₹255,240.00  │        │
│  │  › Home Rent₹291,600.00 │  │ SSY         ₹108,000.00  │        │
│  │ Family      ₹250,000.00 │  │ PPF         ₹100,000.00  │        │
│  │ ...                     │  │ ...                      │        │
│  └──────────────────────────┘  └──────────────────────────┘        │
│  ┌──────────────────────────┐  ┌──────────────────────────┐        │
│  │ ↑ Income     [Auto ○]   │  │ ⇄ Transfer   [Auto ○]   │        │
│  │ Category         Amount  │  │ Category         Amount  │        │
│  │ ─────────────────────── │  │ ─────────────────────── │        │
│  │ Salary    ₹3,305,687.00 │  │ A/c to A/c₹6,922,559.45 │        │
│  │  › Finastra₹2,874,432.. │  │                          │        │
│  │ Rent        ₹142,750.00 │  │                          │        │
│  │ Dividend     ₹63,167.40 │  │                          │        │
│  │ ...                     │  │ ...                      │        │
│  └──────────────────────────┘  └──────────────────────────┘        │
└────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────┐
│  SECTION 4 — TRANSACTIONS PANEL                                    │
│  Income Transactions — Salary / Finastra   Records: 12 / 1647  [🔍]│
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Acct/Src  Category  Sub-category  Date        Amount  Narr.. │  │
│  │ SA1668    Salary    Finastra      2024-03-22  ₹239,536  NEFT │  │
│  │ SA1668    Salary    Finastra      2024-02-22  ₹239,437  NEFT │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

---

#### Section 1 — Granularity Bar

**Purpose:** Control the time period and granularity applied to all sections.

| Element | Type | Behaviour |
|---------|------|-----------|
| Granularity dropdown | Select | Options: Yearly, Quarterly, Monthly (default: Monthly) |
| Start date input | Text / date picker | ISO date string representing the period start |
| Range slider | Dual-handle slider | Visual drag to set start/end within available data range |
| End date input | Text / date picker | ISO date string representing the period end |
| Apply button | Primary button | Triggers re-aggregation of all sections with new period |

**Rules:**
- Granularity controls the step size of the range slider handles (e.g., Monthly snaps to month boundaries).
- Default range on first load: earliest available transaction date → latest available transaction date.
- Changing granularity resets range to the full available range for that unit.
- Apply button is the only action that triggers data refresh (no live/auto filtering on drag).

---

#### Section 2 — Overall Summary Bar

**Purpose:** Show top-level aggregated totals for the selected period at a glance.

| Element | Type | Behaviour |
|---------|------|-----------|
| Income total | Stat chip (green, ↑ icon) | Sum of all INCOME transactions in period |
| Expense total | Stat chip (red, ↓ icon) | Sum of all EXPENSE transactions in period |
| Investment total | Stat chip (blue, 💼 icon) | Sum of all INVESTMENT transactions in period |
| Transfer total | Stat chip (grey, ⇄ icon) | Sum of all TRANSFER transactions in period |
| Account/Source multiselect | Dropdown (multiselect) | Lists all unique Account/Source values; badge shows selected count; "All" when none are deselected |

**Rules:**
- Totals update immediately when Apply is pressed in Section 1 or Account/Source selection changes.
- Account/Source selection acts as a cross-section filter affecting Sections 2, 3, and 4 simultaneously.
- Amounts displayed in INR with thousands separator (₹X,XX,XXX.XX format).

---

#### Section 3 — Widgets Grid

**Purpose:** Show category-level aggregations for each transaction type, allowing drill-down to sub-category.

**Layout:** 2-column grid on desktop (≥ 768 px); single column stack on mobile (< 768 px). Widget order: Expenses (top-left), Investment (top-right), Income (bottom-left), Transfer (bottom-right).

**Each Widget contains:**

| Element | Type | Behaviour |
|---------|------|-----------|
| Widget title | Header | Icon + label (e.g., "↓ Expenses") |
| Auto toggle | Toggle switch | OFF by default; when ON the Transactions panel auto-refreshes on row selection |
| Tree table | 2-column table | Column 1: category/sub-category tree; Column 2: aggregated amount |

**Tree Table Rules:**
- **Level 1 rows** (Category): Show category name with a collapse/expand chevron (›) and the aggregated total for all sub-categories combined. Bold text.
- **Level 2 rows** (Sub-category): Indented under their parent category. Shown collapsed by default. Amount is the sub-category total.
- **Sort:** Amounts sorted **descending** at both levels independently (categories by their total, sub-categories within each category by their total).
- **Expand/Collapse:** Clicking a Level 1 row toggles visibility of its Level 2 rows.
- **Row Selection:** Clicking any row (Level 1 or Level 2) sets it as the active selection, highlighted with a tinted background.
- **Auto toggle behaviour:** When Auto is ON and a row is selected, the Transactions panel (Section 4) refreshes immediately to show transactions matching that selection. When Auto is OFF, row selection is still tracked but the Transactions panel does not auto-update; a manual "View Transactions" action is required (double-click or dedicated button — TBD in implementation).
- **Empty state:** Widget shows "No data for selected period" when there are no transactions of that type.

---

#### Section 4 — Transactions Panel

**Purpose:** Display individual transactions for the selection made in Section 3.

**Initial State:** Shows all transactions within the selected period (no widget filter applied) with title "All Transactions".

| Element | Type | Behaviour |
|---------|------|-----------|
| Panel title | Text | Format: `<Type> Transactions — <Category> / <Sub-category>` (e.g., "Income Transactions — Salary / Finastra") |
| Record count | Text | `Records: <filtered count> / <total count>` |
| Search icon (🔍) | Icon button | Clicking expands an inline text field; typing filters rows by free-form substring match against all visible columns |
| Transaction table | Table (desktop/tablet ≥ 768 px) | Columns: Account/Source, Category, Sub-category, Date, Amount, Narration |
| Transaction cards | Card list (mobile < 768 px) | Each card shows: Date, Amount (coloured by type), Category, Sub-category, Narration excerpt |

**Transaction Table Rules:**
- Default sort: Date descending.
- Amount column: colour-coded — green (INCOME), red (EXPENSE), blue (INVESTMENT), grey (TRANSFER).
- Search field: appears inline to the right of the record count when activated; pressing Escape or clicking outside collapses it and clears the filter.
- Record count updates in real-time as user types in the search field.
- Pagination: 20 rows per page with Prev/Next controls at the bottom of the panel.
- Panel title updates whenever a new widget row is selected or search is applied.

---

#### Desktop Layout (≥ 1024 px)

```
┌────────────────────────────────────────────────────────────────────┐
│ HEADER: Logo │ [Dashboard] [Transactions] [Import] [Settings]      │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│ ── SECTION 1: GRANULARITY ──────────────────────────────────────── │
│  Granularity: [Monthly ▼]   [2023-04]━━━━━━━━━━━━━━━[2024-03]  [Apply] │
│                                                                    │
│ ── SECTION 2: OVERALL SUMMARY ──────────────────────────────────── │
│  ↑ Income ₹3,532,257.27  ↓ Expense ₹2,495,947.53                  │
│  💼 Investment ₹855,865.00  ⇄ Transfer ₹6,922,559.45              │
│                                          [⊞ Account/Source (4) ▼] │
│                                                                    │
│ ── SECTION 3: WIDGETS ──────────────────────────────────────────── │
│ ┌──────────────────────────┐  ┌──────────────────────────┐         │
│ │ ↓ Expenses   [Auto ○]   │  │ 💼 Investment [Auto ○]   │         │
│ │ Lifestyle   ₹470,118.99 │  │ Mutual Fund ₹392,625.00  │         │
│ │  › Clothing ₹120,400.00 │  │ Gold        ₹255,240.00  │         │
│ │ Rent        ₹291,600.00 │  │ SSY         ₹108,000.00  │         │
│ │ ...                     │  │ ...                      │         │
│ └──────────────────────────┘  └──────────────────────────┘         │
│ ┌──────────────────────────┐  ┌──────────────────────────┐         │
│ │ ↑ Income     [Auto ○]   │  │ ⇄ Transfer   [Auto ○]   │         │
│ │ Salary    ₹3,305,687.00 │  │ A/c to A/c₹6,922,559.45 │         │
│ │  › Finastra₹2,874,432.. │  │                          │         │
│ │ Rent        ₹142,750.00 │  │                          │         │
│ │ ...                     │  │                          │         │
│ └──────────────────────────┘  └──────────────────────────┘         │
│                                                                    │
│ ── SECTION 4: TRANSACTIONS ─────────────────────────────────────── │
│  Income Transactions — Salary / Finastra   Records: 12 / 1647 [🔍] │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ Acct/Src  Category  Sub-category  Date        Amount  Narr.. │   │
│ │ SA1668    Salary    Finastra      2024-03-22  ₹239,536       │   │
│ │ SA1668    Salary    Finastra      2024-02-22  ₹239,437       │   │
│ │ ...                                                          │   │
│ └──────────────────────────────────────────────────────────────┘   │
│  [< Prev]  Page 1 of 82  [Next >]                                  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

#### Tablet Layout (768 px – 1023 px)

- Sections 1, 2, 4 remain full-width.
- Section 3: 2-column widget grid collapses to single column (all 4 widgets stacked vertically).
- Transaction panel shows table (not cards).

---

#### Mobile Layout (< 768 px)

```
┌────────────────────────────────────────────────┐
│ HEADER (Compact): [≡] Logo  [Profile]          │
├────────────────────────────────────────────────┤
│ Granularity: [Monthly ▼]                       │
│ [2023-04]━━━━━━━━━━━━━━━[2024-03]  [Apply]    │
├────────────────────────────────────────────────┤
│ ↑ ₹35,32,257  ↓ ₹24,95,947                    │
│ 💼 ₹8,55,865  ⇄ ₹69,22,559                    │
│                    [Account/Source (4) ▼]      │
├────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┐   │
│ │ ↓ Expenses              [Auto ○]         │   │
│ │ Lifestyle         ₹470,118.99            │   │
│ │ Rent              ₹291,600.00            │   │
│ │ ...                                      │   │
│ └──────────────────────────────────────────┘   │
│ ┌──────────────────────────────────────────┐   │
│ │ 💼 Investment           [Auto ○]         │   │
│ │ ...                                      │   │
│ └──────────────────────────────────────────┘   │
│ ┌──────────────────────────────────────────┐   │
│ │ ↑ Income                [Auto ○]         │   │
│ │ ...                                      │   │
│ └──────────────────────────────────────────┘   │
│ ┌──────────────────────────────────────────┐   │
│ │ ⇄ Transfer              [Auto ○]         │   │
│ │ ...                                      │   │
│ └──────────────────────────────────────────┘   │
├────────────────────────────────────────────────┤
│ Income Transactions — Salary / Finastra        │
│ Records: 12 / 1647                      [🔍]  │
│ ┌──────────────────────────────────────────┐   │
│ │ 📅 2024-03-22  ↑ ₹2,39,536             │   │
│ │ Salary / Finastra  SA1668               │   │
│ │ NEFT CR-ICIC0000104-FUNDTECH INDIA...   │   │
│ └──────────────────────────────────────────┘   │
│ ┌──────────────────────────────────────────┐   │
│ │ 📅 2024-02-22  ↑ ₹2,39,437             │   │
│ │ Salary / Finastra  SA1668               │   │
│ │ NEFT CR-ICIC0000104-FUNDTECH INDIA...   │   │
│ └──────────────────────────────────────────┘   │
│  [< Prev]  1 / 82  [Next >]                    │
├────────────────────────────────────────────────┤
│ BOTTOM NAV: [Home] [Txn] [Import] [...]        │
└────────────────────────────────────────────────┘
```

---

#### Component Details

| Component | data-testid | Notes |
|-----------|-------------|-------|
| Granularity dropdown | `granularity-select` | Values: `yearly`, `quarterly`, `monthly` |
| Period start input | `period-start` | ISO date string |
| Period end input | `period-end` | ISO date string |
| Range slider | `period-range-slider` | Dual-handle; steps by granularity unit |
| Apply button | `apply-period-btn` | Triggers full dashboard refresh |
| Income total | `overall-income` | Stat chip |
| Expense total | `overall-expense` | Stat chip |
| Investment total | `overall-investment` | Stat chip |
| Transfer total | `overall-transfer` | Stat chip |
| Account/Source multiselect | `account-source-filter` | Badge shows selected count |
| Expenses widget | `widget-expenses` | Contains tree table |
| Investment widget | `widget-investment` | Contains tree table |
| Income widget | `widget-income` | Contains tree table |
| Transfer widget | `widget-transfer` | Contains tree table |
| Widget Auto toggle | `widget-auto-toggle` (within each widget) | Toggle; OFF by default |
| Widget category row | `widget-row-category` | Level 1 tree row |
| Widget sub-category row | `widget-row-subcategory` | Level 2 tree row; hidden until parent expanded |
| Transactions panel title | `transactions-panel-title` | Dynamic text |
| Records count | `transactions-record-count` | `Records: X / Y` |
| Search icon button | `transactions-search-btn` | Expands search field |
| Search field | `transactions-search-input` | Inline text input |
| Transaction table | `transactions-table` | Desktop/tablet (≥ 768 px) |
| Transaction card | `transaction-card` | Mobile (< 768 px) |
| Pagination prev | `transactions-pagination-prev` | — |
| Pagination next | `transactions-pagination-next` | — |

---

#### Ad Placements on Dashboard (v2.0)

The v1.0 sidebar skyscraper and banner ad positions are superseded by the new full-width layout. Revised ad placement for v2.0:

| Placement | Format | Trigger | data-placement |
|-----------|--------|---------|----------------|
| Between Section 2 and Section 3 | Native banner 728×90 (hidden < 768 px) | Page load | `dashboard-summary-banner` |
| Between Section 3 and Section 4 | Native banner 728×90 (hidden < 768 px) | After widget interaction | `dashboard-widgets-banner` |
| Mobile sticky footer | Sticky banner 320×50 | Scroll | `mobile-sticky-footer` |

> See `06_AD_STRATEGY.md` for CPM tier rationale and AdSense slot configuration.

---

### 1.2 Import & Processing Screen

**Purpose:** Show file upload, bank selection, processing progress, and high-engagement ad.

**User Flow:**
1. User selects bank → bank-specific file format hint
2. Uploads file (CSV or Excel) → Drag & drop or file picker
3. Optionally enters password (if encrypted)
4. Clicks "Proceed to Analyze"
5. Progress bar shows WASM engine loading and processing
6. Ad displayed during wait time (high-engagement moment)

#### Desktop & Mobile Layout

```
┌──────────────────────────────────────────────────────────┐
│  Import New Statement                              [X]  │  (Modal/Overlay)
├──────────────────────────────────────────────────────────┤
│                                                          │
│  SECTION 1: Bank Selection                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Which bank is this statement from?               │  │
│  │                                                  │  │
│  │  [HDFC Bank (Savings) ▼]                         │  │
│  │  Options: HDFC Savings, HDFC Credit Card         │  │
│  │           (More banks coming soon...)            │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  SECTION 2: File Upload                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 📄 Drag and drop HDFC CSV/Excel here             │  │
│  │    or [Browse Files]                             │  │
│  │                                                  │  │
│  │ Supported: .csv, .xlsx, .xls                     │  │
│  │ Max size: 25 MB                                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  SECTION 3: Password (Optional)                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Is the file password-protected?                  │  │
│  │ Password: [*******************]                  │  │
│  │ (Only used client-side for decryption)           │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│                 ┌──────────────────────┐               │
│                 │ PROCEED TO ANALYZE  │               │  (CTA Button)
│                 └──────────────────────┘               │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  PROCESSING STATUS (After upload)                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Status: Initializing...                          │  │
│  │ ┌──────────────────────────────────────────────┐ │  │
│  │ │████████████░░░░░░░░░░░░░░░░░░░░░ 45%        │ │  │ (Progress Bar)
│  │ └──────────────────────────────────────────────┘ │  │
│  │                                                  │  │
│  │ ✓ Initializing WASM Engine                      │  │
│  │ ✓ Loading Rust Parser                           │  │
│  │ ⏳ Loading ML Categorizer...                      │  │
│  │ ⊘ Parsing File (0/523 transactions)             │  │
│  │ ⊘ Categorizing...                                │  │
│  │                                                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  AD PLACEMENT (High Engagement)                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │              [AD] (300x250)                      │  │
│  │  "Best Credit Cards for HDFC Users - Apply Now" │  │
│  │  ┌────────────────────────────────────────────┐ │  │
│  │  │ [Image]  Apply Now >                       │ │  │
│  │  └────────────────────────────────────────────┘ │  │
│  │                                           Ad by  │  │
│  │                                          AdSense │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  TOOLTIP: "Your data stays on your device."             │  (Privacy Note)
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Component Specifications:**

| Component | Type | Behavior |
|-----------|------|----------|
| Bank Dropdown | Select | Enables category-specific hints |
| File Input | Drag & Drop + File Picker | Max 25MB, supports CSV/XLSX/XLS |
| Password Input | Text | Masked, client-side only |
| Progress Bar | Animated | Smooth, indeterminate during loading |
| Status List | Text | Shows checkmarks for completed steps |
| Ad Placeholder | 300x250 | Medium Rectangle, native ad format |

**Status Sequence:**

```
Initial → "Ready to upload"
Upload selected → "Initializing WASM Engine"
Parsing starts → "Loading Rust Parser"
Parser ready → "Loading ML Categorizer"
Categorizer ready → "Parsing File (X/Y transactions)"
Parsing complete → "Categorizing Transactions..."
Categorization complete → "Process Complete"
→ Emit event to redirect to Transactions screen
```

---

### 1.3 Transaction Review Screen

**Purpose:** Review and approve/correct AI-categorized transactions.

#### Desktop: Table View

```
┌────────────────────────────────────────────────────────────────────┐
│ HEADER / FILTERS                                                   │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ Show: [Needs Review (3) ▼] │ Export CSV │ Sync & Train  ✓ ✨  │ │
│ └────────────────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────┤
│ EDITABLE TABLE                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ [ ]│Date   │Description      │Amount  │Category   │Confidence  ││
│ ├─────────────────────────────────────────────────────────────────┤│
│ │ [ ]│01/10  │UPI-SWIGGY-...   │-450.00 │[Food ▼]   │🟢 High    ││  (Row 1: Pre-filled, High Confidence)
│ │ [ ]│01/11  │NEFT-LANDLORD... │-15000  │[Rent ▼]   │🟢 High    ││  (Row 2: Pre-filled, High Confidence)
│ │ [ ]│01/12  │UNKNOWN-MERCHANT │-2000   │[Select ▼] │🔴 Low(!)  ││  (Row 3: Needs Review, Red indicator)
│ ├─────────────────────────────────────────────────────────────────┤│
│ │                                                                 ││
│ │          [AD] (Native In-Feed Ad after row 20)                 ││
│ │  "Smart Budgeting App - Start Free Trial"                     ││
│ │                                                                 ││
│ ├─────────────────────────────────────────────────────────────────┤│
│ │ [ ]│01/13  │AMAZON RETAIL    │-599.00 │[Shopping ▼]│🟡 Medium  ││  (Row 21+)
│ │ [ ]│01/14  │SALARY-DEPOSIT   │+45000  │[Income ▼] │🟢 High    ││
│ └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│ PAGINATION: [< Prev] Page 1 of 45 [Next >]                        │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

**Table Columns:**

| Column | Type | Editable | Behavior |
|--------|------|----------|----------|
| Checkbox | Checkbox | ✓ | Select rows for bulk actions |
| Date | Date | | Sortable |
| Description | Text | | Searchable |
| Amount | Number | | Sortable |
| Category | Dropdown | ✓ | Click to change category |
| Confidence | Indicator | | 🟢 High, 🟡 Medium, 🔴 Low |

**Interaction Details:**

**Category Dropdown Behavior:**
- Click dropdown → Show list of predefined categories + search
- Select category → Update row, mark as modified
- Unsure? → Click "?" for category hints based on description
- Custom entry → Not allowed (must use predefined list)

**Default Filter Logic:**
- Show "Needs Review" first (Low confidence items)
- Then "Medium" confidence
- Then "High" confidence (can be hidden)

**Bulk Actions:**
- Select multiple rows (checkboxes)
- Bulk category assignment
- Bulk approval
- Bulk deletion (soft delete, move to FLAGGED status)

#### Mobile: Card View

```
┌──────────────────────────────┐
│ HEADER / FILTERS             │
│ ┌────────────────────────────┐│
│ │ < Prev  January 2025  Next >│
│ │ Show: [Needs Review (3) ▼]│ │
│ └────────────────────────────┘│
├──────────────────────────────┤
│ TRANSACTION CARDS (Stacked)  │
│ ┌────────────────────────────┐│
│ │ SWIGGY BANGALORE           ││ (Merchant)
│ │ ₹ 450.00  [▼ Expense]      ││ (Amount + Direction)
│ │ ────────────────────────── ││
│ │ Date: 01/10                ││
│ │ ────────────────────────── ││
│ │ Category: [Food ▼]         ││ (Editable dropdown)
│ │ Sub: [Dining ▼]            ││
│ │ Confidence: 🟢 High        ││
│ │ ────────────────────────── ││
│ │ [ ✓ Approve ]  [ ✗ Flag ] ││ (Action buttons)
│ └────────────────────────────┘│
│ ┌────────────────────────────┐│
│ │      [AD] (Native Card)    ││
│ │                            ││
│ │  "Best Savings Account"    ││
│ │  9.5% Interest Rate        ││
│ │       [Open Account >]     ││
│ │                            ││
│ └────────────────────────────┘│
│ ┌────────────────────────────┐│
│ │ NEFT-LANDLORD-RENT         ││
│ │ ₹ 15,000.00 [▼ Expense]    ││
│ │ ────────────────────────── ││
│ │ Date: 01/11                ││
│ │ ────────────────────────── ││
│ │ Category: [Rent ▼]         ││
│ │ Confidence: 🟢 High        ││
│ │ ────────────────────────── ││
│ │ [ ✓ Approve ]  [ ✗ Flag ] ││
│ └────────────────────────────┘│
│ ┌────────────────────────────┐│
│ │ UNKNOWN-MERCHANT-XYZ       ││
│ │ ₹ 2,000.00 [▼ Expense]     ││
│ │ ────────────────────────── ││
│ │ Date: 01/12                ││
│ │ ────────────────────────── ││
│ │ Category: [Select ▼] ⚠️    ││ (Empty, needs input)
│ │ Sub: [--- ▼]               ││
│ │ Confidence: 🔴 Low (!!)    ││
│ │ ────────────────────────── ││
│ │ [ ✓ Approve ]  [ ✗ Flag ] ││
│ └────────────────────────────┘│
├──────────────────────────────┤
│ FAB: [↑ Sync & Train (3)]    │ (Floating Action Button)
│ Shows count of changes       │
└──────────────────────────────┘
```

**Card Design:**
- Each card represents one transaction
- Tap category dropdown to edit
- Tap "Approve" to mark as synced
- Tap "Flag" to mark for review later
- FAB shows number of unsaved changes

---

## 2. Confidence Indicator Design

**Indicator Styles:**

| Level | Color | Symbol | Meaning | Action |
|-------|-------|--------|---------|--------|
| HIGH | Green 🟢 | ✓ | >90% confidence | Auto-approved |
| MEDIUM | Orange 🟡 | ? | 60-90% confidence | Review suggested |
| LOW | Red 🔴 | ! | <60% confidence | Manual review required |

**Default Filter Behavior:**
- Initially show: LOW + MEDIUM items (user needs to confirm)
- "High confidence" items can be hidden to reduce clutter
- Toggle to show all items if needed

---

## 3. Sync & Train Action

**Location:**
- Desktop: Top-right header button (green highlight)
- Mobile: Floating Action Button (bottom-right)

**Behavior:**

```
User clicks "Sync & Train"
    ↓
Show confirmation dialog:
"Sync changes to Google Sheets and retrain AI?"
[Cancel] [Proceed]
    ↓ (Proceed clicked)
Show progress overlay:
"Syncing 3 changes..."
[████████░░░░░░░] 50%
    ↓ (Sync complete)
Index DB → Google Sheets (via OAuth token)
1. Append new transactions
2. Update rules (new user mappings)
3. Recalculate Dashboard_Data tab
    ↓
WASM Engine: Retrain ML model
model.partial_fit(new_data)
    ↓
Save updated model to IndexedDB & Google Drive
    ↓
Show toast notification:
"✨ Sync complete. Your AI just got smarter!"
[Dismiss]
    ↓
Dashboard updates in real-time
```

---

## 4. Ad Placement Strategy

### 4.1 Placement Locations

**Dashboard:**

| Position | Format | Size | CPM Tier |
|----------|--------|------|----------|
| Sidebar | Skyscraper | 160x600 | High |
| Between Widgets | Native Banner | 728x90 | Medium |
| Below Category Chart | Native In-Feed | 300x250 | High |
| Mobile Sticky Footer | Mobile Banner | 320x50 | Medium |

**Import Screen:**
- **Primary:** Medium Rectangle (300x250) during progress display
- **Placement:** Centered below progress bar
- **Context:** High engagement moment (user waiting for processing)

**Transaction Review:**
- **Desktop:** In-feed native ad after every 20th row in table
- **Mobile:** Native card ad between every 5th card
- **Format:** Contextual (e.g., credit card offers for finance category)

### 4.2 Ad Configuration

**Ad Placeholder Component:**

```typescript
// Angular component for ad rendering
<app-ad-placeholder
  [format]="'native'"
  [size]="'300x250'"
  [context]="'finance'"
  (adLoaded)="onAdLoaded()"
  (adClicked)="onAdClicked()">
</app-ad-placeholder>
```

**Attributes:**
- `format`: "native", "banner", "skyscraper"
- `size`: "300x250", "728x90", "160x600", "320x50"
- `context`: Category or screen context for targeting

---

## 5. Navigation Design

### 5.1 Desktop Navigation

**Sidebar (Always visible):**
- Logo/Brand name at top
- Menu items (Dashboard, Transactions, Import Data, Settings)
- Active item highlighted
- Collapsible on narrow screens

### 5.2 Mobile Navigation

**Bottom Navigation:**
- 4-5 icons at bottom of screen
- Labels on first load, then icons only
- Active item highlighted

**Items:**
1. 🏠 Dashboard
2. 📊 Transactions
3. 📤 Import
4. ⚙️ Settings

---

## 6. Theme & Color Palette

### 6.1 Colors

**Primary Colors:**
- Trust Blue: `#1E3A8A` (Main brand color)
- Action Green: `#10B981` (Positive, approvals)
- Warning Orange: `#F59E0B` (Caution, medium confidence)
- Error Red: `#EF4444` (Problems, low confidence)

**Semantic Colors:**
- Income: Green `#10B981`
- Expense: Red `#EF4444`
- Neutral: Gray `#6B7280`

### 6.2 Themes

**Light Mode (Default):**
- Background: White `#FFFFFF`
- Text: Dark Gray `#1F2937`
- Cards: Light Gray `#F9FAFB`
- Border: Light Gray `#E5E7EB`

**Dark Mode:**
- Background: Dark Gray `#111827`
- Text: Light Gray `#F3F4F6`
- Cards: Dark Blue `#1F2937`
- Border: Dark Gray `#374151`

---

## 7. Responsive Breakpoints

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| Mobile | < 640px | Single column, bottom nav |
| Tablet | 640px - 1024px | 2 columns, sidebar |
| Desktop | > 1024px | Full layout with sidebar |

---

## 8. Accessibility Features

**Keyboard Navigation:**
- Tab through all interactive elements
- Enter to activate buttons and dropdowns
- Arrow keys in tables and dropdowns

**Screen Reader Support:**
- All interactive elements have proper ARIA labels
- Form inputs have associated labels
- Images have alt text
- Semantic HTML structure

**Color Contrast:**
- All text meets WCAG AA standards (4.5:1 for normal text)
- Color not sole indicator (use icons + color)

---

## 9. Loading & Error States

### 9.1 Loading States

**Skeleton Loaders:**
- Dashboard widgets show placeholder shimmer effect
- Table rows show skeleton rows
- Charts show empty state until data loads

### 9.2 Error States

**Toast Notifications:**
- Position: Top-right corner
- Auto-dismiss after 5 seconds
- Action button (Retry, Dismiss)

**Error Messages:**
- User-friendly language (no stack traces)
- Suggest next steps (e.g., "Try uploading a different file format")
- Contact support link for persistent issues

---

## References

- FSD: [../specifications/fsd_1.0.md](../specifications/fsd_1.0.md)
- UX Design: [../specifications/ux_design_1.0.md](../specifications/ux_design_1.0.md)
- Architecture: [01_ARCHITECTURE.md](01_ARCHITECTURE.md)
- Data Model: [02_DATA_MODEL.md](02_DATA_MODEL.md)
