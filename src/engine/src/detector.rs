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

        // Try exact parser identification first
        for parser in parsers {
            if parser.identify(data) {
                best_match = Some(parser.as_ref());
                best_confidence = DetectionConfidence::High;
                best_reason = format!("Detected format: {}", parser.name());
                break; // Found a high-confidence match
            }
        }

        // If no high-confidence match, try heuristic-based detection
        if best_confidence == DetectionConfidence::None {
            let (confidence, reason) = Self::heuristic_detection(parsers, data);
            best_confidence = confidence;
            best_reason = reason;
            
            // For medium confidence, provide hints about which parser might work
            if best_confidence == DetectionConfidence::Medium {
                // Try to find the most likely parser based on bank name hints
                for parser in parsers {
                    let parser_name_lower = parser.name().to_lowercase();
                    if data.to_lowercase().contains(&parser_name_lower.split('_').next().unwrap_or("")) {
                        best_match = Some(parser.as_ref());
                        break;
                    }
                }
            }
        }

        DetectionResult {
            parser: best_match,
            confidence: best_confidence,
            reason: best_reason,
        }
    }

    /// Perform heuristic-based detection when exact matching fails
    /// Returns confidence level and reason based on data characteristics
    fn heuristic_detection(parsers: &[Box<dyn BankParser>], data: &str) -> (DetectionConfidence, String) {
        let data_lower = data.to_lowercase();
        let mut score = 0;
        let mut indicators = Vec::new();

        // Check for bank names that we have parsers for
        let has_known_bank = parsers.iter().any(|p| {
            let bank_name = p.name().split('_').next().unwrap_or("").to_lowercase();
            data_lower.contains(&bank_name)
        });

        if has_known_bank {
            score += 2;
            indicators.push("known bank detected");
        }

        // Check for statement format indicators
        if data.contains("Date") && (data.contains("Narration") || data.contains("Description")) {
            score += 1;
            indicators.push("date and description columns found");
        }

        if data.contains("Withdrawal") || data.contains("Deposit") || data.contains("Debit") || data.contains("Credit") {
            score += 1;
            indicators.push("transaction amount columns found");
        }

        // Check for structured format (CSV/TSV) in first few lines
        let has_structure = data.lines().take(5).any(|line| {
            line.contains('\t') || line.contains(',')
        });
        
        if has_structure {
            score += 1;
            indicators.push("structured format detected");
        }

        // Determine confidence based on score
        let confidence = match score {
            4..=i32::MAX => DetectionConfidence::High,  // Shouldn't reach here, but be safe
            3 => DetectionConfidence::Medium,
            1..=2 => DetectionConfidence::Low,
            _ => DetectionConfidence::None,
        };

        let reason = if indicators.is_empty() {
            "No recognizable bank statement format detected".to_string()
        } else {
            format!("Partial match: {}", indicators.join(", "))
        };

        (confidence, reason)
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

    #[test]
    fn test_heuristic_detection_low_confidence() {
        let parsers: Vec<Box<dyn BankParser>> = Vec::new();
        let data = "Date,Description,Amount\n2024-01-01,Purchase,100.00";
        
        let (confidence, reason) = StatementDetector::heuristic_detection(&parsers, data);
        assert_eq!(confidence, DetectionConfidence::Low);
        assert!(reason.contains("Partial match"));
    }

    #[test]
    fn test_heuristic_detection_medium_confidence() {
        let parsers: Vec<Box<dyn BankParser>> = Vec::new();
        let data = "HDFC Bank Statement\nDate\tNarration\tWithdrawal Amt\tDeposit Amt\n";
        
        let (confidence, reason) = StatementDetector::heuristic_detection(&parsers, data);
        assert_eq!(confidence, DetectionConfidence::Medium);
        assert!(reason.contains("Partial match"));
    }

    #[test]
    fn test_heuristic_detection_none_confidence() {
        let parsers: Vec<Box<dyn BankParser>> = Vec::new();
        let data = "This is just some random text without any banking data";
        
        let (confidence, reason) = StatementDetector::heuristic_detection(&parsers, data);
        assert_eq!(confidence, DetectionConfidence::None);
        assert!(reason.contains("No recognizable"));
    }
}
