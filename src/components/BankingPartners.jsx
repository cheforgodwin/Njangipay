import React from 'react';
import { Building2, Globe, ShieldCheck, CreditCard, Landmark, Banknote } from 'lucide-react';
import MainLayout from './MainLayout';

const BankingPartners = ({ theme, toggleTheme }) => {
  const partners = [
    {
      name: 'Ecobank',
      logo: 'Ecobank',
      description: 'Pan-African banking conglomerate.',
      color: '#005b82',
      icon: <Landmark size={40} />
    },
    {
      name: 'SCB Cameroon',
      logo: 'SCB',
      description: 'Standard Chartered Bank subsidiary.',
      color: '#00aed9',
      icon: <Globe size={40} />
    },
    {
      name: 'UBA',
      logo: 'UBA',
      description: 'United Bank for Africa.',
      color: '#cf102d',
      icon: <Building2 size={40} />
    },
    {
      name: 'Afriland First Bank',
      logo: 'Afriland',
      description: 'Leading bank in Cameroon.',
      color: '#27ae60',
      icon: <ShieldCheck size={40} />
    },
    {
      name: 'Express Union',
      logo: 'EU',
      description: 'Financial services and money transfer.',
      color: '#f39c12',
      icon: <Banknote size={40} />
    },
    {
      name: 'BCF Bank',
      logo: 'BCF',
      description: 'Commercial bank of Cameroon.',
      color: '#2c3e50',
      icon: <CreditCard size={40} />
    }
  ];

  return (
    <MainLayout theme={theme} toggleTheme={toggleTheme}>
      <div className="partners-page">
        <header className="dashboard-header">
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>
              Banking Partners
            </h1>
            <p style={{ color: 'var(--text-sub)', fontSize: '1.1rem' }}>
              Our trusted financial institutions ensuring secure and seamless transactions.
            </p>
          </div>
        </header>

        <section className="partners-intro" style={{ 
          background: 'var(--bg-gradient)', 
          padding: '2.5rem', 
          borderRadius: 'var(--radius-lg)', 
          marginBottom: '3rem',
          border: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <h2 style={{ color: 'var(--primary-green)', fontWeight: '700' }}>Our Trusted Banking Partners</h2>
          <p style={{ color: 'var(--text-main)', lineHeight: '1.6', maxWidth: '800px' }}>
            NjangiPay partners with leading financial institutions to provide you with the most secure, 
            reliable, and efficient financial management experience. Our integration with these 
            partners allows for instant deposits, withdrawals, and real-time transaction monitoring.
          </p>
        </section>

        <div className="dashboard-grid">
          {partners.map((bank, index) => (
            <div key={index} className="partner-card" style={{
              background: 'var(--white)',
              borderRadius: 'var(--radius-md)',
              padding: '2rem',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div className="partner-icon-wrapper" style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: `${bank.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: bank.color,
                marginBottom: '1.5rem'
              }}>
                {bank.icon}
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>
                {bank.name}
              </h3>
              <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                {bank.description}
              </p>
              <div style={{
                marginTop: 'auto',
                fontSize: '0.8rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                color: bank.color,
                letterSpacing: '0.5px'
              }}>
                Verified Partner
              </div>
            </div>
          ))}
        </div>

        <style>{`
          .partner-card:hover {
            transform: translateY(-5px);
            box-shadow: var(--shadow-md);
            border-color: var(--primary-light);
          }
          
          .partner-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background: currentColor;
            opacity: 0.8;
          }

          @media (max-width: 768px) {
            .partners-intro {
              padding: 1.5rem !important;
            }
            .dashboard-header h1 {
              font-size: 1.5rem !important;
            }
          }
        `}</style>
      </div>
    </MainLayout>
  );
};

export default BankingPartners;
