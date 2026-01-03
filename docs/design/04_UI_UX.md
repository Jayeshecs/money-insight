# MoneyInsight UI/UX Implementation Design

## 1. Screen Specifications

### 1.1 Dashboard (Home) Screen

**Purpose:** Provide high-level financial health check at a glance.

**Data Source:** Google Sheets (Dashboard_Data tab, Pivot tables)

#### Desktop Layout

**Grid Structure:** 12-column layout with responsive breakpoints

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER                                                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Logo: FinSheet │ Search │ [Profile] [Drive Connected ✓]     │  │
│  └──────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│ SIDEBAR (2 col) │ MAIN CONTENT (10 col)                            │
│                 │                                                   │
│  [Dashboard]    │ ┌──────────────────────────────────────────────┐ │
│  [Transactions] │ │ FILTERS: Period: [Last Month ▼] Account: All ▼ │
│  [Import Data]  │ └──────────────────────────────────────────────┘ │
│  [Settings]     │                                                   │
│                 │ ┌─────────────┐  ┌──────────────────────────────┐ │
│  ┌───────────┐  │ │ Total Flow  │  │  Income vs Expense (Chart)   │ │
│  │  [AD]     │  │ │  +$12,400   │  │  ┌────────────────────────┐  │ │
│  │ Skyscraper│  │ │ (green ▲)   │  │  │     Bar Chart          │  │ │
│  │ 160x600   │  │ │             │  │  └────────────────────────┘  │ │
│  │           │  │ └─────────────┘  └──────────────────────────────┘ │
│  └───────────┘  │                                                   │
│                 │ ┌────────────────────────────────────────────────┐ │
│                 │ │     Category Breakdown (Pie Chart)             │ │
│                 │ │  [Food] [Rent] [Travel] [Shopping] [Other]     │ │
│                 │ └────────────────────────────────────────────────┘ │
│                 │                                                   │
│                 │ ┌────────────────────────────────────────────────┐ │
│                 │ │    [AD] (Native Banner 728x90)                 │ │
│                 │ │  Sponsored: "Best Credit Cards for You"        │ │
│                 │ └────────────────────────────────────────────────┘ │
│                 │                                                   │
│                 │ ┌────────────────────────────────────────────────┐ │
│                 │ │ Recent Transactions                            │ │
│                 │ │ ┌────────────────────────────────────────────┐ │ │
│                 │ │ │ Date │ Desc │ Amount │ Category │ Status   │ │ │
│                 │ │ ├────────────────────────────────────────────┤ │ │
│                 │ │ │ 01/10│SWIGGY│ -450  │ Food (🟢)│ ✓ Approved│ │ │
│                 │ │ │ 01/11│NEFT  │-15000 │ Rent (🟢)│ ✓ Approved│ │ │
│                 │ │ │ 01/12│AMAZON│ -599  │ Shop (🟡)│ ? Review  │ │ │
│                 │ │ └────────────────────────────────────────────┘ │ │
│                 │ │ [View All Transactions >]                      │ │
│                 │ └────────────────────────────────────────────────┘ │
│                 │                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

**Component Details:**

| Component | Type | Dimensions | Data Source |
|-----------|------|-----------|-------------|
| Total Flow Widget | Card | 3 cols × 4 rows | SUM(income - expense) |
| Income vs Expense | Chart (Bar) | 5 cols × 4 rows | Monthly breakdown |
| Category Breakdown | Chart (Pie) | 4 cols × 4 rows | By category aggregate |
| Sidebar Ad | Ad Placeholder | 160x600px | AdSense |
| Native Banner Ad | Ad Placeholder | 728x90px | AdSense |
| Recent Transactions | Table | Full width | Last 10 txns |

**Widget Specifications:**

**Total Flow Widget:**
- **Metric:** Net flow = Income - Expense
- **Time Period:** Configurable (default: Last Month)
- **Color:** Green for positive, Red for negative
- **Icon:** Up arrow for positive, down arrow for negative
- **Sub-text:** "vs. Previous Month" with % change

**Income vs Expense Chart:**
- **Type:** Grouped Bar Chart
- **X-axis:** Months (last 6 months)
- **Y-axis:** Amount (INR)
- **Series:** Income (blue), Expense (orange)
- **Interaction:** Hover to see exact values

**Category Breakdown:**
- **Type:** Pie Chart
- **Labels:** Category names + percentage
- **Colors:** Predefined palette for each category
- **Interaction:** Click to filter transactions by category

**Recent Transactions Table:**
- **Columns:** Date, Description, Amount, Category, Status
- **Rows:** Last 10 transactions (descending by date)
- **Row Click:** Navigate to transaction detail/edit screen
- **Pagination:** "View All" button at bottom

#### Mobile Layout

**Stack Order (Top to Bottom):**

```
┌─────────────────────────────┐
│ HEADER (Compact)            │
│ [Menu] Logo │ [Profile]     │
├─────────────────────────────┤
│ FILTERS                     │
│ Period: [Last Month ▼]      │
│ Account: [All ▼]            │
├─────────────────────────────┤
│ WIDGETS (Stacked)           │
│ ┌─────────────────────────┐ │
│ │ Total Flow              │ │
│ │ +$12,400 (green ▲)      │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Income vs Expense       │ │
│ │ [Bar Chart - smaller]   │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Category Breakdown      │ │
│ │ [Pie Chart]             │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │    [AD] (320x50 Sticky) │ │
│ │ Stays at bottom         │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Recent Transactions     │ │
│ │ ┌───────────────────┐   │ │
│ │ │ SWIGGY - 450      │   │ │
│ │ │ Food | 01/10      │   │ │
│ │ └───────────────────┘   │ │
│ │ ┌───────────────────┐   │ │
│ │ │ NEFT - 15000      │   │ │
│ │ │ Rent | 01/11      │   │ │
│ │ └───────────────────┘   │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ BOTTOM NAV                  │
│ [Home] [Txn] [Import] [...] │
└─────────────────────────────┘
```

**Key Differences:**
- Widgets stack vertically
- Sidebar collapsed into hamburger menu
- Sticky footer ad (320x50) visible during scroll
- Bottom navigation for easier thumb access

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
