# Story #001 Defects

This directory contains detailed defect reports discovered during testing of Story #001: Upload and Parse Bank Statement.

## Defect Summary

| ID | Title | Severity | Priority | Status | Test Cases |
|----|-------|----------|----------|--------|------------|
| [DEF-001](DEF-001_Missing_Realistic_Test_Data.md) | Missing Realistic Test Data | High | High | Open | TC1, TC2 |
| [DEF-002](DEF-002_Encryption_Detection_Unclear.md) | Encryption Detection Unclear | Medium | Medium | ✅ Resolved | TC3, TC6 |
| [DEF-003](DEF-003_Missing_Corrupted_File_Test_Data.md) | Missing Corrupted File Test Data | Low | Low | ✅ Resolved | TC7 |

## Quick Reference

### High Priority Defects

**DEF-001: Missing Realistic Test Data**
- **Impact:** Parser accuracy cannot be validated
- **Blocking:** TC1 (HDFC Savings), TC2 (HDFC Credit Card)
- **Resolution Needed:** Create sample HDFC statement files with realistic structure
- **Effort:** 4-6 hours

### Medium Priority Defects

**DEF-002: Encryption Detection Implementation Unclear** ✅ RESOLVED
- **Impact:** Password-protected file handling unverified
- **Blocking:** TC3, TC6 partially blocked
- **Resolution:** Moved encryption detection to WASM layer (calamine library)
- **Date Resolved:** 2026-01-04
- **Effort:** 2 hours

### Low Priority Defects

**DEF-003: Missing Corrupted File Test Data** ✅ RESOLVED
- **Impact:** Corruption handling unverified (low risk)
- **Blocking:** TC7
- **Resolution:** Created corrupted test files using Python script
- **Date Resolved:** 2026-01-04
- **Effort:** 1 hour

## Defect Workflow

### Status Values
- **Open:** Defect identified, awaiting fix
- **In Progress:** Development team working on resolution
- **Testing:** Fix implemented, awaiting verification
- **Closed:** Verified fixed
- **Deferred:** Postponed to future sprint
- **Won't Fix:** Decided not to address

### Severity Levels
- **Critical:** System crash, data loss, security breach
- **High:** Major functionality broken, no workaround
- **Medium:** Functionality impaired, workaround exists
- **Low:** Minor issue, cosmetic, or rare scenario

### Priority Levels
- **Critical:** Fix immediately
- **High:** Fix in current sprint
- **Medium:** Fix in next sprint
- **Low:** Fix when time permits

## Test Execution Impact

### Test Cases Blocked by Defects

| Test Case | Title | Blocking Defect(s) | Status |
|-----------|-------|-------------------|---------|
| TC1 | Upload HDFC Savings | DEF-001 | ⚠️ Blocked |
| TC2 | Upload HDFC Credit Card | DEF-001 | ⚠️ Blocked |
| TC3 | Reject Password-Protected | ~~DEF-002~~ | ✅ Unblocked |
| TC6 | Reject Encrypted File | ~~DEF-002~~ | ✅ Unblocked |
| TC7 | Reject Corrupted File | ~~DEF-003~~ | ✅ Unblocked |

### Test Cases Passing
- TC4: Reject PDF (UI validation)
- TC5a-c: Reject unsupported formats (UI validation)

### Test Cases Ready for Execution
- TC3: Password-protected detection (encryption detection fixed)
- TC6: Encrypted file detection (encryption detection fixed)
- TC7: Corrupted file handling (test data created)
- TC8: Drag and drop upload (implementation complete)
- TC9: Privacy - no network requests (implementation complete)

## Resolution Progress

### Sprint 1 Goals
1. ✅ Identify and document defects
2. ✅ Improve encryption detection (DEF-002) - **RESOLVED**
3. ✅ Create corrupted test files (DEF-003) - **RESOLVED**
4. ⏳ Create realistic test data (DEF-001) - **In Progress**

### Recent Updates (2026-01-04)

**DEF-002 Resolution:**
- Moved encryption detection from Angular to WASM layer
- Leverages calamine library's native error handling
- More reliable detection when attempting to open workbook
- User-friendly error messages for encrypted files
- TC3 and TC6 ready for testing

**DEF-003 Resolution:**
- Created Python script to generate corrupted test files
- Generated 3 corrupted file variants (truncated, wrong extension, severely corrupted)
- Updated TC7 to use realistic corrupted data
- Enhanced WASM error handling for corruption scenarios
- TC7 ready for automated testing

### Acceptance Criteria
All defects must be resolved before Story #001 can be marked as "Done":
- [x] E2E test suite created
- [x] Test data directory structure created
- [x] Encryption detection implemented (DEF-002)
- [x] Corrupted test files available (DEF-003)
- [ ] Realistic test data available (DEF-001)
- [ ] All TC1-TC7 executable
- [ ] All TC1-TC7 passing
- [ ] No critical or high severity defects open

**Progress: 4/8 criteria met (50%)**

## Related Documentation

- [Story #001](../../stories/story_001_Upload_and_Parse_Bank_Statement.md)
- [Test Cases](../story_001_Upload_and_Parse_Bank_Statement_testcases.md)
- [Manual Test Report](../story_001_testdata/MANUAL_TEST_REPORT.md)
- [E2E Test Suite](../../../tests/e2e/tests/story_001.spec.ts)
- [Sprint 1 Status](../../sprints/sprint1_status.md)

## Contact

**QA Team Lead:** QA Automation Engineer  
**Development Lead:** Development Team  
**Product Owner:** Jayesh Prajapati

---

*Last Updated: 2026-01-04*
