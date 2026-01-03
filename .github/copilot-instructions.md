# Copilot Instructions

# Project Context: MoneyInsight

## Technical Strategy
- **Frontend:** Angular 21 SPA.
- **Engine:** Rust compiled to WASM. **Note:** We are porting logic from reference Python scripts into Rust.
- **Data Persistence:** Primary storage is Google Sheets (user-owned). 
- **Performance:** Use **IndexedDB** for browser-level caching (Offline-first approach).
- **Ad Strategy:** Implement "Ad Placeholders" in "decision moments" such as near Expense Analysis widgets and during import processing.

## Implementation Constraints
- **Formats:** ONLY Excel (.xlsx/xls) and CSV are supported. No PDF support.
- **Privacy:** All parsing must happen within the Rust WASM layer; no raw data is sent to a server [2, 8].
- **Scalability:** The Rust engine must use a **plugin architecture** to allow easy addition of new bank parsers (e.g., SBI, ICICI).
