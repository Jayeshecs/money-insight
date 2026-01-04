// HDFC Savings (v1, v2) parser module

use crate::traits::{BankParser, Transaction};

pub struct HdfcSavingsParser;

impl BankParser for HdfcSavingsParser {
    fn identify(&self, data: &str) -> bool {
        // Check for HDFC Savings specific patterns
        data.contains("HDFC Bank") && 
        (data.contains("Date") && data.contains("Narration") && 
         (data.contains("Withdrawal Amt") || data.contains("Deposit Amt")))
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
            let (amount, txn_type) = if !withdrawal.is_empty() && withdrawal != "0" && withdrawal != "0.00" {
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
            
            transactions.push(Transaction {
                date: parsed_date,
                description: narration.to_string(),
                amount,
                account: "HDFC_SAVINGS".to_string(),
                transaction_type: txn_type.to_string(),
            });
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

    #[test]
    fn test_hdfc_savings_identification() {
        let valid_data = "HDFC Bank\nDate\tNarration\tChq./Ref.No.\tValue Dt\tWithdrawal Amt.\tDeposit Amt.\tClosing Balance";
        let parser = HdfcSavingsParser;
        assert!(parser.identify(valid_data));
    }

    #[test]
    fn test_hdfc_savings_parsing() {
        let data = "HDFC Bank\nDate\tNarration\tChq./Ref.No.\tValue Dt\tWithdrawal Amt.\tDeposit Amt.\tClosing Balance\n\
                    01/01/24\tATM WDL\t12345\t01/01/24\t1,000.00\t\t50,000.00\n\
                    02/01/24\tSALARY CREDIT\t\t02/01/24\t\t75,000.00\t125,000.00";
        
        let parser = HdfcSavingsParser;
        let result = parser.parse(data);
        
        assert!(result.is_ok());
        let transactions = result.unwrap();
        assert_eq!(transactions.len(), 2);
        assert_eq!(transactions[0].amount, -1000.0);
        assert_eq!(transactions[1].amount, 75000.0);
    }

    #[test]
    fn test_invalid_format() {
        let invalid_data = "Some random text without proper headers";
        let parser = HdfcSavingsParser;
        assert!(!parser.identify(invalid_data));
    }
}
