"""
Script untuk menambahkan data dengan nilai 0 untuk wilayah yang ada di GeoJSON
tapi tidak ada di data, sehingga peta tidak blank
"""
import pandas as pd
import json
from pathlib import Path
import sys

BASE_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(BASE_DIR))

from models.data_normalizer import DataNormalizer

DATA_FILE = BASE_DIR / 'data' / 'hasil_normalisasi_kel11.xlsx'
GEOJSON_FILE = BASE_DIR / 'data' / 'lad.geojson'
OUTPUT_FILE = BASE_DIR / 'data' / 'hasil_normalisasi_kel11.xlsx'

def main():
    print("=" * 60)
    print("Add Missing Regions Script")
    print("=" * 60)
    
    # Load data
    print("\nLoading data files...")
    df = pd.read_excel(DATA_FILE, sheet_name='normalized')
    with open(GEOJSON_FILE, 'r', encoding='utf-8') as f:
        geojson = json.load(f)
    
    # Get unique local authorities from data
    data_la = set(df['local_authority'].unique())
    
    # Get features from GeoJSON
    features = geojson.get('features', [])
    
    # Find matching property
    normalizer = DataNormalizer()
    matching_prop = normalizer.find_matching_property(geojson, list(data_la))
    
    if not matching_prop:
        print("ERROR: Tidak dapat menemukan property yang cocok di GeoJSON")
        return 1
    
    print(f"Matching property: {matching_prop}")
    
    # Get all names from GeoJSON
    geo_names = []
    for feat in features:
        props = feat.get('properties', {})
        name = props.get(matching_prop)
        if name:
            geo_names.append(name)
    
    geo_names_set = set(geo_names)
    
    # Normalize names for comparison
    data_la_norm = {normalizer.normalize_name(la): la for la in data_la}
    geo_names_norm = {normalizer.normalize_name(name): name for name in geo_names_set}
    
    # Find missing regions
    missing_in_data = geo_names_norm.keys() - data_la_norm.keys()
    
    if not missing_in_data:
        print("\nSemua wilayah sudah ada di data!")
        return 0
    
    print(f"\nMenambahkan {len(missing_in_data)} wilayah yang hilang...")
    
    # Get years and benefit types from existing data
    years = sorted(df['year'].unique())
    benefit_types = sorted(df['co_benefit_type'].unique())
    nation = df['nation'].iloc[0] if len(df) > 0 else 'Eng/Wales'
    
    # Create records for missing regions with value 0
    new_records = []
    for geo_norm in missing_in_data:
        geo_name = geo_names_norm[geo_norm]
        for year in years:
            for benefit_type in benefit_types:
                new_records.append({
                    'local_authority': geo_name,
                    'nation': nation,
                    'year': year,
                    'co_benefit_type': benefit_type,
                    'value_total': 0.0
                })
    
    print(f"Menambahkan {len(new_records)} records baru (nilai 0)")
    
    # Create DataFrame for new records
    df_new = pd.DataFrame(new_records)
    
    # Combine with existing data
    df_combined = pd.concat([df, df_new], ignore_index=True)
    
    # Save to Excel
    print(f"\nMenyimpan ke {OUTPUT_FILE}...")
    with pd.ExcelWriter(OUTPUT_FILE, engine='openpyxl') as writer:
        df_combined.to_excel(writer, sheet_name='normalized', index=False)
    
    print(f"Successfully saved {len(df_combined)} records")
    print(f"Unique local_authorities: {df_combined['local_authority'].nunique()}")
    print(f"Coverage: {len(geo_names_set)}/{len(geo_names_set)} (100%)")
    
    return 0

if __name__ == '__main__':
    exit(main())


