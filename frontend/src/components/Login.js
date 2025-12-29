import React, { useState } from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import './Login.css';

import { upsertUser } from '../services/api';

function GoogleIcon() {
  // Simple "G" mark using paths; uses currentColor so hover states stay consistent.
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 10.2v3.9h5.5c-.8 2.4-2.9 4.1-5.5 4.1A6.2 6.2 0 1 1 12 5.8c1.5 0 2.9.6 4 1.6l2.7-2.7A10 10 0 1 0 22 12c0-.7-.1-1.3-.2-1.8H12z"
      />
    </svg>
  );
}

function GuestIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2.25c-4 0-7.5 2.02-7.5 4.5V20h15v-1.25c0-2.48-3.5-4.5-7.5-4.5Z"
      />
    </svg>
  );
}

/**
 * Guest Login Component
 */
function GuestLogin({ onLogin }) {
  const handleGuestLogin = () => {
    console.log('Guest login clicked');
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
    console.log('Saving guest user to localStorage:', guestUser);
    localStorage.setItem('wheeleat_user', JSON.stringify(guestUser));
    
    // Trigger login callback
    console.log('Calling onLogin callback for guest');
    onLogin(guestUser);
  };

  return (
    <button 
      className="login-btn guest-btn"
      onClick={handleGuestLogin}
      type="button"
    >
      <span className="btn-icon">
        <GuestIcon />
      </span>
      <span className="btn-text">Continue as Guest</span>
    </button>
  );
}

/**
 * Google Login Component (inside GoogleOAuthProvider)
 */
function GoogleLoginButton({ onLogin }) {
  const [loading, setLoading] = useState(false);

  console.log('GoogleLoginButton: Initializing Google OAuth login');

  const googleLogin = useGoogleLogin({
    scope: 'openid email profile',
    onSuccess: async (tokenResponse) => {
      console.log('Google OAuth Success - Token received:', tokenResponse);
      setLoading(true);
      try {
        // Get user info from Google
        console.log('Fetching user info from Google API...');
        const userInfoResponse = await fetch(
          `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${tokenResponse.access_token}`
        );
        console.log('User info response status:', userInfoResponse.status);
        if (!userInfoResponse.ok) {
          const body = await userInfoResponse.text();
          throw new Error(`Failed to fetch Google user profile (${userInfoResponse.status}): ${body}`);
        }
        const userInfo = await userInfoResponse.json();
        console.log('User info received:', userInfo);
        if (!userInfo?.sub) {
          console.error('Missing "sub" in user info:', userInfo);
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

        // Save to localStorage first (for immediate UI update)
        console.log('Saving user to localStorage:', googleUser);
        localStorage.setItem('wheeleat_user', JSON.stringify(googleUser));
        
        // Save to database (upsert - create or update)
        try {
          console.log('Saving user to database...');
          const dbResult = await upsertUser({
            id: googleUser.id,
            name: googleUser.name,
            email: googleUser.email,
          });
          console.log('User saved to database:', dbResult);
        } catch (dbError) {
          console.error('Error saving user to database:', dbError);
          // Continue anyway - user is logged in via localStorage
        }
        
        // Trigger login callback
        console.log('Calling onLogin callback');
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
      <span className="btn-icon">
        <GoogleIcon />
      </span>
      <span className="btn-text">
        {loading ? 'Signing in...' : 'Sign in with Google'}
      </span>
    </button>
  );
}


/**
 * Main Login Component
 */
function Login({ onLogin, onCancel }) {
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  // Debug logging
  console.log('=== Login Component Debug ===');
  console.log('REACT_APP_GOOGLE_CLIENT_ID:', googleClientId);
  console.log('process.env keys:', Object.keys(process.env).filter(key => key.includes('GOOGLE')));
  console.log('All REACT_APP_ env vars:', Object.keys(process.env).filter(key => key.startsWith('REACT_APP_')));
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('===========================');

  // If Google Client ID is not configured, show message
  if (!googleClientId) {
    return (
      <div className="login-container">
        <div className="login-box">
          {typeof onCancel === 'function' ? (
            <button
              type="button"
              onClick={onCancel}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.35)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '999px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                marginBottom: '12px',
              }}
            >
              ← Back
            </button>
          ) : null}
          <h1>WheelEat</h1>
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
          {typeof onCancel === 'function' ? (
            <button
              type="button"
              onClick={onCancel}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.35)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '999px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                marginBottom: '12px',
              }}
            >
              ← Back
            </button>
          ) : null}
          <h1>WheelEat</h1>
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

