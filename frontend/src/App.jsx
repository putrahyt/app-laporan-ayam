import { HashRouter, Routes, Route, NavLink } from 'react-router-dom';
import { useState } from 'react';
import FormInput from './pages/FormInput';
import DataPenjualan from './pages/DataPenjualan';
import FormPembelian from './pages/FormPembelian';
import DataPembelian from './pages/DataPembelian';
import Kas from './pages/Kas';
import './App.css';

export default function App() {
  const [openPenjualan, setOpenPenjualan] = useState(true);
  const [openPembelian, setOpenPembelian] = useState(true);

  return (
    <HashRouter>
      <div className="layout">
        <nav className="sidebar">
          <div className="logo">🐔 Penjualan Ayam</div>

          {/* Grup Penjualan Ayam */}
          <div style={{ marginBottom: 4 }}>
            <div onClick={() => setOpenPenjualan(!openPenjualan)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#94a3b8', userSelect: 'none' }}>
              <span>📦 PENJUALAN AYAM</span>
              <span>{openPenjualan ? '▲' : '▼'}</span>
            </div>
            {openPenjualan && (
              <div style={{ paddingLeft: 10 }}>
                <NavLink to="/" end>📝 Input Penjualan</NavLink>
                <NavLink to="/data-penjualan">📊 Data Penjualan</NavLink>
              </div>
            )}
          </div>

          {/* Grup Pembelian Ayam */}
          <div style={{ marginBottom: 4 }}>
            <div onClick={() => setOpenPembelian(!openPembelian)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#94a3b8', userSelect: 'none' }}>
              <span>🛒 PEMBELIAN AYAM</span>
              <span>{openPembelian ? '▲' : '▼'}</span>
            </div>
            {openPembelian && (
              <div style={{ paddingLeft: 10 }}>
                <NavLink to="/input-pembelian">📝 Input Pembelian</NavLink>
                <NavLink to="/data-pembelian">📊 Data Pembelian</NavLink>
              </div>
            )}
          </div>

          <NavLink to="/keuangan">💵 Keuangan</NavLink>
        </nav>
        <main className="content">
          <Routes>
            <Route path="/" element={<FormInput />} />
            <Route path="/data-penjualan" element={<DataPenjualan />} />
            <Route path="/input-pembelian" element={<FormPembelian />} />
            <Route path="/data-pembelian" element={<DataPembelian />} />
            <Route path="/keuangan" element={<Kas />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}