const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');
const ExcelJS = require('exceljs');

const app = express();
app.use(cors());
app.use(express.json());

// GET semua penjualan
app.get('/api/penjualan', async (req, res) => {
  const { search, dari, sampai } = req.query;
  let query = `SELECT * FROM penjualan WHERE 1=1`;
  const params = [];
  if (search) { query += ` AND (nama LIKE ? OR catatan LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
  if (dari) { query += ` AND tanggal >= ?`; params.push(dari); }
  if (sampai) { query += ` AND tanggal <= ?`; params.push(sampai); }
  query += ` ORDER BY tanggal DESC, id DESC`;
  try {
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET semua penjualan dengan pagination + filter (untuk halaman Data Penjualan)
app.get('/api/penjualan/all', async (req, res) => {
  const { search, dari, sampai, status, page = 1, limit = 15 } = req.query;
  const offset = (page - 1) * limit;

  let where = 'WHERE 1=1';
  const params = [];

  if (search) {
    where += ` AND (nama LIKE ? OR catatan LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }
  if (status) { where += ` AND status = ?`; params.push(status); }
  if (dari) { where += ` AND tanggal >= ?`; params.push(dari); }
  if (sampai) { where += ` AND tanggal <= ?`; params.push(sampai); }

  const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM penjualan ${where}`, params);
  const [[{ grandTotal }]] = await db.query(`SELECT COALESCE(SUM(total), 0) as grandTotal FROM penjualan ${where}`, params);
  const [rows] = await db.query(
    `SELECT * FROM penjualan ${where} ORDER BY tanggal DESC, id DESC LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );
  res.json({ rows, total, grandTotal: Number(grandTotal) });
});

// GET satu penjualan (untuk detail)
app.get('/api/penjualan/:id', async (req, res) => {
  const [rows] = await db.query(`SELECT * FROM penjualan WHERE id=?`, [req.params.id]);
  res.json(rows[0] || {});
});

// Export Excel semua data (dengan filter)
app.get('/api/export/semua', async (req, res) => {
  const { search, dari, sampai, status } = req.query;
  let where = 'WHERE 1=1';
  const params = [];
  if (search) { where += ` AND (nama LIKE ? OR catatan LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
  if (status) { where += ` AND status = ?`; params.push(status); }
  if (dari) { where += ` AND tanggal >= ?`; params.push(dari); }
  if (sampai) { where += ` AND tanggal <= ?`; params.push(sampai); }
  const [rows] = await db.query(`SELECT * FROM penjualan ${where} ORDER BY tanggal DESC, id DESC`, params);
  await generateExcel(res, rows, `data_laporan.xlsx`, '047857');
});

// === HELPER: Generate Excel ===
async function generateExcel(res, rows, filename, headerColor) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Laporan');

  let maxItem = 0, maxKotak = 0;
  rows.forEach(row => {
    try {
      const all = JSON.parse(row.items_detail || '[]');
      const items = all.filter(x => x.tipe !== 'kotak');
      const kotaks = all.filter(x => x.tipe === 'kotak');
      if (items.length > maxItem) maxItem = items.length;
      if (kotaks.length > maxKotak) maxKotak = kotaks.length;
    } catch {}
  });
  if (maxItem === 0) maxItem = 1;

  const columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'Tanggal', key: 'tanggal', width: 14 },
    { header: 'Nama', key: 'nama', width: 22 },
  ];
  for (let i = 0; i < maxItem; i++) {
    columns.push({ header: `Item ${i+1}`, key: `item_${i}_nama`, width: 18 });
    columns.push({ header: `Jml ${i+1}`, key: `item_${i}_jumlah`, width: 10 });
    columns.push({ header: `Sat ${i+1}`, key: `item_${i}_satuan`, width: 8 });
    columns.push({ header: `Hrg Item ${i+1}`, key: `item_${i}_harga`, width: 15 });
    columns.push({ header: `Subtotal ${i+1}`, key: `item_${i}_sub`, width: 16 });
  }
  for (let i = 0; i < maxKotak; i++) {
    columns.push({ header: `Kotak ${i+1}`, key: `kotak_${i}_nama`, width: 22 });
    columns.push({ header: `Jml Kotak ${i+1}`, key: `kotak_${i}_jumlah`, width: 13 });
  }
  if (maxKotak > 0) {
    columns.push({ header: 'Harga Kotak', key: 'harga_kotak', width: 18 });
    columns.push({ header: 'Net Kotak', key: 'net_kotak', width: 12 });
    columns.push({ header: 'Total Harga Kotak (Rp)', key: 'total_kotak', width: 18 });
  }
  columns.push(
    { header: 'Total Harga Item (Rp)', key: 'total_item', width: 18 },
    { header: 'Jml Keseluruhan Item', key: 'jumlah_item', width: 12 },
    { header: 'Total Keseluruhan Harga (Rp)', key: 'total', width: 22 },
    { header: 'Status', key: 'status', width: 16 },
    { header: 'Keterangan', key: 'keterangan', width: 28 },
  );
  sheet.columns = columns;

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + headerColor } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  headerRow.height = 32;

  let grandJumlahItem = 0, grandTotal = 0;

  rows.forEach((row, i) => {
    let allItems = [];
    try { allItems = JSON.parse(row.items_detail || '[]'); } catch {}

    const items = allItems.filter(x => x.tipe !== 'kotak');
    const kotaks = allItems.filter(x => x.tipe === 'kotak');
    const hargaKotak = Number(row.harga_kotak) || 0;
    const netKotak = kotaks.reduce((s, k) => {
      const v = Number(k.jumlah) || 0;
      return k.nama === 'Kotak Kosong' ? s - v : s + v;
    }, 0);
    const totalKotak = netKotak * hargaKotak;
    const totalItem = items.reduce((s, it) => s + (Number(it.jumlah) || 0) * (Number(it.harga) || 0), 0);

    const rowData = {
      no: i + 1,
      tanggal: new Date(row.tanggal).toLocaleDateString('id-ID'),
      nama: row.nama,
      jumlah_item: Number(row.jumlah_item),
      total_item: totalItem,
      total: Number(row.total),
      status: row.status,
      keterangan: row.catatan || '-',
    };

    if (maxKotak > 0) {
      rowData.harga_kotak = hargaKotak || '-';
      rowData.net_kotak = netKotak || '-';
      rowData.total_kotak = totalKotak;
    }

    for (let j = 0; j < maxItem; j++) {
      const it = items[j];
      rowData[`item_${j}_nama`] = it?.nama || '-';
      rowData[`item_${j}_jumlah`] = it ? Number(it.jumlah) : '-';
      rowData[`item_${j}_satuan`] = it?.satuan || '-';
      rowData[`item_${j}_harga`] = it ? Number(it.harga) : '-';
      rowData[`item_${j}_sub`] = it ? (Number(it.jumlah) || 0) * (Number(it.harga) || 0) : 0;
    }

    for (let j = 0; j < maxKotak; j++) {
      const k = kotaks[j];
      rowData[`kotak_${j}_nama`] = k?.nama || '-';
      rowData[`kotak_${j}_jumlah`] = k ? Number(k.jumlah) : '-';
    }

    const excelRow = sheet.addRow(rowData);
    excelRow.alignment = { vertical: 'middle' };
    excelRow.height = 22;

    ['total_item', 'total', 'total_kotak'].forEach(key => {
      if (rowData[key] !== undefined && typeof rowData[key] === 'number') {
        excelRow.getCell(key).numFmt = '#,##0';
      }
    });
    for (let j = 0; j < maxItem; j++) {
      if (typeof rowData[`item_${j}_harga`] === 'number') excelRow.getCell(`item_${j}_harga`).numFmt = '#,##0';
      if (typeof rowData[`item_${j}_sub`] === 'number') excelRow.getCell(`item_${j}_sub`).numFmt = '#,##0';
    }

    const statusCell = excelRow.getCell('status');
    if (row.status === 'Sudah Dibayar') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
      statusCell.font = { color: { argb: 'FF065F46' }, bold: true };
    } else {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
      statusCell.font = { color: { argb: 'FF991B1B' }, bold: true };
    }

    if (i % 2 === 1) {
      excelRow.eachCell(cell => {
        if (!cell.fill || !cell.fill.fgColor) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        }
      });
    }

    grandJumlahItem += Number(row.jumlah_item);
    grandTotal += Number(row.total);
  });

  const totalRow = sheet.addRow({
    no: '', tanggal: '', nama: 'GRAND TOTAL',
    jumlah_item: grandJumlahItem,
    total: grandTotal,
    status: `${rows.length} transaksi`,
    keterangan: '',
  });
  totalRow.font = { bold: true, size: 12 };
  totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
  totalRow.getCell('total').numFmt = '#,##0';
  totalRow.height = 26;

  sheet.eachRow(row => {
    row.eachCell(cell => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  await workbook.xlsx.write(res);
  res.end();
}

// POST tambah penjualan baru
app.post('/api/penjualan', async (req, res) => {
  const { tanggal, nama, items_detail, jumlah_item, harga, harga_kotak, total, status, catatan } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO penjualan (tanggal, nama, items_detail, jumlah_item, harga, harga_kotak, total, status, catatan) VALUES (?,?,?,?,?,?,?,?,?)`,
      [tanggal, nama, items_detail, jumlah_item, harga || 0, harga_kotak || 0, total, status, catatan || '']
    );
    res.json({ id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH update status atau catatan saja
app.patch('/api/penjualan/:id', async (req, res) => {
  const fields = Object.keys(req.body).map(k => `${k}=?`).join(', ');
  const values = [...Object.values(req.body), req.params.id];
  await db.query(`UPDATE penjualan SET ${fields} WHERE id=?`, values);
  res.json({ message: 'Updated' });
});

// DELETE
app.delete('/api/penjualan/:id', async (req, res) => {
  await db.query(`DELETE FROM penjualan WHERE id=?`, [req.params.id]);
  res.json({ message: 'Deleted' });
});

// === GET semua customers ===
app.get('/api/customers', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM customers ORDER BY nama');
  res.json(rows);
});

// === GET semua items ===
app.get('/api/items', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM items ORDER BY nama_item');
  res.json(rows);
});

// === EXPORT EXCEL harian ===
app.get('/api/export/harian', async (req, res) => {
  const { tanggal } = req.query;
  const [rows] = await db.query(`SELECT * FROM penjualan WHERE tanggal = ? ORDER BY id`, [tanggal]);
  await generateExcel(res, rows, `laporan-harian-${tanggal}.xlsx`, '1D4ED8');
});

// === EXPORT EXCEL bulanan ===
app.get('/api/export/bulanan', async (req, res) => {
  const { bulan, tahun } = req.query;
  const [rows] = await db.query(`
    SELECT p.*, c.nama as nama_customer, i.nama_item
    FROM penjualan p
    LEFT JOIN customers c ON p.customer_id = c.id
    LEFT JOIN items i ON p.item_id = i.id
    WHERE MONTH(p.tanggal) = ? AND YEAR(p.tanggal) = ?
    ORDER BY p.tanggal, p.id
  `, [bulan, tahun]);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Laporan Bulanan');

  sheet.columns = [
    { header: 'Tanggal', key: 'tanggal', width: 14 },
    { header: 'Nama', key: 'nama_customer', width: 20 },
    { header: 'Item', key: 'nama_item', width: 25 },
    { header: 'Kilo', key: 'kilo', width: 10 },
    { header: 'Kotak (Isi)', key: 'kotak_isi', width: 12 },
    { header: 'Kotak (Kosong)', key: 'kotak_kosong', width: 15 },
    { header: 'Harga', key: 'harga', width: 15 },
    { header: 'Total', key: 'total', width: 18 },
    { header: 'Status', key: 'status', width: 10 },
    { header: 'Keterangan', key: 'keterangan', width: 25 },
  ];

  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047857' } };

  rows.forEach((row, i) => {
    sheet.addRow({ ...row, no: i + 1 });
  });

  const grandTotal = rows.reduce((s, r) => s + Number(r.total), 0);
  const totalRow = sheet.addRow({ tanggal: 'GRAND TOTAL', total: grandTotal });
  totalRow.font = { bold: true };

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=laporan-bulan-${bulan}-${tahun}.xlsx`);
  await workbook.xlsx.write(res);
  res.end();
});

// === MASTER ITEM ===
app.get('/api/master-item', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM master_item ORDER BY nama');
  res.json(rows);
});

app.post('/api/master-item', async (req, res) => {
  const { nama } = req.body;
  if (!nama?.trim()) return res.status(400).json({ error: 'Nama wajib diisi' });
  try {
    const [result] = await db.query('INSERT INTO master_item (nama) VALUES (?)', [nama.trim()]);
    res.json({ id: result.insertId, nama: nama.trim() });
  } catch { res.status(400).json({ error: 'Nama item sudah ada' }); }
});

app.delete('/api/master-item/:id', async (req, res) => {
  await db.query('DELETE FROM master_item WHERE id=?', [req.params.id]);
  res.json({ message: 'Deleted' });
});

// === MASTER SATUAN ===
app.get('/api/master-satuan', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM master_satuan ORDER BY nama');
  res.json(rows);
});

app.post('/api/master-satuan', async (req, res) => {
  const { nama } = req.body;
  if (!nama?.trim()) return res.status(400).json({ error: 'Nama wajib diisi' });
  try {
    const [result] = await db.query('INSERT INTO master_satuan (nama) VALUES (?)', [nama.trim()]);
    res.json({ id: result.insertId, nama: nama.trim() });
  } catch { res.status(400).json({ error: 'Nama satuan sudah ada' }); }
});

app.delete('/api/master-satuan/:id', async (req, res) => {
  await db.query('DELETE FROM master_satuan WHERE id=?', [req.params.id]);
  res.json({ message: 'Deleted' });
});


// === KAS MASUK ===

// GET - total keseluruhan (kas manual + semua penjualan)
app.get('/api/kas/total', async (req, res) => {
  try {
    const [[{ totalKas }]] = await db.query('SELECT COALESCE(SUM(nominal), 0) as totalKas FROM kas');
    const [[{ totalPenjualan }]] = await db.query('SELECT COALESCE(SUM(total), 0) as totalPenjualan FROM penjualan');
    res.json({ total: Number(totalKas) + Number(totalPenjualan) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET - semua data kas dengan pagination + filter (untuk tabel laporan)
app.get('/api/kas/all', async (req, res) => {
  const { search, dari, sampai, page = 1, limit = 15 } = req.query;
  const offset = (page - 1) * limit;
  const params = [];
  const paramsPenjualan = [];

  let whereKas = 'WHERE 1=1';
  let wherePenjualan = 'WHERE 1=1';

  if (dari) {
    whereKas += ' AND tanggal >= ?'; params.push(dari);
    wherePenjualan += ' AND tanggal >= ?'; paramsPenjualan.push(dari);
  }
  if (sampai) {
    whereKas += ' AND tanggal <= ?'; params.push(sampai);
    wherePenjualan += ' AND tanggal <= ?'; paramsPenjualan.push(sampai);
  }
  if (search) {
    whereKas += ' AND keterangan LIKE ?'; params.push(`%${search}%`);
    wherePenjualan += ' AND CONCAT(\'Penjualan ayam tanggal \', DATE_FORMAT(tanggal, \'%d/%m/%Y\')) LIKE ?';
    paramsPenjualan.push(`%${search}%`);
  }

  try {
    const [kasRows] = await db.query(
      `SELECT id, tanggal, nominal, keterangan, 'kas' as sumber FROM kas ${whereKas}`,
      params
    );
    const [penjualanRows] = await db.query(
      `SELECT NULL as id, tanggal, SUM(total) as nominal,
        CONCAT('Penjualan ayam tanggal ', DATE_FORMAT(tanggal, '%d/%m/%Y')) as keterangan,
        'penjualan' as sumber
      FROM penjualan ${wherePenjualan}
      GROUP BY tanggal`,
      paramsPenjualan
    );

    const semua = [...kasRows, ...penjualanRows].sort((a, b) => {
      if (b.tanggal > a.tanggal) return 1;
      if (b.tanggal < a.tanggal) return -1;
      return a.sumber === 'kas' ? -1 : 1;
    });

    const total = semua.length;
    const grandTotal = semua.reduce((s, r) => s + Number(r.nominal), 0);
    const rows = semua.slice(Number(offset), Number(offset) + Number(limit));
    res.json({ rows, total, grandTotal });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET - ambil data kas (kas manual + penjualan ayam) dengan filter tanggal
app.get('/api/kas', async (req, res) => {
  const { dari, sampai } = req.query;
  const params = [];
  const paramsPenjualan = [];

  let whereKas = 'WHERE 1=1';
  let wherePenjualan = 'WHERE 1=1';

  if (dari) {
    whereKas += ' AND tanggal >= ?'; params.push(dari);
    wherePenjualan += ' AND tanggal >= ?'; paramsPenjualan.push(dari);
  }
  if (sampai) {
    whereKas += ' AND tanggal <= ?'; params.push(sampai);
    wherePenjualan += ' AND tanggal <= ?'; paramsPenjualan.push(sampai);
  }

  try {
    // Ambil data kas manual
    const [kasRows] = await db.query(
      `SELECT id, tanggal, nominal, keterangan, 'kas' as sumber FROM kas ${whereKas} ORDER BY tanggal DESC, id DESC`,
      params
    );

    // Ambil total penjualan per hari dari tabel penjualan (dikelompokkan per tanggal)
    const [penjualanRows] = await db.query(
      `SELECT 
        NULL as id,
        tanggal,
        SUM(total) as nominal,
        CONCAT('Penjualan ayam tanggal ', DATE_FORMAT(tanggal, '%d/%m/%Y')) as keterangan,
        'penjualan' as sumber
      FROM penjualan
      ${wherePenjualan}
      GROUP BY tanggal
      ORDER BY tanggal DESC`,
      paramsPenjualan
    );

    // Gabungkan dan urutkan berdasarkan tanggal DESC
    const semua = [...kasRows, ...penjualanRows].sort((a, b) => {
      if (b.tanggal > a.tanggal) return 1;
      if (b.tanggal < a.tanggal) return -1;
      // kas manual di atas penjualan pada hari yang sama
      if (a.sumber === 'kas' && b.sumber === 'penjualan') return -1;
      return 1;
    });

    res.json(semua);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST - simpan kas baru
app.post('/api/kas', async (req, res) => {
  const { tanggal, nominal, keterangan } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO kas (tanggal, nominal, keterangan) VALUES (?, ?, ?)',
      [tanggal, nominal, keterangan || '']
    );
    res.json({ id: result.insertId, tanggal, nominal, keterangan });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE - hapus kas
app.delete('/api/kas/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM kas WHERE id = ?', [req.params.id]);
    res.json({ message: 'Berhasil dihapus' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(process.env.PORT, () => {
  console.log(`Server berjalan di port ${process.env.PORT}`);
});