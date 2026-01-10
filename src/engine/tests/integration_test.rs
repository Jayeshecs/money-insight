// Integration test for Excel to TSV conversion and parsing
// This test reads actual test data files and verifies end-to-end parsing

use std::fs;
use std::path::Path;
use calamine::{Reader, open_workbook_auto_from_rs, Data};
use std::io::Cursor;

// Import from the crate's internal modules for testing
use moneyinsight_wasm::parsers::hdfc_savings::HdfcSavingsParser;
use moneyinsight_wasm::parsers::hdfc_credit::HdfcCreditCardParser;
use moneyinsight_wasm::traits::BankParser;

#[test]
fn test_parse_actual_hdfc_savings_xls() {
    let test_file_path = "../../../docs/testcases/story_001_testdata/SA3234_FY2025_20251221.xls";
    
    if !Path::new(test_file_path).exists() {
        println!("Test file not found: {}", test_file_path);
        println!("Skipping integration test - this is expected in CI/CD environments");
        return;
    }
    
    // Read the actual test file
    let file_bytes = fs::read(test_file_path)
        .expect("Failed to read test file");
    
    println!("Read {} bytes from test file", file_bytes.len());
    
    // Simulate what the WASM engine does: Convert Excel to TSV
    use calamine::{Reader, open_workbook_auto_from_rs, Data};
    use std::io::Cursor;
    
    let cursor = Cursor::new(&file_bytes);
    let mut workbook = open_workbook_auto_from_rs(cursor)
        .expect("Failed to open Excel file");
    
    // Get first worksheet
    let sheet_names = workbook.sheet_names();
    assert!(!sheet_names.is_empty(), "Workbook should have at least one sheet");
    
    let sheet_name = &sheet_names[0];
    let range = workbook.worksheet_range(sheet_name)
        .expect("Failed to read worksheet");
    
    // Convert to TSV (same logic as lib.rs excel_to_tsv)
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
    
    println!("\n========== ACTUAL TEST FILE STRUCTURE ==========");
    println!("First 30 lines of TSV conversion:");
    for (i, line) in tsv.lines().take(30).enumerate() {
        println!("Line {}: '{}'", i, line);
    }
    println!("================================================\n");
    
    // Now test if our parser can identify this
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
            if !transactions.is_empty() {
                println!("First transaction: {:?}", transactions[0]);
                println!("Last transaction: {:?}", transactions[transactions.len() - 1]);
            }
            assert!(!transactions.is_empty(), "Should have at least one transaction");
        }
        Err(e) => {
            println!("\n❌ Parsing failed: {}", e);
            panic!("Failed to parse the actual test file: {}", e);
        }
    }
}

#[test]
fn test_parse_actual_hdfc_credit_xls() {
    let test_file_path = "../../../docs/testcases/story_001_testdata/CC2486_20250418.xls";
    
    if !Path::new(test_file_path).exists() {
        println!("Test file not found: {}", test_file_path);
        println!("Skipping integration test - this is expected in CI/CD environments");
        return;
    }
    
    // Read the actual test file
    let file_bytes = fs::read(test_file_path)
        .expect("Failed to read test file");
    
    println!("Read {} bytes from credit card test file", file_bytes.len());
    
    // Simulate what the WASM engine does: Convert Excel to TSV
    use calamine::{Reader, open_workbook_auto_from_rs, Data};
    use std::io::Cursor;
    
    let cursor = Cursor::new(&file_bytes);
    let mut workbook = open_workbook_auto_from_rs(cursor)
        .expect("Failed to open Excel file");
    
    let sheet_names = workbook.sheet_names();
    let sheet_name = &sheet_names[0];
    let range = workbook.worksheet_range(sheet_name)
        .expect("Failed to read worksheet");
    
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
    
    println!("\n========== CREDIT CARD TEST FILE STRUCTURE ==========");
    println!("First 30 lines of TSV conversion:");
    for (i, line) in tsv.lines().take(30).enumerate() {
        println!("Line {}: '{}'", i, line);
    }
    println!("====================================================\n");
    
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
        
        panic!("Credit card parser failed to identify actual test file!");
    }
    
    // Try to parse it
    let result = parser.parse(&tsv);
    
    match result {
        Ok(transactions) => {
            println!("\n✅ Successfully parsed {} credit card transactions", transactions.len());
            if !transactions.is_empty() {
                println!("First transaction: {:?}", transactions[0]);
            }
            assert!(!transactions.is_empty(), "Should have at least one transaction");
        }
        Err(e) => {
            println!("\n❌ Credit card parsing failed: {}", e);
            panic!("Failed to parse the credit card test file: {}", e);
        }
    }
}
