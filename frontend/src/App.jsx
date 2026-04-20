import { HashRouter, Routes, Route, NavLink } from 'react-router-dom'; 
import FormInput from './pages/FormInput';
import DataPenjualan from './pages/DataPenjualan';
import Kas from './pages/Kas';
import './App.css';

export default function App() {
  return (
    <HashRouter>
      <div className="layout">
        <nav className="sidebar">
          <div className="logo">🐔 Penjualan Ayam</div>
          <NavLink to="/" end>📝 Input Penjualan Ayam</NavLink>
          <NavLink to="/data">📊 Data Penjualan Ayam</NavLink>
          <NavLink to="/kas">💵 Penjualan</NavLink>
        </nav>
        <main className="content">
          <Routes>
            <Route path="/" element={<FormInput />} />
            <Route path="/data" element={<DataPenjualan />} />
            <Route path="/kas" element={<Kas />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}