// HDFC Savings (v1, v2) parser module

use crate::traits::BankParser;
use crate::models::Transaction;

pub struct HdfcSavingsParser;

impl BankParser for HdfcSavingsParser {
    fn identify(&self, data: &str) -> bool {
        // Check for HDFC Savings specific patterns
        // Based on Python reference: Look for "Date" header in first column position
        // and typical HDFC savings account column headers
        let lines: Vec<&str> = data.lines().take(100).collect();
        
        for line in lines {
            // Check if line contains the expected header pattern
            if line.contains("Date") && line.contains("Narration") {
                // Further validate with withdrawal/deposit columns
                if line.contains("Withdrawal Amt") || line.contains("Deposit Amt") {
                    // Also check for HDFC Bank mention in first few lines
                    return data.lines().take(10).any(|l| l.to_lowercase().contains("hdfc bank"));
                }
            }
        }
        false
    }
    
    fn parse(&self, data: &str) -> Result<Vec<Transaction>, String> {
        let mut transactions = Vec::new();
        let lines: Vec<&str> = data.lines().collect();
        
        // Find header row
        let header_idx = lines.iter()
            .position(|line| line.contains("Date") && line.contains("Narration"))
            .ok_or("Invalid HDFC Savings format: Header not found")?;
        
        // Parse data rows (skip header + 1 empty row if present)
        let start_idx = if header_idx + 1 < lines.len() && lines[header_idx + 1].trim().is_empty() {
            header_idx + 2
        } else {
            header_idx + 1
        };
        
        for line in &lines[start_idx..] {
            if line.trim().is_empty() {
                break;
            }
            
            let parts: Vec<&str> = line.split('\t').collect();
            if parts.len() < 6 {
                continue;
            }
            
            let date = parts[0].trim();
            let narration = parts[1].trim();
            
            // Handle withdrawal and deposit columns (typically columns 4 and 5)
            let withdrawal = parts.get(4).unwrap_or(&"").trim().replace(",", "");
            let deposit = parts.get(5).unwrap_or(&"").trim().replace(",", "");
            
            // Determine amount and type
            let (amount, _txn_type) = if !withdrawal.is_empty() && withdrawal != "0" && withdrawal != "0.00" {
                match withdrawal.parse::<f64>() {
                    Ok(amt) if amt > 0.0 => (-amt, "DEBIT"),
                    _ => continue,
                }
            } else if !deposit.is_empty() && deposit != "0" && deposit != "0.00" {
                match deposit.parse::<f64>() {
                    Ok(amt) if amt > 0.0 => (amt, "CREDIT"),
                    _ => continue,
                }
            } else {
                continue;
            };
            
            // Parse date from DD/MM/YY format
            let parsed_date = parse_hdfc_date(date)?;
            
            // Determine credit indicator and transaction type
            let is_credit = amount > 0.0;
            let credit_indicator = if is_credit { "Yes".to_string() } else { String::new() };
            let transaction_type = crate::models::TransactionType::from_credit_indicator_and_description(is_credit, narration);
            let abs_amount = amount.abs();
            
            // Create new transaction with enhanced model
            let transaction = Transaction::new(
                parsed_date,
                "HDFC_SAVINGS".to_string(),
                narration.to_string(),
                abs_amount,
                credit_indicator,
                transaction_type,
                "HDFC_SAVINGS".to_string(),
            );
            
            transactions.push(transaction);
        }
        
        if transactions.is_empty() {
            return Err("No valid transactions found in the statement".to_string());
        }
        
        Ok(transactions)
    }
    
    fn name(&self) -> &'static str {
        "HDFC Savings Account"
    }
}

fn parse_hdfc_date(date_str: &str) -> Result<String, String> {
    // Convert DD/MM/YY to YYYY-MM-DD
    let parts: Vec<&str> = date_str.split('/').collect();
    if parts.len() != 3 {
        return Err(format!("Invalid date format: {}", date_str));
    }
    
    let day = parts[0].parse::<u32>().map_err(|_| "Invalid day")?;
    let month = parts[1].parse::<u32>().map_err(|_| "Invalid month")?;
    let year = parts[2].parse::<u32>().map_err(|_| "Invalid year")?;
    
    // Assume 20xx for years 00-30, 19xx for 31-99
    let full_year = if year <= 30 { 2000 + year } else { 1900 + year };
    
    Ok(format!("{:04}-{:02}-{:02}", full_year, month, day))
}

#[cfg(test)]
mod tests {
    use super::*;

    // ============================================================================
    // IDENTIFICATION TESTS - Testing identify() method with various formats
    // ============================================================================

    #[test]
    fn test_hdfc_savings_identification_basic() {
        let valid_data = "HDFC Bank\nDate\tNarration\tChq./Ref.No.\tValue Dt\tWithdrawal Amt.\tDeposit Amt.\tClosing Balance";
        let parser = HdfcSavingsParser;
        assert!(parser.identify(valid_data), "Should identify basic HDFC Savings format");
    }

    #[test]
    fn test_identification_with_uppercase_bank_name() {
        let data = "HDFC BANK\nDate\tNarration\tChq./Ref.No.\tValue Dt\tWithdrawal Amt.\tDeposit Amt.\tClosing Balance";
        let parser = HdfcSavingsParser;
        assert!(parser.identify(data), "Should handle 'HDFC BANK' in uppercase");
    }

    #[test]
    fn test_identification_with_mixed_case_bank_name() {
        let data = "Hdfc Bank\nDate\tNarration\tChq./Ref.No.\tValue Dt\tWithdrawal Amt.\tDeposit Amt.\tClosing Balance";
        let parser = HdfcSavingsParser;
        assert!(parser.identify(data), "Should handle 'Hdfc Bank' in mixed case");
    }

    #[test]
    fn test_identification_bank_name_on_different_line() {
        // Test case: Bank name appears BEFORE the header line
        let data = "HDFC Bank Ltd\nSavings Account Statement\n\nDate\tNarration\tChq./Ref.No.\tValue Dt\tWithdrawal Amt.\tDeposit Amt.\tClosing Balance";
        let parser = HdfcSavingsParser;
        assert!(parser.identify(data), "Should identify when bank name is on a different line from headers");
    }

    #[test]
    fn test_identification_bank_name_after_header() {
        // Test case: Bank name appears AFTER the header line (less common but possible)
        let data = "Date\tNarration\tChq./Ref.No.\tValue Dt\tWithdrawal Amt.\tDeposit Amt.\tClosing Balance\nHDFC Bank Ltd\n01/01/24\tTest\t123";
        let parser = HdfcSavingsParser;
        assert!(parser.identify(data), "Should identify when bank name appears after headers");
    }

    #[test]
    fn test_identification_with_column_variations() {
        // Test with period after "Amt."
        let data = "HDFC Bank\nDate\tNarration\tChq./Ref.No.\tValue Dt\tWithdrawal Amt.\tDeposit Amt.\tClosing Balance";
        let parser = HdfcSavingsParser;
        assert!(parser.identify(data), "Should handle 'Withdrawal Amt.' and 'Deposit Amt.' with periods");
    }

    #[test]
    fn test_identification_without_periods() {
        // Test without periods in "Amt"
        let data = "HDFC Bank\nDate\tNarration\tChq./Ref.No.\tValue Dt\tWithdrawal Amt\tDeposit Amt\tClosing Balance";
        let parser = HdfcSavingsParser;
        assert!(parser.identify(data), "Should handle 'Withdrawal Amt' and 'Deposit Amt' without periods");
    }

    #[test]
    fn test_identification_real_world_format_v1() {
        // Simulate real HDFC Savings statement structure (Version 1)
        let data = "\
\n\
\nHDFC Bank Ltd.\n\
Savings Account Statement\n\
Account Number: XXXX1234\n\
Statement Period: 01/12/2024 to 31/12/2024\n\
\n\
Date\tNarration\tChq./Ref.No.\tValue Dt\tWithdrawal Amt.\tDeposit Amt.\tClosing Balance\n\
01/12/24\tATM WDL\t12345\t01/12/24\t1,000.00\t\t50,000.00";
        
        let parser = HdfcSavingsParser;
        let result = parser.identify(data);
        if !result {
            println!("FAILED to identify v1 format. Data structure:");
            for (i, line) in data.lines().take(10).enumerate() {
                println!("Line {}: '{}'", i, line);
            }
        }
        assert!(result, "Should identify real-world HDFC Savings v1 format");
    }

    #[test]
    fn test_identification_real_world_format_v2() {
        // Simulate another common HDFC Savings statement structure (Version 2)
        let data = "\
HDFC BANK\n\
\n\
Customer ID: 12345678\n\
Account No: SA1234567890\n\
\n\
Transaction Details\n\
Date\tNarration\tChq./Ref.No.\tValue Dt\tWithdrawal Amt.\tDeposit Amt.\tClosing Balance";
        
        let parser = HdfcSavingsParser;
        let result = parser.identify(data);
        if !result {
            println!("FAILED to identify v2 format. Data structure:");
            for (i, line) in data.lines().take(10).enumerate() {
                println!("Line {}: '{}'", i, line);
            }
        }
        assert!(result, "Should identify real-world HDFC Savings v2 format");
    }

    #[test]
    fn test_identification_with_metadata_before_header() {
        // Real statements often have multiple lines of metadata before the actual table
        let data = "\
\n\
\n\
\n\
HDFC Bank\n\
Branch: Mumbai Main Branch\n\
IFSC Code: HDFC0000123\n\
Customer Name: John Doe\n\
Account Number: 12345678901234\n\
Statement Period: Jan 2024\n\
\n\
Date\tNarration\tChq./Ref.No.\tValue Dt\tWithdrawal Amt.\tDeposit Amt.\tClosing Balance";
        
        let parser = HdfcSavingsParser;
        let result = parser.identify(data);
        if !result {
            println!("FAILED to identify format with metadata. First 15 lines:");
            for (i, line) in data.lines().take(15).enumerate() {
                println!("Line {}: '{}'", i, line);
            }
        }
        assert!(result, "Should identify format even with multiple metadata lines before header");
    }

    #[test]
    fn test_identification_hdfc_bank_outside_first_10_lines() {
        // Edge case: Bank name appears after line 10
        let data = "\
Line 1\n\
Line 2\n\
Line 3\n\
Line 4\n\
Line 5\n\
Line 6\n\
Line 7\n\
Line 8\n\
Line 9\n\
Line 10\n\
HDFC Bank - This is line 11\n\
Date\tNarration\tChq./Ref.No.\tValue Dt\tWithdrawal Amt.\tDeposit Amt.\tClosing Balance";
        
        let parser = HdfcSavingsParser;
        let result = parser.identify(data);
        if !result {
            println!("FAILED when bank name is on line 11. Current code only checks first 10 lines.");
        }
        // This test documents the current limitation - bank name must be in first 10 lines
        // If we want to fix this, we should check more lines or entire document
        assert!(!result, "KNOWN LIMITATION: Current code only checks first 10 lines for bank name");
    }

    #[test]
    fn test_identification_headers_split_across_lines() {
        // Edge case: What if headers are on multiple lines? (Less common but possible)
        let data = "\
HDFC Bank\n\
Date\tNarration\n\
Chq./Ref.No.\tValue Dt\n\
Withdrawal Amt.\tDeposit Amt.\tClosing Balance";
        
        let parser = HdfcSavingsParser;
        let result = parser.identify(data);
        if !result {
            println!("Headers are split across multiple lines - current code requires all on same line");
        }
        // This documents current limitation
        assert!(!result, "KNOWN LIMITATION: Current code requires Date, Narration, and Amt columns on same line");
    }

    #[test]
    fn test_identification_only_withdrawal_column() {
        // What if statement only has Withdrawal column, not Deposit?
        let data = "HDFC Bank\nDate\tNarration\tChq./Ref.No.\tValue Dt\tWithdrawal Amt.\tClosing Balance";
        let parser = HdfcSavingsParser;
        assert!(parser.identify(data), "Should identify even with only Withdrawal Amt column");
    }

    #[test]
    fn test_identification_only_deposit_column() {
        // What if statement only has Deposit column, not Withdrawal?
        let data = "HDFC Bank\nDate\tNarration\tValue Dt\tDeposit Amt.\tClosing Balance";
        let parser = HdfcSavingsParser;
        assert!(parser.identify(data), "Should identify even with only Deposit Amt column");
    }

    #[test]
    fn test_invalid_format_no_hdfc() {
        let invalid_data = "Date\tNarration\tChq./Ref.No.\tValue Dt\tWithdrawal Amt.\tDeposit Amt.\tClosing Balance";
        let parser = HdfcSavingsParser;
        assert!(!parser.identify(invalid_data), "Should reject when 'HDFC Bank' is not mentioned");
    }

    #[test]
    fn test_invalid_format_no_date_column() {
        let invalid_data = "HDFC Bank\nNarration\tChq./Ref.No.\tValue Dt\tWithdrawal Amt.\tDeposit Amt.\tClosing Balance";
        let parser = HdfcSavingsParser;
        assert!(!parser.identify(invalid_data), "Should reject when 'Date' column is missing");
    }

    #[test]
    fn test_invalid_format_no_narration_column() {
        let invalid_data = "HDFC Bank\nDate\tChq./Ref.No.\tValue Dt\tWithdrawal Amt.\tDeposit Amt.\tClosing Balance";
        let parser = HdfcSavingsParser;
        assert!(!parser.identify(invalid_data), "Should reject when 'Narration' column is missing");
    }

    #[test]
    fn test_invalid_format_no_amount_columns() {
        let invalid_data = "HDFC Bank\nDate\tNarration\tChq./Ref.No.\tValue Dt\tClosing Balance";
        let parser = HdfcSavingsParser;
        assert!(!parser.identify(invalid_data), "Should reject when both Withdrawal and Deposit columns are missing");
    }

    #[test]
    fn test_invalid_format_icici_bank() {
        let invalid_data = "ICICI Bank\nDate\tNarration\tChq./Ref.No.\tValue Dt\tWithdrawal Amt.\tDeposit Amt.\tClosing Balance";
        let parser = HdfcSavingsParser;
        assert!(!parser.identify(invalid_data), "Should reject ICICI Bank statements");
    }

    #[test]
    fn test_invalid_format_sbi_bank() {
        let invalid_data = "State Bank of India\nDate\tNarration\tDebit\tCredit\tBalance";
        let parser = HdfcSavingsParser;
        assert!(!parser.identify(invalid_data), "Should reject SBI Bank statements");
    }

    #[test]
    fn test_invalid_format_random_text() {
        let invalid_data = "Some random text without proper headers";
        let parser = HdfcSavingsParser;
        assert!(!parser.identify(invalid_data), "Should reject random text");
    }

    // ============================================================================
    // PARSING TESTS - Testing parse() method
    // ============================================================================

    #[test]
    fn test_hdfc_savings_parsing_basic() {
        let data = "HDFC Bank\nDate\tNarration\tChq./Ref.No.\tValue Dt\tWithdrawal Amt.\tDeposit Amt.\tClosing Balance\n\
                    01/01/24\tATM WDL\t12345\t01/01/24\t1,000.00\t\t50,000.00\n\
                    02/01/24\tSALARY CREDIT\t\t02/01/24\t\t75,000.00\t125,000.00";
        
        let parser = HdfcSavingsParser;
        let result = parser.parse(data);
        
        assert!(result.is_ok(), "Parsing should succeed for valid data");
        let transactions = result.unwrap();
        assert_eq!(transactions.len(), 2, "Should parse 2 transactions");
        assert_eq!(transactions[0].amount, 1000.0, "First transaction amount should be 1000");
        assert_eq!(transactions[0].transaction_type, crate::models::TransactionType::Expense, "First transaction should be expense");
        assert_eq!(transactions[1].amount, 75000.0, "Second transaction amount should be 75000");
        assert_eq!(transactions[1].transaction_type, crate::models::TransactionType::Income, "Second transaction should be income");
    }

    #[test]
    fn test_parsing_with_empty_line_after_header() {
        let data = "HDFC Bank\nDate\tNarration\tChq./Ref.No.\tValue Dt\tWithdrawal Amt.\tDeposit Amt.\tClosing Balance\n\
                    \n\
                    01/01/24\tATM WDL\t12345\t01/01/24\t1,000.00\t\t50,000.00";
        
        let parser = HdfcSavingsParser;
        let result = parser.parse(data);
        
        assert!(result.is_ok(), "Should handle empty line after header");
        let transactions = result.unwrap();
        assert_eq!(transactions.len(), 1);
    }

    #[test]
    fn test_parsing_amounts_with_commas() {
        let data = "HDFC Bank\nDate\tNarration\tChq./Ref.No.\tValue Dt\tWithdrawal Amt.\tDeposit Amt.\tClosing Balance\n\
                    01/01/24\tLarge Withdrawal\t12345\t01/01/24\t1,50,000.00\t\t50,000.00\n\
                    02/01/24\tLarge Deposit\t\t02/01/24\t\t2,00,000.00\t2,50,000.00";
        
        let parser = HdfcSavingsParser;
        let result = parser.parse(data);
        
        assert!(result.is_ok(), "Should handle amounts with commas");
        let transactions = result.unwrap();
        assert_eq!(transactions[0].amount, 150000.0, "Should parse 1,50,000 correctly");
        assert_eq!(transactions[0].transaction_type, crate::models::TransactionType::Expense, "First should be expense");
        assert_eq!(transactions[1].amount, 200000.0, "Should parse 2,00,000 correctly");
        assert_eq!(transactions[1].transaction_type, crate::models::TransactionType::Income, "Second should be income");
    }

    #[test]
    fn test_parsing_date_formats() {
        let data = "HDFC Bank\nDate\tNarration\tChq./Ref.No.\tValue Dt\tWithdrawal Amt.\tDeposit Amt.\tClosing Balance\n\
                    01/01/24\tTransaction 1\t\t01/01/24\t100.00\t\t1000.00\n\
                    15/06/25\tTransaction 2\t\t15/06/25\t200.00\t\t800.00\n\
                    31/12/99\tTransaction 3\t\t31/12/99\t300.00\t\t500.00";
        
        let parser = HdfcSavingsParser;
        let result = parser.parse(data);
        
        assert!(result.is_ok(), "Should parse various date formats");
        let transactions = result.unwrap();
        assert_eq!(transactions[0].date, "2024-01-01", "Should convert 01/01/24 to 2024-01-01");
        assert_eq!(transactions[1].date, "2025-06-15", "Should convert 15/06/25 to 2025-06-15");
        assert_eq!(transactions[2].date, "1999-12-31", "Should convert 31/12/99 to 1999-12-31");
    }

    #[test]
    fn test_parsing_skip_zero_amount_transactions() {
        let data = "HDFC Bank\nDate\tNarration\tChq./Ref.No.\tValue Dt\tWithdrawal Amt.\tDeposit Amt.\tClosing Balance\n\
                    01/01/24\tReal Transaction\t12345\t01/01/24\t1,000.00\t\t50,000.00\n\
                    02/01/24\tZero Withdrawal\t\t02/01/24\t0.00\t\t50,000.00\n\
                    03/01/24\tZero Deposit\t\t03/01/24\t\t0.00\t50,000.00\n\
                    04/01/24\tAnother Real One\t\t04/01/24\t\t5,000.00\t55,000.00";
        
        let parser = HdfcSavingsParser;
        let result = parser.parse(data);
        
        assert!(result.is_ok(), "Should parse successfully");
        let transactions = result.unwrap();
        assert_eq!(transactions.len(), 2, "Should skip transactions with zero amounts");
    }

    #[test]
    fn test_parsing_transaction_types() {
        let data = "HDFC Bank\nDate\tNarration\tChq./Ref.No.\tValue Dt\tWithdrawal Amt.\tDeposit Amt.\tClosing Balance\n\
                    01/01/24\tDebit Transaction\t\t01/01/24\t1,000.00\t\t50,000.00\n\
                    02/01/24\tCredit Transaction\t\t02/01/24\t\t5,000.00\t55,000.00";
        
        let parser = HdfcSavingsParser;
        let result = parser.parse(data);
        
        assert!(result.is_ok());
        let transactions = result.unwrap();
        // Check amounts and transaction types (debit = expense, credit = income)
        assert_eq!(transactions[0].amount, 1000.0, "Debit amount should be positive");
        assert_eq!(transactions[0].transaction_type, crate::models::TransactionType::Expense, "Debit should be expense");
        assert_eq!(transactions[1].amount, 5000.0, "Credit amount should be positive");
        assert_eq!(transactions[1].transaction_type, crate::models::TransactionType::Income, "Credit should be income");
    }

    #[test]
    fn test_parsing_account_field() {
        let data = "HDFC Bank\nDate\tNarration\tChq./Ref.No.\tValue Dt\tWithdrawal Amt.\tDeposit Amt.\tClosing Balance\n\
                    01/01/24\tTest\t\t01/01/24\t100.00\t\t1000.00";
        
        let parser = HdfcSavingsParser;
        let result = parser.parse(data);
        
        assert!(result.is_ok());
        let transactions = result.unwrap();
        assert_eq!(transactions[0].account, "HDFC_SAVINGS");
        assert_eq!(transactions[0].source, "HDFC_SAVINGS");
    }

    #[test]
    fn test_parsing_empty_statement_fails() {
        let data = "HDFC Bank\nDate\tNarration\tChq./Ref.No.\tValue Dt\tWithdrawal Amt.\tDeposit Amt.\tClosing Balance\n";
        
        let parser = HdfcSavingsParser;
        let result = parser.parse(data);
        
        assert!(result.is_err(), "Should fail when no transactions present");
        assert!(result.unwrap_err().contains("No valid transactions found"));
    }

    #[test]
    fn test_parsing_invalid_header() {
        let data = "HDFC Bank\nSome\tOther\tHeaders\n01/01/24\tTest\t100.00";
        
        let parser = HdfcSavingsParser;
        let result = parser.parse(data);
        
        assert!(result.is_err(), "Should fail when proper header is not found");
        assert!(result.unwrap_err().contains("Header not found"));
    }

    // ============================================================================
    // DIAGNOSTIC TESTS - For troubleshooting the current E2E test failures
    // ============================================================================

    #[test]
    fn test_diagnostic_print_first_20_lines() {
        // This test helps visualize what the parser sees
        let test_data = "\
Some metadata line 1\n\
Some metadata line 2\n\
HDFC Bank Ltd\n\
Account Statement\n\
\n\
Date\tNarration\tChq./Ref.No.\tValue Dt\tWithdrawal Amt.\tDeposit Amt.\tClosing Balance\n\
01/01/24\tTest Transaction\t123\t01/01/24\t1,000.00\t\t49,000.00";
        
        let parser = HdfcSavingsParser;
        
        println!("\n========== DIAGNOSTIC: First 20 lines as seen by parser ==========");
        for (i, line) in test_data.lines().take(20).enumerate() {
            println!("Line {}: '{}'", i, line);
            println!("  - Contains 'Date': {}", line.contains("Date"));
            println!("  - Contains 'Narration': {}", line.contains("Narration"));
            println!("  - Contains 'Withdrawal Amt': {}", line.contains("Withdrawal Amt"));
            println!("  - Contains 'Deposit Amt': {}", line.contains("Deposit Amt"));
            println!("  - Contains 'hdfc bank' (lowercase): {}", line.to_lowercase().contains("hdfc bank"));
        }
        
        let result = parser.identify(test_data);
        println!("\nIdentification result: {}", result);
        println!("==================================================================\n");
        
        assert!(result, "Diagnostic test - check output above to see what parser sees");
    }

    #[test]
    fn test_parser_name() {
        let parser = HdfcSavingsParser;
        assert_eq!(parser.name(), "HDFC Savings Account");
    }
}
