"""
Generate realistic HDFC Credit Card test data matching the parser expectations.

Based on the Python reference implementation:
- Version 2 format (v2) detection: Column 0 = "Transaction type"
- Column 9 (10th): Transaction date (DD/MM/YYYY)
- Column 12 (13th): Narration/Description
- Column 20 (21st): Transaction amount
- Column 23 (24th): Cr/Dr indicator
"""

import pandas as pd
import numpy as np
from datetime import datetime

def create_hdfc_cc_v2_statement():
    """Create HDFC Credit Card statement in v2 format."""
    
    # Create empty DataFrame with 60 columns to match v2 format
    num_cols = 60
    num_rows = 20  # Header + 12 transactions + some empty rows
    
    # Initialize with empty values
    data = [['' for _ in range(num_cols)] for _ in range(num_rows)]
    
    # Add header rows (typical HDFC format has multiple header rows)
    data[0][0] = 'HDFC Bank Credit Card Statement'
    data[1][0] = 'Card Number: XXXX XXXX XXXX 2486'
    data[2][0] = 'Statement Date: 18/04/2025'
    
    # Add column header row (row 4, index 3)
    # The parser looks for "Transaction type" in column 0
    data[3][0] = 'Transaction type'
    data[3][9] = 'Transaction date'
    data[3][12] = 'Description'
    data[3][20] = 'Amount'
    data[3][23] = 'Cr/Dr'
    
    # Sample transactions starting from row 5 (index 4)
    transactions = [
        ('15/04/2025', 'AMAZON RETAIL INDIA', 2500.00, 'Dr'),
        ('15/04/2025', 'SWIGGY FOOD DELIVERY', 850.00, 'Dr'),
        ('16/04/2025', 'UBER INDIA TRIP', 450.00, 'Dr'),
        ('16/04/2025', 'BIG BAZAAR PURCHASE', 3200.00, 'Dr'),
        ('17/04/2025', 'FLIPKART ELECTRONICS', 15000.00, 'Dr'),
        ('17/04/2025', 'ZOMATO FOOD ORDER', 680.00, 'Dr'),
        ('17/04/2025', 'PAYMENT RECEIVED THANK YOU', 10000.00, 'Cr'),
        ('18/04/2025', 'NETFLIX SUBSCRIPTION', 649.00, 'Dr'),
        ('18/04/2025', 'DMart GROCERY', 2450.00, 'Dr'),
        ('18/04/2025', 'PETROL PUMP INDIAN OIL', 3500.00, 'Dr'),
        ('18/04/2025', 'APOLLO PHARMACY', 890.00, 'Dr'),
        ('18/04/2025', 'PAYMENT RECEIVED THANK YOU', 5000.00, 'Cr'),
    ]
    
    for idx, (date, desc, amount, cr_dr) in enumerate(transactions):
        row_idx = 4 + idx
        data[row_idx][0] = 'SALE' if cr_dr == 'Dr' else 'PAYMENT'
        data[row_idx][9] = date
        data[row_idx][12] = desc
        data[row_idx][20] = amount
        data[row_idx][23] = cr_dr
    
    # Create DataFrame
    df = pd.DataFrame(data)
    
    return df


def create_hdfc_cc_v1_statement():
    """Create HDFC Credit Card statement in v1 format (older format)."""
    
    # Create empty DataFrame with 60 columns to match v1 format
    num_cols = 60
    num_rows = 20
    
    # Initialize with empty values
    data = [['' for _ in range(num_cols)] for _ in range(num_rows)]
    
    # Add header rows
    data[0][0] = 'HDFC Bank Credit Card Statement'
    data[1][0] = 'Card Number: XXXX XXXX XXXX 2486'
    data[2][0] = 'Statement Date: 18/04/2025'
    
    # Add column header row (row 4, index 3)
    # The parser looks for "Transaction type" in column 1 (2nd column)
    data[3][1] = 'Transaction type'
    data[3][17] = 'Transaction date'
    data[3][21] = 'Description'
    data[3][48] = 'Amount'
    data[3][54] = 'Cr/Dr'
    
    # Sample transactions starting from row 5 (index 4)
    transactions = [
        ('15/04/2025', 'AMAZON RETAIL INDIA', 2500.00, 'Dr'),
        ('15/04/2025', 'SWIGGY FOOD DELIVERY', 850.00, 'Dr'),
        ('16/04/2025', 'UBER INDIA TRIP', 450.00, 'Dr'),
        ('16/04/2025', 'BIG BAZAAR PURCHASE', 3200.00, 'Dr'),
        ('17/04/2025', 'FLIPKART ELECTRONICS', 15000.00, 'Dr'),
        ('17/04/2025', 'ZOMATO FOOD ORDER', 680.00, 'Dr'),
        ('17/04/2025', 'PAYMENT RECEIVED THANK YOU', 10000.00, 'Cr'),
        ('18/04/2025', 'NETFLIX SUBSCRIPTION', 649.00, 'Dr'),
        ('18/04/2025', 'DMart GROCERY', 2450.00, 'Dr'),
        ('18/04/2025', 'PETROL PUMP INDIAN OIL', 3500.00, 'Dr'),
        ('18/04/2025', 'APOLLO PHARMACY', 890.00, 'Dr'),
        ('18/04/2025', 'PAYMENT RECEIVED THANK YOU', 5000.00, 'Cr'),
    ]
    
    for idx, (date, desc, amount, cr_dr) in enumerate(transactions):
        row_idx = 4 + idx
        data[row_idx][1] = 'SALE' if cr_dr == 'Dr' else 'PAYMENT'
        data[row_idx][17] = date
        data[row_idx][21] = desc
        data[row_idx][48] = amount
        data[row_idx][54] = cr_dr
    
    # Create DataFrame
    df = pd.DataFrame(data)
    
    return df


if __name__ == '__main__':
    print("Generating HDFC Credit Card test data files...")
    
    # Generate v2 format (newer format - for CC2486_20250418.xls)
    print("Creating v2 format: CC2486_20250418.xls")
    df_v2 = create_hdfc_cc_v2_statement()
    df_v2.to_excel('CC2486_20250418.xls', index=False, header=False, engine='xlwt')
    print(f"  ✓ Created with shape: {df_v2.shape}")
    
    # Generate v1 format (older format - for CC2486_20251218.xls)
    print("Creating v1 format: CC2486_20251218.xls")
    df_v1 = create_hdfc_cc_v1_statement()
    df_v1.to_excel('CC2486_20251218.xls', index=False, header=False, engine='xlwt')
    print(f"  ✓ Created with shape: {df_v1.shape}")
    
    print("\nTest data generation complete!")
    print("\nSample transactions included:")
    print("- 12 transactions per file")
    print("- Mix of debits (purchases) and credits (payments)")
    print("- Realistic merchant names (Amazon, Swiggy, Uber, etc.)")
    print("- Date format: DD/MM/YYYY")
    print("- Amount range: ₹450 to ₹15,000")
    print("- Total debits: ₹30,169")
    print("- Total credits: ₹15,000")
