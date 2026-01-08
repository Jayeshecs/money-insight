# Story #001: Upload and Parse Bank Statement - Implementation Guide

## Overview

This document provides step-by-step instructions for building, testing, and deploying the implementation of Story #001.

## Prerequisites

### Rust & WASM Tools

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install wasm-pack
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# Verify installation
rustc --version
wasm-pack --version
```

### Node.js & Angular CLI

```bash
# Install Node.js (v18+ recommended)
# Download from https://nodejs.org/

# Install Angular CLI
npm install -g @angular/cli@17

# Verify installation
node --version
ng version
```

## Build Process

### Step 1: Build WASM Engine

```bash
cd src/engine

# Run build script
chmod +x build.sh  # On Linux/Mac
./build.sh

# Or on Windows
build.bat

# Or manually
wasm-pack build --target web --release
```

### Step 2: Test WASM Engine

```bash
cd src/engine

# Run native unit tests (parsers and registry logic)
cargo test

# Run WASM-specific tests (optional, requires browser)
# Note: These test the WASM bindings and require a browser environment
wasm-pack test --headless --firefox
# Or for Chrome:
wasm-pack test --headless --chrome
```

**Note**: Native `cargo test` runs parser logic tests. WASM tests (`wasm-pack test`) are optional and test the JavaScript bindings.

### Step 3: Integrate WASM with Angular

```bash
# Copy WASM package to Angular project
cd src/engine
cp -r pkg/ ../client/src/app/wasm/

# Or on Windows
xcopy pkg ..\client\src\app\wasm\ /E /I /Y
```

### Step 4: Update Angular Imports

Update `src/client/src/app/core/services/parsing.service.ts`:

```typescript
// Uncomment these lines after WASM build
import init, { WasmEngine } from '../../wasm/pkg/moneyinsight_wasm';

// In initialize() method, uncomment:
await init();
this.wasmEngine = new WasmEngine();
```

### Step 5: Run Angular Development Server

```bash
cd src/client

# Install dependencies
npm install

# Start dev server
ng serve

# Open browser to http://localhost:4200
```

## Testing

### Unit Tests (Rust)

```bash
cd src/engine

# Run all native tests (parsers, registry, auto-detection)
cargo test

# With verbose output
cargo test -- --nocapture

# Run specific test
cargo test test_hdfc_savings_parsing

# Run WASM integration tests (optional, requires browser)
wasm-pack test --headless --firefox
```

**Test Coverage**:
- ✅ Parser identification logic (native tests)
- ✅ Transaction parsing logic (native tests)
- ✅ Auto-detection mechanism (native tests)
- ✅ Date parsing utilities (native tests)
- ⚠️ WASM bindings (requires `wasm-pack test`)

### Unit Tests (Angular)

```bash
cd src/client

# Run all tests
ng test

# Run specific test suite
ng test --include='**/file-upload.service.spec.ts'

# Run tests with coverage
ng test --code-coverage
```

### Integration Testing

1. **Manual Test Cases**: Follow [`docs/testcases/story_001_Upload_and_Parse_Bank_Statement_testcases.md`](docs/testcases/story_001_Upload_and_Parse_Bank_Statement_testcases.md "docs/testcases/story_001_Upload_and_Parse_Bank_Statement_testcases.md")

2. **Test Files**: Prepare sample files:
   - `HDFC_Savings_Sample.xlsx`
   - `HDFC_CreditCard_Sample.csv`
   - `Corrupted_Savings.xlsx`
   - `Statement.pdf` (for rejection testing)

3. **Test Procedure**:
   ```bash
   # Start dev server
   ng serve
   
   # Navigate to import screen
   # Upload each test file
   # Verify expected results per test cases
   ```

## Verification Checklist

- [ ] WASM builds without errors
- [ ] All Rust unit tests pass
- [ ] All Angular unit tests pass
- [ ] Test Case 1: Valid HDFC Savings parses successfully
- [ ] Test Case 2: Valid HDFC Credit Card parses successfully
- [ ] Test Case 3: Password-protected files are rejected
- [ ] Test Case 4: PDF files are rejected
- [ ] Test Case 5: Other unsupported formats are rejected
- [ ] Test Case 6: Encrypted files are rejected
- [ ] Test Case 7: Corrupted files show proper error
- [ ] No data is sent to any server (verify in Network tab)
- [ ] Progress indicators work correctly
- [ ] Error messages are user-friendly
- [ ] Parsed data is stored in sessionStorage

## Troubleshooting

### WASM Build Fails

**Issue**: `wasm-pack` command not found

**Solution**:
```bash
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
source ~/.cargo/env
```

**Issue**: Tests fail with "function not implemented on non-wasm32 targets"

**Solution**:
This is expected. Native tests (`cargo test`) only run non-WASM tests. To test WASM bindings:
```bash
wasm-pack test --headless --firefox
```

**Issue**: Compilation errors

**Solution**:
```bash
cargo clean
rustup update
wasm-pack build --target web --release
```

### Angular Can't Find WASM Module

**Issue**: `Cannot find module '@moneyinsight/wasm'`

**Solution**:
```bash
# Verify WASM package is copied
ls src/client/src/app/wasm/

# If missing, rebuild and copy
cd src/engine
wasm-pack build --target web --release
cp -r pkg/ ../client/src/app/wasm/
```

### WASM Initialization Fails

**Issue**: "Failed to initialize WASM engine"

**Solution**:
1. Check browser console for detailed errors
2. Ensure WASM file is served with correct MIME type
3. Verify Angular is serving static assets correctly
4. Check `angular.json` assets configuration

### Parser Not Detecting Files

**Issue**: "No parser found for this file format"

**Solution**:
1. Verify file format matches expected patterns
2. Check file encoding (should be UTF-8 or ASCII)
3. Add debug logging to parser `identify()` methods
4. Ensure headers match bank statement format exactly

### Tests Fail

**Issue**: Angular tests fail with WASM errors

**Solution**:
```typescript
// Mock WASM in test environment
beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      { 
        provide: ParsingService, 
        useValue: jasmine.createSpyObj('ParsingService', ['parseFile'])
      }
    ]
  });
});
```

## Performance Optimization

### WASM Size Optimization

```toml
# In Cargo.toml
[profile.release]
opt-level = "z"      # Optimize for size
lto = true           # Enable link-time optimization
codegen-units = 1    # Better optimization
```

### Angular Build Optimization

```bash
# Production build
ng build --configuration production

# With source maps for debugging
ng build --configuration production --source-map
```

## Deployment

### Production Build

```bash
# Build WASM
cd src/engine
wasm-pack build --target web --release

# Build Angular
cd ../client
ng build --configuration production

# Output in: dist/client/
```

### Static Hosting

The built Angular app can be hosted on:
- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting
- AWS S3 + CloudFront

Ensure WASM files are served with correct MIME type:
```
.wasm -> application/wasm
```

## Next Steps

After Story #001 is complete:

1. **Story #002**: Auto-detect and apply correct parser plugin
2. **Story #003**: Store parsed transactions in IndexedDB
3. **Story #004**: Sync transactions to Google Sheets
4. **Story #005**: WASM engine emits JSON for dashboard
5. **Story #006**: Ad placeholder on import screen

## Support

For issues or questions:
1. Check [`docs/stories/story_001_Upload_and_Parse_Bank_Statement.md`](docs/stories/story_001_Upload_and_Parse_Bank_Statement.md "docs/stories/story_001_Upload_and_Parse_Bank_Statement.md")
2. Review test cases
3. Check Rust/Angular documentation
4. Open an issue in project repository
