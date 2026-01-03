# MoneyInsight WASM Engine Design

## 1. Architecture Overview

The WASM Engine is the core of MoneyInsight, handling all privacy-sensitive operations in-browser. It's implemented in Rust and compiled to WebAssembly, exposing a clean JavaScript interface for the Angular frontend.

```
┌────────────────────────────────────┐
│  Angular Frontend (JavaScript)     │
└────────────┬───────────────────────┘
             │
             │ JavaScript Binding
             │
┌────────────▼───────────────────────────────────┐
│         WASM Engine (Rust)                      │
├───────────────────────────────────────────────┤
│                                               │
│  ┌─────────────────────────────────────┐    │
│  │  Plugin Registry & Auto-Detection   │    │
│  └─────────────────────────────────────┘    │
│           ↓                                   │
│  ┌─────────────────────────────────────┐    │
│  │  Bank Parsers (Plugin Trait)        │    │
│  │  ├─ HDFC Savings                    │    │
│  │  ├─ HDFC Credit Card                │    │
│  │  └─ (Extensible)                   │    │
│  └─────────────────────────────────────┘    │
│           ↓                                   │
│  ┌─────────────────────────────────────┐    │
│  │  Transaction Transformer            │    │
│  │  (Normalize to common format)       │    │
│  └─────────────────────────────────────┘    │
│           ↓                                   │
│  ┌─────────────────────────────────────┐    │
│  │  Categorizer (ML-based)             │    │
│  │  (Uses sklearn-like model)          │    │
│  └─────────────────────────────────────┘    │
│           ↓                                   │
│  ┌─────────────────────────────────────┐    │
│  │  Output Emitter (JSON)              │    │
│  │  TransactionBatch → JSON            │    │
│  └─────────────────────────────────────┘    │
│                                               │
└───────────────────────────────────────────────┘
             │
             │ JSON Output
             ↓
     IndexedDB / Frontend UI
```

## 2. Core Components

### 2.1 Plugin Trait & Registry

**File:** `src/traits.rs`

```rust
pub trait BankParser: Send + Sync {
    /// Auto-detect if this parser can handle the given file content.
    /// Returns true if parser recognizes the format.
    fn identify(&self, data: &str) -> bool;
    
    /// Parse file content and extract transactions.
    /// Returns Result with Vec<Transaction> or error message.
    fn parse(&self, data: &str) -> Result<Vec<Transaction>, String>;
    
    /// Human-readable name of the parser (e.g., "HDFC Savings Account").
    fn name(&self) -> &'static str;
}

pub trait Categorizer: Send + Sync {
    /// Categorize a transaction based on description.
    /// Returns category, sub-category, and confidence score.
    fn categorize(&self, txn: &Transaction) -> CategorizedResult;
    
    /// Update categorizer with user feedback (for incremental training).
    fn update_with_feedback(&mut self, pattern: &str, category: &str) -> Result<(), String>;
}

pub struct PluginRegistry {
    parsers: Vec<Box<dyn BankParser>>,
}

impl PluginRegistry {
    pub fn register(&mut self, parser: Box<dyn BankParser>) {
        self.parsers.push(parser);
    }
    
    pub fn auto_detect(&self, data: &str) -> Option<&dyn BankParser> {
        self.parsers.iter()
            .find(|p| p.identify(data))
            .map(|p| p.as_ref())
    }
}
```

### 2.2 Data Structures

**File:** `src/lib.rs`

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub date: String,           // ISO 8601: YYYY-MM-DD
    pub description: String,    // Merchant/transaction description
    pub amount: f64,           // Positive for income, negative for expense
    pub account: String,       // Account identifier
    pub transaction_type: String, // DEBIT, CREDIT, etc.
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategorizedTransaction {
    pub transaction: Transaction,
    pub category: String,      // e.g., "Food"
    pub sub_category: String,  // e.g., "Dining"
    pub confidence: f64,       // 0.0 to 1.0
    pub confidence_level: ConfidenceLevel,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum ConfidenceLevel {
    High,    // > 0.9
    Medium,  // 0.6 - 0.9
    Low,     // < 0.6
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionBatch {
    pub source_parser: String,  // e.g., "HDFC_SAVINGS"
    pub transactions: Vec<CategorizedTransaction>,
    pub parse_duration_ms: u64,
    pub categorization_duration_ms: u64,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategorizedResult {
    pub category: String,
    pub sub_category: String,
    pub confidence: f64,
}
```

### 2.3 Public JavaScript API

**File:** `src/lib.rs` (wasm-bindgen exports)

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct WasmEngine {
    registry: PluginRegistry,
    categorizer: Box<dyn Categorizer>,
}

#[wasm_bindgen]
impl WasmEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Result<WasmEngine, JsValue> {
        // Initialize all parsers and categorizer
        let mut registry = PluginRegistry::new();
        
        // Register HDFC parsers
        registry.register(Box::new(HdfcSavingsParser));
        registry.register(Box::new(HdfcCreditCardParser));
        
        // Initialize ML categorizer
        let categorizer = Box::new(MLCategorizer::new());
        
        Ok(WasmEngine { registry, categorizer })
    }
    
    /// Auto-detect bank format and parse file.
    /// Input: file_data (string or buffer), bank_hint (optional, e.g., "HDFC_SAVINGS")
    /// Output: JSON string of TransactionBatch
    #[wasm_bindgen]
    pub fn parse_file(&self, file_data: &str, bank_hint: Option<String>) -> Result<String, JsValue> {
        let start = std::time::Instant::now();
        
        // Auto-detect parser
        let parser = self.registry.auto_detect(file_data)
            .ok_or_else(|| JsValue::from_str("No parser found for this file format"))?;
        
        // Parse transactions
        let transactions = parser.parse(file_data)
            .map_err(|e| JsValue::from_str(&e))?;
        
        let parse_duration = start.elapsed().as_millis() as u64;
        
        // Categorize transactions
        let cat_start = std::time::Instant::now();
        let categorized: Vec<CategorizedTransaction> = transactions.iter()
            .map(|txn| {
                let cat_result = self.categorizer.categorize(txn);
                let confidence_level = match cat_result.confidence {
                    c if c > 0.9 => ConfidenceLevel::High,
                    c if c >= 0.6 => ConfidenceLevel::Medium,
                    _ => ConfidenceLevel::Low,
                };
                CategorizedTransaction {
                    transaction: txn.clone(),
                    category: cat_result.category,
                    sub_category: cat_result.sub_category,
                    confidence: cat_result.confidence,
                    confidence_level,
                }
            })
            .collect();
        
        let cat_duration = cat_start.elapsed().as_millis() as u64;
        
        let batch = TransactionBatch {
            source_parser: parser.name().to_string(),
            transactions: categorized,
            parse_duration_ms: parse_duration,
            categorization_duration_ms: cat_duration,
            error: None,
        };
        
        serde_json::to_string(&batch)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }
    
    /// Update categorizer with user feedback.
    /// Input: pattern (merchant name), category (category name)
    #[wasm_bindgen]
    pub fn add_categorization_rule(&mut self, pattern: &str, category: &str) -> Result<(), JsValue> {
        self.categorizer.update_with_feedback(pattern, category)
            .map_err(|e| JsValue::from_str(&e))
    }
    
    /// List all available parsers.
    #[wasm_bindgen]
    pub fn list_parsers(&self) -> JsValue {
        let parsers: Vec<String> = self.registry.parsers
            .iter()
            .map(|p| p.name().to_string())
            .collect();
        serde_wasm_bindgen::to_value(&parsers).unwrap()
    }
}
```

## 3. Bank Parser Implementation Guide

### 3.1 HDFC Savings Account Parser

**File:** `src/parsers/hdfc_savings.rs`

**Characteristics:**
- Format: CSV or Excel (.xlsx)
- Headers: Date, Description, Debit, Credit, Balance
- Identification: Contains "HDFC Bank" header or "Balance Sheet" text

**Implementation:**

```rust
pub struct HdfcSavingsParser;

impl BankParser for HdfcSavingsParser {
    fn identify(&self, data: &str) -> bool {
        data.contains("HDFC Bank") || 
        (data.contains("Date") && data.contains("Debit") && data.contains("Credit"))
    }
    
    fn parse(&self, data: &str) -> Result<Vec<Transaction>, String> {
        // Parse CSV/Excel
        let lines: Vec<&str> = data.lines().collect();
        
        // Skip header and metadata rows
        let start_idx = lines.iter()
            .position(|line| line.contains("Date"))
            .ok_or("No header found")?;
        
        let mut transactions = Vec::new();
        
        for line in &lines[start_idx + 1..] {
            let parts: Vec<&str> = line.split(',').collect();
            if parts.len() < 4 { continue; }
            
            let date = parts[0].trim().to_string();
            let description = parts[1].trim().to_string();
            let debit = parts[2].trim().parse::<f64>().unwrap_or(0.0);
            let credit = parts[3].trim().parse::<f64>().unwrap_or(0.0);
            
            let amount = if debit > 0.0 {
                -debit  // Outflow
            } else if credit > 0.0 {
                credit  // Inflow
            } else {
                continue;
            };
            
            transactions.push(Transaction {
                date,
                description,
                amount,
                account: "HDFC_SAVINGS".to_string(),
                transaction_type: if amount < 0.0 { "DEBIT" } else { "CREDIT" }.to_string(),
            });
        }
        
        Ok(transactions)
    }
    
    fn name(&self) -> &'static str {
        "HDFC Savings Account"
    }
}
```

### 3.2 HDFC Credit Card Parser

**File:** `src/parsers/hdfc_credit.rs`

**Characteristics:**
- Format: Excel (.xlsx) primarily
- Headers: Date, Reference No., Merchant, Amount
- Identification: Contains "HDFC Credit Card" or "Credit Card Statement"

## 4. Categorizer Implementation

### 4.1 ML-Based Categorizer

The categorizer uses a simple machine learning approach:

**Algorithm:**
1. **Pattern Matching:** Check user-defined rules first (exact match, contains, regex)
2. **ML Model:** If no rule matches, use trained ML model
3. **Fallback:** If confidence is very low, return "Miscellaneous"

**Features Extracted:**
- Merchant name (from description)
- Transaction type (DEBIT/CREDIT)
- Amount range
- Temporal patterns (day of week, time of month)

### 4.2 Incremental Training

When users correct a categorization:
1. Extract features from the transaction
2. Add new training sample: (features, category)
3. Use `partial_fit()` for incremental model update
4. Save updated model to IndexedDB

## 5. Error Handling

### 5.1 Parser Errors

- **Unsupported Format:** No parser matches → Return error with suggestion
- **Corrupted Data:** Parsing fails → Skip line and continue, return partial results with warning
- **Password-Protected:** Decrypt first using browser's Crypto API

### 5.2 Categorizer Errors

- **Unknown Pattern:** No rule and low ML confidence → Flag as "Needs Review"
- **Model Loading:** Model file corrupted → Use fallback model

## 6. Performance Optimization

### 6.1 Benchmarks

**Expected Performance:**
- Parse 100 transactions: < 500ms
- Categorize 100 transactions: < 300ms
- Total for 500-transaction statement: < 3 seconds

### 6.2 Optimization Strategies

- **Lazy Initialization:** Load ML model only on first categorization call
- **Batch Processing:** Categorize in batches to reduce overhead
- **Caching:** Cache rule matches for repeated merchants
- **Memory Management:** Stream large files instead of loading entirely

## 7. Testing Strategy

### 7.1 Unit Tests

**Test Fixtures:**
- Sample HDFC Savings CSV (various formats)
- Sample HDFC Credit Card Excel
- Edge cases: Missing fields, unusual descriptions, special characters

**Test Cases:**
- `test_hdfc_savings_identification()`
- `test_hdfc_savings_parsing()`
- `test_categorizer_rule_matching()`
- `test_categorizer_ml_fallback()`
- `test_error_handling_corrupted_file()`

### 7.2 Integration Tests

- End-to-end: Upload → Parse → Categorize → Return JSON
- Categorization accuracy: Run against known labeled dataset

## 8. Deployment & Distribution

### 8.1 Build Process

```bash
# Build WASM module
wasm-pack build --target web

# Output:
# - moneyinsight_wasm.wasm (compiled module)
# - moneyinsight_wasm.js (JavaScript bindings)
# - moneyinsight_wasm.d.ts (TypeScript definitions)
```

### 8.2 Angular Integration

```typescript
// In Angular service
import init, { WasmEngine } from '@moneyinsight/wasm';

export class ParsingService {
  private wasmEngine: WasmEngine | null = null;
  
  async initialize() {
    await init();  // Load WASM module
    this.wasmEngine = new WasmEngine();
  }
  
  parseFile(fileData: string, bankHint?: string): TransactionBatch {
    const result = this.wasmEngine!.parse_file(fileData, bankHint);
    return JSON.parse(result);
  }
}
```

## 9. Future Extensibility

### 9.1 Adding a New Bank Parser (SBI Example)

```rust
// Step 1: Create src/parsers/sbi.rs
pub struct SBIParser;

impl BankParser for SBIParser {
    fn identify(&self, data: &str) -> bool {
        data.contains("State Bank of India") || data.contains("SBI")
    }
    
    fn parse(&self, data: &str) -> Result<Vec<Transaction>, String> {
        // SBI-specific parsing logic
        todo!()
    }
    
    fn name(&self) -> &'static str {
        "SBI Bank Account"
    }
}

// Step 2: Register in src/lib.rs
pub fn new() -> Result<WasmEngine, JsValue> {
    let mut registry = PluginRegistry::new();
    registry.register(Box::new(HdfcSavingsParser));
    registry.register(Box::new(HdfcCreditCardParser));
    registry.register(Box::new(SBIParser));  // New parser
    // ...
}

// Step 3: Rebuild and redeploy
// wasm-pack build --target web
```

### 9.2 Model Improvement

- Collect user feedback over time
- Periodically retrain model with new labeled data
- Version models and allow rollback if accuracy degrades

---

## References

- Architecture Design: [01_ARCHITECTURE.md](01_ARCHITECTURE.md)
- Data Model: [02_DATA_MODEL.md](02_DATA_MODEL.md)
- FSD: [../specifications/fsd_1.0.md](../specifications/fsd_1.0.md)
- Cargo.toml: [../../src/engine/Cargo.toml](../../src/engine/Cargo.toml)
