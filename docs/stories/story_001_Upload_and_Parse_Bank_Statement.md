## Story: Upload and Parse Bank Statement (WASM Engine)

**As a** privacy-focused user  
**I want** to upload my bank statement (Excel/CSV) and have it parsed in-browser  
**So that** my financial data never leaves my device

### Scenarios
- User uploads a supported HDFC Savings or Credit Card statement
- System prompts for password if the file is encrypted
- Parsing happens client-side using the Rust WASM engine

### Acceptance Criteria
- Only Excel (.xlsx/.xls) and CSV files are accepted
- If the file is password-protected, user is prompted and parsing proceeds after correct password
- Parsing is performed entirely in-browser (no server roundtrip)
- Errors for unsupported formats or failed parsing are clearly shown
