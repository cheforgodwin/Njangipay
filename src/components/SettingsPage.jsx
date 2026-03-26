import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Moon, Sun, User, Bell, Shield, Smartphone, Save } from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import MainLayout from './MainLayout';

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
      <main className="container" style={{ paddingTop: '1rem', paddingBottom: '6rem' }}>
        <h1 style={{ marginBottom: '2rem' }}>Settings</h1>

        <div className="grid gap-2 settings-grid">
          <aside className="glass card" style={{ height: 'fit-content', padding: '1.5rem' }}>
            <div className="flex-center" style={{ flexDirection: 'column', paddingBottom: '2rem', borderBottom: '1px solid var(--glass-border)', marginBottom: '1.5rem' }}>
              <div className="avatar" style={{ width: '80px', height: '80px', fontSize: '2rem', marginBottom: '1rem' }}>
                {getUserDisplayName().substring(0, 2).toUpperCase()}
              </div>
              <h3 style={{ margin: 0 }}>{getUserDisplayName()}</h3>
              <p className="text-sub" style={{ fontSize: '0.9rem' }}>{currentUser?.email}</p>
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

          <div className="glass card" style={{ padding: '3rem' }}>
            <section style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Appearance</h2>
              <div className="flex-between glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Theme Mode</h3>
                  <p className="text-sub" style={{ fontSize: '0.9rem' }}>Customize how NjangiPay looks on your device.</p>
                </div>
                <button 
                  onClick={toggleTheme} 
                  className="btn-secondary flex gap-1"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 1.2rem' }}
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
              <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Profile Information</h2>
                <div className="grid gap-1 grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="displayName" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Display Name</label>
                    <input 
                      type="text" 
                      id="displayName"
                      name="displayName"
                      className="auth-input" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      style={{ width: '100%', background: 'var(--off-white)', border: '1px solid var(--glass-border)' }}
                    />
                  </div>
                  <div className="form-group">
                     <label className="form-label" htmlFor="emailAddress" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Email Address</label>
                     <input 
                       type="email" 
                       id="emailAddress"
                       name="emailAddress"
                       className="auth-input" 
                       defaultValue={currentUser?.email || ''} 
                       disabled
                       style={{ width: '100%', background: 'var(--accent-light)', border: '1px solid var(--glass-border)', cursor: 'not-allowed' }}
                     />
                  </div>
                </div>
                <button type="submit" className="btn-primary" style={{ marginTop: '2rem' }} disabled={updating}>
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
