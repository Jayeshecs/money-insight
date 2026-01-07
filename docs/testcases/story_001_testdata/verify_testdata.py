import pandas as pd

print("Verifying CC2486_20250418.xls...")
df = pd.read_excel('CC2486_20250418.xls', header=None)
print(f"Shape: {df.shape}")
print(f"\nHeader row (row 3, col 0): {df.iloc[3, 0]}")
print(f"First transaction date (row 4, col 9): {df.iloc[4, 9]}")
print(f"First transaction desc (row 4, col 12): {df.iloc[4, 12]}")
print(f"First transaction amount (row 4, col 20): {df.iloc[4, 20]}")
print(f"First transaction Cr/Dr (row 4, col 23): {df.iloc[4, 23]}")

# Count non-empty transactions
txn_count = 0
for i in range(4, len(df)):
    if pd.notna(df.iloc[i, 9]) and df.iloc[i, 9] != '':
        txn_count += 1
    else:
        break

print(f"\nTotal transactions: {txn_count}")
print("\nFile verification complete!")
