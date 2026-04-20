import { useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';

const API = 'http://localhost:3001/api';

export default function LaporanHarian() {
  const [tanggal, setTanggal] = useState(dayjs().format('YYYY-MM-DD'));
  const [search, setSearch] = useState('');
  const [data, setData] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const load = () => {
    axios.get(`${API}/penjualan?dari=${tanggal}&sampai=${tanggal}&search=${search}`)
      .then(r => { setData(r.data); setLoaded(true); });
  };

  const exportExcel = () => {
    window.open(`${API}/export/harian?tanggal=${tanggal}`);
  };

  const total = data.reduce((s, r) => s + Number(r.total), 0);

  return (
    <div className="card">
      <h2>📅 Laporan Harian</h2>
      <div className="search-bar">
        <div className="form-group">
          <label>Tanggal</label>
          <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)}/>
        </div>
        <div className="form-group">
          <label>Cari nama / item</label>
          <input placeholder="Ketik untuk cari..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <div className="form-group" style={{justifyContent:'flex-end'}}>
          <label>&nbsp;</label>
          <button className="btn btn-primary" onClick={load}>🔍 Tampilkan</button>
        </div>
        {loaded && (
          <div className="form-group" style={{justifyContent:'flex-end'}}>
            <label>&nbsp;</label>
            <button className="btn btn-success" onClick={exportExcel}>📥 Export Excel</button>
          </div>
        )}
      </div>
      {loaded && (
        <table>
          <thead><tr>
            <th>No</th><th>Nama</th><th>Item</th><th>Kilo</th>
            <th>Kotak Isi</th><th>Kotak Kosong</th><th>Harga</th><th>Total</th>
            <th>Status</th><th>Keterangan</th>
          </tr></thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={row.id}>
                <td>{i+1}</td>
                <td>{row.nama}</td>
                <td>{row.nama_item}</td>
                <td>{row.kilo} kg</td>
                <td>{row.kotak_isi}</td>
                <td>{row.kotak_kosong}</td>
                <td>Rp {Number(row.harga).toLocaleString('id-ID')}</td>
                <td><b>Rp {Number(row.total).toLocaleString('id-ID')}</b></td>
                <td><span className={`badge badge-${row.status}`}>{row.status}</span></td>
                <td>{row.keterangan}</td>
              </tr>
            ))}
            <tr className="total-row">
              <td colSpan="7" style={{textAlign:'right'}}>Total:</td>
              <td><b>Rp {total.toLocaleString('id-ID')}</b></td>
              <td colSpan="2"></td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}