import { 
  Mail, 
  Lock, 
  Phone, 
  User,
  CheckCircle, 
  Eye, 
  EyeOff,
  ArrowRight
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth, storage, db } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Navbar from './Navbar';
import './LoginPage.css';

const LoginPage = ({ theme, toggleTheme }) => {
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [usePhone, setUsePhone] = useState(false);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [idCardFile, setIdCardFile] = useState(null);
  const [codeSent, setCodeSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser, userData, login, googleSignIn, setupRecaptcha, phoneSignIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && currentUser) {
      const role = userData?.role || 'user';
      const target = getRoleRedirect(role);
      console.log('Auto-redirect from login to', target);
      navigate(target, { replace: true });
    }
  }, [currentUser, userData, authLoading, navigate]);

  const getRoleRedirect = (role) => {
    if (role === 'super-admin') return '/super-admin';
    if (role === 'bank-admin') return '/bank-dashboard';
    if (role === 'admin') return '/admin/communities';
    if (role === 'community-admin') return '/admin/communities';
    if (role === 'community') return '/groups';
    if (role === 'leader') return '/leader';
    if (role === 'auditor') return '/auditor';
    return '/dashboard';
  };

  async function handleSubmit(e) {
    e.preventDefault();
    
    // Form validation
    if (!username.trim()) {
      setError('Please enter your username or email');
      return;
    }
    
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      const result = await login(username, password);
      
      if (!result.user.emailVerified) {
        alert("Quick Note: Your email is not verified yet. Please check your inbox for the verification link to secure your account.");
      }

      // Fetch user doc
      const userRef = doc(db, 'users', result.user.uid);
      const snap = await getDoc(userRef);
      const data = snap.exists() ? snap.data() : {};
      const role = data.role || 'user';
      console.log('Login successful, role:', role, 'navigating to:', getRoleRedirect(role));

      // If user provided verification info during login, update their doc
      if (fullName || idCardFile) {
        let idUrl = data.idCardUrl || '';
        if (idCardFile) {
          const sRef = ref(storage, `kyc/${idCardFile.name}-${Date.now()}`);
          await uploadBytes(sRef, idCardFile);
          idUrl = await getDownloadURL(sRef);
        }
        await updateDoc(userRef, {
          fullName: fullName || data.fullName || '',
          idCardUrl: idUrl,
          isVerified: false // Admin still needs to check
        });
      }

      navigate(getRoleRedirect(role), { replace: true });
      console.log('Navigated to:', getRoleRedirect(role));
    } catch (err) {
      setError('Failed to log in. Please check your credentials.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      setError('');
      setLoading(true);
      const result = await googleSignIn();
      const { getDoc, doc } = await import('firebase/firestore');
      const { db } = await import('../config/firebase');
      const snap = await getDoc(doc(db, 'users', result.user.uid));
      const role = snap.exists() ? snap.data().role : 'user';
      navigate(getRoleRedirect(role), { replace: true });
      console.log('Google signed in, navigated to:', getRoleRedirect(role));
    } catch (err) {
      setError('Failed to sign in with Google.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }
  async function handlePhoneSubmit(e) {
    e.preventDefault();
    
    // Phone validation
    if (!phoneNumber.trim()) {
      setError('Please enter your phone number');
      return;
    }
    
    // Validate Cameroon phone number format
    const phoneRegex = /^(\+237)?6[5-9]\d{7}$/;
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    if (!phoneRegex.test(cleanPhone) && !phoneRegex.test('+' + cleanPhone)) {
      setError('Please enter a valid Cameroon phone number (MTN/Orange format: 6XXXXXXXX)');
      return;
    }
    
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
    
    // Code validation
    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }
    
    if (verificationCode.length !== 6) {
      setError('Verification code must be 6 digits');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      const result = await confirmationResult.confirm(verificationCode);
      const { getDoc, doc } = await import('firebase/firestore');
      const { db } = await import('../config/firebase');
      const snap = await getDoc(doc(db, 'users', result.user.uid));
      const role = snap.exists() ? snap.data().role : 'user';
      navigate(getRoleRedirect(role), { replace: true });
      console.log('Phone verified, navigated to:', getRoleRedirect(role));
    } catch (err) {
      setError('Invalid verification code. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page-container">
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <div className="auth-wrapper">
        <div className="glass auth-card">
          <Link to="/" className="auth-logo logo">
            NjangiPay
          </Link>
          
          <h2 className="auth-title">Welcome Back!</h2>
          <p className="auth-subtitle text-sub">Log in to manage your community savings.</p>

          {error && <div className="error-message" style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

          {currentUser && !authLoading && (
            <div className="info-message" style={{ color: 'var(--primary-green)', marginBottom: '1rem', textAlign: 'center' }}>
              You are already signed in. If you want to use a different account, please log out first.
              <button 
                type="button" 
                onClick={async () => { await auth.signOut(); window.location.reload(); }}
                className="btn-secondary" 
                style={{ marginTop: '0.75rem', width: '100%' }}
              >
                Log Out
              </button>
            </div>
          )}
          
          <div className="auth-toggle">
            <button 
              onClick={() => { setUsePhone(false); setError(''); }} 
              className={`btn-toggle ${!usePhone ? 'active' : ''}`}
            >
              Username
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
                <label className="form-label" htmlFor="username">Username</label>
                <div className="input-wrapper">
                  <User className="input-icon" size={18} />
                  <input 
                    type="text" 
                    id="username"
                    name="username"
                    className="auth-input"
                    placeholder="yourusername" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    id="password"
                    name="password"
                    className="auth-input"
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button" 
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div style={{ textAlign: 'right', marginTop: '10px' }}>
                  <span className="forgot-password">Forgot Password?</span>
                </div>
              </div>

              <div className="verification-reminder glass-sub" style={{ padding: '15px', borderRadius: '12px', marginTop: '15px', border: '1px dashed var(--primary-green)' }}>
                <p style={{ fontSize: '0.85rem', marginBottom: '10px', fontWeight: '500' }}>Identity Verification (Recommended)</p>
                
                <div className="form-group">
                  <div className="input-wrapper">
                    <CheckCircle className="input-icon" size={16} />
                    <input 
                      type="text" 
                      className="auth-input"
                      placeholder="Full Legal Name" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      style={{ fontSize: '0.9rem' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div className="input-wrapper" style={{ padding: '4px' }}>
                    <input 
                      type="file" 
                      className="auth-input"
                      onChange={(e) => setIdCardFile(e.target.files[0])}
                      accept="image/*,.pdf"
                      style={{ padding: '6px', fontSize: '0.8rem' }}
                    />
                  </div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>Upload ID Card or Passport</label>
                </div>
              </div>
              
              <button 
                type="submit"
                className="btn-primary" 
                style={{ width: '100%', marginTop: '1rem' }}
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'} <ArrowRight size={18} />
              </button>
            </form>
          ) : (
            <form onSubmit={codeSent ? handleVerifyCode : handlePhoneSubmit}>
              {!codeSent ? (
                <div className="form-group">
                  <label className="form-label" htmlFor="phoneNumber">Phone Number (Cameroon MTN/Orange)</label>
                  <div className="input-wrapper">
                    <Phone className="input-icon" size={18} />
                    <input 
                      type="tel" 
                      id="phoneNumber"
                      name="phoneNumber"
                      className="auth-input"
                      placeholder="e.g. 650123456 or +237650123456" 
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                    />
                  </div>
                  <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                    Use a local MTN/Orange number, 9 digits, with optional +237 prefix.
                  </p>
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
            className="btn-secondary google-btn" 
            style={{ width: '100%', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign In with Google
          </button>
          
          <p className="auth-footer text-sub">
            Don't have an account? <span onClick={() => navigate('/signup')}>Sign Up</span>
          </p>
        </div>
      </div>
    </div>
  );
};




export default LoginPage;
