import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import SpinWheel from './components/SpinWheel';
import CategorySelector from './components/CategorySelector';
import DietarySelector from './components/DietarySelector';
import MallSelector from './components/MallSelector';
import ResultModal from './components/ResultModal';
import Login from './components/Login';
import AdSense from './components/AdSense';

// API base URL for local development.
// - Production (Cloudflare Pages): leave unset so we use same-origin requests.
// - Local dev (npm start): set REACT_APP_API_BASE_URL, e.g. https://wheeleat-xp5.pages.dev
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

/**
 * Main App Component (WheelEat functionality)
 */
function WheelEatApp({ user, onLogout }) {
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
    const url = `${API_BASE_URL}/api/malls`;
    console.log('Fetching malls from:', url);
    
    fetch(url)
      .then(res => {
        console.log('Malls response status:', res.status, res.statusText);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('Malls data received:', data);
        setMalls(data.malls || []);
        setMallsLoading(false);
        // Set default mall if available
        if (data.malls && data.malls.length > 0 && !mallId) {
          setMallId(data.malls[0].id);
        }
      })
      .catch(err => {
        console.error('Failed to load malls:', err);
        setMallsLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load categories when mall changes
  useEffect(() => {
    if (mallId) {
      const url = `${API_BASE_URL}/api/categories?mall_id=${encodeURIComponent(mallId)}`;
      console.log('Fetching categories from:', url);
      
      fetch(url)
        .then(res => {
          console.log('Categories response status:', res.status, res.statusText);
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          return res.json();
        })
        .then(data => {
          console.log('Categories data received:', data);
          setCategories(data.categories || []);
        })
        .catch(err => {
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
      const categoriesParam = selectedCategories.join(',');
      fetch(`${API_BASE_URL}/api/restaurants?categories=${encodeURIComponent(categoriesParam)}&mall_id=${encodeURIComponent(mallId)}`)
        .then(res => res.json())
        .then(data => setRestaurants(data.restaurants))
        .catch(err => {
          console.error('Failed to load restaurants:', err);
          setRestaurants([]);
        });
    } else {
      setRestaurants([]);
    }
  }, [selectedCategories, mallId]);

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
      const response = await fetch(`${API_BASE_URL}/api/spin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dietary_need: dietaryNeed,
          selected_categories: selectedCategories,
          mall_id: mallId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to spin the wheel' }));
        throw new Error(errorData.detail || 'Failed to spin the wheel');
      }

      const data = await response.json();
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
              {user?.name ? (
                <span style={{ fontSize: '0.9rem', color: '#667eea', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {user.name}
                </span>
              ) : null}
              <button
                type="button"
                onClick={onLogout}
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
                aria-label="Logout (clear test session)"
                title="Logout (clear test session)"
              >
                Logout
              </button>
            </div>
          </div>
          <p className="subtitle">Spin the wheel to decide where to eat!</p>
        </header>

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

/**
 * Root App Component with Login
 * Shows login page if user is not logged in, otherwise shows main app
 */
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
    setLoading(false);
    console.log('===============================');
  }, []);

  // Handle login success
  const handleLogin = (userData) => {
    console.log('=== handleLogin called ===');
    console.log('User data received:', userData);
    setUser(userData);
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

  // Show login page if user is not logged in
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Show main app if user is logged in
  return <WheelEatApp user={user} onLogout={handleLogout} />;
}

export default App;
