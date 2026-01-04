# Story #001 Defects

This directory contains detailed defect reports discovered during testing of Story #001: Upload and Parse Bank Statement.

## Defect Summary

| ID | Title | Severity | Priority | Status | Test Cases |
|----|-------|----------|----------|--------|------------|
| [DEF-001](DEF-001_Missing_Realistic_Test_Data.md) | Missing Realistic Test Data | High | High | Open | TC1, TC2 |
| [DEF-002](DEF-002_Encryption_Detection_Unclear.md) | Encryption Detection Unclear | Medium | Medium | Open | TC3, TC6 |
| [DEF-003](DEF-003_Missing_Corrupted_File_Test_Data.md) | Missing Corrupted File Test Data | Low | Low | Open | TC7 |

## Quick Reference

### High Priority Defects

**DEF-001: Missing Realistic Test Data**
- **Impact:** Parser accuracy cannot be validated
- **Blocking:** TC1 (HDFC Savings), TC2 (HDFC Credit Card)
- **Resolution Needed:** Create sample HDFC statement files with realistic structure
- **Effort:** 4-6 hours

### Medium Priority Defects

**DEF-002: Encryption Detection Implementation Unclear**
- **Impact:** Password-protected file handling unverified
- **Blocking:** TC3, TC6 partially blocked
- **Resolution Needed:** Improve encryption detection or move to WASM layer
- **Effort:** 4-6 hours

### Low Priority Defects

**DEF-003: Missing Corrupted File Test Data**
- **Impact:** Corruption handling unverified (low risk)
- **Blocking:** TC7
- **Resolution Needed:** Create intentionally corrupted test files
- **Effort:** 2-3 hours
- **Note:** Consider deferring to Sprint 2 or backlog

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

| Test Case | Title | Blocking Defect(s) |
|-----------|-------|-------------------|
| TC1 | Upload HDFC Savings | DEF-001 |
| TC2 | Upload HDFC Credit Card | DEF-001 |
| TC3 | Reject Password-Protected | DEF-002 |
| TC6 | Reject Encrypted File | DEF-002 |
| TC7 | Reject Corrupted File | DEF-003 |

### Test Cases Passing
- TC4: Reject PDF (UI validation)
- TC5a-c: Reject unsupported formats (UI validation)

### Test Cases Pending
- TC8: Drag and drop upload (implementation complete, needs validation)
- TC9: Privacy - no network requests (implementation complete, needs validation)

## Resolution Progress

### Sprint 1 Goals
1. ✅ Identify and document defects
2. ⏳ Create realistic test data (DEF-001)
3. ⏳ Improve encryption detection (DEF-002)
4. ⏸️ Defer DEF-003 to Sprint 2

### Acceptance Criteria
All defects must be resolved before Story #001 can be marked as "Done":
- [x] E2E test suite created
- [x] Test data directory structure created
- [ ] Realistic test data available
- [ ] All TC1-TC7 executable
- [ ] All TC1-TC7 passing
- [ ] No critical or high severity defects open

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
