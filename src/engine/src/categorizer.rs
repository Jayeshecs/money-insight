// Categorization Engine for Transaction Classification
// Reference: reference/python_scripts/stmt-proc-py for ported logic

use crate::models::{Transaction, Rule, PatternType};
use std::collections::HashMap;

/// Categorization engine with rule-based matching
pub struct Categorizer {
    rules: Vec<Rule>,
    default_rules: Vec<Rule>,
}

impl Categorizer {
    /// Create a new categorizer with default rules
    pub fn new() -> Self {
        let default_rules = Self::create_default_rules();
        Categorizer {
            rules: Vec::new(),
            default_rules,
        }
    }
    
    /// Load custom user rules
    pub fn load_rules(&mut self, rules: Vec<Rule>) {
        self.rules = rules;
        // Sort by priority (higher first)
        self.rules.sort_by(|a, b| b.priority.cmp(&a.priority));
    }
    
    /// Categorize a transaction
    pub fn categorize(&self, transaction: &mut Transaction) {
        let description = transaction.narration.to_lowercase();
        
        // Try user rules first (highest priority)
        for rule in &self.rules {
            if !rule.active {
                continue;
            }
            
            if self.matches_rule(&description, rule) {
                transaction.set_category(
                    rule.category.clone(),
                    rule.sub_category.clone(),
                    0.95, // High confidence for user rules
                );
                return;
            }
        }
        
        // Try default rules
        for rule in &self.default_rules {
            if self.matches_rule(&description, rule) {
                transaction.set_category(
                    rule.category.clone(),
                    rule.sub_category.clone(),
                    0.85, // Good confidence for default rules
                );
                return;
            }
        }
        
        // Fallback to basic keyword matching
        if let Some((category, sub_category, confidence)) = self.keyword_match(&description) {
            transaction.set_category(category, sub_category, confidence);
            return;
        }
        
        // Default uncategorized with low confidence
        transaction.set_category("Uncategorized".to_string(), None, 0.1);
    }
    
    /// Check if description matches a rule
    fn matches_rule(&self, description: &str, rule: &Rule) -> bool {
        match rule.pattern_type {
            PatternType::Exact => description == rule.pattern.to_lowercase(),
            PatternType::Contains => description.contains(&rule.pattern.to_lowercase()),
            PatternType::Regex => {
                // Simple regex-like matching (can be enhanced with regex crate)
                description.contains(&rule.pattern.to_lowercase())
            }
            PatternType::MerchantId => description.contains(&rule.pattern.to_lowercase()),
        }
    }
    
    /// Keyword-based matching for common patterns
    fn keyword_match(&self, description: &str) -> Option<(String, Option<String>, f64)> {
        let keywords = self.get_keyword_mappings();
        
        for (keyword, (category, sub_category)) in keywords {
            if description.contains(keyword) {
                return Some((
                    category.to_string(),
                    sub_category.map(|s| s.to_string()),
                    0.7, // Medium confidence for keyword matching
                ));
            }
        }
        
        None
    }
    
    /// Get keyword to category mappings
    fn get_keyword_mappings(&self) -> HashMap<&str, (&str, Option<&str>)> {
        let mut map = HashMap::new();
        
        // Food & Dining
        map.insert("swiggy", ("Food", Some("Dining")));
        map.insert("zomato", ("Food", Some("Dining")));
        map.insert("restaurant", ("Food", Some("Dining")));
        map.insert("cafe", ("Food", Some("Cafe")));
        map.insert("coffee", ("Food", Some("Cafe")));
        map.insert("starbucks", ("Food", Some("Cafe")));
        map.insert("dominos", ("Food", Some("Dining")));
        map.insert("pizza", ("Food", Some("Dining")));
        map.insert("mcdonald", ("Food", Some("Dining")));
        map.insert("kfc", ("Food", Some("Dining")));
        map.insert("grocery", ("Food", Some("Groceries")));
        map.insert("bigbasket", ("Food", Some("Groceries")));
        map.insert("grofers", ("Food", Some("Groceries")));
        map.insert("blinkit", ("Food", Some("Groceries")));
        map.insert("dmart", ("Food", Some("Groceries")));
        
        // Transportation
        map.insert("uber", ("Transportation", Some("Ride Share")));
        map.insert("ola", ("Transportation", Some("Ride Share")));
        map.insert("rapido", ("Transportation", Some("Ride Share")));
        map.insert("petrol", ("Transportation", Some("Fuel")));
        map.insert("fuel", ("Transportation", Some("Fuel")));
        map.insert("diesel", ("Transportation", Some("Fuel")));
        map.insert("parking", ("Transportation", Some("Parking")));
        map.insert("toll", ("Transportation", Some("Toll")));
        map.insert("fastag", ("Transportation", Some("Toll")));
        
        // Utilities
        map.insert("electricity", ("Utilities", Some("Electric")));
        map.insert("electric", ("Utilities", Some("Electric")));
        map.insert("paytm", ("Utilities", None));
        map.insert("phonepe", ("Utilities", None));
        map.insert("water", ("Utilities", Some("Water")));
        map.insert("gas", ("Utilities", Some("Gas")));
        map.insert("recharge", ("Utilities", Some("Mobile")));
        map.insert("mobile recharge", ("Utilities", Some("Mobile")));
        
        // Shopping
        map.insert("amazon", ("Shopping", Some("Online")));
        map.insert("flipkart", ("Shopping", Some("Online")));
        map.insert("myntra", ("Shopping", Some("Clothing")));
        map.insert("ajio", ("Shopping", Some("Clothing")));
        map.insert("meesho", ("Shopping", Some("Online")));
        
        // Entertainment
        map.insert("netflix", ("Entertainment", Some("Streaming")));
        map.insert("spotify", ("Entertainment", Some("Music")));
        map.insert("youtube", ("Entertainment", Some("Streaming")));
        map.insert("prime video", ("Entertainment", Some("Streaming")));
        map.insert("movie", ("Entertainment", Some("Movies")));
        map.insert("cinema", ("Entertainment", Some("Movies")));
        map.insert("pvr", ("Entertainment", Some("Movies")));
        map.insert("inox", ("Entertainment", Some("Movies")));
        map.insert("bookmyshow", ("Entertainment", Some("Movies")));
        
        // Healthcare
        map.insert("pharmacy", ("Healthcare", Some("Pharmacy")));
        map.insert("apollo", ("Healthcare", Some("Pharmacy")));
        map.insert("hospital", ("Healthcare", Some("Medical")));
        map.insert("doctor", ("Healthcare", Some("Medical")));
        map.insert("clinic", ("Healthcare", Some("Medical")));
        map.insert("netmeds", ("Healthcare", Some("Pharmacy")));
        map.insert("1mg", ("Healthcare", Some("Pharmacy")));
        
        // Insurance
        map.insert("insurance", ("Insurance", None));
        map.insert("premium", ("Insurance", None));
        map.insert("policy", ("Insurance", None));
        
        // Subscriptions
        map.insert("subscription", ("Subscriptions", None));
        map.insert("membership", ("Subscriptions", None));
        
        // ATM/Bank
        map.insert("atm", ("Cash Withdrawal", None));
        map.insert("cash withdrawal", ("Cash Withdrawal", None));
        map.insert("withdrawal", ("Cash Withdrawal", None));
        
        // Income indicators
        map.insert("salary", ("Income", Some("Salary")));
        map.insert("dividend", ("Income", Some("Investment")));
        map.insert("interest", ("Income", Some("Interest")));
        map.insert("refund", ("Income", Some("Refund")));
        
        map
    }
    
    /// Create default categorization rules
    fn create_default_rules() -> Vec<Rule> {
        let mut rules = Vec::new();
        
        // High-confidence patterns
        rules.push(Rule::new(
            PatternType::Contains,
            "upi-swiggy".to_string(),
            "Food".to_string(),
            Some("Dining".to_string()),
            95,
        ));
        
        rules.push(Rule::new(
            PatternType::Contains,
            "upi-zomato".to_string(),
            "Food".to_string(),
            Some("Dining".to_string()),
            95,
        ));
        
        rules.push(Rule::new(
            PatternType::Contains,
            "netflix".to_string(),
            "Entertainment".to_string(),
            Some("Streaming".to_string()),
            90,
        ));
        
        rules.push(Rule::new(
            PatternType::Contains,
            "spotify".to_string(),
            "Entertainment".to_string(),
            Some("Music".to_string()),
            90,
        ));
        
        rules.push(Rule::new(
            PatternType::Contains,
            "amazon".to_string(),
            "Shopping".to_string(),
            Some("Online".to_string()),
            85,
        ));
        
        rules.push(Rule::new(
            PatternType::Contains,
            "flipkart".to_string(),
            "Shopping".to_string(),
            Some("Online".to_string()),
            85,
        ));
        
        rules.push(Rule::new(
            PatternType::Contains,
            "uber".to_string(),
            "Transportation".to_string(),
            Some("Ride Share".to_string()),
            90,
        ));
        
        rules.push(Rule::new(
            PatternType::Contains,
            "ola cab".to_string(),
            "Transportation".to_string(),
            Some("Ride Share".to_string()),
            90,
        ));
        
        // Sort by priority
        rules.sort_by(|a, b| b.priority.cmp(&a.priority));
        
        rules
    }
}

impl Default for Categorizer {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::Transaction;

    #[test]
    fn test_categorize_swiggy() {
        let categorizer = Categorizer::new();
        let mut txn = Transaction::new(
            "2025-01-10".to_string(),
            "HDFC_SAVINGS_1234".to_string(),
            "UPI-SWIGGY-BANGALORE-12345".to_string(),
            450.0,
            String::new(),
            crate::models::TransactionType::Expense,
            "HDFC_SAVINGS".to_string(),
        );
        
        categorizer.categorize(&mut txn);
        
        assert_eq!(txn.category, "Food");
        assert_eq!(txn.sub_category, Some("Dining".to_string()));
        assert!(txn.confidence > 0.8);
    }

    #[test]
    fn test_categorize_netflix() {
        let categorizer = Categorizer::new();
        let mut txn = Transaction::new(
            "2025-01-10".to_string(),
            "HDFC_SAVINGS_1234".to_string(),
            "NETFLIX SUBSCRIPTION".to_string(),
            199.0,
            String::new(),
            crate::models::TransactionType::Expense,
            "HDFC_SAVINGS".to_string(),
        );
        
        categorizer.categorize(&mut txn);
        
        assert_eq!(txn.category, "Entertainment");
        assert_eq!(txn.sub_category, Some("Streaming".to_string()));
    }

    #[test]
    fn test_categorize_unknown() {
        let categorizer = Categorizer::new();
        let mut txn = Transaction::new(
            "2025-01-10".to_string(),
            "HDFC_SAVINGS_1234".to_string(),
            "SOME RANDOM MERCHANT".to_string(),
            100.0,
            String::new(),
            crate::models::TransactionType::Expense,
            "HDFC_SAVINGS".to_string(),
        );
        
        categorizer.categorize(&mut txn);
        
        assert_eq!(txn.category, "Uncategorized");
        assert!(txn.confidence < 0.5);
    }

    #[test]
    fn test_custom_rule_priority() {
        let mut categorizer = Categorizer::new();
        
        // Add custom rule that overrides default
        let custom_rule = Rule::new(
            PatternType::Contains,
            "swiggy".to_string(),
            "Custom Category".to_string(),
            Some("Custom SubCategory".to_string()),
            100,
        );
        
        categorizer.load_rules(vec![custom_rule]);
        
        let mut txn = Transaction::new(
            "2025-01-10".to_string(),
            "HDFC_SAVINGS_1234".to_string(),
            "UPI-SWIGGY-TEST".to_string(),
            450.0,
            String::new(),
            crate::models::TransactionType::Expense,
            "HDFC_SAVINGS".to_string(),
        );
        
        categorizer.categorize(&mut txn);
        
        // Custom rule should take precedence
        assert_eq!(txn.category, "Custom Category");
        assert_eq!(txn.confidence, 0.95);
    }
}
