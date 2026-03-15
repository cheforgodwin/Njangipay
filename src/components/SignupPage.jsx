import { Leaf, Mail, Lock, ArrowRight, Chrome, User, Phone, CheckCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import logo from '../assets/logo.svg';
import './LoginPage.css'; // Reusing styles

const SignupPage = ({ theme, toggleTheme }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [usePhone, setUsePhone] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, googleSignIn, setupRecaptcha, phoneSignIn, currentUser } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      setError('');
      setLoading(true);
      await signup(email, password, phoneNumber);
      // Removed direct navigate here to allow AuthContext to update currentUser first
    } catch (err) {
      setError('Failed to create an account.');
      console.error(err);
      setLoading(false);
    }
  }

  async function handlePhoneSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      const appVerifier = setupRecaptcha('recaptcha-container');
      const result = await phoneSignIn(phoneNumber, appVerifier);
      setConfirmationResult(result);
      setCodeSent(true);
    } catch (err) {
      setError('Failed to send verification code. Please check the phone number.');
      console.error(err);
    }
    setLoading(false);
  }

  async function handleVerifyCode(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await confirmationResult.confirm(verificationCode);
      // Redirect handled by useEffect
    } catch (err) {
      setError('Invalid verification code.');
      console.error(err);
    }
    setLoading(false);
  }

  // Use useEffect to handle redirection once logged in
  useEffect(() => {
    if (!loading && currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, loading, navigate]);

  async function handleGoogleSignIn() {
    try {
      setError('');
      setLoading(true);
      await googleSignIn();
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to sign in with Google.');
      console.error(err);
    }
    setLoading(false);
  }

  return (
    <div className="auth-page-container">
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <div className="auth-wrapper">
        <div className="glass auth-card">
          <Link to="/" className="auth-logo logo">
             <img src={logo} alt="NjangiPay" className="logo-icon" />
             NjangiPay
          </Link>
          
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle text-sub">Start your community savings journey today.</p>

          {error && <div className="error-message" style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
          
          <div className="auth-toggle">
            <button 
              onClick={() => { setUsePhone(false); setError(''); }} 
              className={`btn-toggle ${!usePhone ? 'active' : ''}`}
            >
              Email
            </button>
            <button 
              onClick={() => { setUsePhone(true); setError(''); }} 
              className={`btn-toggle ${usePhone ? 'active' : ''}`}
            >
              Phone
            </button>
          </div>

          {!usePhone ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <Mail className="input-icon" size={18} />
                  <input 
                    type="email" 
                    id="email"
                    name="email"
                    className="auth-input"
                    placeholder="name@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="phoneNumber">Phone Number</label>
                <div className="input-wrapper">
                  <Phone className="input-icon" size={18} />
                  <input 
                    type="tel" 
                    id="phoneNumber"
                    name="phoneNumber"
                    className="auth-input"
                    placeholder="+1234567890" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={18} />
                  <input 
                    type="password" 
                    id="password"
                    name="password"
                    className="auth-input"
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={18} />
                  <input 
                    type="password" 
                    id="confirmPassword"
                    name="confirmPassword"
                    className="auth-input"
                    placeholder="••••••••" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <button 
                type="submit"
                className="btn-primary" 
                style={{ width: '100%', marginTop: '1rem' }}
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Sign Up'} <ArrowRight size={18} />
              </button>
            </form>
          ) : (
            <form onSubmit={codeSent ? handleVerifyCode : handlePhoneSubmit}>
              {!codeSent ? (
                <div className="form-group">
                  <label className="form-label" htmlFor="phoneAuth">Phone Number</label>
                  <div className="input-wrapper">
                    <Phone className="input-icon" size={18} />
                    <input 
                      type="tel" 
                      id="phoneAuth"
                      name="phoneAuth"
                      className="auth-input"
                      placeholder="+1234567890" 
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label" htmlFor="verificationCode">Verification Code</label>
                  <div className="input-wrapper">
                    <CheckCircle className="input-icon" size={18} />
                    <input 
                      type="text" 
                      id="verificationCode"
                      name="verificationCode"
                      className="auth-input"
                      placeholder="Enter 6-digit code" 
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}
              
              <button 
                type="submit"
                className="btn-primary" 
                style={{ width: '100%', marginTop: '1rem' }}
                disabled={loading}
              >
                {loading ? 'Processing...' : (codeSent ? 'Verify Code' : 'Send Code')} <ArrowRight size={18} />
              </button>
              <div id="recaptcha-container"></div>
            </form>
          )}

          <div className="auth-divider">
            <span>OR</span>
          </div>

          <button 
            onClick={handleGoogleSignIn}
            className="btn-secondary" 
            style={{ width: '100%', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            disabled={loading}
          >
            <Chrome size={18} /> Sign Up with Google
          </button>
          
          <p className="auth-footer text-sub">
            Already have an account? <span onClick={() => navigate('/login')}>Sign In</span>
          </p>
        </div>
      </div>
    </div>
  );
};



export default SignupPage;
