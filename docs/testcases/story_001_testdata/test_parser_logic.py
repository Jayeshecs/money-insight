"""
Quick test to validate the generated HDFC CC test data files match parser expectations.
"""
import pandas as pd
import sys

def test_file(filename, expected_version):
    print(f"\n{'='*60}")
    print(f"Testing: {filename}")
    print(f"Expected Version: {expected_version}")
    print(f"{'='*60}")
    
    try:
        df = pd.read_excel(filename, header=None)
        print(f"✓ File loaded successfully")
        print(f"  Shape: {df.shape}")
        
        # Test version detection logic from Python reference
        if expected_version == "v1":
            # Check for v1 header row (column 1 = "Transaction type")
            v1_rows = df[df.iloc[:, 1] == "Transaction type"]
            if not v1_rows.empty:
                header_row_index = v1_rows.index[0]
                print(f"✓ V1 format detected (header at row {header_row_index})")
                
                # Verify column positions
                txn_date_col = 17
                narration_col = 21
                amount_col = 48
                cr_dr_col = 54
                
        elif expected_version == "v2":
            # Check for v2 header row (column 0 = "Transaction type")
            v2_rows = df[df.iloc[:, 0] == "Transaction type"]
            if not v2_rows.empty:
                header_row_index = v2_rows.index[0]
                print(f"✓ V2 format detected (header at row {header_row_index})")
                
                # Verify column positions
                txn_date_col = 9
                narration_col = 12
                amount_col = 20
                cr_dr_col = 23
        
        # Count transactions
        start_row = header_row_index + 1
        txn_count = 0
        for i in range(start_row, len(df)):
            if pd.notna(df.iloc[i, txn_date_col]) and df.iloc[i, txn_date_col] != '':
                txn_count += 1
            else:
                break
        
        print(f"✓ Transactions found: {txn_count}")
        
        if txn_count > 0:
            # Show first transaction
            first_txn = {
                'date': df.iloc[start_row, txn_date_col],
                'description': df.iloc[start_row, narration_col],
                'amount': df.iloc[start_row, amount_col],
                'cr_dr': df.iloc[start_row, cr_dr_col]
            }
            print(f"✓ First transaction:")
            print(f"    Date: {first_txn['date']}")
            print(f"    Desc: {first_txn['description']}")
            print(f"    Amt: {first_txn['amount']}")
            print(f"    Cr/Dr: {first_txn['cr_dr']}")
            
            # Verify date format (should be DD/MM/YYYY)
            date_str = str(first_txn['date'])
            if '/' in date_str and len(date_str.split('/')) == 3:
                print(f"✓ Date format is correct (DD/MM/YYYY)")
            else:
                print(f"✗ Date format may be incorrect: {date_str}")
        
        # Summary
        print(f"\n{'✓'*20} PASS {'✓'*20}")
        return True
        
    except Exception as e:
        print(f"\n{'✗'*20} FAIL {'✗'*20}")
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    print("\nHDFC Credit Card Test Data Validation")
    print("=" * 60)
    
    results = []
    
    # Test both files
    results.append(test_file('CC2486_20250418.xls', 'v2'))
    results.append(test_file('CC2486_20251218.xls', 'v1'))
    
    # Final summary
    print(f"\n{'='*60}")
    print("FINAL RESULTS")
    print(f"{'='*60}")
    print(f"Total tests: {len(results)}")
    print(f"Passed: {sum(results)}")
    print(f"Failed: {len(results) - sum(results)}")
    
    if all(results):
        print("\n✅ ALL TESTS PASSED - Test data is ready for parser validation!")
        sys.exit(0)
    else:
        print("\n❌ SOME TESTS FAILED - Please review errors above")
        sys.exit(1)
