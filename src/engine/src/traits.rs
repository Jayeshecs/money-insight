// Common Parser Traits (Plugin Architecture)

use serde::{Deserialize, Serialize};

/// Core transaction data structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub date: String,           // ISO 8601: YYYY-MM-DD
    pub description: String,
    pub amount: f64,            // Signed: negative for debits, positive for credits
    pub account: String,        // Account identifier (e.g., "HDFC_SAVINGS")
    pub transaction_type: String, // "DEBIT" or "CREDIT"
}

/// Result of parsing operation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionBatch {
    pub source_parser: String,
    pub transactions: Vec<Transaction>,
    pub parse_duration_ms: u64,
    pub error: Option<String>,
}

/// Bank parser trait - implement this for each bank/statement format
pub trait BankParser: Send + Sync {
    /// Check if this parser can handle the given file content
    fn identify(&self, data: &str) -> bool;
    
    /// Parse the file content into transactions
    fn parse(&self, data: &str) -> Result<Vec<Transaction>, String>;
    
    /// Return the parser name for identification
    fn name(&self) -> &'static str;
}

/// Plugin registry for managing multiple parsers
pub struct PluginRegistry {
    pub parsers: Vec<Box<dyn BankParser>>,
}

impl PluginRegistry {
    pub fn new() -> Self {
        PluginRegistry {
            parsers: Vec::new(),
        }
    }
    
    pub fn register(&mut self, parser: Box<dyn BankParser>) {
        self.parsers.push(parser);
    }
    
    /// Auto-detect which parser to use based on file content
    pub fn auto_detect(&self, data: &str) -> Option<&dyn BankParser> {
        self.parsers.iter()
            .find(|p| p.identify(data))
            .map(|p| p.as_ref())
    }
}
