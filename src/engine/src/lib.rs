// WASM Entry point & Auto-detection logic

use wasm_bindgen::prelude::*;
use js_sys::Uint8Array;
use calamine::{Reader, open_workbook_auto_from_rs, Data};
use std::io::Cursor;
use std::collections::HashMap;

pub mod traits;
pub mod models;
pub mod parsers;
pub mod categorizer;
mod detector;

use traits::{PluginRegistry};
use models::{Transaction, TransactionBatch, DashboardSummary, CategoryStats, PeriodSummary};
use parsers::{HdfcSavingsParser, HdfcCreditCardParser};
use detector::StatementDetector;
use categorizer::Categorizer;

/// Set up panic hook for better error messages in WASM
#[wasm_bindgen(start)]
pub fn init_panic_hook() {
    console_error_panic_hook::set_once();
}

/// Main WASM Engine interface
#[wasm_bindgen]
pub struct WasmEngine {
    registry: PluginRegistry,
    categorizer: Categorizer,
}

#[wasm_bindgen]
impl WasmEngine {
    /// Initialize the WASM engine with all available parsers
    #[wasm_bindgen(constructor)]
    pub fn new() -> Result<WasmEngine, JsValue> {
        let mut registry = PluginRegistry::new();
        
        // Register all available parsers
        registry.register(Box::new(HdfcSavingsParser));
        registry.register(Box::new(HdfcCreditCardParser));
        
        // Initialize categorizer with default rules
        let categorizer = Categorizer::new();
        
        Ok(WasmEngine { registry, categorizer })
    }
    
    /// Parse a bank statement file (Excel or CSV)
    /// 
    /// # Arguments
    /// * `file_data` - Binary file data as Uint8Array
    /// * `file_name` - The name of the file (used to determine file type)
    /// 
    /// # Returns
    /// JSON string containing TransactionBatch or error
    #[wasm_bindgen]
    pub fn parse_file(&self, file_data: Uint8Array, file_name: &str) -> Result<String, JsValue> {
        // Convert Uint8Array to Vec<u8>
        let bytes = file_data.to_vec();
        
        if bytes.is_empty() {
            return Err(JsValue::from_str("File is empty or could not be read"));
        }
        
        // Convert to text (Excel to TSV or use as-is for CSV/TXT)
        let text_data = if file_name.to_lowercase().ends_with(".xlsx") || file_name.to_lowercase().ends_with(".xls") {
            self.excel_to_tsv(&bytes)?
        } else {
            // Assume CSV/TXT - convert bytes to string
            String::from_utf8(bytes)
                .map_err(|e| JsValue::from_str(&format!("Invalid UTF-8 in file: {}", e)))?
        };
        
        // Validate basic structure
        if let Err(e) = StatementDetector::validate_structure(&text_data) {
            return Err(JsValue::from_str(&format!("Invalid file structure: {}", e)));
        }
        
        // Capture parse start time (WASM only — std::time::Instant not available in wasm32)
        #[cfg(target_arch = "wasm32")]
        let start_time = js_sys::Date::now();

        // Debug: log what WASM sees before detection
        #[cfg(target_arch = "wasm32")]
        {
            use web_sys::console;
            let first_30_lines: String = text_data
                .lines()
                .take(30)
                .enumerate()
                .map(|(i, line)| format!("{}| {}", i + 1, line))
                .collect::<Vec<_>>()
                .join("\n");
            console::log_1(&format!("TSV First 30 lines:\n{}", first_30_lines).into());
            console::log_1(&format!("Calling auto-detect with {} bytes of data", text_data.len()).into());
        }

        // Auto-detect parser using enhanced detector
        let detection = StatementDetector::detect(&self.registry.parsers, &text_data);
        
        let parser = match detection.parser {
            Some(p) => p,
            None => {
                // Provide helpful hints about what was detected
                let hints = StatementDetector::get_hints(&text_data);
                let hints_str = hints.join("; ");
                
                return Err(JsValue::from_str(&format!(
                    "No parser found for this file format. Detection hints: {}. Currently supported: HDFC Savings and Credit Card statements.",
                    hints_str
                )));
            }
        };
        
        // Parse transactions
        let mut transactions = parser.parse(&text_data)
            .map_err(|e| JsValue::from_str(&format!("File could not be parsed. {}", e)))?;
        
        // Categorize all transactions
        for transaction in &mut transactions {
            self.categorizer.categorize(transaction);
        }

        // Capture parse duration using JS performance clock
        #[cfg(target_arch = "wasm32")]
        let parse_duration_ms = {
            let end = js_sys::Date::now();
            (end - start_time) as u64
        };
        #[cfg(not(target_arch = "wasm32"))]
        let parse_duration_ms = 0u64;
        
        let batch = TransactionBatch {
            source_parser: parser.name().to_string(),
            transactions,
            parse_duration_ms,
            error: None,
        };
        
        serde_json::to_string(&batch)
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize results: {}", e)))
    }
    
    /// Convert Excel file bytes to TSV string
    fn excel_to_tsv(&self, bytes: &[u8]) -> Result<String, JsValue> {
        // Pre-validate file structure to catch corruption early
        if bytes.len() < 512 {
            return Err(JsValue::from_str(
                "File could not be parsed. The file may be corrupted or invalid. Please check the file and try again."
            ));
        }
        
        // Check for valid file signatures
        // ZIP signature (0x504B0304) for .xlsx files
        // CFB signature (0xD0CF11E0) for .xls files
        let has_zip_sig = bytes.len() >= 4 && 
                          bytes[0] == 0x50 && bytes[1] == 0x4B && 
                          bytes[2] == 0x03 && bytes[3] == 0x04;
        let has_cfb_sig = bytes.len() >= 8 && 
                          bytes[0] == 0xD0 && bytes[1] == 0xCF && 
                          bytes[2] == 0x11 && bytes[3] == 0xE0;
        
        // If file doesn't have Excel signatures, it's likely encrypted or wrong format
        // Since user uploaded .xlsx/.xls file, assume encryption rather than corruption
        if !has_zip_sig && !has_cfb_sig {
            return Err(JsValue::from_str(
                "Password-protected and encrypted statements are not supported. Please export without encryption."
            ));
        }
        
        // For CFB files (.xls), validate the header structure more thoroughly
        if has_cfb_sig {
            // Check sector size (should be 512 or 4096)
            if bytes.len() >= 30 {
                let sector_shift = bytes[30] as u16 | ((bytes[31] as u16) << 8);
                if sector_shift < 9 || sector_shift > 12 {
                    return Err(JsValue::from_str(
                        "File could not be parsed. The file may be corrupted or invalid. Please check the file and try again."
                    ));
                }
                let sector_size = 1u32 << sector_shift;
                
                // Validate FAT sector count and directory sector
                if bytes.len() >= 68 {
                    let _num_fat_sectors = u32::from_le_bytes([bytes[44], bytes[45], bytes[46], bytes[47]]);
                    let first_dir_sector = u32::from_le_bytes([bytes[48], bytes[49], bytes[50], bytes[51]]);
                    
                    // If file is too small to contain the claimed sectors, it's corrupted
                    let min_required_size = (sector_size * (first_dir_sector + 1)) as usize;
                    if bytes.len() < min_required_size && first_dir_sector != 0xFFFFFFFF {
                        return Err(JsValue::from_str(
                            "File could not be parsed. The file may be corrupted or invalid. Please check the file and try again."
                        ));
                    }
                }
            }
        }
        
        let cursor = Cursor::new(bytes);
        let workbook_result = open_workbook_auto_from_rs(cursor);
        
        // Handle encryption and other open errors with specific messages
        let mut workbook = match workbook_result {
            Err(e) => {
                let error_msg = e.to_string().to_lowercase();
                
                // Check for encryption/password protection
                if error_msg.contains("password") || 
                   error_msg.contains("encrypted") || 
                   error_msg.contains("protection") ||
                   error_msg.contains("cipher") {
                    return Err(JsValue::from_str(
                        "Password-protected and encrypted statements are not supported. Please export without encryption."
                    ));
                }
                
                // Check for corruption indicators
                if error_msg.contains("invalid") || 
                   error_msg.contains("corrupt") || 
                   error_msg.contains("unexpected") ||
                   error_msg.contains("malformed") {
                    return Err(JsValue::from_str(
                        "File could not be parsed. The file may be corrupted or invalid. Please check the file and try again."
                    ));
                }
                
                // "Cannot detect file format" - could be encrypted or corrupted
                if error_msg.contains("cannot detect") || error_msg.contains("detect") {
                    return Err(JsValue::from_str(
                        "Password-protected and encrypted statements are not supported. Please export without encryption."
                    ));
                }
                
                // Generic error - likely corruption since we validated signatures
                return Err(JsValue::from_str(
                    "File could not be parsed. The file may be corrupted or invalid. Please check the file and try again."
                ));
            }
            Ok(wb) => wb,
        };
        
        // Get first worksheet
        let sheet_names = workbook.sheet_names();
        if sheet_names.is_empty() {
            return Err(JsValue::from_str("Excel file has no worksheets"));
        }
        
        let sheet_name = &sheet_names[0];
        let range = workbook
            .worksheet_range(sheet_name)
            .map_err(|e| JsValue::from_str(&format!("Failed to read worksheet: {}", e)))?;
        
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
            
            // Build TSV row - preserves empty cells including first cell
            let tsv_row = row_str.join("\t");
            tsv.push_str(&tsv_row);
            tsv.push('\n');
        }
        
        Ok(tsv)
    }
    
    /// List all available parsers
    /// 
    /// # Returns
    /// Array of parser names as JsValue
    #[wasm_bindgen]
    pub fn list_parsers(&self) -> JsValue {
        let parsers: Vec<String> = self.registry.parsers
            .iter()
            .map(|p| p.name().to_string())
            .collect();
        
        serde_wasm_bindgen::to_value(&parsers).unwrap_or(JsValue::NULL)
    }
    
    /// Detect the file format without parsing
    /// 
    /// # Arguments
    /// * `file_data` - Binary file data as Uint8Array
    /// * `file_name` - The name of the file
    /// 
    /// # Returns
    /// JSON object with detection results: { detected: bool, format: string, confidence: string, hints: string[] }
    #[wasm_bindgen]
    pub fn detect_format(&self, file_data: Uint8Array, file_name: &str) -> Result<String, JsValue> {
        // Convert Uint8Array to Vec<u8>
        let bytes = file_data.to_vec();
        
        if bytes.is_empty() {
            return Err(JsValue::from_str("File is empty or could not be read"));
        }
        
        // Convert to text (Excel to TSV or use as-is for CSV/TXT)
        let text_data = if file_name.to_lowercase().ends_with(".xlsx") || file_name.to_lowercase().ends_with(".xls") {
            self.excel_to_tsv(&bytes)?
        } else {
            String::from_utf8(bytes)
                .map_err(|e| JsValue::from_str(&format!("Invalid UTF-8 in file: {}", e)))?
        };
        
        // Debug: log what WASM sees during detect_format
        #[cfg(target_arch = "wasm32")]
        {
            use web_sys::console;
            let first_30_lines: String = text_data
                .lines()
                .take(30)
                .enumerate()
                .map(|(i, line)| format!("{}| {}", i + 1, line))
                .collect::<Vec<_>>()
                .join("\n");
            console::log_1(&format!("[detect_format] TSV First 30 lines:\n{}", first_30_lines).into());
            console::log_1(&format!("[detect_format] Calling auto-detect with {} bytes of data", text_data.len()).into());
        }

        // Validate structure
        let structure_valid = StatementDetector::validate_structure(&text_data).is_ok();
        
        // Detect format
        let detection = StatementDetector::detect(&self.registry.parsers, &text_data);
        let hints = StatementDetector::get_hints(&text_data);
        
        let result = serde_json::json!({
            "detected": detection.parser.is_some(),
            "format": detection.parser.map(|p| p.name()).unwrap_or("Unknown"),
            "confidence": format!("{:?}", detection.confidence),
            "reason": detection.reason,
            "hints": hints,
            "structureValid": structure_valid,
        });
        
        serde_json::to_string(&result)
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize results: {}", e)))
    }
}

// ============================================================================
// Standalone WASM functions
// ============================================================================

/// Pure helper: deserialize JSON array of Transaction objects.
/// Separated from the WASM binding so it can be unit-tested natively.
fn parse_transactions_json(json: &str) -> Result<Vec<Transaction>, String> {
    serde_json::from_str(json).map_err(|e| format!("Invalid transactions JSON: {}", e))
}

/// Compute an aggregated dashboard summary from a JSON array of Transaction objects.
///
/// Accepts the `transactions` array previously returned by `parse_file()` (or loaded
/// from IndexedDB) and returns a `DashboardSummary` JSON with totals, category
/// breakdown, source breakdown, and the date range covered.
///
/// # Arguments
/// * `transactions_json` - JSON string: an **array** of `Transaction` objects
///
/// # Returns
/// JSON string of `DashboardSummary` or an error.
#[wasm_bindgen]
pub fn get_dashboard_summary(transactions_json: &str) -> Result<String, JsValue> {
    let transactions = parse_transactions_json(transactions_json)
        .map_err(|e| JsValue::from_str(&e))?;

    let summary = compute_dashboard_summary(&transactions);

    serde_json::to_string(&summary)
        .map_err(|e| JsValue::from_str(&format!("Failed to serialize dashboard summary: {}", e)))
}

/// Pure function: compute DashboardSummary from a slice of Transactions.
/// Separated from the WASM binding to allow native unit testing.
pub fn compute_dashboard_summary(transactions: &[Transaction]) -> DashboardSummary {
    let mut total_credit = 0.0_f64;
    let mut total_debit = 0.0_f64;
    let mut category_breakdown: HashMap<String, CategoryStats> = HashMap::new();
    let mut source_breakdown: HashMap<String, usize> = HashMap::new();
    let mut from_date: Option<String> = None;
    let mut to_date: Option<String> = None;

    for txn in transactions {
        let is_credit = txn.credit_indicator == "Yes";

        if is_credit {
            total_credit += txn.amount;
        } else {
            total_debit += txn.amount;
            // Category breakdown for debit (spending) transactions only
            let stats = category_breakdown
                .entry(txn.category.clone())
                .or_insert(CategoryStats { total_amount: 0.0, count: 0, percentage: 0.0 });
            stats.total_amount += txn.amount;
            stats.count += 1;
        }

        // Source (parser) breakdown — counts all transaction types
        *source_breakdown.entry(txn.source.clone()).or_insert(0) += 1;

        // Track date range
        match &from_date {
            None => from_date = Some(txn.date.clone()),
            Some(d) if txn.date < *d => from_date = Some(txn.date.clone()),
            _ => {}
        }
        match &to_date {
            None => to_date = Some(txn.date.clone()),
            Some(d) if txn.date > *d => to_date = Some(txn.date.clone()),
            _ => {}
        }
    }

    // Calculate per-category percentage of total debit spend
    if total_debit > 0.0 {
        for stats in category_breakdown.values_mut() {
            stats.percentage = (stats.total_amount / total_debit) * 100.0;
        }
    }

    let period = match (from_date, to_date) {
        (Some(from), Some(to)) => Some(PeriodSummary { from_date: from, to_date: to }),
        _ => None,
    };

    DashboardSummary {
        transaction_count: transactions.len(),
        total_credit,
        total_debit,
        net_flow: total_credit - total_debit,
        category_breakdown,
        source_breakdown,
        period,
    }
}

#[cfg(all(test, target_arch = "wasm32"))]
mod wasm_tests {
    use super::*;
    use wasm_bindgen_test::*;

    #[wasm_bindgen_test]
    fn test_engine_initialization() {
        let engine = WasmEngine::new();
        assert!(engine.is_ok());
    }

    #[wasm_bindgen_test]
    fn test_empty_file_rejection() {
        let engine = WasmEngine::new().unwrap();
        let empty_array = js_sys::Uint8Array::new_with_length(0);
        let result = engine.parse_file(empty_array, "test.csv");
        assert!(result.is_err());
    }
}

#[cfg(all(test, not(target_arch = "wasm32")))]
mod native_tests {
    use super::*;

    #[test]
    fn test_plugin_registry() {
        let mut registry = PluginRegistry::new();
        registry.register(Box::new(HdfcSavingsParser));
        registry.register(Box::new(HdfcCreditCardParser));
        
        assert_eq!(registry.parsers.len(), 2);
    }

    #[test]
    fn test_auto_detection_hdfc_savings() {
        let mut registry = PluginRegistry::new();
        registry.register(Box::new(HdfcSavingsParser));
        registry.register(Box::new(HdfcCreditCardParser));
        
        let sample_data = "HDFC Bank\nDate\tNarration\tChq./Ref.No.\tValue Dt\tWithdrawal Amt.\tDeposit Amt.\tClosing Balance";
        let parser = registry.auto_detect(sample_data);
        
        assert!(parser.is_some());
        assert_eq!(parser.unwrap().name(), "HDFC Savings Account");
    }

    #[test]
    fn test_auto_detection_hdfc_credit() {
        let mut registry = PluginRegistry::new();
        registry.register(Box::new(HdfcSavingsParser));
        registry.register(Box::new(HdfcCreditCardParser));
        
        let sample_data = "HDFC Bank\nCredit Card Statement\nCard No: 1234567890123456\nTransaction type\tDescription\tAmount\tCr/Dr";
        let parser = registry.auto_detect(sample_data);
        
        assert!(parser.is_some());
        assert_eq!(parser.unwrap().name(), "HDFC Credit Card");
    }

    #[test]
    fn test_auto_detection_no_match() {
        let mut registry = PluginRegistry::new();
        registry.register(Box::new(HdfcSavingsParser));
        registry.register(Box::new(HdfcCreditCardParser));
        
        let sample_data = "Random bank statement data";
        let parser = registry.auto_detect(sample_data);
        
        assert!(parser.is_none());
    }

    // =========================================================================
    // Story 005: Dashboard Summary Tests
    // =========================================================================

    fn make_txn(date: &str, narration: &str, amount: f64, credit: bool, category: &str) -> Transaction {
        use models::{TransactionType, ConfidenceLevel, TransactionStatus};
        Transaction {
            id: uuid::Uuid::new_v4().to_string(),
            date: date.to_string(),
            account: "HDFC_SAVINGS".to_string(),
            narration: narration.to_string(),
            amount,
            credit_indicator: if credit { "Yes".to_string() } else { String::new() },
            transaction_type: if credit { TransactionType::Income } else { TransactionType::Expense },
            category: category.to_string(),
            sub_category: None,
            confidence: 0.9,
            confidence_level: ConfidenceLevel::High,
            status: TransactionStatus::Pending,
            source: "HDFC_SAVINGS".to_string(),
            memo_notes: None,
            tags: vec![],
            created_at: "2025-01-01T00:00:00Z".to_string(),
            last_modified: "2025-01-01T00:00:00Z".to_string(),
            synced: false,
        }
    }

    #[test]
    fn test_dashboard_summary_empty_input() {
        let summary = compute_dashboard_summary(&[]);
        assert_eq!(summary.transaction_count, 0);
        assert_eq!(summary.total_credit, 0.0);
        assert_eq!(summary.total_debit, 0.0);
        assert_eq!(summary.net_flow, 0.0);
        assert!(summary.category_breakdown.is_empty());
        assert!(summary.period.is_none());
    }

    #[test]
    fn test_dashboard_summary_credit_debit_split() {
        let txns = vec![
            make_txn("2025-01-05", "SALARY CREDIT", 45000.0, true, "Income"),
            make_txn("2025-01-10", "UPI-SWIGGY", 450.0, false, "Food"),
            make_txn("2025-01-11", "UPI-AMAZON", 1200.0, false, "Shopping"),
        ];
        let summary = compute_dashboard_summary(&txns);
        assert_eq!(summary.transaction_count, 3);
        assert!((summary.total_credit - 45000.0).abs() < 0.01);
        assert!((summary.total_debit - 1650.0).abs() < 0.01);
        assert!((summary.net_flow - 43350.0).abs() < 0.01);
    }

    #[test]
    fn test_dashboard_summary_category_breakdown() {
        let txns = vec![
            make_txn("2025-01-10", "SWIGGY", 450.0, false, "Food"),
            make_txn("2025-01-11", "ZOMATO", 300.0, false, "Food"),
            make_txn("2025-01-12", "AMAZON", 1200.0, false, "Shopping"),
        ];
        let summary = compute_dashboard_summary(&txns);
        assert_eq!(summary.category_breakdown.len(), 2);
        let food = &summary.category_breakdown["Food"];
        assert!((food.total_amount - 750.0).abs() < 0.01);
        assert_eq!(food.count, 2);
        let shopping = &summary.category_breakdown["Shopping"];
        assert!((shopping.total_amount - 1200.0).abs() < 0.01);
        assert_eq!(shopping.count, 1);
    }

    #[test]
    fn test_dashboard_summary_category_percentage() {
        let txns = vec![
            make_txn("2025-01-10", "SWIGGY", 500.0, false, "Food"),
            make_txn("2025-01-11", "AMAZON", 500.0, false, "Shopping"),
        ];
        let summary = compute_dashboard_summary(&txns);
        let food_pct = summary.category_breakdown["Food"].percentage;
        let shop_pct = summary.category_breakdown["Shopping"].percentage;
        assert!((food_pct - 50.0).abs() < 0.01);
        assert!((shop_pct - 50.0).abs() < 0.01);
    }

    #[test]
    fn test_dashboard_summary_period_range() {
        let txns = vec![
            make_txn("2025-03-15", "TXN A", 100.0, false, "Food"),
            make_txn("2025-01-01", "TXN B", 200.0, false, "Food"),
            make_txn("2025-06-30", "TXN C", 300.0, false, "Food"),
        ];
        let summary = compute_dashboard_summary(&txns);
        let period = summary.period.unwrap();
        assert_eq!(period.from_date, "2025-01-01");
        assert_eq!(period.to_date, "2025-06-30");
    }

    #[test]
    fn test_dashboard_summary_source_breakdown() {
        let txns = vec![
            make_txn("2025-01-10", "TXN A", 100.0, false, "Food"),
            make_txn("2025-01-11", "TXN B", 200.0, false, "Food"),
        ];
        let summary = compute_dashboard_summary(&txns);
        assert_eq!(summary.source_breakdown.get("HDFC_SAVINGS"), Some(&2));
    }

    #[test]
    fn test_get_dashboard_summary_from_json() {
        // TC3 analog: verify JSON round-trip via the pure helper
        let txns = vec![
            make_txn("2025-01-05", "SALARY", 45000.0, true, "Income"),
            make_txn("2025-01-10", "SWIGGY", 450.0, false, "Food"),
        ];
        let txns_json = serde_json::to_string(&txns).unwrap();
        let parsed = parse_transactions_json(&txns_json).unwrap();
        let summary = compute_dashboard_summary(&parsed);
        assert_eq!(summary.transaction_count, 2);
        assert!((summary.total_credit - 45000.0).abs() < 0.01);
        assert!((summary.total_debit - 450.0).abs() < 0.01);
    }

    #[test]
    fn test_parse_transactions_json_invalid() {
        let result = parse_transactions_json("not-valid-json");
        assert!(result.is_err());
    }
}
