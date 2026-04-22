import { useState, useEffect } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import Swal from 'sweetalert2';

const API = 'http://localhost:3001/api';
const PER_PAGE = 15;

export default function Kas() {
  // Form pemasukan
  const [formMasuk, setFormMasuk] = useState({ tanggal: dayjs().format('YYYY-MM-DD'), nominal: '', keterangan: '' });
  // Form pengeluaran
  const [formKeluar, setFormKeluar] = useState({ tanggal: dayjs().format('YYYY-MM-DD'), nominal: '', keterangan: '' });
  const [msgMasuk, setMsgMasuk] = useState('');
  const [msgKeluar, setMsgKeluar] = useState('');

  // Card summary harian
  const [pemasukanHariIni, setPemasukanHariIni] = useState(0);
  const [pengeluaranHariIni, setPengeluaranHariIni] = useState(0);
  // Card summary bulanan
  const [pemasukanBulanIni, setPemasukanBulanIni] = useState(0);
  const [pengeluaranBulanIni, setPengeluaranBulanIni] = useState(0);

  // Tabel laporan
  const [data, setData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dari, setDari] = useState('');
  const [sampai, setSampai] = useState('');
  const [bulanFilter, setBulanFilter] = useState('');
  const [totalFilterMasuk, setTotalFilterMasuk] = useState(0);
  const [totalFilterKeluar, setTotalFilterKeluar] = useState(0);

  useEffect(() => { loadSummary(); }, []);
  useEffect(() => { loadData(); }, [page]);
  useEffect(() => { setPage(1); loadData(1); }, [bulanFilter]);

  const loadSummary = async () => {
    const today = dayjs().format('YYYY-MM-DD');
    const bulanDari = dayjs().startOf('month').format('YYYY-MM-DD');
    const bulanSampai = dayjs().endOf('month').format('YYYY-MM-DD');
    try {
      const [rHariMasuk, rHariKeluar, rBulanMasuk, rBulanKeluar] = await Promise.all([
        axios.get(`${API}/kas/summary?dari=${today}&sampai=${today}&tipe=masuk`),
        axios.get(`${API}/kas/summary?dari=${today}&sampai=${today}&tipe=keluar`),
        axios.get(`${API}/kas/summary?dari=${bulanDari}&sampai=${bulanSampai}&tipe=masuk`),
        axios.get(`${API}/kas/summary?dari=${bulanDari}&sampai=${bulanSampai}&tipe=keluar`),
      ]);
      setPemasukanHariIni(rHariMasuk.data.total || 0);
      setPengeluaranHariIni(rHariKeluar.data.total || 0);
      setPemasukanBulanIni(rBulanMasuk.data.total || 0);
      setPengeluaranBulanIni(rBulanKeluar.data.total || 0);
    } catch {}
  };

  const loadData = async (overridePage) => {
    setLoading(true);
    try {
      let dariParam = dari;
      let sampaiParam = sampai;
      if (bulanFilter) {
        dariParam = dayjs(bulanFilter + '-01').format('YYYY-MM-DD');
        sampaiParam = dayjs(bulanFilter + '-01').endOf('month').format('YYYY-MM-DD');
      }
      const params = new URLSearchParams({
        page: overridePage || page, limit: PER_PAGE,
        ...(search && { search }),
        ...(dariParam && { dari: dariParam }),
        ...(sampaiParam && { sampai: sampaiParam }),
      });
      const res = await axios.get(`${API}/kas/all?${params}`);
      setData(res.data.rows || []);
      setTotalRows(res.data.total || 0);
      setTotalFilterMasuk(res.data.grandTotalMasuk || 0);
      setTotalFilterKeluar(res.data.grandTotalKeluar || 0);
    } catch { setData([]); setTotalRows(0); }
    setLoading(false);
  };

  const handleCari = () => { setPage(1); loadData(1); };
  const handleReset = () => {
    setSearch(''); setDari(''); setSampai(''); setBulanFilter('');
    setPage(1); setTimeout(() => loadData(1), 50);
  };

  const totalPages = Math.ceil(totalRows / PER_PAGE);

  const simpanMasuk = async () => {
    if (!formMasuk.nominal || Number(formMasuk.nominal) <= 0) { setMsgMasuk('⚠️ Nominal wajib diisi!'); setTimeout(() => setMsgMasuk(''), 2500); return; }
    Swal.fire({ title: 'Menyimpan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
      await axios.post(`${API}/kas`, { tanggal: formMasuk.tanggal, nominal: Number(formMasuk.nominal), keterangan: formMasuk.keterangan, tipe: 'masuk' });
      Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Pemasukan tersimpan.', timer: 1800, showConfirmButton: false });
      setFormMasuk({ tanggal: formMasuk.tanggal, nominal: '', keterangan: '' });
      loadSummary(); loadData(1); setPage(1);
    } catch { Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan.' }); }
  };

  const simpanKeluar = async () => {
    if (!formKeluar.nominal || Number(formKeluar.nominal) <= 0) { setMsgKeluar('⚠️ Nominal wajib diisi!'); setTimeout(() => setMsgKeluar(''), 2500); return; }
    Swal.fire({ title: 'Menyimpan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
      await axios.post(`${API}/kas`, { tanggal: formKeluar.tanggal, nominal: Number(formKeluar.nominal), keterangan: formKeluar.keterangan, tipe: 'keluar' });
      Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Pengeluaran tersimpan.', timer: 1800, showConfirmButton: false });
      setFormKeluar({ tanggal: formKeluar.tanggal, nominal: '', keterangan: '' });
      loadSummary(); loadData(1); setPage(1);
    } catch { Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan.' }); }
  };

  const hapus = (id) => {
    Swal.fire({ title: 'Yakin hapus?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Ya, Hapus!', cancelButtonText: 'Batal' })
      .then(async (result) => {
        if (result.isConfirmed) {
          try {
            await axios.delete(`${API}/kas/${id}`);
            Swal.fire({ title: 'Terhapus!', icon: 'success', timer: 1500, showConfirmButton: false });
            loadSummary(); loadData();
          } catch { Swal.fire('Gagal!', 'Terjadi kesalahan.', 'error'); }
        }
      });
  };

  const hasilHariIni = pemasukanHariIni - pengeluaranHariIni;

  return (
    <div>
      {/* === CARDS BARIS 1: Harian === */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 180, background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', borderLeft: '4px solid #2563eb', padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 6 }}>💵 Total Pemasukan Hari Ini</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#059669' }}>Rp {Number(pemasukanHariIni).toLocaleString('id-ID')}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{dayjs().format('DD MMMM YYYY')}</div>
        </div>
        <div style={{ flex: 1, minWidth: 180, background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', borderLeft: '4px solid #dc2626', padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 6 }}>🔴 Total Pengeluaran Hari Ini</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#dc2626' }}>Rp {Number(pengeluaranHariIni).toLocaleString('id-ID')}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{dayjs().format('DD MMMM YYYY')}</div>
        </div>
        <div style={{ flex: 1, minWidth: 180, background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', borderLeft: `4px solid ${hasilHariIni >= 0 ? '#7c3aed' : '#f59e0b'}`, padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 6 }}>📊 Hasil Keseluruhan Hari Ini</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: hasilHariIni >= 0 ? '#7c3aed' : '#f59e0b' }}>Rp {Math.abs(hasilHariIni).toLocaleString('id-ID')}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{hasilHariIni >= 0 ? 'Untung' : 'Rugi'}</div>
        </div>
      </div>

      {/* === CARDS BARIS 2: Bulanan === */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220, background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', borderLeft: '4px solid #059669', padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 6 }}>📅 Total Pemasukan Bulan Ini</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#059669' }}>Rp {Number(pemasukanBulanIni).toLocaleString('id-ID')}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{dayjs().format('MMMM YYYY')}</div>
        </div>
        <div style={{ flex: 1, minWidth: 220, background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', borderLeft: '4px solid #f87171', padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 6 }}>📅 Total Pengeluaran Bulan Ini</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#dc2626' }}>Rp {Number(pengeluaranBulanIni).toLocaleString('id-ID')}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{dayjs().format('MMMM YYYY')}</div>
        </div>
      </div>

      {/* === FORM INPUT BERDAMPINGAN === */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Form Pemasukan */}
        <div className="card" style={{ margin: 0 }}>
          <h2 style={{ color: '#059669', fontSize: 16 }}>💵 Input Uang Masuk</h2>
          <div className="form-group"><label>Tanggal</label>
            <input type="date" value={formMasuk.tanggal} onChange={e => setFormMasuk({ ...formMasuk, tanggal: e.target.value })} />
          </div>
          <div className="form-group"><label>Nominal (Rp)</label>
            <input type="number" placeholder="0" min="0" value={formMasuk.nominal}
              onChange={e => setFormMasuk({ ...formMasuk, nominal: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && simpanMasuk()} />
          </div>
          <div className="form-group" style={{ marginBottom: 14 }}><label>Keterangan</label>
            <input type="text" placeholder="Contoh: Hasil jualan pagi..." value={formMasuk.keterangan}
              onChange={e => setFormMasuk({ ...formMasuk, keterangan: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && simpanMasuk()} />
          </div>
          {msgMasuk && <p style={{ color: '#dc2626', fontWeight: 600, marginBottom: 10 }}>{msgMasuk}</p>}
          <button className="btn btn-primary" onClick={simpanMasuk}>💾 Simpan Pemasukan</button>
        </div>

        {/* Form Pengeluaran */}
        <div className="card" style={{ margin: 0 }}>
          <h2 style={{ color: '#dc2626', fontSize: 16 }}>🔴 Input Pengeluaran</h2>
          <div className="form-group"><label>Tanggal</label>
            <input type="date" value={formKeluar.tanggal} onChange={e => setFormKeluar({ ...formKeluar, tanggal: e.target.value })} />
          </div>
          <div className="form-group"><label>Nominal (Rp)</label>
            <input type="number" placeholder="0" min="0" value={formKeluar.nominal}
              onChange={e => setFormKeluar({ ...formKeluar, nominal: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && simpanKeluar()} />
          </div>
          <div className="form-group" style={{ marginBottom: 14 }}><label>Keterangan</label>
            <input type="text" placeholder="Contoh: Beli pakan, Operasional..." value={formKeluar.keterangan}
              onChange={e => setFormKeluar({ ...formKeluar, keterangan: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && simpanKeluar()} />
          </div>
          {msgKeluar && <p style={{ color: '#dc2626', fontWeight: 600, marginBottom: 10 }}>{msgKeluar}</p>}
          <button className="btn btn-primary" style={{ background: '#dc2626' }} onClick={simpanKeluar}>💾 Simpan Pengeluaran</button>
        </div>
      </div>

      {/* === TABEL LAPORAN === */}
      <div className="card">
        <h2>📊 Tabel Laporan Keuangan</h2>

        {/* Filter Bulan */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>Filter Bulan</label>
            <input type="month" value={bulanFilter} onChange={e => setBulanFilter(e.target.value)}
              style={{ padding: '7px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13 }} />
          </div>
          {(bulanFilter || dari || sampai) && (
            <div style={{ alignSelf: 'flex-end', display: 'flex', gap: 10 }}>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '7px 14px' }}>
                <span style={{ fontSize: 12, color: '#475569' }}>Pemasukan: </span>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#059669' }}>Rp {Number(totalFilterMasuk).toLocaleString('id-ID')}</span>
              </div>
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '7px 14px' }}>
                <span style={{ fontSize: 12, color: '#475569' }}>Pengeluaran: </span>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#dc2626' }}>Rp {Number(totalFilterKeluar).toLocaleString('id-ID')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Filter tanggal & cari */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>Dari tanggal</label>
            <input type="date" value={dari} onChange={e => setDari(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>Sampai tanggal</label>
            <input type="date" value={sampai} onChange={e => setSampai(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13 }} />
          </div>
          <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>Cari</label>
            <input type="text" placeholder="Cari keterangan..."
              value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCari()}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13 }} />
          </div>
          <button onClick={handleCari} style={{ padding: '8px 18px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', height: 38 }}>Cari</button>
          <button onClick={handleReset} style={{ padding: '8px 14px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, cursor: 'pointer', height: 38 }}>Reset</button>
          <span style={{ fontSize: 13, color: '#94a3b8', alignSelf: 'center' }}>{totalRows} data</span>
        </div>

        {/* Tabel */}
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>No</th><th>Tanggal</th><th>Keterangan</th>
                <th style={{ textAlign: 'right' }}>Nominal</th><th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="5" style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>Memuat data...</td></tr>}
              {!loading && data.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>Belum ada data</td></tr>}
              {!loading && data.map((row, i) => {
                const isKeluar = row.tipe === 'keluar' || row.sumber === 'pembelian';
                return (
                  <tr key={`${row.sumber}-${row.id}-${i}`}>
                    <td>{(page - 1) * PER_PAGE + i + 1}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{dayjs(row.tanggal).format('DD/MM/YYYY')}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: row.keterangan ? '#1e293b' : '#94a3b8' }}>{row.keterangan || '-'}</span>
                        {row.sumber === 'penjualan' && <span style={{ background: '#fef3c7', color: '#92400e', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, whiteSpace: 'nowrap' }}>🐔 Penjualan</span>}
                        {row.sumber === 'pembelian' && <span style={{ background: '#fef2f2', color: '#991b1b', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, whiteSpace: 'nowrap' }}>🛒 Pembelian</span>}
                        {row.tipe === 'keluar' && row.sumber === 'kas' && <span style={{ background: '#fef2f2', color: '#991b1b', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, whiteSpace: 'nowrap' }}>🔴 Keluar</span>}
                        {row.tipe === 'masuk' && row.sumber === 'kas' && <span style={{ background: '#f0fdf4', color: '#166534', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, whiteSpace: 'nowrap' }}>💵 Masuk</span>}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: isKeluar ? '#dc2626' : '#059669' }}>
                      {isKeluar ? '-' : '+'} Rp {Number(row.nominal).toLocaleString('id-ID')}
                    </td>
                    <td>
                      {row.sumber === 'kas' ? (
                        <button title="Hapus" onClick={() => hapus(row.id)}
                          style={{ background: '#fef2f2', border: 'none', borderRadius: 8, padding: '6px 9px', cursor: 'pointer', color: '#dc2626', lineHeight: 1 }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 3h6l1 1h4v2H4V4h4l1-1zm-1 5h8l-.8 12H9.8L9 8zm2 2v8h1v-8h-1zm3 0v8h1v-8h-1z"/>
                          </svg>
                        </button>
                      ) : <span style={{ fontSize: 11, color: '#94a3b8' }}>otomatis</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: 16, gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: '#475569', marginRight: 8 }}>Halaman {page} dari {totalPages}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setPage(1)} disabled={page === 1} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: page === 1 ? '#f8fafc' : 'white', cursor: page === 1 ? 'default' : 'pointer', fontSize: 13, color: '#475569' }}>«</button>
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: page === 1 ? '#f8fafc' : 'white', cursor: page === 1 ? 'default' : 'pointer', fontSize: 13, color: '#475569' }}>‹ Prev</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p = page <= 3 ? i + 1 : page + i - 2;
                if (p > totalPages) return null;
                return <button key={p} onClick={() => setPage(p)} style={{ padding: '6px 12px', borderRadius: 6, border: '1.5px solid', fontSize: 13, cursor: 'pointer', borderColor: page === p ? '#2563eb' : '#e2e8f0', background: page === p ? '#eff6ff' : 'white', color: page === p ? '#2563eb' : '#475569', fontWeight: page === p ? 700 : 400 }}>{p}</button>;
              })}
              <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: page === totalPages ? '#f8fafc' : 'white', cursor: page === totalPages ? 'default' : 'pointer', fontSize: 13, color: '#475569' }}>Next ›</button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: page === totalPages ? '#f8fafc' : 'white', cursor: page === totalPages ? 'default' : 'pointer', fontSize: 13, color: '#475569' }}>»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}