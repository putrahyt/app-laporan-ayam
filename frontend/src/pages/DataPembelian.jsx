import { useState, useEffect } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import DetailPenjualan from './DetailPenjualan';
import EditableItems from './EditableItems';
import Swal from 'sweetalert2';

const API = 'http://localhost:3001/api';
const STATUS_OPTIONS = ['Sudah Dibayar', 'Belum Dibayar'];
const PER_PAGE = 30;

function EditableText({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || '');

  if (editing) {
    return (
      <input autoFocus value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={() => { onSave(val); setEditing(false); }}
        onKeyDown={e => { if (e.key === 'Enter') { onSave(val); setEditing(false); } }}
        style={{ width: 110, padding: '3px 6px', border: '1px solid #2563eb', borderRadius: 6, fontSize: 13 }}
      />
    );
  }
  return (
    <span onClick={() => setEditing(true)} title="Klik untuk edit"
      style={{ cursor: 'pointer', fontSize: 13, color: val ? '#1e293b' : '#94a3b8' }}>
      {val || '-'}
    </span>
  );
}

function HargaInfo({ row }) {
  const [open, setOpen] = useState(false);
  let allItems = [];
  try { allItems = JSON.parse(row.items_detail || '[]'); } catch {}
  const items = allItems.filter(x => x.tipe !== 'kotak');
  const kotakList = allItems.filter(x => x.tipe === 'kotak');
  const hargaKotak = Number(row.harga_kotak) || 0;
  const netKotak = kotakList.reduce((s, k) => {
    const v = Number(k.jumlah) || 0;
    return k.nama === 'Kotak Kosong' ? s - v : s + v;
  }, 0);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(true)} title="Lihat Harga"
        style={{ background: '#fefce8', border: '1px solid #fbbf24', borderRadius: 6, padding: '3px 9px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#92400e' }}>
        💰 Lihat Harga
      </button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}
          onClick={() => setOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 14, padding: '20px 24px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)', minWidth: 340, maxWidth: 460, width: '90%' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#2563eb', marginBottom: 14 }}>💰 Harga — {row.nama}</div>

            {items.length > 0 && (
              <>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, marginBottom: 6 }}>ITEM</div>
                {items.map((item, i) => {
                  const sub = (Number(item.jumlah) || 0) * (Number(item.harga) || 0);
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 13 }}>
                      <span style={{ flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', padding: '4px 10px', borderRadius: 6, fontWeight: 600 }}>
                        {item.nama} <span style={{ color: '#94a3b8', fontWeight: 400 }}>({item.jumlah} {item.satuan})</span>
                      </span>
                      <span style={{ color: '#475569', minWidth: 110, textAlign: 'right' }}>Rp {Number(item.harga || 0).toLocaleString('id-ID')}</span>
                      <span style={{ color: "#dc2626", fontWeight: 700, minWidth: 110, textAlign: 'right' }}>= Rp {sub.toLocaleString('id-ID')}</span>
                    </div>
                  );
                })}
              </>
            )}

            {kotakList.length > 0 && (
              <>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, marginTop: 10, marginBottom: 6 }}>KOTAK</div>
                {kotakList.map((k, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontSize: 13 }}>
                    <span style={{ flex: 1, background: '#fefce8', border: '1px solid #fde68a', padding: '4px 10px', borderRadius: 6, fontWeight: 600, color: '#92400e' }}>
                      {k.nama} <span style={{ fontWeight: 400, color: '#a16207' }}>({k.jumlah} kotak)</span>
                    </span>
                  </div>
                ))}
                <div style={{ fontSize: 13, color: '#475569', marginTop: 6, paddingLeft: 4 }}>
                  Net kotak: <b>{netKotak}</b> &nbsp;×&nbsp; Rp {hargaKotak.toLocaleString('id-ID')} =&nbsp;
                  <b style={{ color: "#dc2626" }}>Rp {(netKotak * hargaKotak).toLocaleString('id-ID')}</b>
                </div>
              </>
            )}

            <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 12, paddingTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setOpen(false)}
                style={{ padding: '7px 20px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DataPenjualan() {
    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [grandTotal, setGrandTotal] = useState(0); // ← tambah ini
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('semua');
    const [dari, setDari] = useState('');
    const [sampai, setSampai] = useState('');
    const [detailId, setDetailId] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => { loadData(); }, [page, filterStatus]);

    const loadData = async () => {
    setLoading(true);
    const params = new URLSearchParams({
        page, limit: PER_PAGE,
        ...(search && { search }),
        ...(filterStatus !== 'semua' && { status: filterStatus }),
        ...(dari && { dari }),
        ...(sampai && { sampai }),
    });
    const res = await axios.get(`${API}/pembelian/all?${params}`);
    setData(res.data.rows);
    setTotal(res.data.total);
    setGrandTotal(res.data.grandTotal); // ← tambah ini
    setLoading(false);
    };

    const handleCari = () => { setPage(1); loadData(); };

    const totalPages = Math.ceil(total / PER_PAGE);
    // ← baris grandTotal dari reduce DIHAPUS

    const hapus = async (id) => {
    Swal.fire({
        title: 'Yakin hapus data ini?',
        text: "Data akan dihapus secara permanen dari database!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33', // Merah untuk aksi hapus
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, Hapus!',
        cancelButtonText: 'Batal'
    }).then(async (result) => {
        if (result.isConfirmed) {
        try {
            // Eksekusi hapus ke backend
            await axios.delete(`${API}/penjualan/${id}`);
            
            // Notifikasi sukses
            Swal.fire({
            title: 'Terhapus!',
            text: 'Data penjualan telah berhasil dihapus.',
            icon: 'success',
            timer: 1500, // Hilang otomatis dalam 1.5 detik
            showConfirmButton: false
            });

            // Refresh data di tabel
            loadData(); 
        } catch (error) {
            // Jika ada kendala koneksi atau database
            Swal.fire(
            'Gagal!',
            'Terjadi kesalahan saat menghapus data.',
            'error'
            );
            console.error(error);
        }
        }
    });
    };

    const updateField = async (id, field, value) => {
    await axios.patch(`${API}/penjualan/${id}`, { [field]: value });
    loadData();
    };

    const exportExcel = async () => {
    const params = new URLSearchParams({
        ...(search && { search }),
        ...(filterStatus !== 'semua' && { status: filterStatus }),
        ...(dari && { dari }),
        ...(sampai && { sampai }),
    });
    const res = await fetch(`${API}/export/pembelian-semua?${params}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-pembelian.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    };

  if (detailId) {
    return <DetailPenjualan id={detailId} onKembali={() => { setDetailId(null); loadData(); }} />;
  }

  return (
    <div>
        {/* Card Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        <div style={{ background: 'white', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderLeft: '4px solid #2563eb' }}>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginBottom: 6 }}>Total Transaksi</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#1e3a5f' }}>{total}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>transaksi tercatat</div>
        </div>
        {/* <div style={{ background: 'white', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderLeft: '4px solid #dc2626' }}>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginBottom: 6 }}>Total Keseluruhan Penjualan Ayam</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#991b1b' }}>Rp {grandTotal.toLocaleString('id-ID')}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>dari semua transaksi</div>
        </div> */}
        </div>

        <div className="card">
        <h2>📊 Data Pembelian — {total} transaksi</h2>

        {/* Filter & Search */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
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
                <input type="text" placeholder="Cari nama atau keterangan..."
                value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCari()}
                style={{ width: '100%', padding: '8px 12px 8px 32px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13 }} />
            </div>
            </div>
            <button onClick={handleCari}
            style={{ padding: '8px 18px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', height: 38 }}>
            Cari
            </button>
            <button onClick={() => { setSearch(''); setDari(''); setSampai(''); setFilterStatus('semua'); setPage(1); setTimeout(loadData, 50); }}
            style={{ padding: '8px 14px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, cursor: 'pointer', height: 38 }}>
            Reset
            </button>
        </div>

        {/* Filter Status + Export */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            {['semua', 'Sudah Dibayar', 'Belum Dibayar'].map(s => (
            <button key={s} onClick={() => { setFilterStatus(s); setPage(1); }}
                style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', border: '1.5px solid',
                borderColor: filterStatus === s ? (s === 'semua' ? '#2563eb' : s === 'Sudah Dibayar' ? '#dc2626' : '#dc2626') : '#e2e8f0',
                background: filterStatus === s ? (s === 'semua' ? '#eff6ff' : s === 'Sudah Dibayar' ? '#fef2f2' : '#fef2f2') : 'white',
                color: filterStatus === s ? (s === 'semua' ? '#2563eb' : s === 'Sudah Dibayar' ? '#dc2626' : '#dc2626') : '#64748b',
                }}>
                {s === 'semua' ? '🔍 Semua' : s === 'Sudah Dibayar' ? '✅ Sudah Dibayar' : '❌ Belum Dibayar'}
            </button>
            ))}
            <span style={{ fontSize: 13, color: '#94a3b8' }}>{total} data</span>
            <div style={{ marginLeft: 'auto' }}>
            <button onClick={exportExcel}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#dc2626', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24">
                <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 11l5 5 5-5M12 4v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Export Excel
            </button>
            </div>
        </div>

        {/* Tabel */}
        <div style={{ overflowX: 'auto' }}>
            <table>
            <thead>
                <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>Nama</th>
                <th>Jml Item</th>
                <th>Harga</th>
                <th>Total</th>
                <th>Status</th>
                <th>Ket.</th>
                <th>Aksi</th>
                </tr>
            </thead>
            <tbody>
                {loading && (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>Memuat data...</td></tr>
                )}
                {!loading && data.length === 0 && (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>Tidak ada data</td></tr>
                )}
                {!loading && data.map((row, i) => (
                <tr key={row.id}>
                    <td>{(page - 1) * PER_PAGE + i + 1}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{dayjs(row.tanggal).format('DD/MM/YYYY')}</td>
                    <td>{row.nama}</td>
                    <td style={{ textAlign: 'center' }}>
                    <EditableItems
                        row={row}
                        onSaved={() => loadData()}
                    />
                    </td>
                    <td>
                        <HargaInfo row={row} />
                    </td>
                    <td><b>Rp {Number(row.total).toLocaleString('id-ID')}</b></td>
                    <td>
                    <select value={row.status} onChange={e => updateField(row.id, 'status', e.target.value)}
                        style={{
                        padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1.5px solid',
                        borderColor: row.status === 'Sudah Dibayar' ? '#dc2626' : '#dc2626',
                        color: row.status === 'Sudah Dibayar' ? '#dc2626' : '#dc2626',
                        background: row.status === 'Sudah Dibayar' ? '#fef2f2' : '#fef2f2',
                        }}>
                        {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                    </select>
                    </td>
                    <td>
                    <EditableText value={row.catatan} onSave={val => updateField(row.id, 'catatan', val)} />
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                    <button title="Lihat Detail" onClick={() => setDetailId(row.id)}
                        style={{ background: '#eff6ff', border: 'none', borderRadius: 8, padding: '6px 9px', marginRight: 6, cursor: 'pointer', color: '#2563eb', lineHeight: 1 }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>
                        </svg>
                    </button>
                    <button title="Hapus" onClick={() => hapus(row.id)}
                        style={{ background: '#fef2f2', border: 'none', borderRadius: 8, padding: '6px 9px', cursor: 'pointer', color: '#dc2626', lineHeight: 1 }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 3h6l1 1h4v2H4V4h4l1-1zm-1 5h8l-.8 12H9.8L9 8zm2 2v8h1v-8h-1zm3 0v8h1v-8h-1z"/>
                        </svg>
                    </button>
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