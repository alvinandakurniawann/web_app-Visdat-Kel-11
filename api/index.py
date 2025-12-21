"""
Vercel Serverless Function Entry Point
Handler untuk Vercel serverless functions
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import Flask app
from app import app

# Export handler untuk Vercel
# Vercel akan otomatis menggunakan WSGI adapter untuk Flask app
handler = app

