# UI Wireframes and UX Specifications

> **Deprecated — superseded by [`ux_design_2.0.md`](ux_design_2.0.md) (2026-04-13).**  
> This document remains for historical reference only. The Dashboard section (§ "Screen: The Dashboard") is replaced by the v2.0 four-section full-width layout. The Import & Processing and Transaction Review screens are unchanged and re-documented in `ux_design_2.0.md`.

---

Three critical views viz., 1. **Dashboard (Home)**, 2. **Upload & Processing (The Engine)**, and 3. **Transaction Review (The Data)**. Each section includes layouts for Desktop and Mobile, specifically highlighting **AdSense Placements** (\[AD\]) to maximize revenue keeping best user experience.

### Global Navigation & Layout

* **Philosophy:** Minimalist sidebar (desktop) / Bottom nav (mobile) to maximize screen real estate for data.  
* **Theme:** "Trust Blue" or Dark Mode options (finance apps benefit from dark mode).

### Screen: The Dashboard (Home)

* **Goal:** High-level financial health check.  
* **Data Source:** Google Sheet (Pivot tables).

#### Desktop Layout

Plaintext

\+----------------------+-------------------------------------------------------+  
|  LOGO  \[FinSheet\]    |  Search Trans... | \[Profile/Drive Status: Connected\]  |  
\+----------------------+-------------------------------------------------------+  
|  NAV BAR             |  HEADER: \[ Period: Last Month v \] \[ Acct: All v \]     |  
|                      |                                                       |  
|  \[ Dashboard \]       |  \+-------------------+  \+--------------------------+  |  
|  \[ Transactions \]    |  |  Total Net Flow   |  |     Income vs Expense    |  |  
|  \[ Import Data  \]    |  |     \+$12,400      |  |     \[ Bar Chart \]        |  |  
|  \[ Settings     \]    |  |   (green arrow)   |  |                          |  |  
|                      |  \+-------------------+  \+--------------------------+  |  
|  \------------------  |                                                       |  
|                      |  \+-------------------------------------------------+  |  
|      \[ AD \]          |  |           Category Breakdown (Pie)              |  |  
|   (Skyscraper        |  |  \[Food\] \[Rent\] \[Travel\]                         |  |  
|    160x600)          |  \+-------------------------------------------------+  |  
|                      |                                                       |  
|                      |  \+-------------------------------------------------+  |  
|                      |  | \[ AD \] (Native Banner \- 728x90)                 |  |  
|                      |  \+-------------------------------------------------+  |  
|                      |                                                       |  
|                      |  \+-------------------------------------------------+  |  
|                      |  | Recent Transactions (Preview Table)             |  |  
|                      |  | Date | Desc | Amt | Cat | Status                |  |  
|                      |  \+-------------------------------------------------+  |  
\+----------------------+-------------------------------------------------------+

#### Mobile Layout

* **Change:** Stacked widgets.  
* **Ad Placement:** A "Sticky" bottom banner (320x50) that stays visible as users scroll.

###  Screen: Import & AI Processing (WASM Engine)

* **Goal:** Run the Rust WASM container, parse the XLS/XLSX/CSV, and show progress. This is the **high-engagement** screen where users wait.

#### Desktop & Mobile (Modal/Overlay)

Plaintext

\+---------------------------------------------------------------+  
|  Import New Statement                                     \[X\] |  
\+---------------------------------------------------------------+  
|                                                               |  
|   1\. Select Bank:  \[ HDFC Bank v \]                            |  
|                                                               |  
|   2\. Upload XLS/XLSX/CSV:   \[ Drag & Drop HDFC Statement Here \]        |  
|                                                               |  
|   3\. Show error message If statement is encrypted or password-protected               |  
|                                                               |  
|   \[ PROCEED TO ANALYZE \]                                      |  
|                                                               |  
|   \---------------------------------------------------------   |  
|   STATUS: Loading Rust WASM Engine... \[||||||||||     \] 60%      |  
|   \> Initializing Pyodide...                                   |  
|   \> Loading 'pandas'...                                       |  
|   \> Loading your Custom ML Model...                           |  
|                                                               |  
|   \+-------------------------------------------------------+   |  
|   |                       \[ AD \]                          |   |  
|   |    "Best Credit Cards for HDFC Users \- Apply Now"     |   |  
|   |           (Medium Rectangle 300x250)                  |   |  
|   \+-------------------------------------------------------+   |  
|                                                               |  
\+---------------------------------------------------------------+

* **UX Note:** Since loading Pyodide and parsing takes 5-15 seconds, placing a high-CPM Medium Rectangle ad here is extremely effective. The user is "captive" watching the progress bar.

### Screen: Transactions (The ML Training Ground)

* **Goal:** Review AI categorization, correct errors, and "Train" the model.  
* **Key Interaction:** When a user changes a category, the system flags it for "Retraining".

#### Desktop Layout (Editable Table)

Plaintext

\+--------------------------------------------------------------------------+  
| Filter: \[Uncategorized Only\] \[Export CSV\] \[Sync to Drive & Train\]        |  
\+--------------------------------------------------------------------------+  
| \[ \] Date  | Description           | Amount  | Category      | Confidence |  
|--------------------------------------------------------------------------|  
| \[ \] 01/10 | UPI-SWIGGY-12345      | 450.00  | \[Food v\]      | (High)     |  
| \[ \] 01/11 | NEFT-LANDLORD-RENT    | 15000.0 | \[Rent v\]      | (High)     |  
| \[ \] 01/12 | UNKNOWN-MERCHANT-XYZ  | 2000.00 | \[Select... v\] | (Low)  (\!) |  
|--------------------------------------------------------------------------|  
|                  \[ AD \] (Native In-Feed Ad)                              |  
|--------------------------------------------------------------------------|  
| \[ \] 01/13 | AMAZON RETAIL         | 599.00  | \[Shopping v\]  | (Med)      |  
\+--------------------------------------------------------------------------+

#### Mobile Layout (Card View)

* **Logic:** Tables break on mobile. We use "Cards" with a focus on quick validation.

Plaintext

\+---------------------------+  
|  \< Prev    Jan 2025  Next \>|  
\+---------------------------+  
| Filter: Needs Review (3)  |  
\+---------------------------+  
|                           |  
|  \+---------------------+  |  
|  | SWIGGY BANGALORE    |  |  
|  | ₹ 450.00            |  |  
|  | \------------------- |  |  
|  | Cat: \[ Food   v \]   |  | \<--- Tap to change  
|  | Sub: \[ Dining v \]   |  |  
|  | \[ Confirm \]         |  |  
|  \+---------------------+  |  
|                           |  
|  \+---------------------+  |  
|  |      \[ AD \]         |  |  
|  |   (Native Card)     |  |  
|  \+---------------------+  |  
|                           |  
|  \+---------------------+  |  
|  | LIC PREMIUM PAY     |  |  
|  | ₹ 2,100.00          |  |  
|  | \------------------- |  |  
|  | Cat: \[ Insur... v \] |  |  
|  | \[ Confirm \]         |  |  
|  \+---------------------+  |  
|                           |  
\+---------------------------+  
| FAB: \[ (+) Add Cash \]     |  
\+---------------------------+

### Interaction Specs (The "Machine Learning Loop")

This is the most complex part of the UI/UX. The user needs to feel like they are teaching the AI.

1. **The "Confidence" Indicator:**  
   * **Green Dot:** AI is \>90% sure (e.g., "Starbucks" \= Coffee).  
   * **Yellow Dot:** AI is guessing (e.g., "Amazon" \= Shopping? Or Groceries?).  
   * **Red Dot:** AI has no idea.  
   * **UX Requirement:** Default the filter to show "Red/Yellow" items first so the user can quickly fix them.  
2. **The "Sync & Train" Action:**  
   * **Location:** Floating Action Button (Mobile) or Top Right Header (Desktop).  
   * **Behavior:**  
     1. User clicks "Sync".  
     2. App saves data to Google Sheets Transactions tab.  
     3. **App saves the new mappings** (e.g., "FreshMenu" \-\> "Food") to the Rules tab.  
     4. App triggers the Rust WASM background worker to model.partial\_fit() (incremental training) and saves the updated .pkl model back to Drive.  
     5. Toast Message: *"Sync complete. Your AI just got smarter\!"*
