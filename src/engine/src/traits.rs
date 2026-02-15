// Common Parser Traits (Plugin Architecture)

use crate::models::Transaction;

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
