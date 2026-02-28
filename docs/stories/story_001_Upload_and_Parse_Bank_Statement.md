## Story: Upload and Parse Bank Statement (WASM Engine)

**Status:** ✅ QA Verified — All Tests Passing  
**Sprint:** Sprint 1  
**Last Updated:** 2026-02-28

**As a** privacy-focused user  
**I want** to upload my bank statement (Excel/CSV) and have it parsed in-browser  
**So that** my financial data never leaves my device

### Scenarios
- User uploads a supported HDFC Savings (xlsx) or Credit Card statement (xlsx)
- The password protected files are not supported
- Parsing happens client-side using the Rust WASM engine

### Acceptance Criteria
- Only Excel (.xlsx/.xls) and CSV files are accepted
- Password-protected or encrypted files are rejected with a clear error message
- Parsing is performed entirely in-browser (no server roundtrip)
- Errors for unsupported formats or failed parsing are clearly shown
