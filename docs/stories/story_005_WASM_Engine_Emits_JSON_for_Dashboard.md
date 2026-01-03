## Story: WASM Engine Emits JSON for Dashboard

**As a** developer  
**I want** the WASM engine to emit a JSON object after parsing  
**So that** the Angular frontend can update dashboard widgets in real time

### Scenarios
- After parsing, WASM emits a structured JSON object
- Angular signals or RxJS update the UI

### Acceptance Criteria
- JSON structure includes all necessary transaction fields
- Dashboard widgets update instantly after parsing
