## Test Cases for Story: Upload and Parse Bank Statement (WASM Engine)

### Test Case 1: Upload Supported HDFC Savings Statement
**Objective:** Verify that a valid HDFC Savings Excel file is parsed successfully in-browser.

#### Steps
1. Navigate to the upload screen.
2. Select a valid HDFC Savings .xlsx file.
3. Click upload.

#### Test Data
- HDFC_Savings_Sample.xlsx

#### Expected Result
- File is parsed in-browser and transactions are displayed. No data leaves the device.

---

### Test Case 2: Upload Supported HDFC Credit Card Statement
**Objective:** Verify that a valid HDFC Credit Card CSV file is parsed successfully in-browser.

#### Steps
1. Navigate to the upload screen.
2. Select a valid HDFC Credit Card .csv file.
3. Click upload.

#### Test Data
- HDFC_CreditCard_Sample.csv

#### Expected Result
- File is parsed in-browser and transactions are displayed. No data leaves the device.

---

### Test Case 3: Reject Password-Protected Statement
**Objective:** Verify that password-protected statements are rejected with a clear error message indicating they are not supported.

#### Steps
1. Navigate to the upload screen.
2. Select a password-protected .xlsx file.
3. Attempt to upload.

#### Test Data
- HDFC_Savings_Protected.xlsx (password-protected)

#### Expected Result
- System displays a clear error message: "Password-protected and encrypted statements are not supported. Please export without encryption." Parsing does not occur and no data is processed.

---

### Test Case 4: Reject PDF File Format
**Objective:** Verify that PDF files are rejected with a clear error message.

#### Steps
1. Navigate to the upload screen.
2. Select a .pdf file.
3. Attempt to upload.

#### Test Data
- Statement.pdf

#### Expected Result
- System displays a clear error message: "Only Excel (.xlsx/.xls) and CSV files are supported." Parsing does not occur and no data is processed.

---

### Test Case 5: Reject Unsupported File Formats
**Objective:** Verify that unsupported file formats (other than PDF) are rejected with a clear error message.

#### Steps
1. Navigate to the upload screen.
2. Select a .txt, .doc, .json, or other non-Excel/CSV file.
3. Attempt to upload.

#### Test Data
- Notes.txt
- Document.doc
- Data.json

#### Expected Result
- System displays a clear error message: "Only Excel (.xlsx/.xls) and CSV files are supported." Parsing does not occur and no data is processed.

---

### Test Case 6: Reject Encrypted Statement
**Objective:** Verify that encrypted statements are rejected with a clear error message indicating encryption is not supported.

#### Steps
1. Navigate to the upload screen.
2. Select an encrypted .xlsx or .csv file.
3. Attempt to upload.

#### Test Data
- HDFC_Savings_Encrypted.xlsx
- HDFC_CreditCard_Encrypted.csv

#### Expected Result
- System displays a clear error message: "Password-protected and encrypted statements are not supported. Please export without encryption." Parsing does not occur and no data is processed.

---

### Test Case 7: Upload Corrupted or Malformed File
**Objective:** Verify that corrupted or malformed files are rejected in-browser with a clear error message.

#### Steps
1. Navigate to the upload screen.
2. Select a corrupted .xlsx or .csv file.
3. Click upload.

#### Test Data
- Corrupted_Savings.xlsx
- Corrupted_CreditCard.csv

#### Expected Result
- System displays a clear error message: "File could not be parsed. Please check the file and try again." Parsing stops and no data is processed.
