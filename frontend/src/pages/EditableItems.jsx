import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const API = 'http://localhost:3001/api';

export const NAMA_ITEM = [
  'Ayam', 'Ceker Ayam', 'Kepala Ayam', 'Drambon', 'Takbone', 'Sayap',
  'Leher', 'Kepala Leher', 'Hati', 'Rangka', 'Hati Ampela Usus', 'Ayam Hidup',
];
export const SATUAN_ITEM = ['Kg', 'Bks', 'Pcs', 'Kotak'];
export const NAMA_KOTAK = ['Kotak Isi (Ayam Hidup)', 'Kotak Kosong'];

function buatItemBaru() {
  return { tipe: 'item', nama: '', jumlah: '', satuan: '', harga: '' };
}
function buatKotakBaru() {
  return { tipe: 'kotak', nama: 'Kotak Isi (Ayam Hidup)', jumlah: '' };
}

function hitungJumlahItem(items, kotakList) {
  const ti = items.reduce((s, i) => s + (Number(i.jumlah) || 0), 0);
  const tk = kotakList.reduce((s, k) => {
    const v = Number(k.jumlah) || 0;
    return k.nama === 'Kotak Kosong' ? s - v : s + v;
  }, 0);
  return ti + tk;
}

function hitungTotal(items, kotakList, hargaKotak) {
  const ti = items.reduce((s, i) => s + (Number(i.jumlah) || 0) * (Number(i.harga) || 0), 0);
  const netK = kotakList.reduce((s, k) => {
    const v = Number(k.jumlah) || 0;
    return k.nama === 'Kotak Kosong' ? s - v : s + v;
  }, 0);
  return ti + netK * (Number(hargaKotak) || 0);
}

export default function EditableItems({ row, onSaved }) {
  const [masterItem, setMasterItem] = useState([]);
  const [masterSatuan, setMasterSatuan] = useState([]);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [kotakList, setKotakList] = useState([]);
  const [hargaKotak, setHargaKotak] = useState('');
  const [saving, setSaving] = useState(false);
  const popupRef = useRef(null);

  useEffect(() => {
    if (open) {
      axios.get(`${API}/master-item`).then(r => setMasterItem(r.data));
      axios.get(`${API}/master-satuan`).then(r => setMasterSatuan(r.data));
    }
  }, [open]);

  const buka = () => {
    let parsed = [];
    try { parsed = JSON.parse(row.items_detail || '[]'); } catch {}
    const isLegacy = parsed.length > 0 && parsed.every(x => !x.tipe);
    if (isLegacy) {
      setItems(parsed.map(x => ({ tipe: 'item', nama: x.nama || '', jumlah: x.jumlah ?? '', satuan: x.satuan || '', harga: x.harga || '' })));
      setKotakList([]);
    } else {
      const it = parsed.filter(x => x.tipe !== 'kotak');
      const kt = parsed.filter(x => x.tipe === 'kotak');
      setItems(it.length > 0 ? it : [buatItemBaru()]);
      setKotakList(kt);
    }
    // FIX: pastikan hargaKotak ke-load dengan benar dari row
    const hk = row.harga_kotak !== null && row.harga_kotak !== undefined
      ? String(Number(row.harga_kotak))
      : '';
    setHargaKotak(hk);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const updateItem = (idx, field, val) => {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: val };
    setItems(next);
  };
  const tambahItem = () => setItems([...items, buatItemBaru()]);
  const hapusItem = (idx) => { if (items.length > 1) setItems(items.filter((_, i) => i !== idx)); };

  const updateKotak = (idx, field, val) => {
    const next = [...kotakList];
    next[idx] = { ...next[idx], [field]: val };
    setKotakList(next);
  };
  const tambahKotak = () => setKotakList([...kotakList, buatKotakBaru()]);
  const hapusKotak = (idx) => setKotakList(kotakList.filter((_, i) => i !== idx));

  // Kalkulasi
  const itemsYangDiisi = items.filter(i => i.nama);
  const jumlahTotal = hitungJumlahItem(itemsYangDiisi, kotakList);
  const totalKeseluruhan = hitungTotal(itemsYangDiisi, kotakList, hargaKotak);
  const totalItemSaja = itemsYangDiisi.reduce((s, i) => s + (Number(i.jumlah) || 0), 0);
  const netKotak = kotakList.reduce((s, k) => {
    const v = Number(k.jumlah) || 0;
    return k.nama === 'Kotak Kosong' ? s - v : s + v;
  }, 0);
  const totalHargaKotak = netKotak * (Number(hargaKotak) || 0);
  const totalHargaItem = itemsYangDiisi.reduce((s, i) => s + (Number(i.jumlah) || 0) * (Number(i.harga) || 0), 0);

  const simpan = async () => {
    const adaItem = itemsYangDiisi.length > 0;
    const adaKotak = kotakList.length > 0;

    if (!adaItem && !adaKotak) {
      Swal.fire({ icon: 'warning', title: 'Perhatian', text: 'Minimal isi satu item atau satu kotak!', confirmButtonColor: '#2563eb' });
      return;
    }
    if (adaItem && itemsYangDiisi.some(i => !i.jumlah)) {
      Swal.fire({ icon: 'warning', title: 'Perhatian', text: 'Jumlah item wajib diisi!', confirmButtonColor: '#2563eb' });
      return;
    }
    if (adaKotak && kotakList.some(k => !k.jumlah)) {
      Swal.fire({ icon: 'warning', title: 'Perhatian', text: 'Jumlah kotak wajib diisi!', confirmButtonColor: '#2563eb' });
      return;
    }

    const konfirm = await Swal.fire({
      title: 'Simpan perubahan?',
      text: `Data item untuk ${row.nama} akan diperbarui.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, simpan',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#e2e8f0',
    });

    if (!konfirm.isConfirmed) return;

    setSaving(true);
    try {
      const allItems = [...itemsYangDiisi, ...kotakList];
      const jumlah_item = hitungJumlahItem(itemsYangDiisi, kotakList);
      const total = hitungTotal(itemsYangDiisi, kotakList, hargaKotak);
      await axios.patch(`${API}/penjualan/${row.id}`, {
        items_detail: JSON.stringify(allItems),
        harga_kotak: Number(hargaKotak) || 0,
        jumlah_item,
        total,
      });
      Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Data item berhasil diperbarui.', timer: 1800, showConfirmButton: false });
      setOpen(false);
      onSaved && onSaved();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal!', text: 'Terjadi kesalahan saat menyimpan.', confirmButtonColor: '#2563eb' });
    } finally {
      setSaving(false);
    }
  };

  const thStyle = { fontSize: 11, color: '#94a3b8', fontWeight: 600 };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <span onClick={buka} title="Klik untuk edit"
        style={{ cursor: 'pointer', fontSize: 13, color: '#1e293b', borderBottom: '1px dashed #94a3b8', paddingBottom: 1 }}>
        {Number(row.jumlah_item).toLocaleString('id-ID')}
      </span>

      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.25)' }}>
          <div ref={popupRef} style={{ background: 'white', borderRadius: 14, padding: '18px 20px', boxShadow: '0 8px 40px rgba(37,99,235,0.15)', width: 620, maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#2563eb', marginBottom: 12 }}>✏️ Edit Item & Harga — {row.nama}</div>

            {/* === ITEM — hanya tampil kalau ada item yang diisi === */}
            {itemsYangDiisi.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>🐔 ITEM</div>
                <div style={{ display: 'flex', gap: 7, marginBottom: 5, paddingLeft: 30 }}>
                  <div style={{ width: 140, ...thStyle }}>Nama Item</div>
                  <div style={{ width: 65, ...thStyle, textAlign: 'center' }}>Jumlah</div>
                  <div style={{ width: 75, ...thStyle, textAlign: 'center' }}>Satuan</div>
                  <div style={{ width: 95, ...thStyle, textAlign: 'right' }}>Harga (Rp)</div>
                  <div style={{ width: 100, ...thStyle, textAlign: 'right' }}>Subtotal</div>
                </div>
                {items.map((item, idx) => {
                  const sub = (Number(item.jumlah) || 0) * (Number(item.harga) || 0);
                  return (
                    <div key={idx} style={{ display: 'flex', gap: 7, marginBottom: 7, alignItems: 'center' }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#eff6ff', color: '#2563eb', fontSize: 11, fontWeight: 700, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {idx + 1}
                      </div>
                      <select value={item.nama} onChange={e => updateItem(idx, 'nama', e.target.value)}
                        style={{ width: 140, padding: '5px 7px', border: '1px solid #cbd5e1', borderRadius: 7, fontSize: 12 }}>
                        <option value="">-- Pilih --</option>
                        {masterItem.map(n => <option key={n.id} value={n.nama}>{n.nama}</option>)}
                      </select>
                      <input type="number" placeholder="0" min="0" step="0.5" value={item.jumlah}
                        onChange={e => updateItem(idx, 'jumlah', e.target.value)}
                        style={{ width: 65, padding: '5px 6px', border: '1px solid #cbd5e1', borderRadius: 7, fontSize: 12, textAlign: 'center' }} />
                      <select value={item.satuan} onChange={e => updateItem(idx, 'satuan', e.target.value)}
                        style={{ width: 75, padding: '5px 4px', border: '1px solid #cbd5e1', borderRadius: 7, fontSize: 12 }}>
                        <option value="">--</option>
                        {masterSatuan.map(s => <option key={s.id} value={s.nama}>{s.nama}</option>)}
                      </select>
                      <input type="number" placeholder="0" min="0" value={item.harga}
                        onChange={e => updateItem(idx, 'harga', e.target.value)}
                        style={{ width: 95, padding: '5px 6px', border: '1px solid #cbd5e1', borderRadius: 7, fontSize: 12, textAlign: 'right' }} />
                      <div style={{ width: 100, fontSize: 12, fontWeight: 600, color: sub > 0 ? '#059669' : '#94a3b8', textAlign: 'right' }}>
                        {sub > 0 ? `Rp ${sub.toLocaleString('id-ID')}` : '-'}
                      </div>
                      {items.length > 1
                        ? <button onClick={() => hapusItem(idx)} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 17, cursor: 'pointer', lineHeight: 1, padding: '0 2px' }}>×</button>
                        : <div style={{ width: 18 }} />}
                    </div>
                  );
                })}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingLeft: 30 }}>
                  <button onClick={tambahItem}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: '1.5px dashed #2563eb', color: '#2563eb', borderRadius: 7, padding: '4px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                    + Tambah Item
                  </button>
                  <div style={{ fontSize: 12, color: '#475569', textAlign: 'right' }}>
                    Jml item: <b>{totalItemSaja}</b> &nbsp;|&nbsp; Total harga: <b style={{ color: '#059669' }}>Rp {totalHargaItem.toLocaleString('id-ID')}</b>
                  </div>
                </div>
              </div>
            )}

            {/* === KOTAK — hanya tampil kalau ada kotak === */}
            {kotakList.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>📦 KOTAK</div>
                <div style={{ display: 'flex', gap: 7, marginBottom: 5, paddingLeft: 30 }}>
                  <div style={{ width: 180, ...thStyle }}>Jenis Kotak</div>
                  <div style={{ width: 65, ...thStyle, textAlign: 'center' }}>Jumlah</div>
                </div>
                {kotakList.map((k, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 7, marginBottom: 7, alignItems: 'center' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fef9c3', color: '#92400e', fontSize: 11, fontWeight: 700, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {idx + 1}
                    </div>
                    <select value={k.nama} onChange={e => updateKotak(idx, 'nama', e.target.value)}
                      style={{ width: 180, padding: '5px 7px', border: '1px solid #cbd5e1', borderRadius: 7, fontSize: 12 }}>
                      {NAMA_KOTAK.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <input type="number" placeholder="0" min="0" value={k.jumlah}
                      onChange={e => updateKotak(idx, 'jumlah', e.target.value)}
                      style={{ width: 65, padding: '5px 6px', border: '1px solid #cbd5e1', borderRadius: 7, fontSize: 12, textAlign: 'center' }} />
                    <button onClick={() => hapusKotak(idx)} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 17, cursor: 'pointer', lineHeight: 1 }}>×</button>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, paddingLeft: 30 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>Harga: Rp</span>
                    <input type="number" placeholder="0" min="0"
                      value={hargaKotak}
                      onChange={e => setHargaKotak(e.target.value)}
                      style={{ width: 120, padding: '5px 7px', border: '2px solid #2563eb', borderRadius: 7, fontSize: 13, textAlign: 'right', fontWeight: 600 }} />
                  </div>
                  <div style={{ fontSize: 12, color: '#475569', textAlign: 'right' }}>
                    Net kotak: <b>{netKotak}</b> &nbsp;|&nbsp; Total harga: <b style={{ color: '#059669' }}>Rp {totalHargaKotak.toLocaleString('id-ID')}</b>
                  </div>
                </div>
              </div>
            )}

            {/* Ringkasan total */}
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '8px 14px', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: '#475569' }}>
                Total keseluruhan item: <b style={{ color: '#1e293b' }}>{jumlahTotal}</b>
                &nbsp;&nbsp;|&nbsp;&nbsp;
                Total keseluruhan harga: <b style={{ color: '#059669' }}>Rp {totalKeseluruhan.toLocaleString('id-ID')}</b>
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={simpan} disabled={saving}
                style={{ flex: 1, padding: '9px 0', background: saving ? '#93c5fd' : '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? '⏳ Menyimpan...' : '💾 Simpan'}
              </button>
              <button onClick={() => setOpen(false)}
                style={{ padding: '9px 16px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}