// Integration test for Excel to TSV conversion and parsing
// This test reads actual test data files and verifies end-to-end parsing

use std::fs;
use std::path::PathBuf;
use calamine::{Reader, open_workbook_auto_from_rs, Data};
use std::io::Cursor;

// Import from the crate's internal modules for testing
use moneyinsight_wasm::parsers::hdfc_savings::HdfcSavingsParser;
use moneyinsight_wasm::parsers::hdfc_credit::HdfcCreditCardParser;
use moneyinsight_wasm::traits::BankParser;

/// Helper function to convert Excel file bytes to TSV format
/// This replicates the logic from lib.rs for testing purposes
fn excel_to_tsv(file_bytes: &[u8]) -> Result<String, String> {
    let cursor = Cursor::new(file_bytes);
    let mut workbook = open_workbook_auto_from_rs(cursor)
        .map_err(|e| format!("Failed to open Excel file: {}", e))?;
    
    // Get first worksheet
    let sheet_names = workbook.sheet_names();
    if sheet_names.is_empty() {
        return Err("Workbook has no sheets".to_string());
    }
    
    let sheet_name = &sheet_names[0];
    let range = workbook.worksheet_range(sheet_name)
        .map_err(|e| format!("Failed to read worksheet: {}", e))?;
    
    // Convert to TSV
    let mut tsv = String::new();
    for row in range.rows() {
        let row_str: Vec<String> = row.iter().map(|cell| {
            match cell {
                Data::Empty => String::new(),
                Data::String(s) => s.clone(),
                Data::Float(f) => f.to_string(),
                Data::Int(i) => i.to_string(),
                Data::Bool(b) => b.to_string(),
                Data::Error(e) => format!("#ERROR: {:?}", e),
                Data::DateTime(dt) => dt.to_string(),
                _ => String::new(),
            }
        }).collect();
        
        let tsv_row = row_str.join("\t");
        tsv.push_str(&tsv_row);
        tsv.push('\n');
    }
    
    Ok(tsv)
}

/// Helper function to get test data file path
fn get_test_file_path(filename: &str) -> PathBuf {
    // Try multiple possible locations
    let possible_paths = vec![
        PathBuf::from(format!("../../../docs/testcases/story_001_testdata/{}", filename)),
        PathBuf::from(format!("../../docs/testcases/story_001_testdata/{}", filename)),
        PathBuf::from(format!("docs/testcases/story_001_testdata/{}", filename)),
    ];
    
    for path in possible_paths {
        if path.exists() {
            return path;
        }
    }
    
    // Return the default expected path
    PathBuf::from(format!("../../../docs/testcases/story_001_testdata/{}", filename))
}

/// Helper function to print TSV structure for debugging
fn print_tsv_structure(tsv: &str, title: &str, max_lines: usize) {
    println!("\n========== {} ==========", title);
    println!("First {} lines of TSV conversion:", max_lines);
    for (i, line) in tsv.lines().take(max_lines).enumerate() {
        println!("Line {}: '{}'", i, line);
    }
    println!("================================================\n");
}

#[test]
fn test_parse_actual_hdfc_savings_xls() {
    let test_file_path = get_test_file_path("SA3234_FY2025_20251221.xls");
    
    if !test_file_path.exists() {
        println!("Test file not found: {}", test_file_path.display());
        println!("Skipping integration test - this is expected in CI/CD environments");
        return;
    }
    
    // Read the actual test file
    let file_bytes = fs::read(&test_file_path)
        .expect("Failed to read test file");
    
    println!("Read {} bytes from test file: {}", file_bytes.len(), test_file_path.display());
    
    // Convert Excel to TSV using helper function
    let tsv = excel_to_tsv(&file_bytes)
        .expect("Failed to convert Excel to TSV");
    
    print_tsv_structure(&tsv, "ACTUAL TEST FILE STRUCTURE", 30);
    
    // Test if parser can identify this
    let parser = HdfcSavingsParser;
    let can_identify = parser.identify(&tsv);
    
    println!("Can parser identify this format? {}", can_identify);
    
    if !can_identify {
        println!("\n❌ PARSER FAILED TO IDENTIFY THE ACTUAL TEST FILE!");
        println!("Checking identification requirements:");
        
        let lines: Vec<&str> = tsv.lines().take(20).collect();
        println!("\nChecking each line for required components:");
        
        for (i, line) in lines.iter().enumerate() {
            let has_date = line.contains("Date");
            let has_narration = line.contains("Narration");
            let has_withdrawal = line.contains("Withdrawal Amt");
            let has_deposit = line.contains("Deposit Amt");
            
            if has_date || has_narration || has_withdrawal || has_deposit {
                println!("Line {}: Has Date:{} Narration:{} Withdrawal:{} Deposit:{}", 
                    i, has_date, has_narration, has_withdrawal, has_deposit);
            }
        }
        
        println!("\nChecking for 'hdfc bank' in first 10 lines:");
        for (i, line) in tsv.lines().take(10).enumerate() {
            if line.to_lowercase().contains("hdfc") {
                println!("Line {}: '{}'", i, line);
            }
        }
        
        panic!("Parser failed to identify actual HDFC Savings test file!");
    }
    
    // Try to parse it
    let result = parser.parse(&tsv);
    
    match result {
        Ok(transactions) => {
            println!("\n✅ Successfully parsed {} transactions", transactions.len());
            assert!(!transactions.is_empty(), "Should have at least one transaction");
            
            // Print first and last transactions for verification
            if !transactions.is_empty() {
                println!("\nFirst transaction:");
                println!("  Date: {}", transactions[0].date);
                println!("  Description: {}", transactions[0].description);
                println!("  Amount: {}", transactions[0].amount);
                println!("  Category: {} / {:?}", transactions[0].category, transactions[0].sub_category);
                println!("  Confidence: {:?} ({:?})", transactions[0].confidence, transactions[0].confidence_level);
                
                let last_idx = transactions.len() - 1;
                println!("\nLast transaction:");
                println!("  Date: {}", transactions[last_idx].date);
                println!("  Description: {}", transactions[last_idx].description);
                println!("  Amount: {}", transactions[last_idx].amount);
                println!("  Category: {} / {:?}", transactions[last_idx].category, transactions[last_idx].sub_category);
            }
        }
        Err(e) => {
            println!("\n❌ Parsing failed: {}", e);
            panic!("Failed to parse the actual test file: {}", e);
        }
    }
}

#[test]
fn test_parse_actual_hdfc_credit_xls() {
    let test_file_path = get_test_file_path("CC2486_20250418.xls");
    
    if !test_file_path.exists() {
        println!("Test file not found: {}", test_file_path.display());
        println!("Skipping integration test - this is expected in CI/CD environments");
        return;
    }
    
    // Read the actual test file
    let file_bytes = fs::read(&test_file_path)
        .expect("Failed to read test file");
    
    println!("Read {} bytes from credit card test file: {}", file_bytes.len(), test_file_path.display());
    
    // Convert Excel to TSV using helper function
    let tsv = excel_to_tsv(&file_bytes)
        .expect("Failed to convert Excel to TSV");
    
    print_tsv_structure(&tsv, "CREDIT CARD TEST FILE STRUCTURE", 30);
    
    // Test if credit card parser can identify this
    let parser = HdfcCreditCardParser;
    let can_identify = parser.identify(&tsv);
    
    println!("Can credit card parser identify this format? {}", can_identify);
    
    if !can_identify {
        println!("\n❌ CREDIT CARD PARSER FAILED TO IDENTIFY!");
        
        let lower_data = tsv.to_lowercase();
        println!("Has 'hdfc': {}", lower_data.contains("hdfc"));
        println!("Has 'credit': {}", lower_data.contains("credit"));
        println!("Has 'card no' or 'credit card no': {}", 
            lower_data.contains("card no") || lower_data.contains("credit card no"));
        println!("Has 'Transaction type' (case-sensitive): {}", tsv.contains("Transaction type"));
        
        // Print first 20 lines to help debug
        println!("\nFirst 20 lines for debugging:");
        for (i, line) in tsv.lines().take(20).enumerate() {
            let lower_line = line.to_lowercase();
            if lower_line.contains("hdfc") || lower_line.contains("credit") || 
               lower_line.contains("card") || lower_line.contains("transaction") {
                println!("Line {}: '{}'", i, line);
            }
        }
        
        panic!("Credit card parser failed to identify actual test file!");
    }
    
    // Try to parse it
    let result = parser.parse(&tsv);
    
    match result {
        Ok(transactions) => {
            println!("\n✅ Successfully parsed {} credit card transactions", transactions.len());
            assert!(!transactions.is_empty(), "Should have at least one transaction");
            
            // Print first transaction for verification
            if !transactions.is_empty() {
                println!("\nFirst transaction:");
                println!("  Date: {}", transactions[0].date);
                println!("  Description: {}", transactions[0].description);
                println!("  Amount: {}", transactions[0].amount);
                println!("  Category: {} / {:?}", transactions[0].category, transactions[0].sub_category);
                println!("  Confidence: {:?} ({:?})", transactions[0].confidence, transactions[0].confidence_level);
            }
        }
        Err(e) => {
            println!("\n❌ Credit card parsing failed: {}", e);
            panic!("Failed to parse the credit card test file: {}", e);
        }
    }
}
