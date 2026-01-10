// Auto-detection module for bank statement formats
// This module provides centralized detection logic and priority-based matching

use crate::traits::BankParser;

/// Detection confidence levels
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum DetectionConfidence {
    /// No match found
    None = 0,
    /// Weak match - some indicators present
    Low = 1,
    /// Moderate match - most indicators present
    Medium = 2,
    /// Strong match - all key indicators present
    High = 3,
}

/// Detection result with confidence score
pub struct DetectionResult<'a> {
    pub parser: Option<&'a dyn BankParser>,
    pub confidence: DetectionConfidence,
    pub reason: String,
}

/// Auto-detector for bank statement formats
pub struct StatementDetector;

impl StatementDetector {
    /// Detect the best matching parser for the given data
    /// Returns the parser with the highest confidence score
    pub fn detect<'a>(
        parsers: &'a [Box<dyn BankParser>],
        data: &str,
    ) -> DetectionResult<'a> {
        let mut best_match: Option<&'a dyn BankParser> = None;
        let mut best_confidence = DetectionConfidence::None;
        let mut best_reason = String::from("No matching parser found");

        for parser in parsers {
            if parser.identify(data) {
                // All our current parsers use strong identification
                best_match = Some(parser.as_ref());
                best_confidence = DetectionConfidence::High;
                best_reason = format!("Detected format: {}", parser.name());
                break; // Found a high-confidence match
            }
        }

        DetectionResult {
            parser: best_match,
            confidence: best_confidence,
            reason: best_reason,
        }
    }

    /// Get detection hints from the data (first few lines)
    /// Useful for debugging and user feedback
    pub fn get_hints(data: &str) -> Vec<String> {
        let mut hints = Vec::new();
        let lines: Vec<&str> = data.lines().take(10).collect();

        // Check for common bank indicators
        let data_lower = data.to_lowercase();
        
        if data_lower.contains("hdfc") {
            hints.push("HDFC Bank detected".to_string());
        }
        
        if data_lower.contains("icici") {
            hints.push("ICICI Bank detected (not yet supported)".to_string());
        }
        
        if data_lower.contains("sbi") || data_lower.contains("state bank") {
            hints.push("SBI Bank detected (not yet supported)".to_string());
        }

        // Check for statement types
        if data.contains("Transaction type") {
            hints.push("Credit card statement format detected".to_string());
        }
        
        if data.contains("Withdrawal Amt") && data.contains("Deposit Amt") {
            hints.push("Savings account statement format detected".to_string());
        }

        // Check for date patterns
        for line in lines {
            if line.contains("Date") {
                hints.push(format!("Date column found: {}", line.trim()));
                break;
            }
        }

        if hints.is_empty() {
            hints.push("No recognizable bank statement format detected".to_string());
        }

        hints
    }

    /// Validate that the data has minimum required structure
    pub fn validate_structure(data: &str) -> Result<(), String> {
        if data.is_empty() {
            return Err("File is empty".to_string());
        }

        let lines: Vec<&str> = data.lines().filter(|l| !l.trim().is_empty()).collect();
        
        if lines.len() < 3 {
            return Err("File has insufficient data (less than 3 non-empty lines)".to_string());
        }

        // Check for tab-separated or comma-separated structure
        let first_line = lines[0];
        let has_structure = first_line.contains('\t') || first_line.contains(',');
        
        if !has_structure {
            return Err("File does not appear to have a structured format (no tabs or commas detected)".to_string());
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detection_confidence_ordering() {
        assert!(DetectionConfidence::High > DetectionConfidence::Medium);
        assert!(DetectionConfidence::Medium > DetectionConfidence::Low);
        assert!(DetectionConfidence::Low > DetectionConfidence::None);
    }

    #[test]
    fn test_validate_structure_empty() {
        let result = StatementDetector::validate_structure("");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("empty"));
    }

    #[test]
    fn test_validate_structure_too_short() {
        let result = StatementDetector::validate_structure("Line 1\nLine 2");
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_structure_valid() {
        let data = "Header\tColumn1\tColumn2\nData1\tData2\tData3\nData4\tData5\tData6";
        let result = StatementDetector::validate_structure(data);
        assert!(result.is_ok());
    }

    #[test]
    fn test_get_hints_hdfc() {
        let data = "HDFC Bank\nStatement\nDate\tNarration\tWithdrawal Amt";
        let hints = StatementDetector::get_hints(data);
        assert!(hints.iter().any(|h| h.contains("HDFC")));
    }

    #[test]
    fn test_get_hints_unsupported_bank() {
        let data = "ICICI Bank\nStatement\n";
        let hints = StatementDetector::get_hints(data);
        assert!(hints.iter().any(|h| h.contains("ICICI") && h.contains("not yet supported")));
    }
}
