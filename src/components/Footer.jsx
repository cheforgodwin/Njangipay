import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Mail, 
  Phone, 
  MapPin,
  ShieldCheck,
  Globe
} from 'lucide-react';
import logo from '../assets/logo.svg';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-container">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-brand">
            <Link to="/" className="logo footer-logo">
              <img src={logo} alt="NjangiPay" className="logo-icon" />
              NjangiPay
            </Link>
            <p className="footer-tagline">
              Revolutionizing community finance through secure, transparent, and AI-driven collective savings and micro-lending.
            </p>
            <div className="social-links">
              <a href="#" aria-label="Facebook"><Facebook size={20} /></a>
              <a href="#" aria-label="Twitter"><Twitter size={20} /></a>
              <a href="#" aria-label="Instagram"><Instagram size={20} /></a>
              <a href="#" aria-label="Linkedin"><Linkedin size={20} /></a>
            </div>
          </div>

          {/* Product Links */}
          <div className="footer-links">
            <h3>Product</h3>
            <ul>
              <li><Link to="/groups">Savings Groups</Link></li>
              <li><Link to="/marketplace">Marketplace</Link></li>
              <li><Link to="/partners">Banking Partners</Link></li>
              <li><Link to="/admin/ai-risk-scores">AI Risk Center</Link></li>
              <li><Link to="/investor">Investor Suite</Link></li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="footer-links">
            <h3>Company</h3>
            <ul>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Press Kit</a></li>
              <li><a href="#">Security</a></li>
              <li><a href="#">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-contact">
            <h3>Contact</h3>
            <ul>
              <li><Mail size={18} /> support@njangipay.com</li>
              <li><Phone size={18} /> +237 600 000 000</li>
              <li><MapPin size={18} /> Douala, Cameroon</li>
              <li className="badge footer-badge"><ShieldCheck size={16} /> PCI-DSS Compliant</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="flex-between">
            <p>&copy; {currentYear} NjangiPay Financial. All rights reserved.</p>
            <div className="footer-legal">
              <a href="#">Terms of Service</a>
              <a href="#">Cookie Policy</a>
              <div className="flex-center gap-1" style={{ color: 'var(--text-muted)', marginLeft: '1rem' }}>
                <Globe size={16} /> English (US)
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
