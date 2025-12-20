#!/usr/bin/env python
"""
Run script untuk menjalankan aplikasi web
"""
from app import create_app

if __name__ == '__main__':
    app = create_app()
    print("=" * 50)
    print("Dashboard Visualisasi Data - Starting Server")
    print("=" * 50)
    print("Server akan berjalan di: http://localhost:5000")
    print("Tekan Ctrl+C untuk menghentikan server")
    print("=" * 50)
    app.run(debug=True, host='0.0.0.0', port=5000)

