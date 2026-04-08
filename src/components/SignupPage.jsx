import { Leaf, Mail, Lock, ArrowRight, User, Phone, CheckCircle, Users, Building2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import { auth } from '../config/firebase';
// Skipping Firebase Storage bucket upload; IDs are stored locally instead.
import './LoginPage.css'; // Reusing styles

const SignupPage = ({ theme, toggleTheme }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [idCardFile, setIdCardFile] = useState(null);
  const [accountType, setAccountType] = useState('individual'); // 'individual' or 'community'
  const [communityName, setCommunityName] = useState('');
  const [communityFocus, setCommunityFocus] = useState('');
  
  const [verificationCode, setVerificationCode] = useState('');
  const [usePhone, setUsePhone] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, googleSignIn, setupRecaptcha, phoneSignIn, currentUser, userData } = useAuth();
  const navigate = useNavigate();

  const getRoleRedirect = (role) => {
    if (role === 'super-admin') return '/super-admin';
    if (role === 'bank-admin') return '/bank-dashboard';
    if (role === 'admin') return '/admin/communities';
    return '/dashboard';
  };

  const storeFileInLocalStorage = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const base64 = reader.result;
          window.localStorage.setItem('njangipay_kycImage', JSON.stringify({
            name: file.name,
            type: file.type,
            data: base64
          }));
          resolve(base64);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  async function handleSubmit(e) {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      setError('');
      setLoading(true);

      let idCardUrl = '';
      let idCardLocal = '';
      if (idCardFile) {
        try {
          // Skip Firebase storage upload as requested.
          idCardLocal = await storeFileInLocalStorage(idCardFile);
          console.log('ID card stored locally while skipping cloud storage.');
        } catch (storeErr) {
          console.warn('ID card local store failed:', storeErr);
          setError('Unable to store ID for verification. Please try again later.');
          setLoading(false);
          return;
        }
      } else if (accountType !== 'individual') {
        // ID card suggested for community/bank, but not required for now
        console.warn('ID card not provided for non-individual account; proceeding without it.');
        // setError('Please upload your ID/Passport to verify identity.');
        // setLoading(false);
        // return;
      }
      
      const extraData = {
        fullName,
        idCardUrl,
        idCardLocal,
        accountType,
        isVerified: false, // Pending KYC
        ...(accountType === 'community' && { 
          communityName, 
          communityFocus,
          isCommunityAdmin: true 
        })
      };

      const result = await signup(fullName, password, phoneNumber, { ...extraData, username: fullName });
      console.log('Signup completed for', result.user.uid, 'username', fullName, 'role', extraData.role);
      setError('');
      // Inform about verification
      alert('Account created! Your identity is being verified. Please check your email inbox to verify your account.');
      // directly send to dashboard/role route if you want immediate dashboard experience while user verifies.
      navigate(getRoleRedirect(extraData.role || 'user'), { replace: true });

    } catch (err) {
      setError('Failed to create an account. ' + err.message);
      console.error(err);
    } finally {
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
    } catch (err) {
      setError('Invalid verification code.');
      console.error(err);
    }
    setLoading(false);
  }

  // Instead of an abrupt auto-redirect on mount, we'll let the UI handle already-logged-in users
  // to avoid confusion when testing.

  async function handleGoogleSignIn() {
    try {
      setError('');
      setLoading(true);
      const result = await googleSignIn();
      const { getDoc, doc } = await import('firebase/firestore');
      const { db } = await import('../config/firebase');
      const snap = await getDoc(doc(db, 'users', result.user.uid));
      const role = snap.exists() ? snap.data().role : 'user';
      navigate(getRoleRedirect(role));
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
             NjangiPay
          </Link>
          
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle text-sub">Start your community savings journey today.</p>

          {currentUser && userData ? (
            <div style={{ textAlign: 'center', margin: '2rem 0' }}>
              <CheckCircle size={48} color="var(--primary-green)" style={{ margin: '0 auto 1rem' }} />
              <h3>You are already logged in!</h3>
              <p className="text-sub" style={{ marginBottom: '1.5rem' }}>You are currently signed in as <strong>{userData.role}</strong>.</p>
              <button onClick={() => navigate(getRoleRedirect(userData.role))} className="btn-primary" style={{ width: '100%', marginBottom: '10px' }}>
                Go to Dashboard
              </button>
              <button onClick={() => { auth.signOut(); window.location.reload(); }} className="btn-secondary" style={{ width: '100%' }}>
                Log Out
              </button>
            </div>
          ) : (
            <>
              {error && <div className="error-message" style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
              
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

          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
            <button 
               type="button" 
               className={`chip ${accountType === 'individual' ? 'active' : ''}`}
               onClick={() => setAccountType('individual')}
            >
              <User size={14} /> Individual
            </button>
            <button 
               type="button" 
               className={`chip ${accountType === 'community' ? 'active' : ''}`}
               onClick={() => setAccountType('community')}
            >
              <Users size={14} /> Community Rep
            </button>
            <button 
               type="button" 
               className={`chip ${accountType === 'bank' ? 'active' : ''}`}
               onClick={() => setAccountType('bank')}
            >
              <Building2 size={14} /> Bank Partner
            </button>
          </div>

          {!usePhone ? (
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                <label className="form-label" htmlFor="fullName">Name (this becomes your local username)</label>
                <div className="input-wrapper">
                  <User size={18} className="input-icon" />
                  <input 
                    type="text" 
                    id="fullName"
                    className="auth-input"
                    placeholder="Enter your name" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                  Public display name + sign-in identifier. No email needed.
                </p>
              </div>

              {accountType === 'community' && (
                <>
                  <div className="form-group">
                    <label className="form-label" htmlFor="communityName">Community Name</label>
                    <div className="input-wrapper">
                      <Users className="input-icon" size={18} />
                      <input 
                        type="text" 
                        id="communityName"
                        className="auth-input"
                        placeholder="e.g. Douala Central Njangi" 
                        value={communityName}
                        onChange={(e) => setCommunityName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="communityFocus">Community Focus</label>
                    <div className="input-wrapper">
                      <Leaf className="input-icon" size={18} />
                      <input 
                        type="text" 
                        id="communityFocus"
                        className="auth-input"
                        placeholder="e.g. Agricultural Development" 
                        value={communityFocus}
                        onChange={(e) => setCommunityFocus(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {accountType === 'bank' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="communityName">Bank Institution Name</label>
                  <div className="input-wrapper">
                    <Building2 className="input-icon" size={18} />
                    <input 
                      type="text" 
                      id="communityName"
                      className="auth-input"
                      placeholder="e.g. Ecobank Cameroon" 
                      value={communityName}
                      onChange={(e) => setCommunityName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

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
                  />
                </div>
                <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                  Accepts MTN/Orange numbers beginning with 6 and formatted as +2376XXXXXXXX.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="idCard">ID Card / Passport Upload</label>
                <div className="input-wrapper" style={{ padding: '4px' }}>
                  <Building2 className="input-icon" size={18} />
                  <input 
                    type="file" 
                    id="idCard"
                    className="auth-input"
                    style={{ padding: '8px' }}
                    onChange={(e) => setIdCardFile(e.target.files[0])}
                    accept="image/*,.pdf"
                  />
                </div>
                <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '4px' }}>Max size 5MB. PDF or Image preferred.</p>
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={18} />
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
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-wrapper">
                  <ShieldCheck className="input-icon" size={18} />
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    id="confirmPassword"
                    name="confirmPassword"
                    className="auth-input"
                    placeholder="••••••••" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button" 
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <button 
                type="submit"
                className="btn-primary" 
                style={{ width: '100%', marginTop: '1rem' }}
                disabled={loading}
              >
                {loading ? 'Creating Account...' : (accountType === 'community' ? 'Register Community' : accountType === 'bank' ? 'Partner with Nexus' : 'Sign Up')} <ArrowRight size={18} />
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
            Sign Up with Google
          </button>
          
          <p className="auth-footer text-sub">
            Already have an account? <span onClick={() => navigate('/login')}>Sign In</span>
          </p>
          </>)}
        </div>
      </div>
    </div>
  );
};



export default SignupPage;
