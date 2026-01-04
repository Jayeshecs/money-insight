// HDFC Credit Card (v1, v2) parser module

use crate::traits::{BankParser, Transaction};

pub struct HdfcCreditCardParser;

impl BankParser for HdfcCreditCardParser {
    fn identify(&self, data: &str) -> bool {
        data.contains("HDFC") && 
        data.contains("Credit Card") &&
        (data.contains("Transaction type") || data.contains("Transaction Date"))
    }
    
    fn parse(&self, data: &str) -> Result<Vec<Transaction>, String> {
        let mut transactions = Vec::new();
        let lines: Vec<&str> = data.lines().collect();
        
        // Find header row
        let header_idx = lines.iter()
            .position(|line| line.contains("Transaction Date") || line.contains("Transaction type"))
            .ok_or("Invalid HDFC Credit Card format: Header not found")?;
        
        // Parse transactions
        for line in &lines[header_idx + 1..] {
            if line.trim().is_empty() {
                break;
            }
            
            let parts: Vec<&str> = line.split('\t').collect();
            if parts.len() < 3 {
                continue;
            }
            
            // Extract date, description, amount, and debit/credit indicator
            let date = parts[0].trim();
            let narration = parts[1].trim();
            
            // Amount is typically second-to-last, Cr/Dr is last
            if parts.len() < 3 {
                continue;
            }
            
            let amount_str = parts[parts.len() - 2].trim().replace(",", "");
            let debit_credit = parts[parts.len() - 1].trim();
            
            let amount = amount_str.parse::<f64>().unwrap_or(0.0);
            if amount == 0.0 {
                continue;
            }
            
            // Credit card: Cr means payment received (positive), Dr means expense (negative)
            let signed_amount = if debit_credit == "Cr" { amount } else { -amount };
            let txn_type = if debit_credit == "Cr" { "CREDIT" } else { "DEBIT" };
            
            let parsed_date = parse_credit_date(date)?;
            
            transactions.push(Transaction {
                date: parsed_date,
                description: narration.to_string(),
                amount: signed_amount,
                account: "HDFC_CREDIT".to_string(),
                transaction_type: txn_type.to_string(),
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

fn parse_credit_date(date_str: &str) -> Result<String, String> {
    // Parse DD/MM/YYYY format
    let parts: Vec<&str> = date_str.split('/').collect();
    if parts.len() != 3 {
        return Err(format!("Invalid date format: {}", date_str));
    }
    
    let day = parts[0].parse::<u32>().map_err(|_| "Invalid day")?;
    let month = parts[1].parse::<u32>().map_err(|_| "Invalid month")?;
    let year = parts[2].parse::<u32>().map_err(|_| "Invalid year")?;
    
    Ok(format!("{:04}-{:02}-{:02}", year, month, day))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hdfc_credit_identification() {
        let valid_data = "HDFC Credit Card\nTransaction Date\tDescription\tAmount\tCr/Dr";
        let parser = HdfcCreditCardParser;
        assert!(parser.identify(valid_data));
    }

    #[test]
    fn test_hdfc_credit_parsing() {
        let data = "HDFC Credit Card\nTransaction Date\tDescription\tAmount\tCr/Dr\n\
                    01/01/2024\tAMAZON PURCHASE\t2,500.00\tDr\n\
                    05/01/2024\tPAYMENT RECEIVED\t10,000.00\tCr";
        
        let parser = HdfcCreditCardParser;
        let result = parser.parse(data);
        
        assert!(result.is_ok());
        let transactions = result.unwrap();
        assert_eq!(transactions.len(), 2);
        assert_eq!(transactions[0].amount, -2500.0);
        assert_eq!(transactions[1].amount, 10000.0);
    }

    #[test]
    fn test_invalid_credit_format() {
        let invalid_data = "Some random credit card text";
        let parser = HdfcCreditCardParser;
        assert!(!parser.identify(invalid_data));
    }
}
