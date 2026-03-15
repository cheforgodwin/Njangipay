import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, Moon, Sun, Bell, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.svg';


const Navbar = ({ theme, toggleTheme, showLogo = true }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const getUserName = () => {
    if (!currentUser) return 'Guest';
    return currentUser.displayName || currentUser.email.split('@')[0];
  };

  return (
    <nav className="app-navbar">
      {showLogo && (
        <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src={logo} alt="NjangiPay" className="logo-icon" />
          NjangiPay
        </div>
      )}
      <div className="nav-links">
        <Link to="/">Home</Link>
        <a href="#features">Features</a>
        <a href="#about">About Us</a>
        {currentUser ? (
          <Link to="/dashboard">Dashboard</Link>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>

      <div className="navbar-actions">
        {currentUser ? (
          <div className="user-profile-actions">
            <div className="notification-bell">
              <Bell color="#666" />
              <div className="notification-dot"></div>
            </div>
            <Link to="/settings" className="nav-settings-link">
              <Settings size={20} color="#666" />
            </Link>
            <div className="avatar" onClick={() => navigate('/settings')} style={{ cursor: 'pointer' }}>
              {getUserName().substring(0, 2).toUpperCase()}
            </div>
          </div>
        ) : (
          <button onClick={() => navigate('/signup')} className="btn-primary">Register</button>
        )}
      </div>
    </nav>
  );
};


export default Navbar;
