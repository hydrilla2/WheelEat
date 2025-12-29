import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import SpinWheel from './components/SpinWheel';
import CategorySelector from './components/CategorySelector';
import DietarySelector from './components/DietarySelector';
import MallSelector from './components/MallSelector';
import ResultModal from './components/ResultModal';
import Login from './components/Login';
import AdSense from './components/AdSense';
import { fetchMalls, fetchCategories, fetchRestaurants, spinWheel } from './services/api';
import Leaderboard from './components/Leaderboard';

/**
 * Main App Component (WheelEat functionality)
 */
function WheelEatApp({ user, onLogout, onShowLogin }) {
  const [mallId, setMallId] = useState('sunway_square');
  const [malls, setMalls] = useState([]);
  const [mallsLoading, setMallsLoading] = useState(true);
  const [dietaryNeed, setDietaryNeed] = useState('any');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('wheel'); // 'wheel' | 'leaderboard'
  const ringAudioRef = useRef(null);
  const clickAudioRef = useRef(null);

  // Result "ring" sound (frontend/public/sounds/ring.mp3 -> /sounds/ring.mp3)
  useEffect(() => {
    const audio = new Audio('/sounds/ring.mp3');
    audio.loop = false;
    audio.volume = 0.8;
    audio.preload = 'auto';
    ringAudioRef.current = audio;

    return () => {
      audio.pause();
      audio.currentTime = 0;
      ringAudioRef.current = null;
    };
  }, []);

  // UI click sound (frontend/public/sounds/click.mp3 -> /sounds/click.mp3)
  useEffect(() => {
    const audio = new Audio('/sounds/click.mp3');
    audio.loop = false;
    audio.volume = 0.6;
    audio.preload = 'auto';
    clickAudioRef.current = audio;

    return () => {
      audio.pause();
      audio.currentTime = 0;
      clickAudioRef.current = null;
    };
  }, []);

  const playClick = useCallback(() => {
    const audio = clickAudioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    const p = audio.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        // Autoplay may be blocked; user interaction usually fixes it.
      });
    }
  }, []);

  // Play ring when the result modal appears
  useEffect(() => {
    if (!showResult || !result) return;
    const audio = ringAudioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    const p = audio.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        // Some browsers block autoplay; user interaction usually fixes it.
      });
    }
  }, [showResult, result]);

  // Load available malls on mount
  useEffect(() => {
    fetchMalls()
      .then((data) => {
        setMalls(data.malls || []);
        setMallsLoading(false);
        // Set default mall if available
        if (data.malls && data.malls.length > 0 && !mallId) {
          setMallId(data.malls[0].id);
        }
      })
      .catch((err) => {
        console.error('Failed to load malls:', err);
        setMallsLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load categories when mall changes
  useEffect(() => {
    if (mallId) {
      fetchCategories(mallId)
        .then((data) => {
          setCategories(data.categories || []);
        })
        .catch((err) => {
          console.error('Failed to load categories:', err);
          setCategories([]);
        });
      
      // Reset selections when mall changes
      setSelectedCategories([]);
      setRestaurants([]);
      setResult(null);
    }
  }, [mallId]);

  // Load restaurants when categories or mall changes
  useEffect(() => {
    if (selectedCategories.length > 0 && mallId) {
      fetchRestaurants({ categories: selectedCategories, mallId, dietaryNeed })
        .then((data) => setRestaurants(data.restaurants))
        .catch((err) => {
          console.error('Failed to load restaurants:', err);
          setRestaurants([]);
        });
    } else {
      setRestaurants([]);
    }
  }, [selectedCategories, mallId, dietaryNeed]);

  const handleSpin = async () => {
    if (selectedCategories.length === 0) {
      setError('Please select at least one restaurant category');
      return;
    }

    if (restaurants.length === 0) {
      setError('No restaurants found in selected categories');
      return;
    }

    setError(null);
    setResult(null);
    setShowResult(false);
    
    // Start spinning animation first
    setSpinning(true);

    // Get the result immediately (while spinning) but don't show it yet
    try {
      const data = await spinWheel({ selectedCategories, mallId, dietaryNeed });
      // Set result for wheel calculation, but don't show modal yet
      setResult(data);
      
      // After spin animation completes (3 seconds), show the result modal
      setTimeout(() => {
        setSpinning(false);
        // Small delay to ensure wheel has stopped
        setTimeout(() => {
          setShowResult(true);
        }, 300);
      }, 3000); // Match the spin animation duration
    } catch (err) {
      setError(err.message || 'An error occurred while spinning');
      setSpinning(false);
    }
  };

  const handleCloseResult = () => {
    setShowResult(false);
    setResult(null);
  };

  return (
    <div className="App">
      <div className="container">
        <header>
          <AdSense 
            slotId={process.env.REACT_APP_ADSENSE_HEADER_SLOT} 
            className="ad-container-header" 
            format="horizontal" 
            label="Header Ad"
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ flex: 1 }} />
            <h1 style={{ margin: 0, flex: 'none' }}>🍽️ WheelEat</h1>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setActiveView('wheel')}
                  style={{
                    background: activeView === 'wheel' ? '#667eea' : 'transparent',
                    border: '1px solid rgba(102,126,234,0.45)',
                    color: activeView === 'wheel' ? 'white' : '#667eea',
                    padding: '8px 12px',
                    borderRadius: '999px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Wheel
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('leaderboard')}
                  style={{
                    background: activeView === 'leaderboard' ? '#667eea' : 'transparent',
                    border: '1px solid rgba(102,126,234,0.45)',
                    color: activeView === 'leaderboard' ? 'white' : '#667eea',
                    padding: '8px 12px',
                    borderRadius: '999px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Leaderboard
                </button>
              </div>
              {user?.name ? (
                <span style={{ fontSize: '0.9rem', color: '#667eea', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {user.name}
                </span>
              ) : null}
              <button
                type="button"
                onClick={user ? onLogout : onShowLogin}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(102,126,234,0.45)',
                  color: '#667eea',
                  padding: '8px 12px',
                  borderRadius: '999px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
                aria-label={user ? 'Logout' : 'Sign in'}
                title={user ? 'Logout' : 'Sign in'}
              >
                {user ? 'Logout' : 'Sign in'}
              </button>
            </div>
          </div>
          <p className="subtitle">Spin the wheel to decide where to eat!</p>
        </header>

        {activeView === 'wheel' ? (
          <div className="main-content">
            <div className="selection-panel">
              <MallSelector
                value={mallId}
                onChange={setMallId}
                malls={malls}
                loading={mallsLoading}
              />
              <DietarySelector
                value={dietaryNeed}
                onChange={setDietaryNeed}
                onClickSound={playClick}
              />
              <CategorySelector
                selected={selectedCategories}
                onChange={setSelectedCategories}
                categories={categories}
                onClickSound={playClick}
              />
            </div>

            <div className="wheel-panel">
              <SpinWheel
                restaurants={restaurants}
                spinning={spinning}
                result={result?.restaurant_name}
              />
              <button
                className="spin-button"
                onClick={handleSpin}
                disabled={spinning || selectedCategories.length === 0 || restaurants.length === 0}
              >
                {spinning ? 'Spinning...' : '🎰 Spin the Wheel!'}
              </button>
              {error && <div className="error-message">{error}</div>}
              {restaurants.length > 0 && !spinning && (
                <div className="restaurant-count">
                  {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''} available
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ marginTop: '8px' }}>
            <MallSelector
              value={mallId}
              onChange={setMallId}
              malls={malls}
              loading={mallsLoading}
            />
            <Leaderboard
              mallId={mallId}
              mallName={malls.find((m) => m.id === mallId)?.display_name || malls.find((m) => m.id === mallId)?.name}
            />
          </div>
        )}
      </div>
      
      {/* Result Modal - shows after spin completes */}
      {showResult && result && (
        <ResultModal 
          result={result} 
          onClose={handleCloseResult}
          onSpinAgain={handleSpin}
        />
      )}
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  // Check if user is already logged in (on page load)
  useEffect(() => {
    console.log('=== App Component - Auth Check ===');
    // Testing helpers:
    // - ?resetAuth=1  -> clears saved user and shows login
    // - ?forceLogin=1 -> ignores saved user and shows login (does NOT clear)
    const params = new URLSearchParams(window.location.search);
    const resetAuth = params.get('resetAuth') === '1';
    const forceLogin = params.get('forceLogin') === '1';
    console.log('resetAuth:', resetAuth, 'forceLogin:', forceLogin);

    if (resetAuth) {
      localStorage.removeItem('wheeleat_user');
      params.delete('resetAuth');
      const newQs = params.toString();
      const newUrl = `${window.location.pathname}${newQs ? `?${newQs}` : ''}${window.location.hash || ''}`;
      window.history.replaceState({}, '', newUrl);
    }

    const savedUser = localStorage.getItem('wheeleat_user');
    console.log('Saved user from localStorage:', savedUser ? 'Found' : 'Not found');
    if (savedUser && !forceLogin && !resetAuth) {
      try {
        const userData = JSON.parse(savedUser);
        console.log('Parsed user data:', userData);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('wheeleat_user');
      }
    } else {
      console.log('No saved user or forceLogin/resetAuth is true - showing login');
    }

    // Keep the "wheel-first" experience by default.
    // Only show the login screen when explicitly requested (or via debug query params).
    setShowLogin(Boolean(forceLogin || resetAuth));
    setLoading(false);
    console.log('===============================');
  }, []);

  // Handle login success
  const handleLogin = (userData) => {
    console.log('=== handleLogin called ===');
    console.log('User data received:', userData);
    setUser(userData);
    setShowLogin(false);
    console.log('User state updated');
    // User data is already saved in localStorage by Login component
  };

  const handleLogout = () => {
    localStorage.removeItem('wheeleat_user');
    setUser(null);
  };

  // Show loading state briefly
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ color: 'white', fontSize: '1.2em' }}>Loading...</div>
      </div>
    );
  }

  // Default: show the wheel first for everyone.
  // Login is an optional screen opened via the header "Sign in" button.
  if (showLogin) {
    return <Login onLogin={handleLogin} onCancel={() => setShowLogin(false)} />;
  }

  return (
    <WheelEatApp
      user={user}
      onLogout={handleLogout}
      onShowLogin={() => setShowLogin(true)}
    />
  );
}

export default App;
