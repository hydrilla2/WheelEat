import React, { useState } from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import './Login.css';

/**
 * Guest Login Component
 */
function GuestLogin({ onLogin }) {
  const handleGuestLogin = () => {
    // Generate temporary guest ID
    const guestId = 'guest_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    
    const guestUser = {
      id: guestId,
      name: 'Guest User',
      email: null,
      picture: null,
      loginType: 'guest',
      loginTime: new Date().toISOString()
    };

    // Save to localStorage
    localStorage.setItem('wheeleat_user', JSON.stringify(guestUser));
    
    // Trigger login callback
    onLogin(guestUser);
  };

  return (
    <button 
      className="login-btn guest-btn"
      onClick={handleGuestLogin}
      type="button"
    >
      <span className="btn-icon">👤</span>
      <span className="btn-text">Continue as Guest</span>
    </button>
  );
}

/**
 * Google Login Component (inside GoogleOAuthProvider)
 */
function GoogleLoginButton({ onLogin }) {
  const [loading, setLoading] = useState(false);

  const googleLogin = useGoogleLogin({
    scope: 'openid email profile',
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        // Get user info from Google
        const userInfoResponse = await fetch(
          `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${tokenResponse.access_token}`
        );
        if (!userInfoResponse.ok) {
          const body = await userInfoResponse.text();
          throw new Error(`Failed to fetch Google user profile (${userInfoResponse.status}): ${body}`);
        }
        const userInfo = await userInfoResponse.json();
        if (!userInfo?.sub) {
          throw new Error('Google user profile missing "sub" (Google user id). Check OAuth configuration.');
        }

        const googleUser = {
          id: userInfo.sub,
          name: userInfo.name,
          email: userInfo.email,
          picture: userInfo.picture,
          loginType: 'google',
          loginTime: new Date().toISOString(),
          accessToken: tokenResponse.access_token
        };

        // Save to localStorage
        localStorage.setItem('wheeleat_user', JSON.stringify(googleUser));
        
        // Trigger login callback
        onLogin(googleUser);
      } catch (error) {
        console.error('Google login error:', error);
        alert('Failed to sign in with Google. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google login error:', error);
      if (error.error !== 'popup_closed_by_user') {
        alert('Failed to sign in with Google. Please try again.');
      }
      setLoading(false);
    },
  });

  return (
    <button 
      className="login-btn google-btn"
      onClick={() => {
        setLoading(true);
        googleLogin();
      }}
      disabled={loading}
      type="button"
    >
      <span className="btn-icon">🔵</span>
      <span className="btn-text">
        {loading ? 'Signing in...' : 'Sign in with Google'}
      </span>
    </button>
  );
}


/**
 * Main Login Component
 */
function Login({ onLogin }) {
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  // If Google Client ID is not configured, show message
  if (!googleClientId) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>🍽️ WheelEat</h1>
          <p className="login-subtitle">Please configure OAuth credentials</p>
          <p className="login-error">
            Google Client ID not found. Please add REACT_APP_GOOGLE_CLIENT_ID to .env file.
            <br />
            See GOOGLE_OAUTH_SETUP.md for instructions.
          </p>
          <GuestLogin onLogin={onLogin} />
        </div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <div className="login-container">
        <div className="login-box">
          <h1>🍽️ WheelEat</h1>
          <p className="login-subtitle">Choose how you'd like to continue</p>
          
          <div className="login-buttons">
            <GoogleLoginButton onLogin={onLogin} />
            <GuestLogin onLogin={onLogin} />
          </div>

          <p className="login-note">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}

export default Login;

