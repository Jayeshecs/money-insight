
# Functional Specification Document (FSD) – MoneyInsight

## 1. Overview

MoneyInsight is a privacy-first, serverless personal finance platform. It enables users to upload bank statements, auto-categorize transactions using AI, and visualize their financial health—all while keeping data in their own Google Drive. The platform is built with a Rust WASM engine for parsing, Angular for the frontend, and Google Sheets for persistent storage.

---

## 2. Core Modules & Functional Requirements

### 2.1 Ingestion & Intelligence Layer (WASM Engine)

- **File Input:** Users can upload Excel (.xlsx/.xls) or CSV files exported from supported banks (e.g., HDFC Savings, HDFC Credit Card).
- **Password Handling:** If a statement is password-protected, prompt the user for the password and decrypt client-side.
- **Plugin Architecture:** The Rust WASM engine uses a `Parser` trait. Each bank/format is a plugin implementing:
	- `identify(&self, data: &str) -> bool`
	- `parse(&self, data: &str) -> Vec<Transaction>`
- **Auto-Detection:** On upload, the engine iterates through plugins to auto-detect the correct parser based on headers or unique patterns.
- **AI Categorization:** Transactions are categorized using ML. Confidence levels (High/Medium/Low) are shown in the UI.
- **User Feedback Loop:** When users correct a category, the mapping is saved to the “Rules” tab in Google Sheets and triggers incremental model training.

### 2.2 Data Management & Caching

- **IndexedDB First:** Parsed data is written to IndexedDB for offline-first access and instant UI updates.
- **Google Sheets Sync:** A background service syncs IndexedDB changes to the user’s Google Sheets:
	- **Transactions Tab:** All parsed and categorized transactions.
	- **Rules Tab:** User-defined categorization rules.
	- **Dashboard_Data Tab:** Aggregated data for widgets.
- **State Management:** Angular signals or RxJS update dashboard widgets in real time as the WASM engine emits new data.

### 2.3 Visualization Dashboard

- **Widgets:** Net Flow, Income vs Expense, Category Breakdown (Pie), Recent Transactions.
- **Filters:** Period (Last Month, Custom), Account (All, Specific).
- **Responsive Design:** 
	- **Desktop:** Sidebar navigation, grid widgets, in-table ad placements.
	- **Mobile:** Bottom navigation, stacked widgets, card-based transaction review.
- **Transaction Review:** Editable table (desktop) or card view (mobile) for reviewing and correcting AI-categorized transactions.
- **ML Loop UI:** Confidence indicators (Green/Yellow/Red dots), default filter to show low-confidence items first, “Sync & Train” action to update rules and retrain the model.

---

## 3. Monetization & Ad Placement

- **Import Screen:** Show a 300x250 ad placeholder during WASM engine initialization and processing (high engagement).
- **Dashboard:**
	- **Sidebar:** Skyscraper ad (160x600) on desktop.
	- **Native Banner:** 728x90 between widgets.
	- **Category Breakdown:** Ad below the pie chart.
	- **Recent Transactions:** Native ad after every 20th row (desktop), sticky bottom banner (320x50) on mobile.
- **Transaction Review:** In-feed native ad in the transaction table (desktop) or as a card (mobile).
- **AdSense Compliance:** All ad placements are designed to maximize revenue at “decision moments” without disrupting user experience.

---

## 4. User Flow

1. **Onboarding:** User logs in with Google, app creates a dedicated Google Sheet.
2. **Import:** User uploads a statement, enters password if needed.
3. **Processing:** WASM engine parses and categorizes transactions, shows progress bar and ad.
4. **Review:** User reviews/corrects categories, confidence indicators guide attention.
5. **Sync & Train:** User syncs changes, rules are updated, model retrains, and data is pushed to Google Sheets.
6. **Dashboard:** User views updated analytics and widgets.

---

## 5. Error Handling & Edge Cases

- **Unsupported Format:** If no parser matches, show a “Report Broken Format” option.
- **Sync Failures:** If Google Sheets sync fails, queue changes for retry and notify the user.
- **Mobile UX:** Use card-based review for easy categorization on small screens.

---

## 6. Privacy & Security

- **Client-Side Processing:** All parsing and ML happen in-browser (WASM); no raw data is sent to any server.
- **Google Sheets Storage:** Only the user’s own Google Drive is used for persistent storage.
- **OAuth Scopes:** App requests only drive.file scope for minimal access.

---

## 7. Technical Constraints

- **Supported Formats:** Only Excel (.xlsx/.xls) and CSV. No PDF support.
- **Extensibility:** New bank formats can be added as Rust plugins.
- **Performance:** IndexedDB caching ensures offline access and fast UI.

---

## 8. UX & Accessibility

Refer to the detailed wireframes and specifications in `ux_design_1.0.md` for full UI/UX guidance. Key highlights:

- **Navigation & Layout:**
	- Minimalist sidebar (desktop) and bottom navigation (mobile) maximize data visibility.
	- Responsive layouts for Dashboard, Import/Processing, and Transaction Review screens.
- **Theme:**
	- "Trust Blue" and Dark Mode options for optimal finance app experience.
- **Ad Placement:**
	- Strategic AdSense placeholders: skyscraper (sidebar), native banners (between widgets), sticky bottom banners (mobile), and in-feed ads (transaction lists/cards).
	- Ads are placed at high-engagement moments (e.g., during import processing, between transaction rows) to maximize revenue without disrupting UX.
- **Interaction Design:**
	- Transaction review features confidence indicators (green/yellow/red dots) and default filters to surface low-confidence AI categorizations first.
	- “Sync & Train” action is prominent (FAB on mobile, header on desktop) to reinforce the ML feedback loop.
- **Accessibility:**
	- All interactive elements are keyboard and screen-reader accessible.
	- Card-based review on mobile for easy, quick categorization.
	- Visual cues and toast messages guide users through key actions (e.g., sync complete, errors).

For wireframes, widget layouts, and ad placement diagrams, see `ux_design_1.0.md`.

---

## 9. Release & Roadmap

- **Sprint 1:** WASM Proof of Concept (HDFC Savings/Credit Card support, IndexedDB, Google Sheets sync).
- **Sprint 2:** Dashboard UI, Ad placements, ML feedback loop.
- **Sprint 3:** Mobile optimization, extensibility for new banks, advanced analytics.

