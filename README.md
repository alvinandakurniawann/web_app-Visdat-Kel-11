# Dashboard Visualisasi Data Interaktif

Aplikasi web untuk visualisasi data interaktif menggunakan Flask dan Leaflet. Aplikasi ini dibuat dengan struktur MVC (Model-View-Controller) untuk memudahkan maintenance dan pengembangan.

## Fitur

- **Peta Interaktif**: Visualisasi choropleth map menggunakan Leaflet dengan interaksi klik untuk memilih Local Authority
- **Grafik Tren Temporal**: Grafik garis untuk menampilkan tren data dari waktu ke waktu
- **Grafik Area Akumulatif**: Visualisasi akumulasi nilai dari waktu ke waktu
- **Analisis Break-Even**: Menghitung tahun break-even untuk setiap Local Authority
- **Dashboard Interaktif**: Kontrol untuk memilih tahun, parameter, dan Local Authority

## Struktur Project

```
web_app/
├── app.py                  # Entry point aplikasi
├── config.py               # Konfigurasi aplikasi
├── models/                 # Model layer (business logic)
│   ├── data_loader.py      # Load dan proses data
│   └── data_normalizer.py  # Normalisasi nama untuk matching
├── controllers/            # Controller layer (request handling)
│   ├── main_controller.py  # Controller untuk views
│   └── api_controller.py   # Controller untuk API endpoints
├── templates/              # View layer (HTML templates)
│   ├── base.html           # Base template
│   └── index.html          # Main dashboard page
└── static/                 # Static files
    ├── css/                # Stylesheet
    │   ├── style.css
    │   └── map-legend.css
    └── js/                 # JavaScript
        ├── app.js
        ├── main.js
        ├── map.js          # Map module (Leaflet)
        └── charts.js       # Charts module (Chart.js)
```

## Instalasi

1. **Install dependencies:**

```bash
cd web_app
pip install -r requirements.txt
```

2. **Pastikan file data tersedia:**
   - `Web version/hasil_normalisasi_kel11.xlsx`
   - `lad.geojson` (di root project)

3. **Jalankan aplikasi:**

```bash
python app.py
```

4. **Buka browser:**
   - Buka `http://localhost:5000`

## Penggunaan

1. **Pilih Tahun**: Gunakan slider untuk memilih tahun yang ingin ditampilkan
2. **Pilih Parameter Peta**: Pilih parameter yang ingin ditampilkan di peta (Physical Activity, Air Quality, Hassle Costs, atau Congestion)
3. **Pilih Local Authority**: Pilih Local Authority dari dropdown atau klik langsung pada peta
4. **Pilih Parameter Grafik**: Centang/uncentang checkbox untuk menampilkan/menyembunyikan parameter tertentu di grafik

## Teknologi

- **Backend**: Flask (Python)
- **Frontend**: HTML, CSS, JavaScript
- **Peta**: Leaflet.js
- **Grafik**: Chart.js
- **Data Processing**: Pandas, NumPy

## Konsep MVC

- **Model**: `models/` - Menangani data loading, processing, dan business logic
- **View**: `templates/` dan `static/` - Menangani presentasi dan UI
- **Controller**: `controllers/` - Menangani request dari user dan koordinasi antara Model dan View

## Clean Code Principles

- Separation of Concerns: Setiap modul memiliki tanggung jawab yang jelas
- DRY (Don't Repeat Yourself): Reusable functions dan classes
- Single Responsibility: Setiap class/function hanya melakukan satu hal
- Naming Conventions: Nama yang jelas dan deskriptif
- Comments: Dokumentasi yang cukup untuk menjelaskan logic penting

## Lisensi

Proyek ini dibuat untuk keperluan akademik.

