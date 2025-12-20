"""
Script untuk memproses ulang data dari Level_2.xlsx
Memastikan semua wilayah ter-cover dan tidak ada data yang hilang
"""
import pandas as pd
import numpy as np
from pathlib import Path

# Path files
BASE_DIR = Path(__file__).parent.parent
LEVEL2_FILE = BASE_DIR.parent / 'Visualisasi Data' / 'Level_2.xlsx'
LOOKUP_FILE = BASE_DIR.parent / 'Visualisasi Data' / 'lookups.xlsx'
OUTPUT_FILE = BASE_DIR / 'data' / 'hasil_normalisasi_kel11.xlsx'

# Target benefit types
TARGET_TYPES = ["physical_activity", "air_quality", "hassle_costs", "congestion"]
YEARS = list(range(2025, 2051))

def normalize_name(name):
    """Normalize nama untuk matching"""
    if pd.isna(name) or name is None:
        return ""
    s = str(name).strip().lower()
    for ch in ["'", "'", "`"]:
        s = s.replace(ch, "")
    s = s.replace("&", "and")
    s = " ".join(s.split())
    return s

def load_lookup_map():
    """Load mapping dari small_area ke local_authority"""
    print("Loading lookup file...")
    df_lookup = pd.read_excel(LOOKUP_FILE)
    
    # Pastikan kolom ada
    if 'small_area' not in df_lookup.columns or 'local_authority' not in df_lookup.columns:
        raise ValueError("Lookup file harus memiliki kolom 'small_area' dan 'local_authority'")
    
    # Buat mapping dictionary
    sa_to_la = {}
    for _, row in df_lookup.iterrows():
        sa = str(row['small_area']) if pd.notna(row['small_area']) else None
        la = str(row['local_authority']) if pd.notna(row['local_authority']) else None
        if sa and la:
            sa_to_la[sa] = la
    
    print(f"Loaded {len(sa_to_la)} mappings from lookup file")
    return sa_to_la

def process_level2_data(sa_to_la):
    """Process Level_2.xlsx dan aggregate ke local_authority"""
    print("Loading Level_2.xlsx...")
    df_level2 = pd.read_excel(LEVEL2_FILE)
    
    print(f"Total rows in Level_2: {len(df_level2)}")
    print(f"Columns: {list(df_level2.columns)}")
    
    # Pastikan kolom yang diperlukan ada
    if 'small_area' not in df_level2.columns:
        raise ValueError("Level_2.xlsx harus memiliki kolom 'small_area'")
    if 'co-benefit_type' not in df_level2.columns:
        raise ValueError("Level_2.xlsx harus memiliki kolom 'co-benefit_type'")
    
    # Filter hanya target types
    df_filtered = df_level2[df_level2['co-benefit_type'].isin(TARGET_TYPES)].copy()
    print(f"Rows after filtering target types: {len(df_filtered)}")
    
    # Check missing mappings
    unique_sa = set(df_filtered['small_area'].astype(str).unique())
    missing_sa = unique_sa - set(sa_to_la.keys())
    if missing_sa:
        print(f"WARNING: {len(missing_sa)} small_area tidak memiliki mapping ke local_authority")
        print(f"Sample missing: {list(missing_sa)[:10]}")
    
    # Aggregate data
    print("Aggregating data by local_authority...")
    records = []
    missing_count = 0
    
    for _, row in df_filtered.iterrows():
        sa = str(row['small_area']) if pd.notna(row['small_area']) else None
        benefit_type = row['co-benefit_type']
        
        if not sa:
            continue
        
        la = sa_to_la.get(sa)
        if not la:
            missing_count += 1
            continue
        
        # Extract values for each year
        for year in YEARS:
            if year in df_level2.columns:
                value = row[year]
                if pd.notna(value) and value != "":
                    try:
                        value_float = float(value)
                        records.append({
                            'local_authority': la,
                            'nation': 'Eng/Wales',  # Default, bisa disesuaikan
                            'year': year,
                            'co_benefit_type': benefit_type,
                            'value_total': value_float
                        })
                    except (ValueError, TypeError):
                        pass
    
    print(f"Missing mappings: {missing_count} rows skipped")
    print(f"Total records created: {len(records)}")
    
    # Create DataFrame
    df_result = pd.DataFrame(records)
    
    # Group by local_authority, year, co_benefit_type and sum
    print("Grouping and summing values...")
    df_result = df_result.groupby(['local_authority', 'nation', 'year', 'co_benefit_type'], as_index=False)['value_total'].sum()
    
    print(f"Final records: {len(df_result)}")
    print(f"Unique local_authorities: {df_result['local_authority'].nunique()}")
    
    return df_result

def main():
    """Main processing function"""
    print("=" * 60)
    print("Data Reprocessing Script")
    print("=" * 60)
    
    try:
        # Load lookup map
        sa_to_la = load_lookup_map()
        
        # Process Level_2 data
        df_result = process_level2_data(sa_to_la)
        
        # Save to Excel
        print(f"\nSaving to {OUTPUT_FILE}...")
        OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
        
        with pd.ExcelWriter(OUTPUT_FILE, engine='openpyxl') as writer:
            df_result.to_excel(writer, sheet_name='normalized', index=False)
        
        print(f"Successfully saved {len(df_result)} records to {OUTPUT_FILE}")
        print(f"Unique local_authorities: {df_result['local_authority'].nunique()}")
        print(f"Years covered: {df_result['year'].min()} - {df_result['year'].max()}")
        print(f"Benefit types: {sorted(df_result['co_benefit_type'].unique())}")
        
    except Exception as e:
        print(f"ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == '__main__':
    exit(main())

