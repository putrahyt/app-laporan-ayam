import { useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';

const API = 'http://localhost:3001/api';

export default function LaporanBulanan() {
  const [bulan, setBulan] = useState(dayjs().format('MM'));
  const [tahun, setTahun] = useState(dayjs().format('YYYY'));
  const [data, setData] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const load = () => {
    axios.get(`${API}/penjualan?dari=${tahun}-${bulan}-01&sampai=${tahun}-${bulan}-31`)
      .then(r => { setData(r.data); setLoaded(true); });
  };

  const exportExcel = () => {
    window.open(`${API}/export/bulanan?bulan=${bulan}&tahun=${tahun}`);
  };

  const total = data.reduce((s, r) => s + Number(r.total), 0);
  const namaBulan = ['','Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

  return (
    <div className="card">
      <h2>📊 Laporan Bulanan</h2>
      <div className="search-bar">
        <div className="form-group">
          <label>Bulan</label>
          <select value={bulan} onChange={e => setBulan(e.target.value)}>
            {namaBulan.slice(1).map((n,i) => <option key={i+1} value={String(i+1).padStart(2,'0')}>{n}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Tahun</label>
          <input type="number" value={tahun} onChange={e => setTahun(e.target.value)} style={{width:90}}/>
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
            <th>No</th><th>Tanggal</th><th>Nama</th><th>Item</th><th>Kilo</th>
            <th>Kotak Isi</th><th>Kotak Kosong</th><th>Harga</th><th>Total</th><th>Status</th>
          </tr></thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={row.id}>
                <td>{i+1}</td>
                <td>{dayjs(row.tanggal).format('DD/MM/YYYY')}</td>
                <td>{row.nama_customer}</td>
                <td>{row.nama_item}</td>
                <td>{row.kilo} kg</td>
                <td>{row.kotak_isi}</td>
                <td>{row.kotak_kosong}</td>
                <td>Rp {Number(row.harga).toLocaleString('id-ID')}</td>
                <td><b>Rp {Number(row.total).toLocaleString('id-ID')}</b></td>
                <td><span className={`badge badge-${row.status}`}>{row.status}</span></td>
              </tr>
            ))}
            <tr className="total-row">
              <td colSpan="8" style={{textAlign:'right'}}>Grand Total:</td>
              <td><b>Rp {total.toLocaleString('id-ID')}</b></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}