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

### Test Case 3: Upload Password-Protected Statement
**Objective:** Verify that the system prompts for a password and parses after correct entry.

#### Steps
1. Navigate to the upload screen.
2. Select a password-protected .xlsx file.
3. Enter the correct password when prompted.
4. Click upload.

#### Test Data
- HDFC_Savings_Protected.xlsx (password: test123)

#### Expected Result
- System prompts for password, parses file after correct entry, and displays transactions.

---

### Test Case 4: Upload Unsupported File Format
**Objective:** Verify that unsupported file formats are rejected with a clear error message.

#### Steps
1. Navigate to the upload screen.
2. Select a .pdf or .txt file.
3. Click upload.

#### Test Data
- Statement.pdf
- Notes.txt

#### Expected Result
- System displays an error: "Only Excel (.xlsx/.xls) and CSV files are supported."

---

### Test Case 5: Upload File with Incorrect Password
**Objective:** Verify that parsing fails and an error is shown if the wrong password is entered.

#### Steps
1. Navigate to the upload screen.
2. Select a password-protected .xlsx file.
3. Enter an incorrect password when prompted.
4. Click upload.

#### Test Data
- HDFC_Savings_Protected.xlsx (password: wrongpass)

#### Expected Result
- System displays an error: "Incorrect password. Please try again."

---

### Test Case 6: Upload Corrupted or Malformed File
**Objective:** Verify that corrupted or malformed files are rejected with a clear error message.

#### Steps
1. Navigate to the upload screen.
2. Select a corrupted .xlsx or .csv file.
3. Click upload.

#### Test Data
- Corrupted_Savings.xlsx
- Corrupted_CreditCard.csv

#### Expected Result
- System displays an error: "File could not be parsed. Please check the file and try again."
