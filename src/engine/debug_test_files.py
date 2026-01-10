#!/usr/bin/env python3
"""
Debug script to inspect actual test data file structure
This shows what the Rust/WASM parser sees after Excel-to-TSV conversion
"""

import sys
try:
    import xlrd  # For old .xls format
except ImportError:
    print("Error: xlrd not installed. Run: pip install xlrd")
    sys.exit(1)
    
from pathlib import Path

def excel_to_tsv_debug(filepath, max_lines=40):
    """
    Convert Excel to TSV exactly like the Rust code does,
    then output for debugging purposes
    """
    print(f"\n{'='*80}")
    print(f"File: {filepath}")
    print(f"{'='*80}\n")
    
    try:
        # Load workbook using xlrd for old .xls format
        wb = xlrd.open_workbook(filepath)
        sheet = wb.sheet_by_index(0)
        
        print(f"Worksheet: {sheet.name}")
        print(f"Dimensions: {sheet.nrows} rows × {sheet.ncols} columns\n")
        print(f"First {max_lines} lines as TSV (matching Rust conversion):\n")
        
        # Convert to TSV (matching Rust logic in lib.rs)
        for row_num in range(min(max_lines, sheet.nrows)):
            row = sheet.row(row_num)
            
            # Convert each cell to string (matching Rust Data enum handling)
            row_str = []
            for cell in row:
                if cell.ctype == xlrd.XL_CELL_EMPTY:
                    row_str.append("")
                elif cell.ctype == xlrd.XL_CELL_TEXT:
                    row_str.append(str(cell.value))
                elif cell.ctype == xlrd.XL_CELL_NUMBER:
                    # Convert number to string
                    row_str.append(str(cell.value))
                elif cell.ctype == xlrd.XL_CELL_DATE:
                    row_str.append(str(cell.value))
                elif cell.ctype == xlrd.XL_CELL_BOOLEAN:
                    row_str.append(str(cell.value))
                elif cell.ctype == xlrd.XL_CELL_ERROR:
                    row_str.append(f"#ERROR: {cell.value}")
                else:
                    row_str.append("")
            
            tsv_line = "\t".join(row_str)
            
            # Print with line number
            print(f"Line {row_num + 1:3d} | {tsv_line}")
        
        if sheet.nrows > max_lines:
            print(f"\n... ({sheet.nrows - max_lines} more lines)")
        
        # Now check parser identification requirements
        print(f"\n{'='*80}")
        print("PARSER IDENTIFICATION CHECK")
        print(f"{'='*80}\n")
        
        # Collect all lines
        all_lines = []
        for row_num in range(sheet.nrows):
            row = sheet.row(row_num)
            row_str = []
            for cell in row:
                if cell.ctype == xlrd.XL_CELL_EMPTY:
                    row_str.append("")
                elif cell.ctype == xlrd.XL_CELL_TEXT:
                    row_str.append(str(cell.value))
                elif cell.ctype == xlrd.XL_CELL_NUMBER:
                    row_str.append(str(cell.value))
                elif cell.ctype == xlrd.XL_CELL_DATE:
                    row_str.append(str(cell.value))
                elif cell.ctype == xlrd.XL_CELL_BOOLEAN:
                    row_str.append(str(cell.value))
                elif cell.ctype == xlrd.XL_CELL_ERROR:
                    row_str.append(f"#ERROR: {cell.value}")
                else:
                    row_str.append("")
            tsv_line = "\t".join(row_str)
            all_lines.append(tsv_line)
        
        # Check HDFC Savings Parser requirements
        print("HDFC Savings Parser Requirements:")
        print("-" * 40)
        
        # 1. Check for bank name in first 10 lines
        hdfc_found_line = None
        for i, line in enumerate(all_lines[:10]):
            if "hdfc bank" in line.lower():
                hdfc_found_line = i
                print(f"✅ 'hdfc bank' found on line {i}: '{line[:80]}'")
                break
        
        if hdfc_found_line is None:
            print("❌ 'hdfc bank' NOT found in first 10 lines!")
        
        # 2. Check for header line with all required columns
        header_found = False
        header_line_num = None
        
        for i, line in enumerate(all_lines[:20]):
            has_date = "Date" in line
            has_narration = "Narration" in line
            has_withdrawal = "Withdrawal Amt" in line
            has_deposit = "Deposit Amt" in line
            
            if has_date and has_narration:
                print(f"\nLine {i} contains 'Date' and 'Narration':")
                print(f"  '{line[:100]}'")
                
                if has_withdrawal or has_deposit:
                    header_found = True
                    header_line_num = i
                    print(f"  ✅ Also has amount columns (Withdrawal:{has_withdrawal}, Deposit:{has_deposit})")
                    print(f"  ✅ THIS LINE MATCHES HDFC SAVINGS HEADER PATTERN")
                else:
                    print(f"  ❌ Missing amount columns")
        
        if not header_found:
            print("\n❌ No line found with Date + Narration + (Withdrawal OR Deposit)")
            print("\nSearching for individual keywords in first 20 lines:")
            for keyword in ["Date", "Narration", "Withdrawal Amt", "Deposit Amt"]:
                found_lines = [i for i, line in enumerate(all_lines[:20]) if keyword in line]
                if found_lines:
                    print(f"  '{keyword}' found on lines: {found_lines}")
                else:
                    print(f"  '{keyword}' NOT FOUND")
        
        # Final identification result
        print(f"\n{'='*80}")
        identifies = hdfc_found_line is not None and header_found
        if identifies:
            print(f"✅ RESULT: Parser SHOULD identify this file")
            print(f"   - Bank name on line {hdfc_found_line}")
            print(f"   - Header pattern on line {header_line_num}")
        else:
            print(f"❌ RESULT: Parser will NOT identify this file")
            if hdfc_found_line is None:
                print(f"   - Missing 'hdfc bank' in first 10 lines")
            if not header_found:
                print(f"   - No line has Date + Narration + amount columns together")
        print(f"{'='*80}\n")
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Test data directory
    test_data_dir = Path(__file__).parent.parent.parent / "docs" / "testcases" / "story_001_testdata"
    
    # Files to analyze
    files_to_check = [
        "SA3234_FY2025_20251221.xls",  # HDFC Savings
        "CC2486_20250418.xls",           # HDFC Credit Card
    ]
    
    for filename in files_to_check:
        filepath = test_data_dir / filename
        if filepath.exists():
            excel_to_tsv_debug(filepath)
            print("\n\n")
        else:
            print(f"File not found: {filepath}\n")
