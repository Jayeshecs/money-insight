// Data Models matching IndexedDB Schema
// Reference: docs/design/02_DATA_MODEL.md

use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::Utc;

/// Transaction entity matching IndexedDB schema
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Transaction {
    /// Unique transaction ID (UUID v4)
    pub id: String,
    
    /// Transaction date (ISO 8601: YYYY-MM-DD)
    pub date: String,
    
    /// Bank account identifier (e.g., "HDFC_SAVINGS_XXXX1234")
    pub account: String,
    
    /// Transaction description/merchant
    pub description: String,
    
    /// Transaction amount (absolute value)
    pub amount: f64,
    
    /// Credit indicator: "Yes" for credit, empty string for debit
    pub credit_indicator: String,
    
    /// Transaction type: Income, Investment, Expense, Transfer
    pub transaction_type: TransactionType,
    
    /// Primary category (e.g., "Food", "Transportation")
    pub category: String,
    
    /// Secondary category (e.g., "Dining", "Groceries")
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sub_category: Option<String>,
    
    /// ML confidence score (0.0 - 1.0)
    pub confidence: f64,
    
    /// Confidence level: "HIGH" (>0.9), "MEDIUM" (0.6-0.9), "LOW" (<0.6)
    pub confidence_level: ConfidenceLevel,
    
    /// Transaction status
    pub status: TransactionStatus,
    
    /// Parser source (e.g., "HDFC_SAVINGS", "HDFC_CREDIT")
    pub source: String,
    
    /// User-added notes
    #[serde(skip_serializing_if = "Option::is_none")]
    pub memo_notes: Option<String>,
    
    /// User-added tags
    #[serde(default)]
    pub tags: Vec<String>,
    
    /// Creation timestamp (ISO 8601)
    pub created_at: String,
    
    /// Last modification timestamp (ISO 8601)
    pub last_modified: String,
    
    /// Whether synced to Google Sheets
    pub synced: bool,
}

impl Transaction {
    /// Create a new transaction with default values
    pub fn new(
        date: String,
        account: String,
        description: String,
        amount: f64,
        credit_indicator: String,
        transaction_type: TransactionType,
        source: String,
    ) -> Self {
        let now = Utc::now().to_rfc3339();
        let id = Uuid::new_v4().to_string();
        
        Transaction {
            id,
            date,
            account,
            description,
            amount,
            credit_indicator,
            transaction_type,
            category: "Uncategorized".to_string(),
            sub_category: None,
            confidence: 0.0,
            confidence_level: ConfidenceLevel::Low,
            status: TransactionStatus::Pending,
            source,
            memo_notes: None,
            tags: Vec::new(),
            created_at: now.clone(),
            last_modified: now,
            synced: false,
        }
    }
    
    /// Set categorization with confidence
    pub fn set_category(&mut self, category: String, sub_category: Option<String>, confidence: f64) {
        self.category = category;
        self.sub_category = sub_category;
        self.confidence = confidence;
        self.confidence_level = ConfidenceLevel::from_score(confidence);
        self.last_modified = Utc::now().to_rfc3339();
    }
    
    /// Update status
    pub fn set_status(&mut self, status: TransactionStatus) {
        self.status = status;
        self.last_modified = Utc::now().to_rfc3339();
    }
}

/// Transaction type enum
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "UPPERCASE")]
pub enum TransactionType {
    Income,      // Money coming in (salary, returns, etc.)
    Investment,  // Investment transactions (mutual funds, stocks, etc.)
    Expense,     // Regular expenses (bills, shopping, etc.)
    Transfer,    // Transfer between accounts
}

impl TransactionType {
    /// Determine transaction type from credit indicator and description
    /// Rules:
    /// - Transfer: can be both credit or debit
    /// - Income: credit only
    /// - Investment: debit only
    /// - Expense: debit only
    pub fn from_credit_indicator_and_description(is_credit: bool, description: &str) -> Self {
        let desc_lower = description.to_lowercase();
        
        // Check for transfers first (can be both credit and debit)
        if desc_lower.contains("transfer") || desc_lower.contains("neft") || desc_lower.contains("imps") || desc_lower.contains("rtgs") {
            return TransactionType::Transfer;
        }
        
        // Credit transactions
        if is_credit {
            // Check for investments in credit (less common, but possible like dividend credits)
            // For now, all non-transfer credits are Income
            return TransactionType::Income;
        }
        
        // Debit transactions
        // Check for investments
        if desc_lower.contains("mutual fund") || desc_lower.contains("sip") || desc_lower.contains("stock") || desc_lower.contains("equity") {
            return TransactionType::Investment;
        }
        
        // Default debit is Expense
        TransactionType::Expense
    }
}

/// Confidence level enum
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "UPPERCASE")]
pub enum ConfidenceLevel {
    High,   // > 0.9
    Medium, // 0.6 - 0.9
    Low,    // < 0.6
}

impl ConfidenceLevel {
    pub fn from_score(score: f64) -> Self {
        if score > 0.9 {
            ConfidenceLevel::High
        } else if score >= 0.6 {
            ConfidenceLevel::Medium
        } else {
            ConfidenceLevel::Low
        }
    }
}

/// Transaction status enum
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "UPPERCASE")]
pub enum TransactionStatus {
    Pending,  // Awaiting user review
    Approved, // User approved
    Flagged,  // Flagged for attention
    Synced,   // Synced to Google Sheets
}

/// Result of parsing operation
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TransactionBatch {
    pub source_parser: String,
    pub transactions: Vec<Transaction>,
    pub parse_duration_ms: u64,
    pub error: Option<String>,
}

/// Categorization Rule entity
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Rule {
    pub id: String,
    pub pattern_type: PatternType,
    pub pattern: String,
    pub category: String,
    pub sub_category: Option<String>,
    pub priority: u8, // 1-100
    pub active: bool,
    pub source: RuleSource,
    pub feedback: bool,
    pub created_at: String,
    pub last_modified: String,
    pub synced: bool,
}

impl Rule {
    pub fn new(
        pattern_type: PatternType,
        pattern: String,
        category: String,
        sub_category: Option<String>,
        priority: u8,
    ) -> Self {
        let now = Utc::now().to_rfc3339();
        Rule {
            id: Uuid::new_v4().to_string(),
            pattern_type,
            pattern,
            category,
            sub_category,
            priority,
            active: true,
            source: RuleSource::UserCreated,
            feedback: false,
            created_at: now.clone(),
            last_modified: now,
            synced: false,
        }
    }
}

/// Pattern type for rules
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "UPPERCASE")]
pub enum PatternType {
    Exact,
    Contains,
    Regex,
    MerchantId,
}

/// Rule source
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "UPPERCASE")]
pub enum RuleSource {
    UserCreated,
    UserFeedback,
    System,
}

/// Model metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Model {
    pub id: String,
    pub version: String,
    pub accuracy_metrics: AccuracyMetrics,
    pub training_data_size: usize,
    pub last_trained: String,
    pub created_at: String,
    pub synced: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccuracyMetrics {
    pub precision: f64,
    pub recall: f64,
    pub f1_score: f64,
}

/// Sync queue entry
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncQueueEntry {
    pub id: String,
    pub operation: SyncOperation,
    pub entity_type: EntityType,
    pub entity_id: String,
    pub payload: serde_json::Value,
    pub status: SyncStatus,
    pub attempts: u32,
    pub last_error: Option<String>,
    pub created_at: String,
    pub processed_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "UPPERCASE")]
pub enum SyncOperation {
    Insert,
    Update,
    Delete,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "UPPERCASE")]
pub enum EntityType {
    Transaction,
    Rule,
    Model,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "UPPERCASE")]
pub enum SyncStatus {
    Pending,
    InProgress,
    Failed,
    Synced,
}

/// Settings entry
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Setting {
    pub key: String,
    pub value: serde_json::Value,
    pub setting_type: SettingType,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "UPPERCASE")]
pub enum SettingType {
    String,
    Number,
    Boolean,
    Object,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_transaction_creation() {
        let txn = Transaction::new(
            "2025-01-10".to_string(),
            "HDFC_SAVINGS_1234".to_string(),
            "UPI-SWIGGY".to_string(),
            450.0,
            String::new(),
            TransactionType::Expense,
            "HDFC_SAVINGS".to_string(),
        );
        
        assert!(!txn.id.is_empty());
        assert_eq!(txn.status, TransactionStatus::Pending);
        assert_eq!(txn.synced, false);
        assert_eq!(txn.category, "Uncategorized");
        assert_eq!(txn.transaction_type, TransactionType::Expense);
        assert_eq!(txn.credit_indicator, "");
    }

    #[test]
    fn test_confidence_level_high() {
        assert_eq!(ConfidenceLevel::from_score(0.95), ConfidenceLevel::High);
    }

    #[test]
    fn test_confidence_level_medium() {
        assert_eq!(ConfidenceLevel::from_score(0.75), ConfidenceLevel::Medium);
        assert_eq!(ConfidenceLevel::from_score(0.6), ConfidenceLevel::Medium);
    }

    #[test]
    fn test_confidence_level_low() {
        assert_eq!(ConfidenceLevel::from_score(0.5), ConfidenceLevel::Low);
        assert_eq!(ConfidenceLevel::from_score(0.0), ConfidenceLevel::Low);
    }

    #[test]
    fn test_transaction_set_category() {
        let mut txn = Transaction::new(
            "2025-01-10".to_string(),
            "HDFC_SAVINGS_1234".to_string(),
            "UPI-SWIGGY".to_string(),
            450.0,
            String::new(),
            TransactionType::Expense,
            "HDFC_SAVINGS".to_string(),
        );
        
        txn.set_category("Food".to_string(), Some("Dining".to_string()), 0.92);
        
        assert_eq!(txn.category, "Food");
        assert_eq!(txn.sub_category, Some("Dining".to_string()));
        assert_eq!(txn.confidence, 0.92);
        assert_eq!(txn.confidence_level, ConfidenceLevel::High);
    }

    #[test]
    fn test_transaction_type_from_amount() {
        // Test expense (debit, no special keywords)
        assert_eq!(
            TransactionType::from_credit_indicator_and_description(false, "SWIGGY ORDER"),
            TransactionType::Expense
        );
        
        // Test income (credit)
        assert_eq!(
            TransactionType::from_credit_indicator_and_description(true, "SALARY CREDIT"),
            TransactionType::Income
        );
        
        // Test transfer (credit)
        assert_eq!(
            TransactionType::from_credit_indicator_and_description(true, "NEFT TRANSFER FROM HDFC"),
            TransactionType::Transfer
        );
        
        // Test transfer (debit)
        assert_eq!(
            TransactionType::from_credit_indicator_and_description(false, "NEFT TRANSFER TO HDFC"),
            TransactionType::Transfer
        );
        
        // Test investment (debit only)
        assert_eq!(
            TransactionType::from_credit_indicator_and_description(false, "SIP MUTUAL FUND"),
            TransactionType::Investment
        );
    }

    #[test]
    fn test_rule_creation() {
        let rule = Rule::new(
            PatternType::Contains,
            "SWIGGY".to_string(),
            "Food".to_string(),
            Some("Dining".to_string()),
            90,
        );
        
        assert!(!rule.id.is_empty());
        assert_eq!(rule.active, true);
        assert_eq!(rule.source, RuleSource::UserCreated);
        assert_eq!(rule.priority, 90);
    }
}
