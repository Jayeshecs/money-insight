## Story: Auto-Detect and Apply Correct Parser Plugin

**As a** user with different bank statement formats  
**I want** the system to auto-detect the correct parser  
**So that** I don’t have to manually select my bank or format

### Scenarios
- User uploads a statement with a known header or pattern
- System iterates through available plugins and selects the correct one

### Acceptance Criteria
- System correctly identifies and applies the parser for HDFC Savings and Credit Card formats
- If no parser matches, user is notified and can report the issue
