"""
Data Loader Model
Menangani loading dan caching data dari Excel dan GeoJSON
"""
import pandas as pd
import json
from pathlib import Path
from functools import lru_cache
from config import Config


class DataLoader:
    """Class untuk memuat dan mengelola data"""
    
    def __init__(self):
        """Initialize data loader dengan path dari config"""
        self.config = Config
        self._data = None
        self._geojson = None
        self._meta = None
    
    @property
    def data(self):
        """Load data Excel dengan caching"""
        if self._data is None:
            self._data = self._load_excel_data()
        return self._data
    
    @property
    def geojson(self):
        """Load GeoJSON dengan caching"""
        if self._geojson is None:
            self._geojson = self._load_geojson()
        return self._geojson
    
    @property
    def meta(self):
        """Load metadata dengan caching"""
        if self._meta is None:
            self._meta = self._load_meta()
        return self._meta
    
    def _load_excel_data(self):
        """Load data dari Excel file"""
        try:
            df = pd.read_excel(
                self.config.EXCEL_FILE,
                sheet_name=self.config.DATA_SHEET
            )
            # Ensure data types
            df['year'] = df['year'].astype(int)
            df['value_total'] = df['value_total'].astype(float)
            return df
        except Exception as e:
            raise ValueError(f"Error loading Excel data: {str(e)}")
    
    def _load_geojson(self):
        """Load GeoJSON file"""
        try:
            with open(self.config.GEOJSON_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            raise ValueError(f"Error loading GeoJSON: {str(e)}")
    
    def _load_meta(self):
        """Load metadata dari Excel"""
        try:
            if self.config.META_SHEET:
                return pd.read_excel(
                    self.config.EXCEL_FILE,
                    sheet_name=self.config.META_SHEET
                )
            return None
        except Exception:
            return None
    
    def get_local_authorities(self):
        """Get list of unique local authorities"""
        return sorted(self.data['local_authority'].unique().tolist())
    
    def get_years(self):
        """Get list of available years"""
        return sorted(self.data['year'].unique().tolist())
    
    def get_benefit_types(self):
        """Get list of benefit types"""
        return sorted(self.data['co_benefit_type'].unique().tolist())
    
    def get_data_for_map(self, year, benefit_type):
        """Get data formatted for map visualization"""
        filtered = self.data[
            (self.data['year'] == year) &
            (self.data['co_benefit_type'] == benefit_type)
        ]
        
        # Group by local_authority and sum values
        aggregated = filtered.groupby('local_authority')['value_total'].sum().reset_index()
        aggregated.columns = ['local_authority', 'value']
        
        return aggregated.to_dict('records')
    
    def get_data_for_chart(self, local_authority, benefit_types=None):
        """Get time series data for a specific local authority"""
        filtered = self.data[self.data['local_authority'] == local_authority]
        
        if benefit_types:
            filtered = filtered[filtered['co_benefit_type'].isin(benefit_types)]
        
        # Group by year and benefit type
        result = filtered.groupby(['year', 'co_benefit_type'])['value_total'].sum().reset_index()
        
        return result.to_dict('records')
    
    def get_cumulative_data(self, local_authority, benefit_types=None):
        """Get cumulative data for a specific local authority"""
        data = self.get_data_for_chart(local_authority, benefit_types)
        
        # Convert to DataFrame for easier manipulation
        df = pd.DataFrame(data)
        
        # Calculate cumulative sum for each benefit type
        df['cumulative'] = df.groupby('co_benefit_type')['value_total'].cumsum()
        
        return df.to_dict('records')
    
    def calculate_break_even(self, local_authority):
        """Calculate break-even year for a local authority"""
        data = self.get_data_for_chart(local_authority)
        df = pd.DataFrame(data)
        
        # Pivot to get benefits and costs
        pivot = df.pivot_table(
            index='year',
            columns='co_benefit_type',
            values='value_total',
            aggfunc='sum'
        ).fillna(0.0)
        
        # Calculate net benefit (benefits - costs)
        benefits = pivot.get('physical_activity', 0) + pivot.get('air_quality', 0)
        costs = pivot.get('hassle_costs', 0) + pivot.get('congestion', 0)
        net = benefits - costs
        
        # Find first year where net >= 0
        for year in sorted(net.index):
            if net.loc[year] >= 0:
                return int(year)
        
        return None

