// HDFC Credit Card (v1, v2) parser module

use crate::traits::{BankParser, Transaction};
#[cfg(target_arch = "wasm32")]
use web_sys::console;


pub struct HdfcCreditCardParser;

#[derive(Debug, PartialEq)]
enum HdfcCreditVersion {
    UNKNOWN,
    V1,
    V2,
}

impl HdfcCreditCardParser {
    /// Detect HDFC Credit Card statement version
    /// v1: Column 1 (index 1) = "Transaction type"
    /// v2: Column 0 (index 0) = "Transaction type"
    fn detect_version(&self, lines: &[Vec<String>]) -> Option<(HdfcCreditVersion, usize)> {
        let mut ver: HdfcCreditVersion = HdfcCreditVersion::UNKNOWN;
        let mut hdr_idx: usize = 0;
        for (idx, line) in lines.iter().enumerate() {
            for cell in line {
                let cell_content = cell.trim();
                
                if ver == HdfcCreditVersion::UNKNOWN {
                    // Check for v2 format first (more specific pattern)
                    if cell_content.starts_with("Credit Card No.:") {
                        #[cfg(target_arch = "wasm32")]
                        console::log_1(&"Detected v2 format indicator".into());
                        ver = HdfcCreditVersion::V2;
                    }
                    
                    // Check for v1 format
                    if cell_content.starts_with("Card No:") {
                        #[cfg(target_arch = "wasm32")]
                        console::log_1(&"Detected v1 format indicator".into());
                        ver = HdfcCreditVersion::V1;
                    }
                }
                if hdr_idx == 0 {
                    // Check for header row with "Transaction type"
                    if cell_content.starts_with("Transaction type") {
                        hdr_idx = idx;
                    }
                }
                if ver != HdfcCreditVersion::UNKNOWN && hdr_idx > 0 {
                    #[cfg(target_arch = "wasm32")]
                    console::log_1(&format!("Detected HDFC Credit Card version: {:?} and header row index {}", ver, hdr_idx).into());
                    return Some((ver, hdr_idx));
                }
            }
        }
        None
    }
    
    /// Extract last 4 digits of credit card number from statement data
    /// Returns format: CCNNNN (e.g., CC2486)
    fn extract_card_account(&self, lines: &[Vec<String>], version: &HdfcCreditVersion) -> Result<String, String> {
        let pattern = match version {
            HdfcCreditVersion::UNKNOWN => return Err("Unknown HDFC Credit Card version".to_string()),
            HdfcCreditVersion::V1 => "Card No:",
            HdfcCreditVersion::V2 => "Credit Card No.:",
        };
        
        // Search for the credit card number in the first few rows
        for line in lines.iter().take(20) {
            for cell in line {
                let cell_content = cell.trim();
                if cell_content.starts_with(pattern) {
                    // Extract all digits from the string
                    let digits: String = cell_content.chars()
                        .filter(|c| c.is_ascii_digit())
                        .collect();
                    
                    // Get last 4 digits
                    if digits.len() >= 4 {
                        let last_four = &digits[digits.len() - 4..];
                        return Ok(format!("CC{}", last_four));
                    }
                }
            }
        }
        
        Err(format!("Credit card number not found in statement (pattern: {})", pattern))
    }
    
    /// Parse date from DD/MM/YYYY or DD/MM/YY format to YYYY-MM-DD
    fn parse_date(&self, date_str: &str) -> Result<String, String> {
        let date_clean = date_str.trim();
        
        // Handle DD/MM/YYYY or DD/MM/YY
        let parts: Vec<&str> = date_clean.split('/').collect();
        if parts.len() < 3 {
            return Err(format!("Invalid date format: {}", date_str));
        }
        
        let day = parts[0].parse::<u32>()
            .map_err(|_| format!("Invalid day: {}", parts[0]))?;
        let month = parts[1].parse::<u32>()
            .map_err(|_| format!("Invalid month: {}", parts[1]))?;
        
        // Extract year part only, ignoring any time component
        let year_str = parts[2].split_whitespace().next()
            .ok_or_else(|| format!("Invalid year format: {}", parts[2]))?;
        
        // Handle 2-digit or 4-digit year
        let year = if year_str.len() == 2 {
            let yy = year_str.parse::<u32>()
                .map_err(|_| format!("Invalid year: {}", year_str))?;
            // Assume 20xx for years 00-99
            2000 + yy
        } else {
            year_str.parse::<u32>()
                .map_err(|_| format!("Invalid year: {}", year_str))?
        };
        
        // Validate ranges
        if day < 1 || day > 31 || month < 1 || month > 12 {
            return Err(format!("Invalid date values: day={}, month={}", day, month));
        }
        
        Ok(format!("{:04}-{:02}-{:02}", year, month, day))
    }
}

impl BankParser for HdfcCreditCardParser {
    fn identify(&self, data: &str) -> bool {
        // Look for HDFC Credit Card indicators and Transaction type header
        // Based on Python reference: Check for "Transaction type" column header
        // and credit card number patterns
        let lower_data = data.to_lowercase();
        let has_hdfc = lower_data.contains("hdfc");
        let has_credit = lower_data.contains("credit");
        let has_card = lower_data.contains("card no") || lower_data.contains("credit card no");
        let has_header = data.contains("Transaction type");
        
        // Must have all key indicators
        has_hdfc && has_credit && has_card && has_header
    }
    
    fn parse(&self, data: &str) -> Result<Vec<Transaction>, String> {
        let mut transactions = Vec::new();
        
        // Convert TSV data to 2D vector
        let lines: Vec<Vec<String>> = data.lines()
            .map(|line| line.split('\t').map(|s| s.to_string()).collect())
            .collect();
        
        if lines.is_empty() {
            return Err("File is empty".to_string());
        }
        
        // Detect version and header row
        let (version, header_idx) = self.detect_version(&lines)
            .ok_or("Invalid HDFC Credit Card format: 'Transaction type' header not found")?;
                
        // Extract account from credit card number in statement
        let txn_source = self.extract_card_account(&lines, &version)?;
        #[cfg(target_arch = "wasm32")]
        console::log_1(&format!("Extracted txn_source: {}", txn_source).into());
        
        // Determine column indices based on version
        let (date_col, narration_col, amount_col, cr_dr_col) = match version {
            HdfcCreditVersion::UNKNOWN => return Err("Unknown HDFC Credit Card version".to_string()),
            HdfcCreditVersion::V1 => (16, 20, 47, 53),
            HdfcCreditVersion::V2 => (9, 12, 20, 23),
        };
        #[cfg(target_arch = "wasm32")]
        console::log_1(&format!("Using columns - Date: {}, Narration: {}, Amount: {}, Cr/Dr: {}", date_col, narration_col, amount_col, cr_dr_col).into());
        
        // Parse transactions starting from the row after header
        let start_row = header_idx + 1;
        for row_idx in start_row..lines.len() {
            let row = &lines[row_idx];
            
            // Check if we have enough columns
            let max_col = date_col.max(narration_col).max(amount_col).max(cr_dr_col);
            if row.len() <= max_col {
                continue;
            }
            
            let date_str = row[date_col].trim();
            let narration = row[narration_col].trim();
            let amount_str = row[amount_col].trim();
            let cr_dr = row[cr_dr_col].trim();
            
            // Stop if date field is empty (end of transactions)
            if date_str.is_empty() {
                break;
            }
            
            // Parse amount (remove commas)
            let amount = amount_str.replace(",", "").parse::<f64>()
                .map_err(|_| format!("Invalid amount at row {}: {}", row_idx + 1, amount_str))?;
            
            // Skip zero amounts
            if amount == 0.0 {
                continue;
            }
            
            // Parse date
            let txn_date = self.parse_date(date_str)
                .map_err(|e| format!("Date parsing error at row {}: {}", row_idx + 1, e))?;
            
            // Credit card: Cr means payment (positive), Dr means purchase (negative)
            let signed_amount = if cr_dr == "Cr" { amount } else { -amount };
            
            transactions.push(Transaction {
                date: txn_date,
                description: narration.to_string(),
                amount: signed_amount,
                account: txn_source.clone(),
                transaction_type: cr_dr.to_string(),
            });
        }
        
        if transactions.is_empty() {
            return Err("No valid transactions found in the credit card statement".to_string());
        }
        
        Ok(transactions)
    }
    
    fn name(&self) -> &'static str {
        "HDFC Credit Card"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hdfc_credit_identification() {
        let valid_data = "HDFC Bank Credit Card\nCard No: 1234567890123456\nTransaction type\tDescription\tAmount\tCr/Dr";
        let parser = HdfcCreditCardParser;
        assert!(parser.identify(valid_data));
    }

    #[test]
    fn test_version_detection_v2() {
        let parser = HdfcCreditCardParser;
        let lines = vec![
            vec!["HDFC Credit Card".to_string()],
            vec!["Credit Card No.: 653029XXXXXX2486".to_string()],
            vec!["Statement Date".to_string()],
            vec!["Transaction type".to_string(), "".to_string(), "Transaction date".to_string()],
        ];
        
        let result = parser.detect_version(&lines);
        assert!(result.is_some());
        let (version, idx) = result.unwrap();
        assert_eq!(version, HdfcCreditVersion::V2);
        assert_eq!(idx, 3);
    }

    #[test]
    fn test_version_detection_v1() {
        let parser = HdfcCreditCardParser;
        let lines = vec![
            vec!["HDFC Credit Card".to_string()],
            vec!["Card No: 6530 29XX XXXX 2486".to_string()],
            vec!["Statement Date".to_string()],
            vec!["".to_string(), "Transaction type".to_string(), "Transaction date".to_string()],
        ];
        
        let result = parser.detect_version(&lines);
        assert!(result.is_some());
        let (version, idx) = result.unwrap();
        assert_eq!(version, HdfcCreditVersion::V1);
        assert_eq!(idx, 3);
    }

    #[test]
    fn test_date_parsing() {
        let parser = HdfcCreditCardParser;
        
        // Test DD/MM/YYYY format
        assert_eq!(parser.parse_date("15/04/2025").unwrap(), "2025-04-15");
        assert_eq!(parser.parse_date("01/12/2024").unwrap(), "2024-12-01");
        
        // Test DD/MM/YY format
        assert_eq!(parser.parse_date("15/04/25").unwrap(), "2025-04-15");
        assert_eq!(parser.parse_date("01/12/24").unwrap(), "2024-12-01");
        
        // Test with time component
        assert_eq!(parser.parse_date("15/04/2025 12:30:45").unwrap(), "2025-04-15");
        assert_eq!(parser.parse_date("01/12/2024 08:15").unwrap(), "2024-12-01");
    }

    #[test]
    fn test_card_account_extraction_v1() {
        let parser = HdfcCreditCardParser;
        
        // Test V1 format: "Card No: NNNN NNXX XXXX NNNN"
        let lines = vec![
            vec!["HDFC Bank Credit Card".to_string()],
            vec!["Card No: 6530 29XX XXXX 2486".to_string()],
            vec!["Statement Date: 15/04/2025".to_string()],
        ];
        
        let result = parser.extract_card_account(&lines, &HdfcCreditVersion::V1);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "CC2486");
    }

    #[test]
    fn test_card_account_extraction_v2() {
        let parser = HdfcCreditCardParser;
        
        // Test V2 format: "Credit Card No.: NNNNNNXXXXXXNNNN"
        let lines = vec![
            vec!["HDFC Bank Credit Card".to_string()],
            vec!["Credit Card No.: 653029XXXXXX2486".to_string()],
            vec!["Statement Date: 15/04/2025".to_string()],
        ];
        
        let result = parser.extract_card_account(&lines, &HdfcCreditVersion::V2);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "CC2486");
    }

    #[test]
    fn test_card_account_extraction_not_found() {
        let parser = HdfcCreditCardParser;
        
        let lines = vec![
            vec!["HDFC Bank Credit Card".to_string()],
            vec!["Statement Date: 15/04/2025".to_string()],
        ];
        
        let result = parser.extract_card_account(&lines, &HdfcCreditVersion::V1);
        assert!(result.is_err());
    }

    #[test]
    fn test_invalid_credit_format() {
        let invalid_data = "Some random credit card text";
        let parser = HdfcCreditCardParser;
        assert!(!parser.identify(invalid_data));
    }
}
