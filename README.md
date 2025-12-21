# Dashboard Visualisasi Data Interaktif

Aplikasi web untuk visualisasi dan analisis data temporal mengenai trade-off antara biaya jangka pendek dan manfaat kesehatan jangka panjang dari aksi iklim di UK. Dibangun menggunakan Flask dengan arsitektur MVC.

## Fitur Utama

**Peta Interaktif**
- Peta koroplet interaktif dengan Leaflet.js
- Pemilihan multiple parameter untuk ditampilkan di peta
- Klik pada peta untuk memilih Local Authority
- Visualisasi warna berdasarkan nilai parameter

**Analisis Temporal**
- Grafik garis tren temporal (2025-2050)
- Grafik area akumulatif
- Perhitungan tahun break-even

**Kontrol Interaktif**
- Slider untuk memilih tahun
- Checkbox untuk memilih parameter peta (multiple selection)
- Checkbox untuk memilih parameter grafik (multiple selection)
- Dropdown untuk memilih Local Authority

## Struktur Project

```
web_app-Visdat-Kel-11/
├── app.py                      # Entry point aplikasi Flask
├── run.py                      # Script untuk menjalankan aplikasi
├── config.py                   # Konfigurasi aplikasi
├── requirements.txt            # Dependencies
│
├── models/                     # Business logic
│   ├── data_loader.py          # Load data dari Excel dan GeoJSON
│   └── data_normalizer.py     # Normalisasi nama untuk matching
│
├── controllers/                # Request handling
│   ├── main_controller.py      # Controller untuk halaman utama
│   └── api_controller.py       # Controller untuk API endpoints
│
├── templates/                  # HTML templates
│   ├── base.html               # Template dasar
│   └── index.html              # Dashboard utama
│
├── static/                     # Static files
│   ├── css/
│   │   ├── style.css
│   │   └── map-legend.css
│   └── js/
│       ├── app.js
│       ├── main.js             # Event handlers dan koordinasi
│       ├── map.js              # Modul peta (Leaflet)
│       └── charts.js           # Modul grafik (Chart.js)
│
└── data/                       # Data files
    ├── hasil_normalisasi_kel11.xlsx
    └── lad.geojson
```

## Instalasi

**Prasyarat:**
- Python 3.8+
- pip

**Langkah:**

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Pastikan file data ada di folder `data/`:
   - `hasil_normalisasi_kel11.xlsx`
   - `lad.geojson`

3. Jalankan aplikasi:
```bash
python run.py
```

4. Buka browser: `http://localhost:5000`

## Cara Penggunaan

**Parameter Peta:**
- Centang checkbox untuk memilih parameter yang ingin ditampilkan
- Nilai di peta adalah jumlah dari semua parameter yang dipilih
- Default: hanya Air Quality

**Tahun:**
- Gunakan slider untuk memilih tahun
- Data akan ditampilkan hingga tahun yang dipilih

**Local Authority:**
- Pilih dari dropdown, atau
- Klik langsung pada wilayah di peta
- Gunakan tombol "Fokus" untuk zoom ke wilayah terpilih

**Parameter Grafik:**
- Centang checkbox untuk memilih parameter yang ingin ditampilkan di grafik
- Semua parameter yang dicentang akan muncul di grafik

## Teknologi

- **Backend:** Flask, Pandas, NumPy
- **Frontend:** HTML5, CSS3, JavaScript
- **Peta:** Leaflet.js
- **Grafik:** Chart.js

## API Endpoints

- `GET /api/map-data` - Data untuk peta
- `GET /api/chart-data` - Data time series
- `GET /api/cumulative-data` - Data akumulatif
- `GET /api/break-even` - Tahun break-even
- `GET /api/geojson` - Data GeoJSON
- `GET /api/local-authorities` - Daftar Local Authority

## Catatan

- Nilai di peta adalah jumlah dari semua parameter yang dipilih
- Jika tidak ada parameter dipilih, peta akan kosong
- Data mencakup 361 Local Authority di UK
- Rentang tahun: 2025-2050

## Pengembang

Kelompok 11 - Visualisasi Data
