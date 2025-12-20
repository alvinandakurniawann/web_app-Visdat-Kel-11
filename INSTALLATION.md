# Panduan Instalasi dan Menjalankan Aplikasi

## Persyaratan

- Python 3.8 atau lebih tinggi
- pip (Python package manager)

## Langkah-langkah Instalasi

### 1. Install Dependencies

```bash
cd web_app
pip install -r requirements.txt
```

### 2. Pastikan File Data Tersedia

Pastikan file-file berikut tersedia di lokasi yang benar:

- `Web version/hasil_normalisasi_kel11.xlsx` - File data Excel dengan sheet 'normalized'
- `lad.geojson` - File GeoJSON untuk peta (di root project)

Struktur folder yang diharapkan:
```
Visualisasi Data/
├── web_app/
│   ├── app.py
│   ├── run.py
│   └── ...
├── Web version/
│   └── hasil_normalisasi_kel11.xlsx
└── lad.geojson
```

### 3. Menjalankan Aplikasi

**Cara 1: Menggunakan run.py (Disarankan)**

```bash
cd web_app
python run.py
```

**Cara 2: Langsung menggunakan app.py**

```bash
cd web_app
python app.py
```

### 4. Akses Aplikasi

Buka browser dan kunjungi:
```
http://localhost:5000
```

## Troubleshooting

### Error: ModuleNotFoundError

Jika terjadi error `ModuleNotFoundError`, pastikan:
1. Semua dependencies sudah terinstall: `pip install -r requirements.txt`
2. Anda berada di direktori `web_app` saat menjalankan aplikasi

### Error: FileNotFoundError

Jika terjadi error file tidak ditemukan, pastikan:
1. File `hasil_normalisasi_kel11.xlsx` ada di folder `Web version/`
2. File `lad.geojson` ada di root project (satu level di atas `web_app/`)
3. Path relatif dari `web_app/` ke file-file tersebut benar

### Error: Port sudah digunakan

Jika port 5000 sudah digunakan, ubah port di file `run.py` atau `app.py`:
```python
app.run(debug=True, host='0.0.0.0', port=5001)  # Ganti 5000 dengan port lain
```

### Data tidak muncul di peta

1. Pastikan GeoJSON file valid
2. Periksa console browser (F12) untuk error JavaScript
3. Periksa Network tab untuk melihat apakah API endpoint mengembalikan data

## Struktur Data

### Format Excel

File Excel harus memiliki sheet `normalized` dengan kolom:
- `local_authority`: Nama Local Authority
- `nation`: Nation (e.g., Eng/Wales)
- `year`: Tahun (integer, 2025-2050)
- `co_benefit_type`: Jenis benefit/cost (physical_activity, air_quality, hassle_costs, congestion)
- `value_total`: Nilai total

### Format GeoJSON

File GeoJSON harus valid dan memiliki properties dengan nama Local Authority.
Property yang didukung:
- LAD24NM, LAD23NM, LAD22NM, dll.
- NAME, name
- lad_name, LAD_NAME

Aplikasi akan otomatis mencari property yang paling cocok dengan data Excel.

