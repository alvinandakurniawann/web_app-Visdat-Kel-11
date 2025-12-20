"""
Data Normalizer
Utility functions untuk normalisasi nama daerah untuk matching dengan GeoJSON
"""
import re
import pandas as pd


class DataNormalizer:
    """Class untuk normalisasi nama daerah"""
    
    @staticmethod
    def normalize_name(name):
        """
        Normalize nama daerah untuk matching dengan GeoJSON
        Menghilangkan karakter spesial dan melakukan case-insensitive matching
        """
        if not name or pd.isna(name):
            return ""
        
        # Convert to string and lowercase
        normalized = str(name).strip().lower()
        
        # Remove special characters
        normalized = re.sub(r"[''`]", "", normalized)
        normalized = normalized.replace("&", "and")
        
        # Normalize whitespace
        normalized = " ".join(normalized.split())
        
        return normalized
    
    @staticmethod
    def find_matching_property(geojson, data_names):
        """
        Find the best matching property in GeoJSON for data names
        """
        if not geojson.get('features'):
            return None
        
        # Get all property keys from first feature
        first_feature = geojson['features'][0]
        property_keys = list(first_feature.get('properties', {}).keys())
        
        # Common property names for Local Authority names
        common_keys = [
            'LAD24NM', 'LAD23NM', 'LAD22NM', 'LAD21NM', 'LAD20NM',
            'LAD19NM', 'NAME', 'name', 'lad_name', 'LAD_NAME'
        ]
        
        # Normalize data names
        normalized_data_names = {DataNormalizer.normalize_name(name) for name in data_names}
        
        best_match = None
        best_count = 0
        
        # Check common keys first
        candidates = [k for k in common_keys if k in property_keys] + \
                    [k for k in property_keys if k not in common_keys]
        
        for key in candidates[:25]:  # Limit to first 25 candidates
            geojson_names = [
                DataNormalizer.normalize_name(f.get('properties', {}).get(key))
                for f in geojson['features']
            ]
            geojson_names_set = {name for name in geojson_names if name}
            
            # Count matches
            matches = len(normalized_data_names & geojson_names_set)
            
            if matches > best_count:
                best_count = matches
                best_match = key
        
        return best_match if best_count > 0 else None

