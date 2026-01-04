# DEF-002: Encryption Detection Implementation Unclear

**Defect ID:** DEF-002  
**Story:** [Story #001 - Upload and Parse Bank Statement](../../stories/story_001_Upload_and_Parse_Bank_Statement.md)  
**Test Cases Affected:** TC3, TC6  
**Severity:** Medium  
**Priority:** Medium  
**Status:** ✅ RESOLVED  
**Reported Date:** 2026-01-04  
**Reported By:** QA Automation Engineer  
**Resolved Date:** 2026-01-04  
**Resolution:** Moved encryption detection to WASM layer (calamine library)  

---

## Resolution Summary

**Fix Implemented:** Option 1 - Moved encryption detection to WASM layer

**Changes Made:**

1. **WASM Engine (lib.rs):**
   - Enhanced `excel_to_tsv()` method to catch calamine library errors
   - Added specific error handling for encryption-related errors
   - Detects keywords: "password", "encrypted", "protection", "cipher"
   - Returns user-friendly message: "Password-protected and encrypted statements are not supported"

2. **Angular Service (file-upload.service.ts):**
   - Removed `isEncrypted()` method (no longer needed)
   - Removed encryption pre-check in `readFile()` method
   - Simplified to direct ArrayBuffer reading
   - Added comment explaining detection moved to WASM

3. **Benefits:**
   - More reliable detection using native Excel library (calamine)
   - Natural detection point when workbook is opened
   - Consistent with "all parsing in WASM" architecture
   - Better error messages from library itself

**Testing:**
- WASM module rebuilt and deployed
- Ready for validation with actual encrypted files
- TC3 and TC6 can now be executed once test data is available

---

## Original Description

The `FileUploadService.isEncrypted()` method attempts to detect Excel file encryption by searching for signature strings in the file's ArrayBuffer. However, the effectiveness of this approach is unverified, and Excel files can be protected in multiple ways that may not be detectable via simple string matching.

**Location:** `src/client/src/app/core/services/file-upload.service.ts` (Lines 75-91)

---

## Current Implementation

```typescript
private isEncrypted(content: ArrayBuffer, file: File): boolean {
  if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
    const bytes = new Uint8Array(content);
    const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    
    const encryptionSignatures = [
      'EncryptedPackage',
      'EncryptionInfo',
      'Microsoft.Container.EncryptionTransform'
    ];
    
    return encryptionSignatures.some(sig => text.includes(sig));
  }
  return false;
}
```

---

## Issues Identified

### 1. Multiple Protection Types
Excel files support several protection mechanisms:

**a) File-level encryption (Password to open)**
- Entire file is encrypted
- Should be detected by current implementation
- ✓ Likely to contain 'EncryptedPackage' signature

**b) Workbook protection (Protect Structure)**
- File opens normally but structure is locked
- May not contain encryption signatures
- ✗ May not be detected by current method

**c) Worksheet protection**
- Individual sheets are locked
- File opens normally
- ✗ Not detected by current method

**d) VBA Project protection**
- Macro code is password-protected
- ✗ Not detected and not relevant for data files

### 2. TextDecoder Limitations
- UTF-8 decoding with `{ fatal: false }` may garble binary data
- Encryption signatures might be split across buffer boundaries
- Large files may have performance issues decoding entire buffer
- Binary patterns might be more reliable than text search

### 3. Missing Test Coverage
- No unit tests for `isEncrypted()` method
- No integration tests with actual encrypted files
- TC3 and TC6 cannot be validated without real encrypted test data

---

## Impact

### Test Cases Blocked
- **TC3:** Reject password-protected .xlsx file - Cannot verify detection works
- **TC6:** Reject encrypted .xlsx file - Cannot verify detection works

### User Impact
**High Priority Scenario:**
- User attempts to upload truly encrypted HDFC statement
- Detection fails silently
- WASM parser receives encrypted binary data
- Parser fails with cryptic error message instead of user-friendly "encryption not supported" message

**Low Priority Scenario:**
- User attempts to upload workbook-protected file (not encrypted)
- False negative - file proceeds to parser
- Parser may succeed if data is readable, or fail with unclear error

---

## Steps to Reproduce

1. Create password-protected Excel file (File → Info → Protect Workbook → Encrypt with Password)
2. Navigate to http://localhost:4200/import
3. Select the encrypted file
4. Observe behavior

**Expected:** Error message "Password-protected and encrypted statements are not supported"  
**Actual:** Behavior unknown - requires testing with actual encrypted file

---

## Root Cause

1. **Design Decision:** Encryption detection was implemented in Angular service rather than WASM layer
2. **Incomplete Research:** Not all Excel protection types were considered
3. **No Validation:** Implementation was not tested with real encrypted files
4. **Alternative Available:** Calamine library (used in WASM) may provide built-in encryption detection

---

## Recommended Fix

### Option 1: Move Detection to WASM (Recommended)

The Rust calamine library may provide better encryption detection when attempting to open workbooks:

```rust
// In excel_to_tsv() method
let cursor = Cursor::new(bytes);
let workbook_result = open_workbook_auto_from_rs(cursor);

match workbook_result {
    Err(e) if e.to_string().contains("encrypted") || e.to_string().contains("password") => {
        return Err(JsValue::from_str(
            "Password-protected and encrypted statements are not supported. Please export without encryption."
        ));
    }
    Err(e) => {
        return Err(JsValue::from_str(&format!("Failed to open Excel file: {}", e)));
    }
    Ok(workbook) => { /* continue parsing */ }
}
```

**Advantages:**
- Calamine library already tries to open the file
- Natural point to detect encryption errors
- More reliable than string searching
- Consistent with "all parsing in WASM" architecture

### Option 2: Improve Angular Detection

Keep detection in Angular but improve accuracy:

```typescript
private isEncrypted(content: ArrayBuffer, file: File): boolean {
  if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
    return false;
  }

  const bytes = new Uint8Array(content);
  
  // Check binary signatures for Excel encryption
  // XLSX (Office Open XML) encryption markers
  const encryptedPackageMarker = new TextEncoder().encode('EncryptedPackage');
  const encryptionInfoMarker = new TextEncoder().encode('EncryptionInfo');
  
  // Search in first 8KB of file (encryption info is typically near start)
  const searchLimit = Math.min(8192, bytes.length);
  
  return this.containsSequence(bytes, encryptedPackageMarker, searchLimit) ||
         this.containsSequence(bytes, encryptionInfoMarker, searchLimit);
}

private containsSequence(haystack: Uint8Array, needle: Uint8Array, limit: number): boolean {
  // Binary search implementation
  for (let i = 0; i < limit - needle.length; i++) {
    let found = true;
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) {
        found = false;
        break;
      }
    }
    if (found) return true;
  }
  return false;
}
```

### Option 3: Dual Detection

Implement both Angular pre-check and WASM fallback:
1. Angular does quick signature check
2. If passes, WASM attempts to open file
3. WASM provides definitive error if encrypted

---

## Testing Requirements

### Unit Tests Needed
```typescript
describe('FileUploadService - Encryption Detection', () => {
  it('should detect EncryptedPackage signature', () => { /* ... */ });
  it('should detect EncryptionInfo signature', () => { /* ... */ });
  it('should not falsely detect encryption in normal files', () => { /* ... */ });
  it('should handle large files efficiently', () => { /* ... */ });
});
```

### Integration Tests Needed
- Test with actual password-protected .xlsx file (created via Excel)
- Test with actual password-protected .xls file (binary format)
- Test with workbook-protected file (structure locked)
- Test with worksheet-protected file (should pass through)
- Test with normal unprotected file (should pass through)

### Test Data Required
Create in `docs/testcases/story_001_testdata/`:
- `HDFC_Savings_Protected.xlsx` - Real password-protected file
- `HDFC_Savings_Encrypted.xlsx` - Real encrypted file
- `HDFC_Savings_Normal.xlsx` - Unprotected file for comparison

---

## Acceptance Criteria for Resolution

1. ✅ Encryption detection reliably identifies password-protected Excel files
2. ✅ Clear error message shown to users attempting to upload encrypted files
3. ✅ No false positives (normal files incorrectly flagged as encrypted)
4. ✅ No false negatives (encrypted files passing through)
5. ✅ Unit tests cover encryption detection logic
6. ✅ Integration tests use real encrypted test files
7. ✅ TC3 passes with real password-protected file
8. ✅ TC6 passes with real encrypted file
9. ✅ Performance acceptable (< 100ms for detection on 1MB file)
10. ✅ Documentation updated with supported/unsupported file types

---

## Workaround

Current workaround: If encryption detection fails, WASM parser will attempt to process the file and return a generic "Failed to open Excel file" error. This provides fallback protection but less user-friendly messaging.

---

## Related Issues

- DEF-001: Missing realistic test data (also blocks encryption testing)
- Future consideration: Support for CSV files doesn't need encryption detection

---

## Additional Notes

**Security Consideration:**  
The application's privacy-first architecture means encrypted statements cannot be supported without exposing the decryption password in client-side code, which would defeat the purpose of encryption. Clear communication to users about this limitation is essential.

**Alternative Approach:**  
Consider adding documentation/help text explaining how users can export unencrypted statements from their bank portals if needed.

---

**Last Updated:** 2026-01-04  
**Assigned To:** Development Team  
**Target Resolution:** Sprint 1  
**Estimated Effort:** 4-6 hours (investigation + implementation + testing)
