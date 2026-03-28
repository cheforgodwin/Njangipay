import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';
import Sidebar from './Sidebar';
import logo from '../assets/logo.svg';
import './Dashboard.css';

const MainLayout = ({ children, theme, toggleTheme }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="dashboard-page-container">
      <div className="mobile-header">
        <button className="menu-toggle" onClick={toggleSidebar}>
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <Link to="/" className="logo">
          <img src={logo} alt="NjangiPay" className="logo-icon" style={{ height: '32px' }} />
          NjangiPay
        </Link>
        <div style={{ width: '40px' }}></div> {/* Spacer for alignment */}
      </div>

      <Navbar theme={theme} toggleTheme={toggleTheme} showLogo={false} />
      
      <div className={`sidebar-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <Sidebar sidebarOpen={sidebarOpen} closeSidebar={closeSidebar} />

        <main className="dashboard-main">
          {children}
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
