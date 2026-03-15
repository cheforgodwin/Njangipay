import React from 'react';
import { Shield, Brain, Users, Smartphone, Zap, HeartHandshake } from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: <Brain size={32} color="var(--primary-green)" />,
      title: "AI Risk Scoring",
      description: "Advanced machine learning models analyze community trust and contribution patterns to predict creditworthiness accurately."
    },
    {
      icon: <Shield size={32} color="var(--primary-green)" />,
      title: "Secure P2P Lending",
      description: "Bank-grade encryption ensures your funds and data are protected. Connect directly with trusted community members."
    },
    {
      icon: <Users size={32} color="var(--primary-green)" />,
      title: "Community Growth",
      description: "Nurture your savings circles and unlock higher credit limits as your community standing improves through consistent participation."
    },
    {
      icon: <Zap size={32} color="var(--primary-green)" />,
      title: "Automated Payouts",
      description: "Say goodbye to manual tracking. Our smart system automates contributions and payouts based on the circle's schedule."
    },
    {
      icon: <Smartphone size={32} color="var(--primary-green)" />,
      title: "Mobile First Experience",
      description: "Manage your finances on the go. Optimized for all screen sizes with a seamless, intuitive mobile interface."
    },
    {
      icon: <HeartHandshake size={32} color="var(--primary-green)" />,
      title: "Financial Inclusion",
      description: "Digitizing the traditional Njangi model to bring fair financial tools to everyone, regardless of formal banking history."
    }
  ];

  return (
    <section id="features" className="features-section" style={{ padding: '80px 0', background: 'var(--white)' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div className="badge" style={{ margin: '0 auto 15px' }}>Platform Excellence</div>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>Built for the <span style={{ color: 'var(--primary-green)' }}>Next Generation</span> of Savers</h2>
          <p className="text-sub" style={{ maxWidth: '700px', margin: '0 auto', fontSize: '1.1rem' }}>
            NjangiPay combines ancient community wisdom with modern technology to deliver a financial ecosystem that actually works for you.
          </p>
        </div>

        <div className="features-grid grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '30px' 
        }}>
          {features.map((feature, index) => (
            <div key={index} className="glass card feature-card" style={{ 
              padding: '40px', 
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              cursor: 'default'
            }}>
              <div style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '15px', 
                background: 'var(--accent-light)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: '20px'
              }}>
                {feature.icon}
              </div>
              <h3 style={{ marginBottom: '15px', fontSize: '1.3rem' }}>{feature.title}</h3>
              <p className="text-muted" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .feature-card:hover {
          transform: translateY(-10px);
          box-shadow: var(--shadow-lg);
          border-color: var(--primary-green);
        }
        @media (max-width: 768px) {
          .features-section {
             padding: 40px 15px !important;
          }
          .features-grid {
             grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
};

export default FeaturesSection;
