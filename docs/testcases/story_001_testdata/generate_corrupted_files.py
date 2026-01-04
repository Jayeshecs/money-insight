#!/usr/bin/env python3
"""Generate corrupted Excel files for testing"""

import os
import shutil
from pathlib import Path

# Test data directory
TEST_DATA_DIR = Path(__file__).parent

def create_truncated_file():
    """Create truncated Excel file by cutting off data"""
    # Use one of the existing XLS files as source
    source_files = list(TEST_DATA_DIR.glob("*.xls"))
    if not source_files:
        print("⚠️  No .xls files found to create truncated version")
        return
    
    source = source_files[0]
    target = TEST_DATA_DIR / "Corrupted_Truncated.xlsx"
    
    with open(source, 'rb') as f:
        data = f.read()
    
    # Keep only first 40% of file to simulate truncation
    truncated = data[:int(len(data) * 0.4)]
    
    with open(target, 'wb') as f:
        f.write(truncated)
    
    print(f"✅ Created: {target.name} ({len(truncated)} bytes from {len(data)} bytes)")

def create_wrong_extension():
    """Create text file with .xlsx extension"""
    source = TEST_DATA_DIR / "Notes.txt"
    target = TEST_DATA_DIR / "Corrupted_WrongExtension.xlsx"
    
    if not source.exists():
        print(f"⚠️  Source file {source.name} not found")
        return
    
    shutil.copy(source, target)
    print(f"✅ Created: {target.name} (text file renamed as Excel)")

def create_corrupted_savings():
    """Create the file referenced in TC7"""
    # Same as truncated file but with TC7's expected name
    source_files = list(TEST_DATA_DIR.glob("SA*.xls"))
    if not source_files:
        # Fallback to any xls file
        source_files = list(TEST_DATA_DIR.glob("*.xls"))
    
    if not source_files:
        print("⚠️  No .xls files found to create Corrupted_Savings.xlsx")
        return
    
    source = source_files[0]
    target = TEST_DATA_DIR / "Corrupted_Savings.xlsx"
    
    with open(source, 'rb') as f:
        data = f.read()
    
    # Keep only first 30% to ensure corruption
    corrupted = data[:int(len(data) * 0.3)]
    
    with open(target, 'wb') as f:
        f.write(corrupted)
    
    print(f"✅ Created: {target.name} (severely truncated at {int(len(data) * 0.3)} bytes)")

def main():
    print("=" * 60)
    print("Creating Corrupted Test Files for DEF-003")
    print("=" * 60)
    print()
    
    create_truncated_file()
    create_wrong_extension()
    create_corrupted_savings()
    
    print()
    print("=" * 60)
    print("Summary:")
    print("  - Corrupted_Truncated.xlsx: Partially truncated Excel file")
    print("  - Corrupted_WrongExtension.xlsx: Text file with .xlsx extension")
    print("  - Corrupted_Savings.xlsx: Severely truncated (for TC7)")
    print()
    print("These files should trigger WASM parsing errors when uploaded.")
    print("=" * 60)

if __name__ == "__main__":
    main()
