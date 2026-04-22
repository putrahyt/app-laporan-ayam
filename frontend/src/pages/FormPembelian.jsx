import { useState, useEffect } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import Swal from 'sweetalert2';
import DetailPembelian from './DetailPembelian';
import EditableItemsPembelian from './EditableItemsPembelian';

const API = 'http://localhost:3001/api';
const STATUS_OPTIONS = ['Sudah Dibayar', 'Belum Dibayar'];
const NAMA_KOTAK = ['Kotak Isi (Ayam Hidup)', 'Kotak Kosong'];

function buatItemBaru() { return { tipe: 'item', nama: '', jumlah: '', satuan: '', harga: '' }; }
function buatKotakBaru() { return { tipe: 'kotak', nama: 'Kotak Isi (Ayam Hidup)', jumlah: '' }; }

function hitungTotal(items, kotakList, hargaKotak) {
  const totalItem = items.reduce((s, i) => s + (Number(i.jumlah) || 0) * (Number(i.harga) || 0), 0);
  const netKotak = kotakList.reduce((s, k) => {
    const v = Number(k.jumlah) || 0;
    return k.nama === 'Kotak Kosong' ? s - v : s + v;
  }, 0);
  return totalItem + netKotak * (Number(hargaKotak) || 0);
}

function hitungJumlahItem(items, kotakList) {
  const ti = items.reduce((s, i) => s + (Number(i.jumlah) || 0), 0);
  const tk = kotakList.reduce((s, k) => {
    const v = Number(k.jumlah) || 0;
    return k.nama === 'Kotak Kosong' ? s - v : s + v;
  }, 0);
  return ti + tk;
}

function EditableText({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || '');
  if (editing) {
    return (
      <input autoFocus value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={() => { onSave(val); setEditing(false); }}
        onKeyDown={e => { if (e.key === 'Enter') { onSave(val); setEditing(false); } }}
        style={{ width: 110, padding: '3px 6px', border: '1px solid #dc2626', borderRadius: 6, fontSize: 13 }}
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
      <button onClick={() => setOpen(true)}
        style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '3px 9px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#991b1b' }}>
        💰 Lihat Harga
      </button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}
          onClick={() => setOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 14, padding: '20px 24px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)', minWidth: 340, maxWidth: 460, width: '90%' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#dc2626', marginBottom: 14 }}>💰 Harga — {row.nama}</div>
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
                      <span style={{ color: '#dc2626', fontWeight: 700, minWidth: 110, textAlign: 'right' }}>= Rp {sub.toLocaleString('id-ID')}</span>
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
                    <span style={{ flex: 1, background: '#fef2f2', border: '1px solid #fca5a5', padding: '4px 10px', borderRadius: 6, fontWeight: 600, color: '#991b1b' }}>
                      {k.nama} <span style={{ fontWeight: 400 }}>({k.jumlah} kotak)</span>
                    </span>
                  </div>
                ))}
                <div style={{ fontSize: 13, color: '#475569', marginTop: 6, paddingLeft: 4 }}>
                  Net kotak: <b>{netKotak}</b> × Rp {hargaKotak.toLocaleString('id-ID')} = <b style={{ color: '#dc2626' }}>Rp {(netKotak * hargaKotak).toLocaleString('id-ID')}</b>
                </div>
              </>
            )}
            <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 12, paddingTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setOpen(false)} style={{ padding: '7px 20px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModalKelolaMaster({ onClose, onRefresh }) {
  const [tab, setTab] = useState('item');
  const [items, setItems] = useState([]);
  const [satuans, setSatuans] = useState([]);
  const [inputItem, setInputItem] = useState('');
  const [inputSatuan, setInputSatuan] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = () => {
    axios.get(`${API}/master-item`).then(r => setItems(r.data));
    axios.get(`${API}/master-satuan`).then(r => setSatuans(r.data));
  };

  const tambahItem = async () => {
    if (!inputItem.trim()) { setErr('Nama item wajib diisi!'); return; }
    try {
      await axios.post(`${API}/master-item`, { nama: inputItem.trim() });
      setInputItem(''); setErr('');
      loadAll(); onRefresh();
    } catch { setErr('Nama item sudah ada!'); }
  };

  const tambahSatuan = async () => {
    if (!inputSatuan.trim()) { setErr('Nama satuan wajib diisi!'); return; }
    try {
      await axios.post(`${API}/master-satuan`, { nama: inputSatuan.trim() });
      setInputSatuan(''); setErr('');
      loadAll(); onRefresh();
    } catch { setErr('Nama satuan sudah ada!'); }
  };

  const hapusItem = async (id, nama) => {
    const k = await Swal.fire({ title: `Hapus "${nama}"?`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Ya, hapus', cancelButtonText: 'Batal', confirmButtonColor: '#dc2626' });
    if (!k.isConfirmed) return;
    await axios.delete(`${API}/master-item/${id}`);
    loadAll(); onRefresh();
  };

  const hapusSatuan = async (id, nama) => {
    const k = await Swal.fire({ title: `Hapus "${nama}"?`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Ya, hapus', cancelButtonText: 'Batal', confirmButtonColor: '#dc2626' });
    if (!k.isConfirmed) return;
    await axios.delete(`${API}/master-satuan/${id}`);
    loadAll(); onRefresh();
  };

  const tabStyle = (active) => ({
    padding: '8px 20px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', background: active ? '#dc2626' : '#f1f5f9',
    color: active ? 'white' : '#475569',
  });

  const daftarAktif = tab === 'item' ? items : satuans;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 28, width: 460, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 17, color: '#991b1b' }}>⚙️ Kelola Master Data</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }}>×</button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button style={tabStyle(tab === 'item')} onClick={() => { setTab('item'); setErr(''); }}>🐔 Item</button>
          <button style={tabStyle(tab === 'satuan')} onClick={() => { setTab('satuan'); setErr(''); }}>📏 Satuan</button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            placeholder={tab === 'item' ? 'Nama item baru...' : 'Nama satuan baru...'}
            value={tab === 'item' ? inputItem : inputSatuan}
            onChange={e => tab === 'item' ? setInputItem(e.target.value) : setInputSatuan(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (tab === 'item' ? tambahItem() : tambahSatuan())}
            style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14 }}
          />
          <button
            onClick={tab === 'item' ? tambahItem : tambahSatuan}
            style={{ padding: '8px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            + Tambah
          </button>
        </div>
        {err && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 8 }}>{err}</p>}
        <div style={{ overflowY: 'auto', flex: 1, border: '1px solid #f1f5f9', borderRadius: 8 }}>
          {daftarAktif.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Belum ada data</div>
          )}
          {daftarAktif.map((item, i) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: i < daftarAktif.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#fef2f2', color: '#dc2626', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{item.nama}</span>
              </div>
              <button onClick={() => tab === 'item' ? hapusItem(item.id, item.nama) : hapusSatuan(item.id, item.nama)}
                style={{ background: '#fef2f2', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', color: '#dc2626', fontSize: 12, fontWeight: 600 }}>
                Hapus
              </button>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, textAlign: 'right' }}>
          <button onClick={onClose}
            style={{ padding: '8px 20px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FormPembelian() {
  const [form, setForm] = useState({
    tanggal: dayjs().format('YYYY-MM-DD'),
    nama: '',
    items: [buatItemBaru()],
    kotakList: [],
    hargaKotak: '',
    status: 'Sudah Dibayar',
    catatan: ''
  });
  const [masterItem, setMasterItem] = useState([]);
  const [masterSatuan, setMasterSatuan] = useState([]);
  const [showKelola, setShowKelola] = useState(false);
  const [tglExport, setTglExport] = useState(dayjs().format('YYYY-MM-DD'));
  const [hariIni, setHariIni] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('semua');
  const [msg, setMsg] = useState('');
  const [detailId, setDetailId] = useState(null);

  useEffect(() => { loadHariIni(); loadMaster(); }, []);

  const loadHariIni = () => {
    const today = dayjs().format('YYYY-MM-DD');
    axios.get(`${API}/pembelian?dari=${today}&sampai=${today}`).then(r => setHariIni(r.data));
  };
  const loadMaster = () => {
    axios.get(`${API}/master-item`).then(r => setMasterItem(r.data));
    axios.get(`${API}/master-satuan`).then(r => setMasterSatuan(r.data));
  };

  const totalJumlahItem = hitungJumlahItem(form.items, form.kotakList);
  const totalJumlahItemSaja = form.items.reduce((s, i) => s + (Number(i.jumlah) || 0), 0);
  const netKotakForm = form.kotakList.reduce((s, k) => {
    const v = Number(k.jumlah) || 0;
    return k.nama === 'Kotak Kosong' ? s - v : s + v;
  }, 0);
  const totalHarga = hitungTotal(form.items, form.kotakList, form.hargaKotak);

  const updateItem = (idx, field, val) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: val };
    setForm({ ...form, items });
  };
  const tambahItem = () => setForm({ ...form, items: [...form.items, buatItemBaru()] });
  const hapusItemRow = (idx) => { if (form.items.length > 1) setForm({ ...form, items: form.items.filter((_, i) => i !== idx) }); };

  const updateKotak = (idx, field, val) => {
    const kotakList = [...form.kotakList];
    kotakList[idx] = { ...kotakList[idx], [field]: val };
    setForm({ ...form, kotakList });
  };
  const tambahKotak = () => setForm({ ...form, kotakList: [...form.kotakList, buatKotakBaru()] });
  const hapusKotak = (idx) => setForm({ ...form, kotakList: form.kotakList.filter((_, i) => i !== idx) });

  const updateStatusCatatan = async (id, field, value) => {
    await axios.patch(`${API}/pembelian/${id}`, { [field]: value });
    loadHariIni();
  };

  const hapusData = async (id) => {
    Swal.fire({ title: 'Yakin hapus?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Ya, Hapus!', cancelButtonText: 'Batal' })
      .then(async (result) => {
        if (result.isConfirmed) {
          try {
            await axios.delete(`${API}/pembelian/${id}`);
            Swal.fire({ title: 'Terhapus!', icon: 'success', timer: 1500, showConfirmButton: false });
            loadHariIni();
          } catch { Swal.fire('Error!', 'Gagal menghapus.', 'error'); }
        }
      });
  };

  const handleSubmit = async () => {
    if (!form.nama.trim()) { setMsg('⚠️ Nama wajib diisi!'); setTimeout(() => setMsg(''), 2000); return; }
    if (form.items.some(i => !i.nama || !i.jumlah)) { setMsg('⚠️ Item wajib lengkap!'); setTimeout(() => setMsg(''), 2000); return; }

    const allItems = [
      ...form.items.map(i => ({ ...i, tipe: 'item' })),
      ...form.kotakList.map(k => ({ ...k, tipe: 'kotak' })),
    ];
    const payload = {
      tanggal: form.tanggal, nama: form.nama,
      items_detail: JSON.stringify(allItems),
      jumlah_item: totalJumlahItem,
      harga_kotak: form.hargaKotak || 0,
      total: totalHarga,
      status: form.status, catatan: form.catatan
    };
    try {
      Swal.fire({ title: 'Menyimpan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      await axios.post(`${API}/pembelian`, payload);
      Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Data pembelian tersimpan.', timer: 2000, showConfirmButton: false });
      setForm({ tanggal: form.tanggal, nama: '', items: [buatItemBaru()], kotakList: [], hargaKotak: '', status: 'Sudah Dibayar', catatan: '' });
      loadHariIni();
    } catch { Swal.fire({ icon: 'error', title: 'Gagal Simpan', text: 'Terjadi kesalahan.' }); }
  };

  const dataTampil = hariIni.filter(row => {
    const cocokSearch = search === '' || row.nama.toLowerCase().includes(search.toLowerCase()) || (row.catatan || '').toLowerCase().includes(search.toLowerCase());
    const cocokStatus = filterStatus === 'semua' || row.status === filterStatus;
    return cocokSearch && cocokStatus;
  });
  const totalTampil = dataTampil.reduce((s, r) => s + Number(r.total), 0);

  const thStyle = { fontSize: 11, color: '#94a3b8', fontWeight: 600 };
  const subTotalItem = (item) => (Number(item.jumlah) || 0) * (Number(item.harga) || 0);
  const totalHargaKotakForm = netKotakForm * (Number(form.hargaKotak) || 0);

  return (
    <div>
      {detailId && (
        <DetailPembelian id={detailId} onKembali={() => { setDetailId(null); loadHariIni(); }} />
      )}
      {!detailId && (<>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ color: '#dc2626', margin: 0 }}>🛒 Input Pembelian Ayam</h2>
          <button onClick={() => setShowKelola(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fef2f2', border: '1.5px solid #fca5a5', color: '#dc2626', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            ⚙️ Kelola Item &amp; Satuan
          </button>
        </div>
        {showKelola && (
          <ModalKelolaMaster
            onClose={() => setShowKelola(false)}
            onRefresh={loadMaster}
          />
        )}
        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="form-group">
            <label>Tanggal</label>
            <input type="date" value={form.tanggal} onChange={e => setForm({ ...form, tanggal: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Nama Supplier</label>
            <input type="text" placeholder="Nama supplier" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} />
          </div>
        </div>

        {/* ITEM */}
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label>🐔 Item</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 6, paddingLeft: 36 }}>
            <div style={{ width: 160, ...thStyle }}>Pilih Item</div>
            <div style={{ width: 90, ...thStyle, textAlign: 'center' }}>Jumlah</div>
            <div style={{ width: 110, ...thStyle, textAlign: 'center' }}>Satuan</div>
            <div style={{ width: 120, ...thStyle, textAlign: 'right' }}>Harga (Rp)</div>
            <div style={{ width: 130, ...thStyle, textAlign: 'right' }}>Subtotal</div>
          </div>
          {form.items.map((item, idx) => {
            const sub = subTotalItem(item);
            return (
              <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 700, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{idx + 1}</div>
                <select value={item.nama} onChange={e => updateItem(idx, 'nama', e.target.value)}
                  style={{ width: 160, padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13 }}>
                  <option value="">-- Pilih Item --</option>
                  {masterItem.map(n => <option key={n.id} value={n.nama}>{n.nama}</option>)}
                </select>
                <input type="number" placeholder="0" value={item.jumlah} min="0" step="0.5"
                  onChange={e => updateItem(idx, 'jumlah', e.target.value)}
                  style={{ width: 90, padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, textAlign: 'center' }} />
                <select value={item.satuan} onChange={e => updateItem(idx, 'satuan', e.target.value)}
                  style={{ width: 110, padding: '8px 8px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13 }}>
                  <option value="">-- Satuan --</option>
                  {masterSatuan.map(s => <option key={s.id} value={s.nama}>{s.nama}</option>)}
                </select>
                <input type="number" placeholder="0" value={item.harga} min="0"
                  onChange={e => updateItem(idx, 'harga', e.target.value)}
                  style={{ width: 120, padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, textAlign: 'right' }} />
                <div style={{ width: 130, fontSize: 13, fontWeight: 600, color: sub > 0 ? '#dc2626' : '#94a3b8', textAlign: 'right', paddingRight: 4 }}>
                  {sub > 0 ? `Rp ${sub.toLocaleString('id-ID')}` : '-'}
                </div>
                {form.items.length > 1
                  ? <button onClick={() => hapusItemRow(idx)} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 20, cursor: 'pointer', lineHeight: 1, width: 28 }}>×</button>
                  : <div style={{ width: 28 }} />}
              </div>
            );
          })}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingLeft: 36, paddingRight: 36 }}>
            <button onClick={tambahItem}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: '1.5px dashed #dc2626', color: '#dc2626', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              + Tambah Item
            </button>
            <div style={{ fontSize: 13, color: '#475569', textAlign: 'right' }}>
              Jumlah item: <b>{totalJumlahItemSaja}</b>&nbsp;&nbsp;|&nbsp;&nbsp;
              Total harga: <b style={{ color: '#dc2626' }}>Rp {form.items.reduce((s, i) => s + subTotalItem(i), 0).toLocaleString('id-ID')}</b>
            </div>
          </div>
        </div>

        {/* KOTAK */}
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label>📦 Kotak</label>
          {form.kotakList.length === 0 && <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>Belum ada kotak. Klik tombol di bawah untuk menambah.</div>}
          {form.kotakList.length > 0 && (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6, paddingLeft: 36 }}>
                <div style={{ width: 200, ...thStyle }}>Jenis Kotak</div>
                <div style={{ width: 90, ...thStyle, textAlign: 'center' }}>Jumlah</div>
              </div>
              {form.kotakList.map((k, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#fef9c3', color: '#92400e', fontSize: 12, fontWeight: 700, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{idx + 1}</div>
                  <select value={k.nama} onChange={e => updateKotak(idx, 'nama', e.target.value)}
                    style={{ width: 200, padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13 }}>
                    {NAMA_KOTAK.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <input type="number" placeholder="0" value={k.jumlah} min="0"
                    onChange={e => updateKotak(idx, 'jumlah', e.target.value)}
                    style={{ width: 90, padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, textAlign: 'center' }} />
                  <button onClick={() => hapusKotak(idx)} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 20, cursor: 'pointer', lineHeight: 1, width: 28 }}>×</button>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, paddingLeft: 36, paddingRight: 36 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>Harga:</span>
                  <span style={{ fontSize: 13, color: '#475569' }}>Rp</span>
                  <input type="number" placeholder="0" value={form.hargaKotak} min="0"
                    onChange={e => setForm({ ...form, hargaKotak: e.target.value })}
                    style={{ width: 130, padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, textAlign: 'right' }} />
                </div>
                <div style={{ fontSize: 13, color: '#475569', textAlign: 'right' }}>
                  Net kotak: <b>{netKotakForm}</b>&nbsp;&nbsp;|&nbsp;&nbsp;
                  Total harga: <b style={{ color: '#dc2626' }}>Rp {totalHargaKotakForm.toLocaleString('id-ID')}</b>
                </div>
              </div>
            </>
          )}
          <button onClick={tambahKotak}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: '1.5px dashed #d97706', color: '#d97706', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, marginTop: 8 }}>
            + Tambah Kotak
          </button>
        </div>

        {/* RINGKASAN */}
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 18px', marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: '#991b1b', fontWeight: 700, marginBottom: 8 }}>📊 Ringkasan</div>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 13, color: '#475569' }}>Total keseluruhan item: <b style={{ color: '#1e293b', fontSize: 15 }}>{totalJumlahItem}</b></div>
            <div style={{ fontSize: 13, color: '#475569' }}>Total keseluruhan harga: <b style={{ color: '#dc2626', fontSize: 16 }}>Rp {totalHarga.toLocaleString('id-ID')}</b></div>
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 14 }}>
          <label>Status</label>
          <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ maxWidth: 260 }}>
            {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label>Catatan</label>
          <textarea placeholder="Opsional..." value={form.catatan} onChange={e => setForm({ ...form, catatan: e.target.value })}
            rows={3} style={{ padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }} />
        </div>
        {msg && <p style={{ marginBottom: 12, color: '#dc2626', fontWeight: 600 }}>{msg}</p>}
        <button className="btn btn-primary" style={{ background: '#dc2626' }} onClick={handleSubmit}>💾 Simpan</button>
      </div>

      {/* TABEL HARI INI */}
      <div className="card">
        <h2>🛒 Data Pembelian {dayjs(hariIni[0]?.tanggal || new Date()).format('DD MMMM YYYY')} — Total: Rp {totalTampil.toLocaleString('id-ID')}</h2>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <input type="text" placeholder="Cari nama atau keterangan..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '9px 12px 9px 34px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14 }} />
          </div>
          {['semua', 'Sudah Dibayar', 'Belum Dibayar'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1.5px solid',
              borderColor: filterStatus === s ? (s === 'semua' ? '#dc2626' : s === 'Sudah Dibayar' ? '#059669' : '#dc2626') : '#e2e8f0',
              background: filterStatus === s ? (s === 'semua' ? '#fef2f2' : s === 'Sudah Dibayar' ? '#f0fdf4' : '#fef2f2') : 'white',
              color: filterStatus === s ? (s === 'semua' ? '#dc2626' : s === 'Sudah Dibayar' ? '#059669' : '#dc2626') : '#64748b',
            }}>
              {s === 'semua' ? '🔍 Semua' : s === 'Sudah Dibayar' ? '✅ Sudah Dibayar' : '❌ Belum Dibayar'}
            </button>
          ))}
          <span style={{ fontSize: 13, color: '#94a3b8', marginLeft: 'auto' }}>{dataTampil.length} data</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>Export Excel:</span>
          <input type="date" value={tglExport} onChange={e => setTglExport(e.target.value)}
            style={{ padding: '7px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13 }} />
          <button onClick={async () => {
            const res = await fetch(`${API}/export/pembelian-harian?tanggal=${tglExport}`);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `laporan-pembelian-harian-${tglExport}.xlsx`; a.click();
            URL.revokeObjectURL(url);
          }} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#dc2626', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24">
              <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 11l5 5 5-5M12 4v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Ekspor ke Excel
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>No</th><th>Nama</th><th>Jml Item</th><th>Harga</th><th>Total</th><th>Status</th><th>Ket.</th><th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {dataTampil.length === 0 && (
                <tr><td colSpan="8" style={{ textAlign: 'center', color: '#94a3b8', padding: 24 }}>Belum ada data hari ini</td></tr>
              )}
              {dataTampil.map((row, i) => (
                <tr key={row.id}>
                  <td>{i + 1}</td>
                  <td>{row.nama}</td>
                  <td style={{ textAlign: 'center' }}>
                    <EditableItemsPembelian row={row} onSaved={loadHariIni} />
                  </td>
                  <td><HargaInfo row={row} /></td>
                  <td><b style={{ color: '#dc2626' }}>Rp {Number(row.total).toLocaleString('id-ID')}</b></td>
                  <td>
                    <select value={row.status} onChange={e => updateStatusCatatan(row.id, 'status', e.target.value)}
                      style={{ padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1.5px solid',
                        borderColor: row.status === 'Sudah Dibayar' ? '#059669' : '#dc2626',
                        color: row.status === 'Sudah Dibayar' ? '#059669' : '#dc2626',
                        background: row.status === 'Sudah Dibayar' ? '#f0fdf4' : '#fef2f2' }}>
                      {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td><EditableText value={row.catatan} onSave={val => updateStatusCatatan(row.id, 'catatan', val)} /></td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button title="Lihat Detail" onClick={() => setDetailId(row.id)}
                      style={{ background: '#fef2f2', border: 'none', borderRadius: 8, padding: '6px 9px', marginRight: 6, cursor: 'pointer', color: '#dc2626', lineHeight: 1 }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>
                      </svg>
                    </button>
                    <button title="Hapus" onClick={() => hapusData(row.id)}
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
      </div>
      </>)}
    </div>
  );
}