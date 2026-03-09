// SBI Savings (Net Banking CSV export) parser module
//
// PO-clarified SBI CSV format (7 fixed columns):
//   Txn Date,Value Date,Description,Ref No./Cheque No.,Debit,Credit,Balance
//
// Key requirements (PO clarifications C1–C13):
//   C1  – Scan first 20 lines; all five headers must be present (case-insensitive).
//   C2  – Treat empty-string OR "0.00" in amount columns as absent; strip comma-thousands.
//   C3  – Both-empty rows (Opening Balance) are silently skipped.
//   C4  – Both-non-empty rows are silently skipped (malformed).
//   C5  – RFC 4180 quoted fields (comma inside description handled by state-machine).
//   C6  – Date format DD/MM/YYYY → YYYY-MM-DD; fallback to Value Date; skip row if both fail.
//   C7  – Strip UTF-8 BOM; normalise CRLF → LF.
//   C8  – account = "SBI_SAVINGS".

use crate::traits::BankParser;
use crate::models::{Transaction, TransactionType};

pub struct SbiSavingsParser;

// ---------------------------------------------------------------------------
// Required SBI header columns (case-insensitive)
// ---------------------------------------------------------------------------
const REQUIRED_HEADERS: &[&str] = &["txn date", "value date", "description", "debit", "credit"];

// ---------------------------------------------------------------------------
// BankParser implementation
// ---------------------------------------------------------------------------

impl BankParser for SbiSavingsParser {
    /// Identify whether `data` is an SBI Savings Net Banking CSV export.
    ///
    /// Strategy (C1):
    ///   1. Strip BOM and normalise CRLF.
    ///   2. Scan the first 20 lines for the first non-blank line.
    ///   3. Split on comma, trim, lower-case, strip double-quotes each token.
    ///   4. All five required headers must be present in that single line.
    fn identify(&self, data: &str) -> bool {
        let preprocessed = preprocess(data);

        for line in preprocessed.lines().take(20) {
            let trimmed = line.trim();
            if trimmed.is_empty() {
                continue;
            }

            // Split on comma (simple split is fine for the header row — no quoted commas expected there)
            let tokens: Vec<String> = trimmed
                .split(',')
                .map(|t| t.trim().to_lowercase().replace('"', ""))
                .collect();

            // All required headers must be present
            let all_present = REQUIRED_HEADERS
                .iter()
                .all(|h| tokens.iter().any(|t| t.as_str() == *h));

            if all_present {
                // Explicit negative checks: reject HDFC formats that share some column names
                // HDFC Savings uses "narration" and "withdrawal amt."
                // HDFC Credit Card uses "transaction type"
                let has_narration = tokens.iter().any(|t| t == "narration");
                let has_withdrawal_amt = tokens.iter().any(|t| t.contains("withdrawal amt"));
                let has_transaction_type = tokens.iter().any(|t| t == "transaction type");

                if has_narration || has_withdrawal_amt || has_transaction_type {
                    return false;
                }

                return true;
            }

            // Only check the first non-blank line
            break;
        }

        false
    }

    /// Parse an SBI Savings CSV into a list of `Transaction` objects.
    fn parse(&self, data: &str) -> Result<Vec<Transaction>, String> {
        let content = preprocess(data);
        let lines: Vec<&str> = content.lines().collect();

        // ------------------------------------------------------------------
        // Find header row (first non-blank line) and map column indices
        // ------------------------------------------------------------------
        let (header_idx, col_map) = find_header_row(&lines)?;

        let txn_date_col = *col_map
            .get("txn date")
            .ok_or("Header 'Txn Date' not found")?;
        let val_date_col = *col_map
            .get("value date")
            .ok_or("Header 'Value Date' not found")?;
        let desc_col = *col_map
            .get("description")
            .ok_or("Header 'Description' not found")?;
        let debit_col = *col_map
            .get("debit")
            .ok_or("Header 'Debit' not found")?;
        let credit_col = *col_map
            .get("credit")
            .ok_or("Header 'Credit' not found")?;

        // ------------------------------------------------------------------
        // Parse data rows
        // ------------------------------------------------------------------
        let mut transactions: Vec<Transaction> = Vec::new();

        for line in &lines[header_idx + 1..] {
            let trimmed = line.trim();
            if trimmed.is_empty() {
                continue;
            }

            let fields = parse_csv_line(trimmed);

            // Skip rows that are shorter than the minimum we need
            let min_cols = [txn_date_col, val_date_col, desc_col, debit_col, credit_col]
                .iter()
                .max()
                .copied()
                .unwrap_or(0)
                + 1;

            if fields.len() < min_cols {
                continue;
            }

            // --- Date (C6) ---
            let txn_date_raw = fields[txn_date_col].trim();
            let val_date_raw = fields[val_date_col].trim();

            let parsed_date = match parse_sbi_date(txn_date_raw) {
                Ok(d) => d,
                Err(_) => match parse_sbi_date(val_date_raw) {
                    Ok(d) => d,
                    Err(_) => continue, // skip row – both dates invalid
                },
            };

            // --- Amounts (C2) ---
            let raw_debit = fields[debit_col].trim().to_string();
            let raw_credit = fields[credit_col].trim().to_string();

            let debit_opt = parse_amount(&raw_debit);
            let credit_opt = parse_amount(&raw_credit);

            let (amount, is_credit) = match (debit_opt, credit_opt) {
                (Some(d), None) => (d, false),  // EXPENSE
                (None, Some(c)) => (c, true),   // INCOME
                (None, None) => continue,       // C3: Opening Balance / both empty — silently skip
                (Some(_), Some(_)) => continue, // C4: malformed — silently skip
            };

            // --- Description / narration ---
            let narration = fields[desc_col].trim().to_string();

            // --- Transaction type (AC3: debit → Expense, credit → Income) ---
            let transaction_type = if is_credit {
                TransactionType::Income
            } else {
                TransactionType::Expense
            };

            let credit_indicator = if is_credit {
                "Yes".to_string()
            } else {
                String::new()
            };

            let txn = Transaction::new(
                parsed_date,
                "SBI_SAVINGS".to_string(),
                narration,
                amount,
                credit_indicator,
                transaction_type,
                "SBI_SAVINGS".to_string(),
            );

            transactions.push(txn);
        }

        Ok(transactions)
    }

    fn name(&self) -> &'static str {
        "SBI Savings"
    }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/// Strip UTF-8 BOM and normalise CRLF → LF (C7).
fn preprocess(data: &str) -> String {
    let stripped = data.strip_prefix('\u{FEFF}').unwrap_or(data);
    stripped.replace("\r\n", "\n").replace('\r', "\n")
}

/// Locate the first non-blank line that contains ALL required SBI headers,
/// returning its index and a map of lowercase-header → column-index.
fn find_header_row(
    lines: &[&str],
) -> Result<(usize, std::collections::HashMap<String, usize>), String> {
    for (idx, line) in lines.iter().enumerate().take(20) {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }

        // Simple comma-split is fine for the header line
        let tokens: Vec<String> = trimmed
            .split(',')
            .map(|t| t.trim().to_lowercase().replace('"', ""))
            .collect();

        let all_present = REQUIRED_HEADERS
            .iter()
            .all(|h| tokens.iter().any(|t| t.as_str() == *h));

        if all_present {
            let map: std::collections::HashMap<String, usize> = tokens
                .into_iter()
                .enumerate()
                .map(|(i, t)| (t, i))
                .collect();
            return Ok((idx, map));
        }

        // Only the first non-blank line is checked
        break;
    }

    Err("Invalid SBI Savings format: required header row not found".to_string())
}

/// Parse a single CSV line using a minimal RFC 4180 state machine (C5).
///
/// Handles:
///   * Quoted fields (double-quote delimited)
///   * Escaped quotes inside quoted fields (`""` → `"`)
///   * Empty fields (consecutive commas or trailing comma)
/// Each parsed field is trimmed of leading/trailing whitespace.
pub fn parse_csv_line(line: &str) -> Vec<String> {
    let mut fields: Vec<String> = Vec::new();
    let mut chars = line.chars().peekable();
    let mut expect_field = true; // we always start expecting at least one field

    while expect_field {
        let mut field = String::new();

        if chars.peek() == Some(&'"') {
            // --- Quoted field ---
            chars.next(); // consume opening `"`
            loop {
                match chars.next() {
                    None => break, // unterminated quote — accept what we have
                    Some('"') => {
                        if chars.peek() == Some(&'"') {
                            chars.next(); // consume second `"` of escape sequence
                            field.push('"');
                        } else {
                            break; // closing `"`
                        }
                    }
                    Some(c) => field.push(c),
                }
            }
            // After closing `"`, skip until comma or end (handles RFC 4180 strictly)
            while let Some(&c) = chars.peek() {
                if c == ',' {
                    break;
                }
                chars.next();
            }
        } else {
            // --- Unquoted field ---
            while let Some(&c) = chars.peek() {
                if c == ',' {
                    break;
                }
                field.push(chars.next().unwrap());
            }
        }

        fields.push(field.trim().to_string());

        // Consume comma → another field follows; end of input → stop.
        if chars.peek() == Some(&',') {
            chars.next();
            expect_field = true;
        } else {
            expect_field = false;
        }
    }

    fields
}

/// Convert `DD/MM/YYYY` (4-digit year, year >= 2000) → `YYYY-MM-DD` (C6).
fn parse_sbi_date(date_str: &str) -> Result<String, String> {
    let parts: Vec<&str> = date_str.split('/').collect();
    if parts.len() != 3 {
        return Err(format!("Invalid SBI date format: '{}'", date_str));
    }

    let day: u32 = parts[0]
        .parse()
        .map_err(|_| format!("Invalid day in date: '{}'", date_str))?;
    let month: u32 = parts[1]
        .parse()
        .map_err(|_| format!("Invalid month in date: '{}'", date_str))?;
    let year: u32 = parts[2]
        .parse()
        .map_err(|_| format!("Invalid year in date: '{}'", date_str))?;

    if year < 2000 {
        return Err(format!("Year < 2000 in date: '{}'", date_str));
    }
    if month == 0 || month > 12 {
        return Err(format!("Invalid month in date: '{}'", date_str));
    }
    if day == 0 || day > 31 {
        return Err(format!("Invalid day in date: '{}'", date_str));
    }

    Ok(format!("{:04}-{:02}-{:02}", year, month, day))
}

/// Parse an amount string (C2):
///   * Strip double-quotes (already stripped by RFC 4180 parser, but guard anyway)
///   * Strip comma-thousands separators
///   * Trim whitespace
///   * Empty string → None
///   * Parsed value <= 0.0 → None
fn parse_amount(raw: &str) -> Option<f64> {
    let cleaned = raw.replace('"', "").replace(',', "");
    let trimmed = cleaned.trim();
    if trimmed.is_empty() {
        return None;
    }
    match trimmed.parse::<f64>() {
        Ok(v) if v > 0.0 => Some(v),
        _ => None,
    }
}

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::TransactionType;

    // -----------------------------------------------------------------------
    // identify() tests
    // -----------------------------------------------------------------------

    /// TC-012-001: identify() returns true for valid SBI CSV (fixture file)
    #[test]
    fn test_identify_sbi_csv_fixture() {
        let content = include_str!("../../tests/fixtures/sbi_savings_sample.csv");
        let parser = SbiSavingsParser;
        assert!(
            parser.identify(content),
            "Should identify SBI Savings CSV fixture"
        );
    }

    /// TC-012-001 (inline): identify() returns true for minimal inline SBI header
    #[test]
    fn test_identify_sbi_csv_minimal_header() {
        let data = "Txn Date,Value Date,Description,Ref No./Cheque No.,Debit,Credit,Balance\n\
                    07/03/2026,07/03/2026,TEST,,100.00,,99900.00";
        let parser = SbiSavingsParser;
        assert!(parser.identify(data));
    }

    /// TC-012-001: Case-insensitive header detection
    #[test]
    fn test_identify_sbi_csv_case_insensitive() {
        let data = "TXN DATE,VALUE DATE,DESCRIPTION,REF NO./CHEQUE NO.,DEBIT,CREDIT,BALANCE\n\
                    07/03/2026,07/03/2026,TEST,,100.00,,99900.00";
        let parser = SbiSavingsParser;
        assert!(parser.identify(data));
    }

    /// TC-012-001: Header scanning works with a BOM prefix (C7)
    #[test]
    fn test_identify_strips_bom() {
        let data = "\u{FEFF}Txn Date,Value Date,Description,Ref No./Cheque No.,Debit,Credit,Balance\n\
                    07/03/2026,07/03/2026,TEST,,100.00,,99900.00";
        let parser = SbiSavingsParser;
        assert!(parser.identify(data));
    }

    /// TC-012-002: identify() returns false for HDFC Savings TSV
    #[test]
    fn test_identify_rejects_hdfc_savings() {
        let data = "HDFC Bank\nDate\tNarration\tWithdrawal Amt.\tDeposit Amt.\tBalance";
        let parser = SbiSavingsParser;
        assert!(
            !parser.identify(data),
            "Should NOT identify HDFC Savings format"
        );
    }

    /// TC-012-002 variant: CSV with HDFC-style narration / withdrawal amt columns
    #[test]
    fn test_identify_rejects_hdfc_savings_csv() {
        // A hypothetical CSV version of the HDFC header
        let data = "Date,Narration,Chq./Ref.No.,Value Dt,Withdrawal Amt.,Deposit Amt.,Closing Balance";
        let parser = SbiSavingsParser;
        assert!(!parser.identify(data));
    }

    /// TC-012-002: identify() returns false for HDFC Credit Card format
    #[test]
    fn test_identify_rejects_hdfc_credit_card() {
        let data = "HDFC Bank\nTransaction Date\tTransaction Type\tDescription\tAmount";
        let parser = SbiSavingsParser;
        assert!(!parser.identify(data));
    }

    /// TC-012-003: identify() returns false for empty string
    #[test]
    fn test_identify_rejects_empty() {
        let parser = SbiSavingsParser;
        assert!(!parser.identify(""));
    }

    /// TC-012-003: identify() returns false for a random CSV
    #[test]
    fn test_identify_rejects_random_csv() {
        let data = "Name,Amount,Date,Note\nAlice,100,2026-01-01,Test";
        let parser = SbiSavingsParser;
        assert!(!parser.identify(data));
    }

    /// TC-012-003: identify() returns false if only SOME required headers are present
    #[test]
    fn test_identify_rejects_partial_headers() {
        // Has Txn Date and Value Date but not Debit/Credit
        let data = "Txn Date,Value Date,Description,Ref No.";
        let parser = SbiSavingsParser;
        assert!(!parser.identify(data));
    }

    // -----------------------------------------------------------------------
    // parse() tests
    // -----------------------------------------------------------------------

    /// TC-012-004: parse() correctly extracts a Debit (EXPENSE) row
    #[test]
    fn test_parse_debit_row() {
        let data = "Txn Date,Value Date,Description,Ref No./Cheque No.,Debit,Credit,Balance\n\
                    07/03/2026,07/03/2026,IMPS/416000123456/UPI-ZOMATO,416000123456,350.00,,199650.00";
        let parser = SbiSavingsParser;
        let txns = parser.parse(data).expect("parse should succeed");

        assert_eq!(txns.len(), 1, "Expected exactly 1 transaction");
        let t = &txns[0];
        assert_eq!(t.date, "2026-03-07");
        assert_eq!(t.narration, "IMPS/416000123456/UPI-ZOMATO");
        assert_eq!(t.amount, 350.0);
        assert_eq!(t.transaction_type, TransactionType::Expense);
        assert_eq!(t.account, "SBI_SAVINGS");
        assert_eq!(t.credit_indicator, "");
    }

    /// TC-012-005: parse() correctly extracts a Credit (INCOME) row
    #[test]
    fn test_parse_credit_row() {
        let data = "Txn Date,Value Date,Description,Ref No./Cheque No.,Debit,Credit,Balance\n\
                    03/03/2026,03/03/2026,CREDIT INTEREST,,,127.50,167000.00";
        let parser = SbiSavingsParser;
        let txns = parser.parse(data).expect("parse should succeed");

        assert_eq!(txns.len(), 1, "Expected exactly 1 transaction");
        let t = &txns[0];
        assert_eq!(t.date, "2026-03-03");
        assert_eq!(t.narration, "CREDIT INTEREST");
        assert_eq!(t.amount, 127.5);
        assert_eq!(t.transaction_type, TransactionType::Income);
        assert_eq!(t.account, "SBI_SAVINGS");
        assert_eq!(t.credit_indicator, "Yes");
    }

    /// TC-012-006: parse() silently skips Opening Balance row (both amounts empty, C3)
    #[test]
    fn test_parse_opening_balance_skipped() {
        let data = "Txn Date,Value Date,Description,Ref No./Cheque No.,Debit,Credit,Balance\n\
                    01/03/2026,01/03/2026,OPENING BALANCE,,,,167371.50";
        let parser = SbiSavingsParser;
        let txns = parser.parse(data).expect("parse should succeed without error");
        assert_eq!(txns.len(), 0, "Opening Balance row must be silently skipped");
    }

    /// TC-012-007: parse() handles comma-thousands in quoted Credit amount (C2, C5)
    #[test]
    fn test_parse_comma_thousands_amount() {
        let data = "Txn Date,Value Date,Description,Ref No./Cheque No.,Debit,Credit,Balance\n\
                    07/03/2026,07/03/2026,NEFT/SALARY,,,\"50,000.00\",202000.00";
        let parser = SbiSavingsParser;
        let txns = parser.parse(data).expect("parse should succeed");

        assert_eq!(txns.len(), 1);
        let t = &txns[0];
        assert!((t.amount - 50000.0).abs() < 0.001, "amount should be 50000.00");
        assert_eq!(t.transaction_type, TransactionType::Income);
    }

    /// TC-012-007 variant: comma-thousands in Debit column
    #[test]
    fn test_parse_comma_thousands_debit() {
        let data = "Txn Date,Value Date,Description,Ref No./Cheque No.,Debit,Credit,Balance\n\
                    07/03/2026,07/03/2026,RENT PAYMENT,,\"15,000.00\",,185000.00";
        let parser = SbiSavingsParser;
        let txns = parser.parse(data).expect("parse should succeed");

        assert_eq!(txns.len(), 1);
        let t = &txns[0];
        assert!((t.amount - 15000.0).abs() < 0.001);
        assert_eq!(t.transaction_type, TransactionType::Expense);
    }

    /// TC-012-008: RFC 4180 quoted description containing a comma (C5)
    #[test]
    fn test_parse_rfc4180_quoted_description() {
        let data = "Txn Date,Value Date,Description,Ref No./Cheque No.,Debit,Credit,Balance\n\
                    07/03/2026,07/03/2026,\"NEFT/ABC,DEF\",,500.00,,99500.00";
        let parser = SbiSavingsParser;
        let txns = parser.parse(data).expect("parse should succeed");

        assert_eq!(txns.len(), 1);
        let t = &txns[0];
        assert_eq!(t.narration, "NEFT/ABC,DEF");
        assert_eq!(t.amount, 500.0);
    }

    /// TC-012-009: parse() uses Value Date as fallback when Txn Date is invalid (C6)
    #[test]
    fn test_parse_value_date_fallback() {
        let data = "Txn Date,Value Date,Description,Ref No./Cheque No.,Debit,Credit,Balance\n\
                    INVALID,07/03/2026,TEST PAYMENT,,100.00,,99900.00";
        let parser = SbiSavingsParser;
        let txns = parser.parse(data).expect("parse should succeed");

        assert_eq!(txns.len(), 1, "Should produce 1 transaction using Value Date fallback");
        assert_eq!(txns[0].date, "2026-03-07");
    }

    /// TC-012-009: Row where BOTH dates are invalid must be skipped
    #[test]
    fn test_parse_skips_row_with_both_dates_invalid() {
        let data = "Txn Date,Value Date,Description,Ref No./Cheque No.,Debit,Credit,Balance\n\
                    INVALID,ALSO_INVALID,TEST PAYMENT,,100.00,,99900.00";
        let parser = SbiSavingsParser;
        let txns = parser.parse(data).expect("parse should succeed");
        assert_eq!(txns.len(), 0, "Row with both invalid dates must be skipped");
    }

    /// TC-012-010: parse() strips UTF-8 BOM and normalises CRLF (C7)
    #[test]
    fn test_parse_bom_and_crlf() {
        let data = "\u{FEFF}Txn Date,Value Date,Description,Ref No./Cheque No.,Debit,Credit,Balance\r\n\
                    07/03/2026,07/03/2026,SALARY CREDIT,,,10000.00,100000.00\r\n";
        let parser = SbiSavingsParser;
        let txns = parser.parse(data).expect("BOM + CRLF parse should succeed");
        assert_eq!(txns.len(), 1);
        assert_eq!(txns[0].date, "2026-03-07");
        assert_eq!(txns[0].amount, 10000.0);
    }

    /// C4: Rows where both Debit and Credit are non-zero must be silently skipped
    #[test]
    fn test_parse_both_amounts_non_zero_skipped() {
        let data = "Txn Date,Value Date,Description,Ref No./Cheque No.,Debit,Credit,Balance\n\
                    07/03/2026,07/03/2026,MALFORMED ROW,,100.00,50.00,99850.00";
        let parser = SbiSavingsParser;
        let txns = parser.parse(data).expect("parse should succeed without error");
        assert_eq!(txns.len(), 0, "Malformed row (both amounts) must be silently skipped");
    }

    /// parse() sets source = "SBI_SAVINGS" (C8)
    #[test]
    fn test_parse_source_field() {
        let data = "Txn Date,Value Date,Description,Ref No./Cheque No.,Debit,Credit,Balance\n\
                    07/03/2026,07/03/2026,ATM WDL,,500.00,,99500.00";
        let parser = SbiSavingsParser;
        let txns = parser.parse(data).unwrap();
        assert_eq!(txns[0].source, "SBI_SAVINGS");
    }

    // -----------------------------------------------------------------------
    // Date parsing helpers
    // -----------------------------------------------------------------------

    #[test]
    fn test_parse_sbi_date_valid() {
        assert_eq!(parse_sbi_date("07/03/2026").unwrap(), "2026-03-07");
        assert_eq!(parse_sbi_date("01/01/2000").unwrap(), "2000-01-01");
        assert_eq!(parse_sbi_date("31/12/2025").unwrap(), "2025-12-31");
    }

    #[test]
    fn test_parse_sbi_date_invalid_format() {
        assert!(parse_sbi_date("2026-03-07").is_err());
        assert!(parse_sbi_date("INVALID").is_err());
        assert!(parse_sbi_date("07/03").is_err());
    }

    #[test]
    fn test_parse_sbi_date_year_before_2000() {
        assert!(parse_sbi_date("07/03/1999").is_err());
    }

    // -----------------------------------------------------------------------
    // Amount parsing helpers
    // -----------------------------------------------------------------------

    #[test]
    fn test_parse_amount_plain() {
        assert_eq!(parse_amount("350.00"), Some(350.0));
        assert_eq!(parse_amount("127.50"), Some(127.5));
    }

    #[test]
    fn test_parse_amount_comma_thousands() {
        assert_eq!(parse_amount("50,000.00"), Some(50000.0));
        assert_eq!(parse_amount("1,00,000.00"), Some(100000.0)); // Indian lakh format
    }

    #[test]
    fn test_parse_amount_empty_is_absent() {
        assert_eq!(parse_amount(""), None);
        assert_eq!(parse_amount("  "), None);
    }

    #[test]
    fn test_parse_amount_zero_is_absent() {
        assert_eq!(parse_amount("0.00"), None);
        assert_eq!(parse_amount("0"), None);
    }

    // -----------------------------------------------------------------------
    // CSV line parser
    // -----------------------------------------------------------------------

    #[test]
    fn test_parse_csv_line_simple() {
        let fields = parse_csv_line("a,b,c");
        assert_eq!(fields, vec!["a", "b", "c"]);
    }

    #[test]
    fn test_parse_csv_line_empty_fields() {
        let fields = parse_csv_line("a,,c");
        assert_eq!(fields, vec!["a", "", "c"]);
    }

    #[test]
    fn test_parse_csv_line_trailing_comma() {
        let fields = parse_csv_line("a,b,");
        assert_eq!(fields, vec!["a", "b", ""]);
    }

    #[test]
    fn test_parse_csv_line_quoted_with_comma() {
        let fields = parse_csv_line(r#"a,"b,c",d"#);
        assert_eq!(fields, vec!["a", "b,c", "d"]);
    }

    #[test]
    fn test_parse_csv_line_quoted_escaped_quote() {
        let fields = parse_csv_line(r#""he said ""hello""",b"#);
        assert_eq!(fields, vec![r#"he said "hello""#, "b"]);
    }

    #[test]
    fn test_parse_csv_line_sbi_debit_row() {
        let fields = parse_csv_line(
            "07/03/2026,07/03/2026,IMPS/416000123456/UPI-ZOMATO,416000123456,350.00,,199650.00",
        );
        assert_eq!(fields.len(), 7);
        assert_eq!(fields[0], "07/03/2026");
        assert_eq!(fields[2], "IMPS/416000123456/UPI-ZOMATO");
        assert_eq!(fields[4], "350.00");
        assert_eq!(fields[5], "");
        assert_eq!(fields[6], "199650.00");
    }

    // -----------------------------------------------------------------------
    // parser name
    // -----------------------------------------------------------------------

    #[test]
    fn test_parser_name() {
        let parser = SbiSavingsParser;
        assert_eq!(parser.name(), "SBI Savings");
    }
}
