import React from 'react';
import MainLayout from './MainLayout';

const PlaceholderPage = ({ title, theme, toggleTheme }) => {
  return (
    <MainLayout theme={theme} toggleTheme={toggleTheme}>
      <header className="dashboard-header">
        <div>
          <h1>{title}</h1>
          <p className="text-sub">This module is currently under development.</p>
        </div>
      </header>
      <div className="glass card" style={{ padding: '3rem', textAlign: 'center', minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚧</div>
        <h2>Coming Soon</h2>
        <p className="text-muted">The <strong>{title}</strong> feature will be available in the next release.</p>
      </div>
    </MainLayout>
  );
};

export default PlaceholderPage;
