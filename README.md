# 🐔 App Laporan Ayam

Aplikasi desktop untuk pencatatan dan laporan penjualan ayam harian. Dibangun dengan React + Node.js + MySQL, dikemas menjadi aplikasi desktop menggunakan Electron.

---

## 📸 Tampilan Aplikasi

### Input Penjualan
![Input Penjualan](https://github.com/user-attachments/assets/8631601b-3a33-4484-9e76-3f21012a251a)

### Data Penjualan Harian
![Data Penjualan](https://github.com/user-attachments/assets/8d03dfd4-e034-4176-8806-b2305482763e)

### Input Pembelian
![Input Pembelian](https://github.com/user-attachments/assets/d4443b6f-f8d1-4995-b8b9-3233a6c5ee89)

### Data Pembelian
![Data Pembelian](https://github.com/user-attachments/assets/24ff0ed3-83b9-4a84-a7e4-1e4ccdfb260a)

### Keuangan
![Keuangan](https://github.com/user-attachments/assets/5029c0df-e7fd-4ba7-a7c9-590f63212c47)

---

## ✨ Fitur

- **Input penjualan dan pembelian harian** — input item (nama, jumlah, satuan, harga) dan kotak (isi/kosong) dengan kalkulasi otomatis
- **Kelola master data** — tambah/hapus pilihan item dan satuan langsung dari aplikasi tanpa perlu rebuild
- **Edit data langsung di tabel** — edit jumlah item, status, dan keterangan langsung di tabel tanpa buka halaman baru
- **Filter & pencarian** — cari berdasarkan nama/keterangan, filter berdasarkan status pembayaran
- **Detail penjualan** — lihat rincian lengkap per transaksi
- **Export Excel** — export laporan harian maupun keseluruhan ke file `.xlsx`
- **Keuangan** — melihat atau menambah pemasukan dan pengeluaran dari penjualan/pembelian ayam serta hasil penghasilan harian/bulanan
- **Status pembayaran** — Sudah Dibayar / Belum Dibayar, bisa diubah langsung di tabel
- **Pagination** — data penjualan keseluruhan tampil dengan pagination

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | MySQL |
| Desktop | Electron |
| Export | ExcelJS |
| Alert | SweetAlert2 |

---

## 📋 Prasyarat

Pastikan sudah terinstall:

- [Node.js](https://nodejs.org) (versi LTS)
- [MySQL Community Server](https://dev.mysql.com/downloads/mysql/) + MySQL Workbench

---

## 🚀 Cara Menjalankan (Development)

### 1. Clone repository

```bash
git clone https://github.com/putrahyt/app-laporan-ayam.git
cd app-laporan-ayam
```

### 2. Setup Database

Buka MySQL Command Line Client atau MySQL Workbench
(Catatan: untuk settingan MySQL nya yaitu user:root dan pass:12345)

- Buat terlebih dahulu database nya dengan nama db_penjualan_ayam. Jika menggunakan MySQL Command Line Client buat seperti ini
  ```sql
  CREATE DATABASE db_penjualan_ayam;
  ```
  ```sql
  USE db_penjualan_ayam;
  ```
- setelah itu import databasenya
  ```sql
  SOURCE /gantipathkamu/db_penjualan_ayam.sql;
  ```


### 3. Setup Backend

```bash
cd backend
npm install
```

Buat file `.env` di folder `backend/`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password_mysql_kamu
DB_NAME=db_penjualan_ayam
PORT=3001
```

Jalankan backend:

```bash
node server.js
```

### 4. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

### 5. Jalankan Electron (Desktop)

```bash
cd electron
npm install
npm start
```

> Jalankan ketiga terminal secara bersamaan. Aplikasi desktop akan terbuka otomatis.

---

## 📦 Build ke .exe (Distribusi)

### 1. Build frontend

```bash
cd frontend
npm run build
```

### 2. Build Electron

```bash
cd electron
npm run build
```

File installer `.exe` akan tersedia di folder `electron/dist-build/`.

> **Catatan:** Laptop tujuan tetap perlu menginstall **MySQL** sebelum menjalankan aplikasi hasil build.

---

## ⚙️ Konfigurasi `.env`

File `.env` tidak ikut di-commit ke GitHub karena alasan keamanan. Buat file `.env` sendiri di folder `backend/` dengan isi:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password_mysql_kamu
DB_NAME=db_penjualan_ayam
PORT=3001
```

Lihat file `backend/.env.example` sebagai referensi.
