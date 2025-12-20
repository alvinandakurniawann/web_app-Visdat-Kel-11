"""
Script untuk memeriksa coverage data terhadap GeoJSON
Mencari wilayah yang ada di GeoJSON tapi tidak ada di data
"""
import pandas as pd
import json
import re
from pathlib import Path
import sys

# Add parent directory to path
BASE_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(BASE_DIR))

from models.data_normalizer import DataNormalizer

DATA_FILE = BASE_DIR / 'data' / 'hasil_normalisasi_kel11.xlsx'
GEOJSON_FILE = BASE_DIR / 'data' / 'lad.geojson'

def main():
    print("=" * 60)
    print("Data Coverage Check")
    print("=" * 60)
    
    # Load data
    print("\nLoading data files...")
    df = pd.read_excel(DATA_FILE, sheet_name='normalized')
    with open(GEOJSON_FILE, 'r', encoding='utf-8') as f:
        geojson = json.load(f)
    
    # Get unique local authorities from data
    data_la = set(df['local_authority'].unique())
    print(f"\nData file:")
    print(f"  Total records: {len(df)}")
    print(f"  Unique local_authorities: {len(data_la)}")
    
    # Get features from GeoJSON
    features = geojson.get('features', [])
    print(f"\nGeoJSON file:")
    print(f"  Total features: {len(features)}")
    
    # Find matching property
    normalizer = DataNormalizer()
    matching_prop = normalizer.find_matching_property(geojson, list(data_la))
    
    if not matching_prop:
        print("\nERROR: Tidak dapat menemukan property yang cocok di GeoJSON")
        return
    
    print(f"  Matching property: {matching_prop}")
    
    # Get all names from GeoJSON
    geo_names = []
    for feat in features:
        props = feat.get('properties', {})
        name = props.get(matching_prop)
        if name:
            geo_names.append(name)
    
    geo_names_set = set(geo_names)
    print(f"  Unique names in GeoJSON: {len(geo_names_set)}")
    
    # Normalize names for comparison
    data_la_norm = {normalizer.normalize_name(la) for la in data_la}
    geo_names_norm = {normalizer.normalize_name(name) for name in geo_names_set}
    
    # Find matches
    matches = data_la_norm & geo_names_norm
    missing_in_data = geo_names_norm - data_la_norm
    missing_in_geo = data_la_norm - geo_names_norm
    
    print(f"\nMatching results:")
    print(f"  Matched: {len(matches)}")
    print(f"  Missing in data (ada di GeoJSON tapi tidak ada di data): {len(missing_in_data)}")
    print(f"  Missing in GeoJSON (ada di data tapi tidak ada di GeoJSON): {len(missing_in_geo)}")
    
    if missing_in_data:
        print(f"\nWilayah yang ada di GeoJSON tapi TIDAK ada di data ({len(missing_in_data)}):")
        # Find original names
        missing_original = []
        for geo_norm in list(missing_in_data)[:20]:  # Show first 20
            for name in geo_names_set:
                if normalizer.normalize_name(name) == geo_norm:
                    missing_original.append(name)
                    break
        for name in sorted(missing_original)[:20]:
            print(f"  - {name}")
        if len(missing_in_data) > 20:
            print(f"  ... dan {len(missing_in_data) - 20} lainnya")
    
    if missing_in_geo:
        print(f"\nWilayah yang ada di data tapi TIDAK ada di GeoJSON ({len(missing_in_geo)}):")
        missing_original = []
        for la_norm in list(missing_in_geo)[:20]:
            for la in data_la:
                if normalizer.normalize_name(la) == la_norm:
                    missing_original.append(la)
                    break
        for name in sorted(missing_original)[:20]:
            print(f"  - {name}")
        if len(missing_in_geo) > 20:
            print(f"  ... dan {len(missing_in_geo) - 20} lainnya")
    
    print(f"\nCoverage: {len(matches)}/{len(geo_names_set)} ({100*len(matches)/len(geo_names_set):.1f}%)")

if __name__ == '__main__':
    main()

