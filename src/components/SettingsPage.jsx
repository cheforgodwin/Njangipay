import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Moon, Sun, User, Bell, Shield, Smartphone, Save } from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import MainLayout from './MainLayout';
import './SettingsPage.css';

const SettingsPage = ({ theme, toggleTheme }) => {
  const { currentUser, getUserDisplayName } = useAuth();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [updating, setUpdating] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    setUpdating(true);
    try {
      await updateProfile(currentUser, { displayName });
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Update error:", error);
      alert("Failed to update profile.");
    } finally {
      setUpdating(false);
    }
  };


  return (
    <MainLayout theme={theme} toggleTheme={toggleTheme}>
      <main className="container settings-main">
        <h1 className="settings-heading">Settings</h1>

        <div className="grid gap-2 settings-grid">
          <aside className="glass card settings-aside-card">
            <div className="flex-center settings-avatar-container">
              <div className="avatar settings-avatar">
                {getUserDisplayName().substring(0, 2).toUpperCase()}
              </div>
              <h3 className="settings-username">{getUserDisplayName()}</h3>
              <p className="text-sub settings-email">{currentUser?.email}</p>
            </div>

            <nav className="sidebar-nav">
              <div className="nav-item active">
                <User size={20} /> Profile
              </div>
              <div className="nav-item">
                <Bell size={20} /> Notifications
              </div>
              <div className="nav-item">
                <Shield size={20} /> Security
              </div>
              <div className="nav-item">
                <Smartphone size={20} /> Linked Devices
              </div>
            </nav>
          </aside>

          <div className="glass card settings-content-card">
            <section className="settings-section">
              <h2 className="settings-section-title">Appearance</h2>
              <div className="flex-between glass settings-theme-box">
                <div>
                  <h3 className="settings-theme-title">Theme Mode</h3>
                  <p className="text-sub settings-theme-desc">Customize how NjangiPay looks on your device.</p>
                </div>
                <button 
                  onClick={toggleTheme} 
                  className="btn-secondary settings-theme-btn"
                >
                  {theme === 'light' ? (
                    <><Moon size={20} /> Dark Mode</>
                  ) : (
                    <><Sun size={20} /> Light Mode</>
                  )}
                </button>
              </div>
            </section>

            <form onSubmit={handleUpdateProfile}>
              <section className="settings-section">
                <h2 className="settings-section-title">Profile Information</h2>
                <div className="grid gap-1 grid-2">
                  <div className="form-group">
                    <label className="form-label settings-input-label" htmlFor="displayName">Display Name</label>
                    <input 
                      type="text" 
                      id="displayName"
                      name="displayName"
                      className="auth-input settings-input settings-input-active" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                     <label className="form-label settings-input-label" htmlFor="emailAddress">Email Address</label>
                     <input 
                       type="email" 
                       id="emailAddress"
                       name="emailAddress"
                       className="auth-input settings-input settings-input-disabled" 
                       defaultValue={currentUser?.email || ''} 
                       disabled
                     />
                  </div>
                </div>
                <button type="submit" className="btn-primary settings-submit-btn" disabled={updating}>
                  {updating ? "Saving..." : <><Save size={18} /> Update Profile</>}
                </button>
              </section>
            </form>

          </div>
        </div>
      </main>
    </MainLayout>
  );
};

export default SettingsPage;
