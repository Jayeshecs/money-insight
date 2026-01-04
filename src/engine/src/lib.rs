// WASM Entry point & Auto-detection logic

use wasm_bindgen::prelude::*;
use js_sys::Uint8Array;
use calamine::{Reader, open_workbook_auto_from_rs, Data};
use std::io::Cursor;

mod traits;
mod parsers;

use traits::{PluginRegistry, TransactionBatch};
use parsers::{HdfcSavingsParser, HdfcCreditCardParser};

/// Main WASM Engine interface
#[wasm_bindgen]
pub struct WasmEngine {
    registry: PluginRegistry,
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
        
        Ok(WasmEngine { registry })
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
        
        // Auto-detect parser
        let parser = self.registry.auto_detect(&text_data)
            .ok_or_else(|| JsValue::from_str(
                "No parser found for this file format. Please ensure you're uploading a valid HDFC Savings or Credit Card statement."
            ))?;
        
        // Parse transactions
        let transactions = parser.parse(&text_data)
            .map_err(|e| JsValue::from_str(&format!("File could not be parsed. {}", e)))?;
        
        let batch = TransactionBatch {
            source_parser: parser.name().to_string(),
            transactions,
            parse_duration_ms: 0, // Timing not available in WASM
            error: None,
        };
        
        serde_json::to_string(&batch)
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize results: {}", e)))
    }
    
    /// Convert Excel file bytes to TSV string
    fn excel_to_tsv(&self, bytes: &[u8]) -> Result<String, JsValue> {
        let cursor = Cursor::new(bytes);
        let mut workbook = open_workbook_auto_from_rs(cursor)
            .map_err(|e| JsValue::from_str(&format!("Failed to open Excel file: {}", e)))?;
        
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
            tsv.push_str(&row_str.join("\t"));
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
        
        let sample_data = "HDFC Credit Card\nTransaction Date\tDescription\tAmount\tCr/Dr";
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
}
