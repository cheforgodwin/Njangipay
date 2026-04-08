import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, Moon, Sun, Bell, Settings, Menu as MenuIcon, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.svg';


const Navbar = ({ theme, toggleTheme, showLogo = true }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getUserName = () => {
    if (!currentUser) return 'Guest';
    return currentUser.displayName || currentUser.email.split('@')[0];
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className="app-navbar">
      {showLogo ? (
        <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src={logo} alt="NjangiPay" className="logo-icon" />
          NjangiPay
        </div>
      ) : (
        <div className="navbar-logo-spacer" style={{ flex: 1 }}></div>
      )}
      
      <div className={`nav-links ${isMenuOpen ? 'mobile-active' : ''}`}>
        <Link to="/" onClick={() => setIsMenuOpen(false)}>Home</Link>
        <a href="#features" onClick={() => setIsMenuOpen(false)}>Features</a>
        <a href="#about" onClick={() => setIsMenuOpen(false)}>About Us</a>
        {currentUser ? (
          <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
        ) : (
          <Link to="/login" onClick={() => setIsMenuOpen(false)}>Login</Link>
        )}
      </div>

      <div className="navbar-actions">
        {currentUser ? (
          <div className="user-profile-actions">
            <div className="notification-bell">
              <Bell color="#666" />
              <div className="notification-dot"></div>
            </div>
            <Link to="/settings" className="nav-settings-link hid-mob">
              <Settings size={20} color="#666" />
            </Link>
            <div className="avatar" onClick={() => navigate('/settings')} style={{ cursor: 'pointer' }}>
              {getUserName().substring(0, 2).toUpperCase()}
            </div>
          </div>
        ) : (
          <button onClick={() => navigate('/signup')} className="btn-primary hid-mob">Register</button>
        )}
        
        <button className="menu-btn-landing" onClick={toggleMenu}>
          {isMenuOpen ? <X size={26} /> : <MenuIcon size={26} />}
        </button>
      </div>

      <style>{`
        .menu-btn-landing {
          display: none;
          background: none;
          border: none;
          color: var(--text-main);
          cursor: pointer;
        }

        @media (max-width: 1024px) {
          .menu-btn-landing {
             display: flex;
             align-items: center;
             justify-content: center;
          }
          
          .nav-links {
             display: none;
             position: absolute;
             top: 100%;
             left: 0;
             right: 0;
             background: var(--white);
             flex-direction: column;
             padding: 2rem;
             gap: 1.5rem;
             border-bottom: 1px solid var(--glass-border);
             box-shadow: 0 10px 15px rgba(0,0,0,0.05);
             z-index: 999;
          }

          .nav-links.mobile-active {
             display: flex;
          }

          .hid-mob {
             display: none;
          }
        }
      `}</style>
    </nav>
  );
};


export default Navbar;

