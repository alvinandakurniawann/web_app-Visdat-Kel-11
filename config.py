"""
Configuration file untuk aplikasi
Mengatur semua konfigurasi aplikasi
"""
import os
from pathlib import Path

class Config:
    """Base configuration"""
    # Flask configuration
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    DEBUG = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    
    # Base directory
    BASE_DIR = Path(__file__).parent.parent
    
    # Data paths
    DATA_DIR = BASE_DIR / 'Web version'
    EXCEL_FILE = DATA_DIR / 'hasil_normalisasi_kel11.xlsx'
    GEOJSON_FILE = BASE_DIR / 'lad.geojson'
    
    # Data sheet names
    DATA_SHEET = 'normalized'
    META_SHEET = 'meta'
    
    # Cache configuration
    CACHE_TIMEOUT = 3600  # 1 hour
    
    # Chart configuration
    YEARS = list(range(2025, 2051))
    BENEFIT_TYPES = {
        'physical_activity': 'Physical Activity (Benefit)',
        'air_quality': 'Air Quality (Benefit)',
        'hassle_costs': 'Hassle Costs (Cost)',
        'congestion': 'Congestion (Cost)'
    }

