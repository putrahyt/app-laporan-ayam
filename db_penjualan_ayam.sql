-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Apr 25, 2026 at 06:52 AM
-- Server version: 9.6.0
-- PHP Version: 8.3.16

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_penjualan_ayam`
--

-- --------------------------------------------------------

--
-- Table structure for table `kas`
--

CREATE TABLE `kas` (
  `id` int NOT NULL,
  `tanggal` date NOT NULL,
  `nominal` decimal(15,0) NOT NULL,
  `keterangan` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `tipe` enum('masuk','keluar') DEFAULT 'masuk'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `kas`
--

INSERT INTO `kas` (`id`, `tanggal`, `nominal`, `keterangan`, `created_at`, `tipe`) VALUES
(7, '2026-04-22', 3000000, 'Hasil jualan hari ini', '2026-04-22 18:04:56', 'masuk'),
(8, '2026-04-22', 1000000, 'Hasil pembelian', '2026-04-22 18:05:14', 'keluar'),
(9, '2026-04-21', 1000000, 'test', '2026-04-22 18:07:48', 'masuk'),
(10, '2026-04-22', 4000000, 'uang hasil jualan', '2026-04-22 18:15:37', 'masuk'),
(13, '2026-04-22', 1000000, 'Uang jajan', '2026-04-22 18:56:19', 'masuk');

-- --------------------------------------------------------

--
-- Table structure for table `master_item`
--

CREATE TABLE `master_item` (
  `id` int NOT NULL,
  `nama` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `master_item`
--

INSERT INTO `master_item` (`id`, `nama`, `created_at`) VALUES
(1, 'Ayam', '2026-04-19 01:01:37'),
(2, 'Ceker Ayam', '2026-04-19 01:01:37'),
(3, 'Kepala Ayam', '2026-04-19 01:01:37'),
(4, 'Drambon', '2026-04-19 01:01:37'),
(5, 'Takbone', '2026-04-19 01:01:37'),
(6, 'Sayap', '2026-04-19 01:01:37'),
(7, 'Leher', '2026-04-19 01:01:37'),
(8, 'Kepala Leher', '2026-04-19 01:01:37'),
(9, 'Hati', '2026-04-19 01:01:37'),
(10, 'Rangka', '2026-04-19 01:01:37'),
(11, 'Hati Ampela Usus', '2026-04-19 01:01:37'),
(12, 'Ayam Hidup', '2026-04-19 01:01:37'),
(17, 'Coba', '2026-04-22 11:20:15'),
(18, 'Lagi', '2026-04-22 11:27:23'),
(19, 'Test', '2026-04-25 06:50:06');

-- --------------------------------------------------------

--
-- Table structure for table `master_satuan`
--

CREATE TABLE `master_satuan` (
  `id` int NOT NULL,
  `nama` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `master_satuan`
--

INSERT INTO `master_satuan` (`id`, `nama`, `created_at`) VALUES
(1, 'Kg', '2026-04-19 01:01:45'),
(2, 'Bks', '2026-04-19 01:01:45'),
(3, 'Pcs', '2026-04-19 01:01:45'),
(4, 'Kotak', '2026-04-19 01:01:45');

-- --------------------------------------------------------

--
-- Table structure for table `pembelian`
--

CREATE TABLE `pembelian` (
  `id` int NOT NULL,
  `tanggal` date NOT NULL,
  `nama` varchar(100) NOT NULL,
  `items_detail` text,
  `jumlah_item` decimal(10,2) DEFAULT '0.00',
  `harga` decimal(15,2) DEFAULT '0.00',
  `total` decimal(15,2) DEFAULT '0.00',
  `status` varchar(50) DEFAULT 'Sudah Dibayar',
  `catatan` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `harga_kotak` decimal(15,2) DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `pembelian`
--

INSERT INTO `pembelian` (`id`, `tanggal`, `nama`, `items_detail`, `jumlah_item`, `harga`, `total`, `status`, `catatan`, `created_at`, `harga_kotak`) VALUES
(2, '2026-04-22', 'PT. Ayam', '[{\"tipe\":\"item\",\"nama\":\"Ayam\",\"jumlah\":\"30\",\"satuan\":\"Kg\",\"harga\":\"33000\"},{\"tipe\":\"item\",\"nama\":\"Ceker Ayam\",\"jumlah\":\"10\",\"satuan\":\"Kg\",\"harga\":\"20000\"}]', 40.00, 0.00, 1190000.00, 'Sudah Dibayar', 'GG', '2026-04-22 10:21:35', 30000.00),
(4, '2026-04-22', 'ss', '[{\"tipe\":\"item\",\"nama\":\"Ayam\",\"jumlah\":\"30\",\"satuan\":\"Kg\",\"harga\":\"30000\"},{\"tipe\":\"item\",\"nama\":\"Kepala Leher\",\"jumlah\":\"50\",\"satuan\":\"Kg\",\"harga\":\"30000\"},{\"tipe\":\"item\",\"nama\":\"Drambon\",\"jumlah\":\"10\",\"satuan\":\"Pcs\",\"harga\":\"3000\"},{\"tipe\":\"item\",\"nama\":\"Sayap\",\"jumlah\":\"40\",\"satuan\":\"Kg\",\"harga\":\"40000\"}]', 130.00, 0.00, 4030000.00, 'Sudah Dibayar', 'hhh', '2026-04-22 11:44:33', 0.00),
(6, '2026-04-22', 'zzz', '[{\"tipe\":\"kotak\",\"nama\":\"Kotak Isi (Ayam Hidup)\",\"jumlah\":\"10.5\"},{\"tipe\":\"kotak\",\"nama\":\"Kotak Isi (Ayam Hidup)\",\"jumlah\":\"20.4\"},{\"tipe\":\"kotak\",\"nama\":\"Kotak Kosong\",\"jumlah\":\"10\"}]', 20.90, 0.00, 627000.00, 'Belum Dibayar', '', '2026-04-22 11:49:09', 30000.00),
(7, '2026-04-22', 'mmm', '[{\"tipe\":\"item\",\"nama\":\"Ayam Hidup\",\"jumlah\":\"40\",\"satuan\":\"Kg\",\"harga\":\"50000\"},{\"tipe\":\"item\",\"nama\":\"Ayam Hidup\",\"jumlah\":\"19\",\"satuan\":\"Kg\",\"harga\":\"30000\"},{\"tipe\":\"kotak\",\"nama\":\"Kotak Isi (Ayam Hidup)\",\"jumlah\":\"30.5\"},{\"tipe\":\"kotak\",\"nama\":\"Kotak Kosong\",\"jumlah\":\"10.45\"}]', 79.05, 0.00, 3171500.00, 'Sudah Dibayar', '', '2026-04-22 11:50:15', 30000.00);

-- --------------------------------------------------------

--
-- Table structure for table `penjualan`
--

CREATE TABLE `penjualan` (
  `id` int NOT NULL,
  `tanggal` date NOT NULL,
  `nama` varchar(100) NOT NULL,
  `items_detail` text,
  `jumlah_item` decimal(10,2) DEFAULT '0.00',
  `harga` decimal(15,2) DEFAULT '0.00',
  `total` decimal(15,2) DEFAULT '0.00',
  `status` varchar(50) DEFAULT 'Sudah Dibayar',
  `catatan` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `harga_kotak` decimal(15,2) DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `penjualan`
--

INSERT INTO `penjualan` (`id`, `tanggal`, `nama`, `items_detail`, `jumlah_item`, `harga`, `total`, `status`, `catatan`, `created_at`, `harga_kotak`) VALUES
(76, '2026-04-22', 'Test', '[{\"tipe\":\"item\",\"nama\":\"Ayam\",\"jumlah\":\"20\",\"satuan\":\"Kg\",\"harga\":\"30000\"}]', 20.00, 0.00, 600000.00, 'Sudah Dibayar', '', '2026-04-22 10:20:17', 0.00),
(77, '2026-04-22', 'Tasa', '[{\"tipe\":\"kotak\",\"nama\":\"Kotak Isi (Ayam Hidup)\",\"jumlah\":\"30\"},{\"tipe\":\"kotak\",\"nama\":\"Kotak Kosong\",\"jumlah\":\"10\"}]', 20.00, 0.00, 600000.00, 'Belum Dibayar', 'mantap', '2026-04-22 11:36:55', 30000.00),
(78, '2026-04-22', 'zxc', '[{\"tipe\":\"item\",\"nama\":\"Coba\",\"jumlah\":\"30\",\"satuan\":\"Pcs\",\"harga\":\"40000\"},{\"tipe\":\"kotak\",\"nama\":\"Kotak Isi (Ayam Hidup)\",\"jumlah\":\"35\"},{\"tipe\":\"kotak\",\"nama\":\"Kotak Kosong\",\"jumlah\":\"20\"}]', 45.00, 0.00, 1650000.00, 'Sudah Dibayar', '', '2026-04-22 11:38:37', 30000.00);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `kas`
--
ALTER TABLE `kas`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `master_item`
--
ALTER TABLE `master_item`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nama` (`nama`);

--
-- Indexes for table `master_satuan`
--
ALTER TABLE `master_satuan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nama` (`nama`);

--
-- Indexes for table `pembelian`
--
ALTER TABLE `pembelian`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `penjualan`
--
ALTER TABLE `penjualan`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `kas`
--
ALTER TABLE `kas`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `master_item`
--
ALTER TABLE `master_item`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `master_satuan`
--
ALTER TABLE `master_satuan`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `pembelian`
--
ALTER TABLE `pembelian`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `penjualan`
--
ALTER TABLE `penjualan`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=79;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
