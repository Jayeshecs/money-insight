## Story: SBI Savings Bank Parser Plugin

**Status:** On Hold

**As a** SBI Savings Bank account holder  
**I want** MoneyInsight to recognise and parse my SBI account statement  
**So that** I can import and analyse my SBI transactions alongside any HDFC accounts

### Background
Sprint 1 delivered a plugin architecture in the Rust WASM engine (`Parser` trait with `identify()` and `parse()` methods) along with working plugins for HDFC Savings and HDFC Credit Card. Sprint 3 extends the engine by adding a first third-party bank plugin — SBI Savings — proving the extensibility of the architecture.

SBI online banking exports account statements as CSV files. The format includes a header block followed by fixed-layout rows with columns: `Txn Date`, `Value Date`, `Description`, `Ref No./Cheque No.`, `Debit`, `Credit`, `Balance`.

### Scenarios
- User uploads an SBI Savings account statement CSV file
- Engine auto-detects the SBI parser and parses all transactions correctly
- Parsed transactions are stored to IndexedDB and shown in the Transactions Review screen
- An unsupported or unknown CSV format (not SBI) shows the "unrecognised format" error
- Sequential upload of an HDFC file followed by an SBI file each use independent, correct parsers

### Acceptance Criteria
1. A new Rust struct `SbiSavingsParser` implements the `Parser` trait (`identify()` + `parse()`).
2. `SbiSavingsParser::identify()` returns `true` for SBI CSV files and `false` for HDFC and unknown formats.
3. `SbiSavingsParser::parse()` correctly extracts: `date` (DD/MM/YYYY → YYYY-MM-DD), `narration` (Description trimmed), `amount` (positive Debit as expense, positive Credit as income), `balance`, and `transactionType` (`EXPENSE` / `INCOME`).
4. The plugin is registered in the engine's auto-detection chain alongside the existing HDFC plugins — no changes to the Angular front-end are required to support the new parser.
5. `[data-testid="upload-success"]` is shown after a valid SBI CSV is uploaded and parsed, with a non-zero transaction count displayed.
6. `[data-testid="parser-error"]` is shown if the uploaded file is neither a known HDFC format nor a valid SBI CSV.
7. All existing HDFC parser E2E tests continue to pass (no regression).
8. The WASM `auto_detect_parser()` function is covered by a Rust unit test for SBI CSV identification.
9. An SBI-specific integration test (`tests/sbi_parser.rs` or `tests/integration.rs`) validates end-to-end parse output for a sample SBI CSV fixture file.

### Technical Notes
- Engine path: `src/engine/src/parsers/sbi_savings.rs` (new file); register in `src/engine/src/lib.rs` or `src/engine/src/parsers/mod.rs`.
- SBI CSV identification heuristic: first non-blank CSV row contains the column header `"Txn Date"` followed by `"Value Date"` and `"Description"` (case-insensitive).
- Amounts: SBI exports separate Debit and Credit columns — one will be empty / `"0"` / `"-"` on any given row. Parse accordingly.
- Date format: SBI uses `DD/MM/YYYY` — convert to `YYYY-MM-DD` ISO format for `Transaction.date`.
- Rust test fixture: place a minimal sample SBI CSV file at `src/engine/tests/fixtures/sbi_savings_sample.csv`.
- No Angular code changes needed; all changes are in the Rust engine only.
- After implementing, rebuild WASM (`build.sh` / `build.bat`) and re-deploy to `src/client/public/`.

### PO Clarifications (2025-06-XX — post agent pre-analysis)

**C1 — Header scanning strategy:**
`identify()` must scan the **first 20 lines** (not just line 0) for the first non-blank row that matches the SBI header pattern. Real SBI Net Banking CSV exports have the header as the first non-blank row (no metadata preamble), but the 20-line window provides a safe buffer. The existing HDFC false-positive risk is nil: HDFC Savings uses `"Date"` / `"Narration"` / `"Withdrawal Amt."` — none overlap with `"Txn Date"` / `"Value Date"` / `"Description"`. All five columns (`Txn Date`, `Value Date`, `Description`, `Debit`, `Credit`) must be present for a positive identification.

**C2 — Debit/Credit empty-cell encoding:**
SBI modern CSV exports use **empty string `""`** for the unpopulated column — not `"0"` and not `"-"`. Strip comma-thousands separators (`"5,000.00"` → `5000.00`) and double-quotes before parsing. Treat the following as "absent": empty string after trim. If a cleaned value parses to exactly `0.0`, also treat as absent (guard: `> 0.0`).

**C3 — Rows where both Debit and Credit are empty:**
Silently skip these rows (e.g., "Opening Balance" rows). Do NOT return an error for them. Log a debug trace but do not count them as transactions.

**C4 — Malformed rows (both Debit and Credit non-empty and non-zero):**
Skip the row and continue parsing. Return the successfully parsed transactions; do NOT abort the entire file. The error count should be surfaced in the `parse()` result if the `ParseResult` struct supports it; otherwise log a warning.

**C5 — Quoted CSV fields (RFC 4180):**
The parser MUST handle RFC 4180 quoting. Descriptions containing a comma (e.g., `"NEFT/ABC,DEF"`) are quoted in the raw CSV. Use a proper delimiter-aware split rather than a naive `split(',')`. A minimal state-machine implementation in Rust is acceptable (no external crate needed).

**C6 — Date format:**
SBI uses `DD/MM/YYYY` (4-digit year). Convert to `YYYY-MM-DD`. Validate `year >= 2000`. If `Txn Date` fails to parse, attempt `Value Date` as fallback; if both fail, skip the row.

**C7 — UTF-8 BOM and CRLF:**
Strip a leading UTF-8 BOM (`\u{FEFF}`) if present. Normalise line endings (replace `\r\n` with `\n`) before any processing.

**C8 — Account field:**
Set `account = "SBI_SAVINGS"` (fixed string). No account number extraction required for Story 012.

**C9 — SBI Mini Statement (mobile app format):**
Out of scope for Story 012. Only the SBI Net Banking desktop CSV export format (7 fixed columns starting with `Txn Date`) is in scope.

**C10 — Sequential upload regression (new AC):**
Add **AC10**: After uploading an SBI CSV, `[data-testid="parser-name"]` (or equivalent displayed text) must show `"SBI Savings"`. After uploading an HDFC Savings CSV in the same session, it must show `"HDFC Savings"`. Both `[data-testid="upload-success"]` assertions must pass independently. This validates parser isolation.

**C11 — Fixture location:**
Place the test fixture at `src/engine/tests/fixtures/sbi_savings_sample.csv`. The `fixtures/` subdirectory does not yet exist — create it. Document this path convention in the Technical Notes.

**C12 — AC8 correction (Technical Notes update):**
Update Technical Notes: fixture path is `src/engine/tests/fixtures/sbi_savings_sample.csv` (new convention), not `docs/testcases/story_001_testdata/`. The integration test should use `include_str!("fixtures/sbi_savings_sample.csv")` or a relative path from the `tests/` directory.

**C13 — AC8 additional unit test scope:**
The Rust unit test for `auto_detect_parser()` must assert:  
- SBI CSV → returns `SbiSavingsParser` name  
- HDFC Savings CSV → returns `HdfcSavingsParser` name (no regression)  
- Unknown CSV → returns error / "no parser found" (updated error message must mention SBI Savings)
