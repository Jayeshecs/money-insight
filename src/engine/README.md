# MoneyInsight WASM Engine

Privacy-first bank statement parsing engine built with Rust and compiled to WebAssembly.

## Features

- **Client-side parsing**: All processing happens in the browser
- **Plugin architecture**: Easy to add new bank parsers
- **Auto-detection**: Automatically identifies the correct parser
- **High performance**: Rust's speed + WASM efficiency
- **Type-safe**: Strongly typed Rust code with comprehensive error handling

## Supported Banks

- HDFC Savings Account (v1, v2)
- HDFC Credit Card (v1, v2)

## Project Structure

```
src/
├── lib.rs              # WASM entry point & main engine
├── traits.rs           # BankParser trait & PluginRegistry
└── parsers/
    ├── mod.rs          # Parser module exports
    ├── hdfc_savings.rs # HDFC Savings parser
    └── hdfc_credit.rs  # HDFC Credit Card parser
```

## Build Instructions

### Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install wasm-pack
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
```

### Build for Development

```bash
wasm-pack build --target web --dev
```

### Build for Production

```bash
wasm-pack build --target web --release
```

### Build Output

The build generates files in `pkg/` directory:
- `moneyinsight_wasm.js` - JavaScript bindings
- `moneyinsight_wasm_bg.wasm` - WebAssembly binary
- `moneyinsight_wasm.d.ts` - TypeScript definitions

## Testing

### Run Unit Tests

```bash
cargo test
```

### Run WASM Tests

```bash
wasm-pack test --headless --firefox
wasm-pack test --headless --chrome
```

## Usage in Angular

### 1. Install WASM Package

```bash
# After building WASM, copy pkg/ to Angular project
cp -r pkg/ ../client/src/app/wasm/
```

### 2. Import in TypeScript

```typescript
import init, { WasmEngine } from './wasm/pkg/moneyinsight_wasm';

// Initialize WASM
await init();

// Create engine instance
const engine = new WasmEngine();

// Parse file
const result = engine.parse_file(fileContent, fileName);
const batch = JSON.parse(result);
```

## Adding a New Bank Parser

### 1. Create Parser File

```rust
// src/parsers/new_bank.rs
use crate::traits::{BankParser, Transaction};

pub struct NewBankParser;

impl BankParser for NewBankParser {
    fn identify(&self, data: &str) -> bool {
        // Implement detection logic
        data.contains("NEW BANK") && data.contains("Statement")
    }
    
    fn parse(&self, data: &str) -> Result<Vec<Transaction>, String> {
        // Implement parsing logic
        let mut transactions = Vec::new();
        // ... parsing code ...
        Ok(transactions)
    }
    
    fn name(&self) -> &'static str {
        "New Bank Account"
    }
}
```

### 2. Register Parser

```rust
// src/parsers/mod.rs
pub mod new_bank;
pub use new_bank::NewBankParser;

// src/lib.rs
use parsers::NewBankParser;

#[wasm_bindgen]
impl WasmEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Result<WasmEngine, JsValue> {
        let mut registry = PluginRegistry::new();
        registry.register(Box::new(HdfcSavingsParser));
        registry.register(Box::new(HdfcCreditCardParser));
        registry.register(Box::new(NewBankParser)); // Add here
        Ok(WasmEngine { registry })
    }
}
```

### 3. Write Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_bank_identification() {
        let valid_data = "NEW BANK Statement...";
        let parser = NewBankParser;
        assert!(parser.identify(valid_data));
    }

    #[test]
    fn test_new_bank_parsing() {
        let data = "...sample data...";
        let parser = NewBankParser;
        let result = parser.parse(data);
        assert!(result.is_ok());
    }
}
```

## Data Structures

### Transaction

```json
{
    "date": "2024-01-15",
    "description": "Amazon Purchase",
    "amount": -1250.50,
    "account": "HDFC_SAVINGS",
    "transaction_type": "DEBIT"
}
```

### TransactionBatch

```json
{
    "source_parser": "HDFC Savings Account",
    "transactions": [...],
    "parse_duration_ms": 45,
    "error": null
}
```

## Performance Optimization

- **Release builds**: Use `opt-level = "z"` for size optimization
- **LTO**: Link-time optimization enabled
- **Minimal dependencies**: Only essential crates included
- **Zero-copy parsing**: Uses string slices where possible

## Security & Privacy

- **No network calls**: All processing is local
- **No data persistence**: WASM has no file system access
- **Memory safe**: Rust's ownership system prevents vulnerabilities
- **Input validation**: All inputs validated before processing

## License

See LICENSE file in project root.
