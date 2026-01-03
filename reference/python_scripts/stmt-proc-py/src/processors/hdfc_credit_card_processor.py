import pandas as pd
import hashlib
import os
import traceback
from .statement_processor import StatementProcessor


class HdfcCreditCardStatementProcessor(StatementProcessor):
    """Processor for HDFC Credit Card Statements."""

    def __init__(self, txn_store):
        """Initialize with a transaction store."""
        super().__init__(txn_store)
        
    def statement_type(self):
        """Return the statement type."""
        return "hdfc-cc"

    def parse_statement(self, file_path):
        """Parse the HDFC credit card statement from the given file path."""
        version = self.detect_version(file_path)
        if version == "v1":
            self.parse_statement_v1(file_path)
        elif version == "v2":
            self.parse_statement_v2(file_path)
        else:
            raise ValueError(f"Unsupported HDFC credit card statement version: {version}")

    def detect_version(self, file_path):
        """Detect the version of the HDFC credit card statement."""
        try:
            print(f"Detecting HDFC credit card statement version for file: {file_path}")
            df = pd.read_excel(file_path, header=None)

            # Check for v1 header row
            v1_rows = df[df.iloc[:, 1] == "Transaction type"]
            if not v1_rows.empty:
                header_row_index = v1_rows.index[0]
                print("Detected HDFC credit card statement version: v1")
                return "v1"

            # Check for v2 header row
            v2_rows = df[df.iloc[:, 0] == "Transaction type"]
            if not v2_rows.empty:
                header_row_index = v2_rows.index[0]
                print("Detected HDFC credit card statement version: v2")
                return "v2"
            
        except Exception as e:
            print(f"Error reading Excel file: {file_path}")
            print("Exception details:")
            traceback.print_exc()
            raise
        
        raise ValueError("Unsupported HDFC credit card statement format.")
    
    def parse_statement_v1(self, file_path):
        # Read the XLS file
        df = pd.read_excel(file_path, header=None)

        # Extract txn-source from the first 6 digits of the filename
        file_name = os.path.basename(file_path)
        txn_source = file_name[:6]

        # Find the header row where the 2nd column value is "Transaction type"
        header_row_index = df[df.iloc[:, 1] == "Transaction type"].index[0]
        start_row_index = header_row_index + 1
        print(f"Header row index: {header_row_index}, Starting data row index: {start_row_index}")
        df = df.iloc[start_row_index:].reset_index(drop=True)

        # Rename columns for easier access
        df.rename(columns={
            17: "txn_date",  # 18th column (0-based index is 17)
            21: "narration",  # 22nd column (0-based index is 21)
            48: "txn_amount",  # 49th column (0-based index is 48)
            54: "debit_credit"  # 55th column (0-based index is 54)
        }, inplace=True)

        # Process each transaction record
        transactions = []
        for _, row in df.iterrows():
            if pd.isna(row['txn_date']) or pd.isnull(row['txn_date']):
                break

            # Concatenate raw data
            raw_data = f"{row['txn_date']}|{row['narration']}|{row['txn_amount']}|{row['debit_credit']}"
            row_id = hashlib.md5(raw_data.encode()).hexdigest()

            # Parse transaction date
            txn_date = pd.to_datetime(row['txn_date'][:10], format='%d/%m/%Y').strftime('%Y-%m-%d')

            # Determine credit indicator
            credit_indicator = "Yes" if row['debit_credit'] == "Cr" else ""

            # Create transaction record
            transaction = {
                "row-id": row_id,
                "txn-source": txn_source,
                "txn-date": txn_date,
                "narration": row['narration'],
                "txn-amount": row['txn_amount'],
                "credit-indicator": credit_indicator,
                "txn-type": "",
                "category": "",
                "sub-category": "",
                "raw-data": raw_data,
            }
            transactions.append(transaction)

        # Store transactions in the consolidated CSV file
        self.store_transactions(transactions)

    
    def parse_statement_v2(self, file_path):
        # Read the XLS file
        df = pd.read_excel(file_path, header=None)

        # Extract txn-source from the first 6 digits of the filename
        file_name = os.path.basename(file_path)
        txn_source = file_name[:6]

        # Find the header row where the 2nd column value is "Transaction type"
        header_row_index = df[df.iloc[:, 0] == "Transaction type"].index[0]
        start_row_index = header_row_index + 1
        print(f"Header row index: {header_row_index}, Starting data row index: {start_row_index}")
        df = df.iloc[start_row_index:].reset_index(drop=True)

        # Rename columns for easier access
        df.rename(columns={
            9: "txn_date",  # 10th column (0-based index is 9)
            12: "narration",  # 13th column (0-based index is 12)
            20: "txn_amount",  # 21st column (0-based index is 20)
            23: "debit_credit"  # 24th column (0-based index is 23)
        }, inplace=True)

        # Process each transaction record
        transactions = []
        for _, row in df.iterrows():
            if pd.isna(row['txn_date']) or pd.isnull(row['txn_date']):
                break

            # Concatenate raw data
            raw_data = f"{row['txn_date']}|{row['narration']}|{row['txn_amount']}|{row['debit_credit']}"
            row_id = hashlib.md5(raw_data.encode()).hexdigest()

            # Parse transaction date
            txn_date = pd.to_datetime(row['txn_date'][:10], format='%d/%m/%Y').strftime('%Y-%m-%d')

            # Determine credit indicator
            credit_indicator = "Yes" if row['debit_credit'] == "Cr" else ""

            # Create transaction record
            transaction = {
                "row-id": row_id,
                "txn-source": txn_source,
                "txn-date": txn_date,
                "narration": row['narration'],
                "txn-amount": row['txn_amount'],
                "credit-indicator": credit_indicator,
                "txn-type": "",
                "category": "",
                "sub-category": "",
                "raw-data": raw_data,
            }
            transactions.append(transaction)

        # Store transactions in the consolidated CSV file
        self.store_transactions(transactions)