import { useEffect, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';

const API = 'http://localhost:3001/api';

export default function DetailPembelian({ id, onKembali }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    // ✅ Pakai endpoint /pembelian/ bukan /penjualan/
    axios.get(`${API}/pembelian/${id}`).then(r => setData(r.data));
  }, [id]);

  if (!data) return <div className="card">Loading...</div>;

  let allItems = [];
  try { allItems = JSON.parse(data.items_detail || '[]'); } catch {}

  const isLegacy = allItems.length > 0 && allItems.every(x => !x.tipe);
  const items = isLegacy ? allItems : allItems.filter(x => x.tipe !== 'kotak');
  const kotakList = isLegacy ? [] : allItems.filter(x => x.tipe === 'kotak');

  const hargaKotak = Number(data.harga_kotak) || 0;
  const netKotak = kotakList.reduce((s, k) => {
    const v = Number(k.jumlah) || 0;
    return k.nama === 'Kotak Kosong' ? s - v : s + v;
  }, 0);
  const totalHargaKotak = netKotak * hargaKotak;
  const totalHargaItem = items.reduce((s, i) => s + (Number(i.jumlah) || 0) * (Number(i.harga) || 0), 0);

  const badge = (status) => ({
    padding: '3px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600,
    background: status === 'Sudah Dibayar' ? '#d1fae5' : '#fee2e2',
    color: status === 'Sudah Dibayar' ? '#065f46' : '#991b1b',
  });

  return (
    <div className="card" style={{ maxWidth: 780 }}>
      <h2 style={{ color: '#dc2626' }}>🔍 Detail Pembelian — {data.nama}</h2>

      <table style={{ marginBottom: 20, width: '100%' }}>
        <tbody>
          <tr>
            <td style={{ width: 140, color: '#475569', padding: '8px 0', verticalAlign: 'top' }}>Tanggal</td>
            <td style={{ fontWeight: 600 }}>{dayjs(data.tanggal).format('DD/MM/YYYY')}</td>
          </tr>
          <tr>
            <td style={{ color: '#475569', padding: '8px 0', verticalAlign: 'top' }}>Nama Supplier</td>
            <td style={{ fontWeight: 600 }}>{data.nama}</td>
          </tr>

          {/* ITEM */}
          {items.length > 0 && (
            <tr>
              <td style={{ color: '#475569', padding: '8px 0', verticalAlign: 'top' }}>🐔 Item</td>
              <td>
                {/* Header */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 5, fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>
                  <div style={{ width: 20 }}></div>
                  <div style={{ flex: 1 }}>NAMA</div>
                  <div style={{ width: 50, textAlign: 'center' }}>JML</div>
                  <div style={{ width: 45, textAlign: 'center' }}>SAT</div>
                  <div style={{ width: 110, textAlign: 'right' }}>HARGA</div>
                  <div style={{ width: 120, textAlign: 'right' }}>SUBTOTAL</div>
                </div>
                {items.map((item, i) => {
                  const sub = (Number(item.jumlah) || 0) * (Number(item.harga) || 0);
                  return (
                    <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 5, alignItems: 'center' }}>
                      <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#fef2f2', color: '#dc2626', fontSize: 10, fontWeight: 700, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                      <span style={{ flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', padding: '3px 8px', borderRadius: 6, fontSize: 13, fontWeight: 600 }}>{item.nama}</span>
                      <span style={{ width: 50, background: '#f8fafc', border: '1px solid #e2e8f0', padding: '3px 6px', borderRadius: 6, fontSize: 13, fontWeight: 600, textAlign: 'center' }}>{item.jumlah}</span>
                      <span style={{ width: 45, background: '#fef2f2', color: '#dc2626', padding: '3px 6px', borderRadius: 6, fontSize: 13, fontWeight: 600, textAlign: 'center' }}>{item.satuan}</span>
                      <span style={{ width: 110, fontSize: 12, color: '#475569', textAlign: 'right' }}>
                        {Number(item.harga) ? `Rp ${Number(item.harga).toLocaleString('id-ID')}` : <span style={{ color: '#94a3b8' }}>-</span>}
                      </span>
                      <span style={{ width: 120, fontSize: 13, fontWeight: 700, color: sub > 0 ? '#dc2626' : '#94a3b8', textAlign: 'right' }}>
                        {sub > 0 ? `Rp ${sub.toLocaleString('id-ID')}` : '-'}
                      </span>
                    </div>
                  );
                })}
                {/* Subtotal item */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4, gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#475569' }}>Jumlah item: <b>{items.reduce((s, i) => s + (Number(i.jumlah) || 0), 0)}</b></span>
                  <span style={{ fontSize: 12, color: '#475569', marginLeft: 16 }}>Total harga: <b style={{ color: '#dc2626' }}>Rp {totalHargaItem.toLocaleString('id-ID')}</b></span>
                </div>
              </td>
            </tr>
          )}

          {/* KOTAK */}
          {kotakList.length > 0 && (
            <tr>
              <td style={{ color: '#475569', padding: '8px 0', verticalAlign: 'top' }}>📦 Kotak</td>
              <td>
                <div style={{ display: 'flex', gap: 6, marginBottom: 5, fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>
                  <div style={{ width: 20 }}></div>
                  <div style={{ flex: 1 }}>JENIS</div>
                  <div style={{ width: 60, textAlign: 'center' }}>JUMLAH</div>
                </div>
                {kotakList.map((k, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 5, alignItems: 'center' }}>
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#fef9c3', color: '#92400e', fontSize: 10, fontWeight: 700, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                    <span style={{ flex: 1, background: '#fefce8', border: '1px solid #fde68a', padding: '3px 8px', borderRadius: 6, fontSize: 13, fontWeight: 600, color: '#92400e' }}>{k.nama}</span>
                    <span style={{ width: 60, background: '#fefce8', border: '1px solid #fde68a', padding: '3px 6px', borderRadius: 6, fontSize: 13, fontWeight: 600, color: '#92400e', textAlign: 'center' }}>{k.jumlah}</span>
                  </div>
                ))}
                {/* Perhitungan kotak */}
                <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', marginTop: 6, fontSize: 13 }}>
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', color: '#92400e' }}>
                    <span>Net kotak: <b>{netKotak}</b></span>
                    <span>Harga: <b>Rp {hargaKotak.toLocaleString('id-ID')}</b></span>
                    <span>Total harga: <b style={{ color: '#dc2626' }}>Rp {totalHargaKotak.toLocaleString('id-ID')}</b></span>
                  </div>
                </div>
              </td>
            </tr>
          )}

          <tr>
            <td style={{ color: '#475569', padding: '8px 0' }}>Total Keseluruhan Item</td>
            <td style={{ fontWeight: 600 }}>{Number(data.jumlah_item)}</td>
          </tr>
          <tr>
            <td style={{ color: '#475569', padding: '8px 0' }}>Total Keseluruhan Harga</td>
            <td style={{ fontWeight: 700, color: '#dc2626', fontSize: 17 }}>Rp {Number(data.total).toLocaleString('id-ID')}</td>
          </tr>
          <tr>
            <td style={{ color: '#475569', padding: '8px 0' }}>Status</td>
            <td><span style={badge(data.status)}>{data.status}</span></td>
          </tr>
          <tr>
            <td style={{ color: '#475569', padding: '8px 0', verticalAlign: 'top' }}>Catatan</td>
            <td style={{ color: data.catatan ? '#1e293b' : '#94a3b8' }}>{data.catatan || '-'}</td>
          </tr>
        </tbody>
      </table>
      <button className="btn btn-primary" style={{ background: '#dc2626' }} onClick={onKembali}>← Kembali</button>
    </div>
  );
}