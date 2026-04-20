import { useState, useEffect } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import Swal from 'sweetalert2';

const API = 'http://localhost:3001/api';
const PER_PAGE = 15;

export default function Kas() {
  // Form input
  const [form, setForm] = useState({
    tanggal: dayjs().format('YYYY-MM-DD'),
    nominal: '',
    keterangan: '',
  });
  const [msg, setMsg] = useState('');

  // Card summary
  const [totalHariIni, setTotalHariIni] = useState(0);
  const [totalBulanIni, setTotalBulanIni] = useState(0);
  const [totalKeseluruhan, setTotalKeseluruhan] = useState(0);

  // Tabel laporan
  const [data, setData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  // Filter
  const [search, setSearch] = useState('');
  const [dari, setDari] = useState('');
  const [sampai, setSampai] = useState('');
  const [bulanFilter, setBulanFilter] = useState('');
  const [totalFilter, setTotalFilter] = useState(0);

  useEffect(() => { loadSummary(); }, []);
  useEffect(() => { loadData(); }, [page]);
  useEffect(() => { setPage(1); loadData(1); }, [bulanFilter]);

  const loadSummary = async () => {
    const today = dayjs().format('YYYY-MM-DD');
    const bulanDari = dayjs().startOf('month').format('YYYY-MM-DD');
    const bulanSampai = dayjs().endOf('month').format('YYYY-MM-DD');
    try {
      const [rHari, rBulan, rTotal] = await Promise.all([
        axios.get(`${API}/kas?dari=${today}&sampai=${today}`),
        axios.get(`${API}/kas?dari=${bulanDari}&sampai=${bulanSampai}`),
        axios.get(`${API}/kas/total`),
      ]);
      const sumArr = (arr) => (arr || []).reduce((s, r) => s + Number(r.nominal), 0);
      setTotalHariIni(sumArr(rHari.data.rows || rHari.data));
      setTotalBulanIni(sumArr(rBulan.data.rows || rBulan.data));
      setTotalKeseluruhan(rTotal.data.total || 0);
    } catch {}
  };

  const loadData = async (overridePage) => {
    setLoading(true);
    try {
      // Kalau bulanFilter diisi, override dari & sampai
      let dariParam = dari;
      let sampaiParam = sampai;
      if (bulanFilter) {
        dariParam = dayjs(bulanFilter + '-01').format('YYYY-MM-DD');
        sampaiParam = dayjs(bulanFilter + '-01').endOf('month').format('YYYY-MM-DD');
      }
      const params = new URLSearchParams({
        page: overridePage || page,
        limit: PER_PAGE,
        ...(search && { search }),
        ...(dariParam && { dari: dariParam }),
        ...(sampaiParam && { sampai: sampaiParam }),
      });
      const res = await axios.get(`${API}/kas/all?${params}`);
      setData(res.data.rows || []);
      setTotalRows(res.data.total || 0);
      setTotalFilter(res.data.grandTotal || 0);
    } catch { setData([]); setTotalRows(0); setTotalFilter(0); }
    setLoading(false);
  };

  const handleCari = () => { setPage(1); loadData(1); };
  const handleReset = () => {
    setSearch(''); setDari(''); setSampai(''); setBulanFilter('');
    setPage(1);
    setTimeout(() => loadData(1), 50);
  };

  const totalPages = Math.ceil(totalRows / PER_PAGE);

  const handleSimpan = async () => {
    if (!form.nominal || Number(form.nominal) <= 0) {
      setMsg('⚠️ Nominal wajib diisi dan lebih dari 0!');
      setTimeout(() => setMsg(''), 2500);
      return;
    }
    Swal.fire({ title: 'Menyimpan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
      await axios.post(`${API}/kas`, {
        tanggal: form.tanggal,
        nominal: Number(form.nominal),
        keterangan: form.keterangan,
      });
      Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Data uang masuk tersimpan.', timer: 1800, showConfirmButton: false });
      setForm({ tanggal: form.tanggal, nominal: '', keterangan: '' });
      loadSummary();
      loadData(1); setPage(1);
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan saat menyimpan.' });
    }
  };

  const hapus = (id) => {
    Swal.fire({
      title: 'Yakin hapus data ini?', icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus!', cancelButtonText: 'Batal',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${API}/kas/${id}`);
          Swal.fire({ title: 'Terhapus!', icon: 'success', timer: 1500, showConfirmButton: false });
          loadSummary(); loadData();
        } catch { Swal.fire('Gagal!', 'Terjadi kesalahan.', 'error'); }
      }
    });
  };

  return (
    <div>
      {/* === CARD SUMMARY === */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', borderLeft: '4px solid #2563eb', padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginBottom: 8 }}>💵 Total Uang Masuk Hari Ini</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>Rp {Number(totalHariIni).toLocaleString('id-ID')}</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>{dayjs().format('DD MMMM YYYY')}</div>
        </div>
        <div style={{ flex: 1, minWidth: 200, background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', borderLeft: '4px solid #059669', padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginBottom: 8 }}>📅 Total Uang Masuk Bulan Ini</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#059669', marginBottom: 4 }}>Rp {Number(totalBulanIni).toLocaleString('id-ID')}</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>{dayjs().format('MMMM YYYY')}</div>
        </div>
        {/* <div style={{ flex: 1, minWidth: 200, background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', borderLeft: '4px solid #7c3aed', padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginBottom: 8 }}>🏦 Total Keseluruhan</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#7c3aed', marginBottom: 4 }}>Rp {Number(totalKeseluruhan).toLocaleString('id-ID')}</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>dari semua transaksi</div>
        </div> */}
      </div>

      {/* === FORM INPUT === */}
      <div className="card">
        <h2>💵 Input Uang Masuk</h2>
        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Tanggal</label>
            <input type="date" value={form.tanggal} onChange={e => setForm({ ...form, tanggal: e.target.value })} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Nominal (Rp)</label>
            <input type="number" placeholder="0" min="0" step="1000" value={form.nominal}
              onChange={e => setForm({ ...form, nominal: e.target.value })}
              onKeyDown={e => { if (e.key === 'Enter') handleSimpan(); }} />
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label>Keterangan</label>
          <input type="text" placeholder="Contoh: Hasil jualan pagi, Uang meja, dll..."
            value={form.keterangan} onChange={e => setForm({ ...form, keterangan: e.target.value })}
            onKeyDown={e => { if (e.key === 'Enter') handleSimpan(); }} />
        </div>
        {form.nominal && Number(form.nominal) > 0 && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: '#475569' }}>Akan dicatat:</span>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#059669' }}>Rp {Number(form.nominal).toLocaleString('id-ID')}</span>
            {form.keterangan && <span style={{ fontSize: 13, color: '#64748b' }}>— {form.keterangan}</span>}
          </div>
        )}
        {msg && <p style={{ marginBottom: 12, color: '#dc2626', fontWeight: 600 }}>{msg}</p>}
        <button className="btn btn-primary" onClick={handleSimpan}>💾 Simpan</button>
      </div>

      {/* === TABEL LAPORAN === */}
      <div className="card">
        <h2>📊 Laporan Uang</h2>

        {/* Filter Bulan */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>Filter Bulan</label>
            <input type="month" value={bulanFilter} onChange={e => setBulanFilter(e.target.value)}
              style={{ padding: '7px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13 }} />
          </div>
          {/* Total hasil filter */}
          {(bulanFilter || dari || sampai) && (
            <div style={{ alignSelf: 'flex-end', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '7px 16px' }}>
              <span style={{ fontSize: 13, color: '#475569' }}>Total filter: </span>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#059669' }}>Rp {Number(totalFilter).toLocaleString('id-ID')}</span>
            </div>
          )}
        </div>

        {/* Filter */}
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
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
                xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24">
                <path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input type="text" placeholder="Cari keterangan..."
                value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCari()}
                style={{ width: '100%', padding: '8px 12px 8px 32px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13 }} />
            </div>
          </div>
          <button onClick={handleCari}
            style={{ padding: '8px 18px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', height: 38 }}>
            Cari
          </button>
          <button onClick={handleReset}
            style={{ padding: '8px 14px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, cursor: 'pointer', height: 38 }}>
            Reset
          </button>
          <span style={{ fontSize: 13, color: '#94a3b8', alignSelf: 'center', marginLeft: 4 }}>{totalRows} data</span>
        </div>

        {/* Tabel */}
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>Keterangan</th>
                <th style={{ textAlign: 'right' }}>Nominal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>Memuat data...</td></tr>
              )}
              {!loading && data.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>Belum ada data uang masuk</td></tr>
              )}
              {!loading && data.map((row, i) => (
                <tr key={`${row.sumber}-${row.id}-${i}`}>
                  <td>{(page - 1) * PER_PAGE + i + 1}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{dayjs(row.tanggal).format('DD/MM/YYYY')}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: row.keterangan ? '#1e293b' : '#94a3b8' }}>{row.keterangan || '-'}</span>
                      {row.sumber === 'penjualan' && (
                        <span style={{ background: '#fef3c7', color: '#92400e', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                          🐔 Penjualan
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#059669' }}>
                    Rp {Number(row.nominal).toLocaleString('id-ID')}
                  </td>
                  <td>
                    {row.sumber === 'kas' ? (
                      <button title="Hapus" onClick={() => hapus(row.id)}
                        style={{ background: '#fef2f2', border: 'none', borderRadius: 8, padding: '6px 9px', cursor: 'pointer', color: '#dc2626', lineHeight: 1 }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 3h6l1 1h4v2H4V4h4l1-1zm-1 5h8l-.8 12H9.8L9 8zm2 2v8h1v-8h-1zm3 0v8h1v-8h-1z"/>
                        </svg>
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>otomatis</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: 16, gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: '#475569', marginRight: 8 }}>Halaman {page} dari {totalPages}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setPage(1)} disabled={page === 1}
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: page === 1 ? '#f8fafc' : 'white', cursor: page === 1 ? 'default' : 'pointer', fontSize: 13, color: '#475569' }}>«</button>
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: page === 1 ? '#f8fafc' : 'white', cursor: page === 1 ? 'default' : 'pointer', fontSize: 13, color: '#475569' }}>‹ Prev</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p = page <= 3 ? i + 1 : page + i - 2;
                if (p > totalPages) return null;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ padding: '6px 12px', borderRadius: 6, border: '1.5px solid', fontSize: 13, cursor: 'pointer',
                      borderColor: page === p ? '#2563eb' : '#e2e8f0',
                      background: page === p ? '#eff6ff' : 'white',
                      color: page === p ? '#2563eb' : '#475569',
                      fontWeight: page === p ? 700 : 400,
                    }}>{p}</button>
                );
              })}
              <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: page === totalPages ? '#f8fafc' : 'white', cursor: page === totalPages ? 'default' : 'pointer', fontSize: 13, color: '#475569' }}>Next ›</button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: page === totalPages ? '#f8fafc' : 'white', cursor: page === totalPages ? 'default' : 'pointer', fontSize: 13, color: '#475569' }}>»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}