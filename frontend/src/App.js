import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './App.css';
import SpinWheel from './components/SpinWheel';
import CategorySelector from './components/CategorySelector';
import DietarySelector from './components/DietarySelector';
import MallSelector from './components/MallSelector';
import ResultModal from './components/ResultModal';
import Login from './components/Login';
import {
  fetchMalls,
  fetchCategories,
  fetchRestaurants,
  spinWheel,
  trackPageView,
  claimRestaurantVoucher,
  fetchUserVouchers,
  fetchVoucherStocks,
  transferVouchers,
} from './services/api';
import Leaderboard from './components/Leaderboard';
import VoucherOfferModal from './components/VoucherOfferModal';
import VoucherWalletModal from './components/VoucherWalletModal';
import AdminVouchers from './components/AdminVouchers';
import { getPriceRange } from './data/priceRanges';
import { getGoogleMapsLink } from './data/googleMapsLinks';

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M4 7.5h16a1 1 0 1 0 0-2H4a1 1 0 0 0 0 2Zm16 3.5H4a1 1 0 0 0 0 2h16a1 1 0 1 0 0-2Zm0 5.5H4a1 1 0 0 0 0 2h16a1 1 0 1 0 0-2Z"
      />
    </svg>
  );
}

/**
 * Main App Component (WheelEat functionality)
 */
function WheelEatApp({ user, onLogout, onShowLogin, pendingVoucherClaim, setPendingVoucherClaim }) {
  const [mallId, setMallId] = useState('sunway_square');
  const [malls, setMalls] = useState([]);
  const [mallsLoading, setMallsLoading] = useState(true);
  const [dietaryNeed, setDietaryNeed] = useState('any');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('wheel'); // 'wheel' | 'leaderboard' | 'admin'
  const [menuOpen, setMenuOpen] = useState(false);
  const [showRestaurantList, setShowRestaurantList] = useState(false);
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [spotlightList, setSpotlightList] = useState([]);
  const [showFeaturedDetail, setShowFeaturedDetail] = useState(false);
  const [featuredDetail, setFeaturedDetail] = useState(null);
  const menuButtonRef = useRef(null);
  const menuRef = useRef(null);
  const [vouchers, setVouchers] = useState([]);
  const [showVoucherWallet, setShowVoucherWallet] = useState(false);
  const [showVoucherOffer, setShowVoucherOffer] = useState(false);
  const [pendingVoucher, setPendingVoucher] = useState(null);
  const [voucherStockByRestaurant, setVoucherStockByRestaurant] = useState({});
  const ringAudioRef = useRef(null);
  const clickAudioRef = useRef(null);

  const promoMenuItems = useMemo(
    () => [
      { name: 'Signature Noodles', price: 'RM 18.90' },
      { name: 'Spicy Mala Bowl', price: 'RM 22.90' },
      { name: 'Soup Dumplings', price: 'RM 16.50' },
      { name: 'Crispy Wontons', price: 'RM 12.90' },
      { name: 'Iced Tea', price: 'RM 6.90' },
    ],
    []
  );

  const promoVouchers = useMemo(
    () => [
      { value: 'RM 5', minSpend: 'Min spend RM 30', restaurant: 'Ba Shu Jia Yan', left: 10 },
    ],
    []
  );

  function getOrCreateAnonUserId() {
    try {
      const key = 'wheeleat_anon_user_id';
      const existing = localStorage.getItem(key);
      if (existing) return existing;
      const created = `anon_${Math.random().toString(16).slice(2)}_${Date.now()}`;
      localStorage.setItem(key, created);
      return created;
    } catch {
      return `anon_${Math.random().toString(16).slice(2)}_${Date.now()}`;
    }
  }

  const effectiveUserId = useMemo(() => {
    return user?.id ? String(user.id) : getOrCreateAnonUserId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const isGuest = useMemo(() => {
    return !user || user.loginType === 'guest' || String(user?.id || '').startsWith('anon_');
  }, [user]);

  const isAdmin = useMemo(() => {
    const email = String(user?.email || '').toLowerCase();
    return (
      user?.loginType === 'google' &&
      (email === 'ybtan6666@gmail.com' || email === 'zixiuong@gmail.com')
    );
  }, [user]);

  const refreshVouchers = useCallback(async () => {
    try {
      const data = await fetchUserVouchers(effectiveUserId);
      const active = Array.isArray(data?.vouchers)
        ? data.vouchers
            .filter((v) => v.status === 'active')
            .map((v) => ({ ...v, logo: v.merchant_logo || v.logo || null }))
        : [];
      setVouchers(active);
    } catch (e) {
      console.debug('Failed to load vouchers:', e);
      setVouchers([]);
    }
  }, [effectiveUserId]);

  const refreshVoucherStocks = useCallback(
    async (merchantNames) => {
      try {
        const names = Array.isArray(merchantNames) ? merchantNames.filter(Boolean) : [];
        if (names.length === 0) return;
        const data = await fetchVoucherStocks(names);
        const stocks = data?.stocks || {};
        setVoucherStockByRestaurant((prev) => ({ ...prev, ...stocks }));
      } catch (e) {
        console.debug('Failed to load voucher stocks:', e);
      }
    },
    []
  );

  // Load voucher stock counts when Restaurant-of-the-day UI is opened.
  useEffect(() => {
    if (!showRestaurantList) return;
    refreshVoucherStocks(spotlightList.map((r) => r?.name));
  }, [showRestaurantList, spotlightList, refreshVoucherStocks]);

  useEffect(() => {
    if (!showFeaturedDetail || !featuredDetail?.name) return;
    refreshVoucherStocks([featuredDetail.name]);
  }, [showFeaturedDetail, featuredDetail, refreshVoucherStocks]);

  // Load vouchers for the current user (or anon user) on mount and when user changes.
  useEffect(() => {
    refreshVouchers();
  }, [refreshVouchers]);

  // Close header menu on outside click / escape
  useEffect(() => {
    if (!menuOpen) return;

    const onMouseDown = (e) => {
      const btn = menuButtonRef.current;
      const menu = menuRef.current;
      const target = e.target;
      if (btn && btn.contains(target)) return;
      if (menu && menu.contains(target)) return;
      setMenuOpen(false);
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  // IMPORTANT: Voucher claiming is ONLY available via "Restaurant of the day" → "Collect voucher".
  // Spinning the wheel should NOT open voucher popups.

  // Auto-claim after login (pendingVoucherClaim is stored in App so it survives unmount when showing Login).
  useEffect(() => {
    if (!pendingVoucherClaim) return;
    if (isGuest) return;
    const merchantName = pendingVoucherClaim?.merchant_name;
    if (!merchantName) return;
    const merchantLogo = pendingVoucherClaim?.merchant_logo || null;
    const valueRm = pendingVoucherClaim?.value_rm;
    const minSpendRm = pendingVoucherClaim?.min_spend_rm;

    (async () => {
      try {
        const out = await claimRestaurantVoucher({
          userId: effectiveUserId,
          merchantName,
          merchantLogo,
          valueRm,
          minSpendRm,
        });
        if (out?.won) {
          await refreshVouchers();
          if (out?.remainingQty !== undefined) {
            setVoucherStockByRestaurant((prev) => ({
              ...prev,
              [merchantName]: { ...(prev?.[merchantName] || {}), remaining_qty: Number(out.remainingQty) },
            }));
          } else {
            refreshVoucherStocks([merchantName]);
          }
          setShowVoucherWallet(true);
        } else if (out?.reason === 'sold_out') {
          alert('Sorry, this restaurant voucher is sold out.');
        }
      } catch (e) {
        console.debug('Auto-claim voucher failed:', e);
      } finally {
        setPendingVoucherClaim?.(null);
      }
    })();
  }, [pendingVoucherClaim, isGuest, effectiveUserId, refreshVouchers, refreshVoucherStocks, setPendingVoucherClaim]);

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

  // Load full restaurant list for spotlight (not filtered by category or dietary)
  useEffect(() => {
    if (!mallId || categories.length === 0) {
      setAllRestaurants([]);
      return;
    }

    fetchRestaurants({ categories, mallId, dietaryNeed: 'any' })
      .then((data) => setAllRestaurants(data.restaurants || []))
      .catch((err) => {
        console.error('Failed to load spotlight restaurants:', err);
        setAllRestaurants([]);
      });
  }, [mallId, categories]);

  // Build a small rotating spotlight list
  useEffect(() => {
    if (!allRestaurants.length) {
      setSpotlightList([]);
      setSpotlightIndex(0);
      return;
    }

    const featuredPrimary = allRestaurants.find((r) => r.name === 'Ba Shu Jia Yan');
    const copy = [featuredPrimary].filter(Boolean);
    if (copy.length === 0) {
      copy.push(...allRestaurants);
    }
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    setSpotlightList(copy.slice(0, 1));
    setSpotlightIndex(0);
  }, [allRestaurants, mallId]);

  // Rotate spotlight every few seconds
  useEffect(() => {
    if (spotlightList.length <= 1) return undefined;

    const interval = setInterval(() => {
      setSpotlightIndex((prev) => (prev + 1) % spotlightList.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [spotlightList]);

  // Load restaurants when categories or mall changes
  useEffect(() => {
    if (!mallId) {
      setRestaurants([]);
      return;
    }

    const categoriesToFetch = selectedCategories.length > 0 ? selectedCategories : categories;
    if (categoriesToFetch.length > 0) {
      fetchRestaurants({ categories: categoriesToFetch, mallId, dietaryNeed })
        .then((data) => setRestaurants(data.restaurants))
        .catch((err) => {
          console.error('Failed to load restaurants:', err);
          setRestaurants([]);
        });
    } else {
      setRestaurants([]);
    }
  }, [selectedCategories, categories, mallId, dietaryNeed]);

  const handleSpin = async () => {
    const categoriesToUse = selectedCategories.length > 0 ? selectedCategories : categories;

    if (categoriesToUse.length === 0) {
      setError('No restaurant categories available');
      return;
    }

    if (restaurants.length === 0) {
      setError('No restaurants found');
      return;
    }

    setError(null);
    setResult(null);
    setShowResult(false);
    
    // Start spinning animation first
    setSpinning(true);

    // Get the result immediately (while spinning) but don't show it yet
    try {
      const data = await spinWheel({ selectedCategories: categoriesToUse, mallId, dietaryNeed });
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
    setShowVoucherOffer(false);
    setPendingVoucher(null);
  };

  const handleKeepVoucher = async () => {
    if (isGuest) {
      const merchantName = pendingVoucher?.merchant_name;
      if (merchantName) {
        setPendingVoucherClaim?.({
          merchant_name: merchantName,
          merchant_logo: pendingVoucher?.merchant_logo || pendingVoucher?.logo || null,
          value_rm: pendingVoucher?.value_rm,
          min_spend_rm: pendingVoucher?.min_spend_rm,
        });
      }
      setShowVoucherOffer(false);
      setPendingVoucher(null);
      onShowLogin();
      alert('Please sign in with Google to claim this voucher.');
      return;
    }

    const merchantName = pendingVoucher?.merchant_name;
    if (!merchantName) {
      setShowVoucherOffer(false);
      setPendingVoucher(null);
      return;
    }
    const merchantLogo = pendingVoucher?.merchant_logo || pendingVoucher?.logo || null;
    const valueRm = pendingVoucher?.value_rm;
    const minSpendRm = pendingVoucher?.min_spend_rm;

    try {
      const out = await claimRestaurantVoucher({
        userId: effectiveUserId,
        merchantName,
        merchantLogo,
        valueRm,
        minSpendRm,
      });
      if (out?.won) {
        await refreshVouchers();
        if (out?.remainingQty !== undefined) {
          setVoucherStockByRestaurant((prev) => ({
            ...prev,
            [merchantName]: { ...(prev?.[merchantName] || {}), remaining_qty: Number(out.remainingQty) },
          }));
        } else {
          refreshVoucherStocks([merchantName]);
        }
        setShowVoucherWallet(true);
      } else if (out?.reason === 'sold_out') {
        alert('Sorry, this restaurant voucher is sold out.');
      }
    } catch (e) {
      console.debug('Failed to claim voucher:', e);
    } finally {
      setShowVoucherOffer(false);
      setPendingVoucher(null);
    }
  };

  const handleDeclineVoucher = async () => {
    setShowVoucherOffer(false);
    setPendingVoucher(null);
  };

  // Voucher removal/used actions intentionally disabled in UI.

  return (
    <div className="App">
      <div className="container">
        <header>
          <div className="header-bar">
            <div />
            <h1 style={{ margin: 0 }}>🍽️ WheelEat</h1>
            <div className="header-actions">
              <button
                ref={menuButtonRef}
                type="button"
                className="header-menu-button"
                aria-label="Open menu"
                aria-haspopup="menu"
                aria-expanded={menuOpen ? 'true' : 'false'}
                onClick={() => setMenuOpen((v) => !v)}
              >
                <span className="header-menu-icon" aria-hidden="true">
                  <MenuIcon />
                </span>
                {vouchers.length > 0 ? <span className="header-menu-dot" aria-label="You have vouchers" /> : null}
              </button>

              {menuOpen ? (
                <div ref={menuRef} className="header-menu-dropdown" role="menu">
                  <div className="header-menu-user" aria-label="Current user">
                    {user?.name ? user.name : 'Guest'}
                  </div>

                  <button
                    type="button"
                    role="menuitem"
                    className={`header-menu-item ${activeView === 'wheel' ? 'active' : ''}`}
                    onClick={() => {
                      setActiveView('wheel');
                      setMenuOpen(false);
                    }}
                  >
                    <span className="header-menu-check" aria-hidden="true">
                      {activeView === 'wheel' ? '✓' : ''}
                    </span>
                    <span className="header-menu-label">Wheel</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    className={`header-menu-item ${activeView === 'leaderboard' ? 'active' : ''}`}
                    onClick={() => {
                      setActiveView('leaderboard');
                      setMenuOpen(false);
                    }}
                  >
                    <span className="header-menu-check" aria-hidden="true">
                      {activeView === 'leaderboard' ? '✓' : ''}
                    </span>
                    <span className="header-menu-label">Leaderboard</span>
                  </button>

                  {isAdmin ? (
                    <button
                      type="button"
                      role="menuitem"
                      className={`header-menu-item ${activeView === 'admin' ? 'active' : ''}`}
                      onClick={() => {
                        setActiveView('admin');
                        setMenuOpen(false);
                      }}
                    >
                      <span className="header-menu-check" aria-hidden="true">
                        {activeView === 'admin' ? '✓' : ''}
                      </span>
                      <span className="header-menu-label">Admin</span>
                    </button>
                  ) : null}

                  <button
                    type="button"
                    role="menuitem"
                    className="header-menu-item"
                    onClick={() => {
                      setShowVoucherWallet(true);
                      setMenuOpen(false);
                    }}
                  >
                    <span className="header-menu-check" aria-hidden="true" />
                    <span className="header-menu-label">Vouchers</span>
                    {vouchers.length > 0 ? <span className="header-menu-badge">{vouchers.length}</span> : null}
                  </button>

                  <div className="header-menu-divider" role="separator" />

                  <button
                    type="button"
                    role="menuitem"
                    className="header-menu-item"
                    onClick={() => {
                      setMenuOpen(false);
                      (user ? onLogout : onShowLogin)();
                    }}
                  >
                    <span className="header-menu-check" aria-hidden="true" />
                    <span className="header-menu-label">{user ? 'Logout' : 'Sign in'}</span>
                  </button>
                </div>
              ) : null}
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
              <div className="spotlight-panel">
                <div className="spotlight-header">
                  <span className="spotlight-title">Restaurant of the day</span>
                  <button
                    type="button"
                    className="spotlight-viewall"
                    onClick={() => setShowRestaurantList(true)}
                  >
                    View all
                  </button>
                </div>
                <button
                  type="button"
                  className="spotlight-card"
                  onClick={() => setShowRestaurantList(true)}
                  aria-label="Open featured restaurants"
                >
                  {spotlightList.length > 0 ? (
                    <div className="spotlight-content">
                      <div className="spotlight-logo">
                        {spotlightList[spotlightIndex]?.logo ? (
                          <img
                            src={`/${spotlightList[spotlightIndex]?.logo}`}
                            alt={spotlightList[spotlightIndex]?.name}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : null}
                      </div>
                      <div className="spotlight-details">
                        <div className="spotlight-name">
                          {spotlightList[spotlightIndex]?.name}
                        </div>
                        <div className="spotlight-meta">
                          {spotlightList[spotlightIndex]?.category || 'Category'}
                          {spotlightList[spotlightIndex]?.unit
                            ? ` | ${spotlightList[spotlightIndex]?.unit}`
                            : ''}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="spotlight-empty">Loading restaurants...</div>
                  )}
                </button>
              </div>
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
                disabled={spinning}
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
                disabled={spinning || restaurants.length === 0}
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
        ) : activeView === 'leaderboard' ? (
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
        ) : (
          <div style={{ marginTop: '8px' }}>
            <AdminVouchers user={user} />
          </div>
        )}

        {activeView === 'wheel' ? (
          <section className="feedback-section" aria-label="Feedback form">
            <div className="feedback-header">
              <h2>Feedback</h2>
              <p>Help us improve WheelEat. Your feedback takes less than a minute.</p>
              <a
                className="feedback-link"
                href="https://forms.gle/tvibjuqAosBAGNmSA"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Google Form
              </a>
            </div>
          </section>
        ) : null}
      </div>
      
      {/* Result Modal - shows after spin completes */}
      {showResult && result && (
        <ResultModal 
          result={result} 
          onClose={handleCloseResult}
          onSpinAgain={handleSpin}
        />
      )}

      {showRestaurantList ? (
        <div
          className="restaurant-list-overlay"
          onClick={() => setShowRestaurantList(false)}
          role="presentation"
        >
          <div
            className="restaurant-list-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="restaurant-list-close"
              onClick={() => setShowRestaurantList(false)}
              aria-label="Close restaurant list"
            >
              X
            </button>
            <h2>Restaurant of the day</h2>
            <div className="restaurant-list-count">
              {spotlightList.length} total
            </div>
            <div className="restaurant-list-scroll">
              {spotlightList.map((r) => {
                const vouchersForRestaurant = promoVouchers.filter(
                  (voucher) => voucher.restaurant === r.name
                );
                const dynamicLeft =
                  voucherStockByRestaurant?.[r.name]?.remaining_qty !== undefined
                    ? voucherStockByRestaurant[r.name].remaining_qty
                    : null;
                return (
                  <div key={r.name} className="featured-bundle">
                    <button
                      type="button"
                      className="restaurant-list-row"
                      onClick={() => {
                        setFeaturedDetail(r);
                        setShowFeaturedDetail(true);
                      }}
                    >
                      <div className="restaurant-list-logo">
                        {r.logo ? (
                          <img
                            src={`/${r.logo}`}
                            alt={r.name}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : null}
                      </div>
                      <div className="restaurant-list-details">
                        <div className="restaurant-list-name">{r.name}</div>
                        <div className="restaurant-list-meta">
                          {r.category || 'Category'}
                          {r.unit ? ` | ${r.unit}` : ''}
                          {r.floor ? ` | ${r.floor}` : ''}
                        </div>
                      </div>
                    </button>
                    {vouchersForRestaurant.length > 0 ? (
                      <div className="voucher-card-grid">
                        {vouchersForRestaurant.map((voucher, index) => (
                          <div key={`${r.name}-voucher-${index}`} className="voucher-card">
                            <div className="voucher-card-value">{voucher.value}</div>
                            <div className="voucher-card-info">
                            <div className="voucher-card-min">
                              {voucher.minSpend} in {voucher.restaurant}
                            </div>
                              <div className="voucher-card-left">
                                {(dynamicLeft !== null ? dynamicLeft : voucher.left)} vouchers left
                              </div>
                            </div>
                            <button
                              type="button"
                              className="voucher-card-cta"
                              onClick={() => {
                                const valueRm = Number(String(voucher.value || '').replace(/[^\d]/g, '')) || 5;
                                const minSpendRm = Number(String(voucher.minSpend || '').replace(/[^\d]/g, '')) || 30;
                                setPendingVoucher({
                                  merchant_name: r.name,
                                  merchant_logo: r.logo || null,
                                  value_rm: valueRm,
                                  min_spend_rm: minSpendRm,
                                });
                                setShowVoucherOffer(true);
                              }}
                            >
                              Collect voucher
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {showFeaturedDetail && featuredDetail ? (
        <div
          className="restaurant-detail-overlay"
          onClick={() => setShowFeaturedDetail(false)}
          role="presentation"
        >
          <div
            className="restaurant-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="restaurant-detail-close"
              onClick={() => setShowFeaturedDetail(false)}
              aria-label="Close restaurant details"
            >
              X
            </button>
            <div className="restaurant-detail-logo">
              {featuredDetail.logo ? (
                <img
                  src={`/${featuredDetail.logo}`}
                  alt={featuredDetail.name}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : null}
            </div>
            <div className="restaurant-detail-title">You got:</div>
            <h3>{featuredDetail.name}</h3>
            <div className="restaurant-detail-info">
              <div className="restaurant-detail-row">
                <span className="restaurant-detail-label">Price range:</span>
                <span className="restaurant-detail-value">
                  {getPriceRange(featuredDetail.name)}
                </span>
              </div>
              <div className="restaurant-detail-row">
                <span className="restaurant-detail-label">Visit Instagram:</span>
                {featuredDetail.name === 'Ba Shu Jia Yan' ? (
                  <a
                    className="restaurant-detail-link"
                    href="https://www.instagram.com/bashujiayansunway/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open Instagram
                  </a>
                ) : (
                  <button type="button" className="restaurant-detail-link" disabled>
                    Open Instagram
                  </button>
                )}
              </div>
              <div className="restaurant-detail-row">
                <span className="restaurant-detail-label">Give me a review:</span>
                {getGoogleMapsLink(featuredDetail.name) ? (
                  <a
                    className="restaurant-detail-link"
                    href={getGoogleMapsLink(featuredDetail.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open Google Maps
                  </a>
                ) : (
                  <button type="button" className="restaurant-detail-link" disabled>
                    Open Google Maps
                  </button>
                )}
              </div>
            </div>
            <div className="restaurant-detail-promo">
              <div className="restaurant-detail-promo-title">Promotion menu</div>
              <div className="restaurant-detail-promo-track">
                {promoMenuItems.map((item, index) => (
                  <div key={`${item.name}-${index}`} className="promo-card">
                    <div className="promo-card-image" aria-hidden="true">
                      <div className="promo-card-icon">Meal</div>
                    </div>
                    <div className="promo-card-name">{item.name}</div>
                    <div className="promo-card-price">{item.price}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="restaurant-detail-vouchers">
              <div className="restaurant-detail-promo-title">Collect voucher</div>
              <div className="voucher-card-grid">
                {promoVouchers
                  .filter((voucher) => voucher.restaurant === featuredDetail.name)
                  .map((voucher, index) => (
                  <div key={`voucher-${index}`} className="voucher-card">
                    <div className="voucher-card-value">{voucher.value}</div>
                    <div className="voucher-card-info">
                      <div className="voucher-card-min">
                        {voucher.minSpend} in {voucher.restaurant}
                      </div>
                      <div className="voucher-card-left">
                        {(voucherStockByRestaurant?.[featuredDetail.name]?.remaining_qty !== undefined
                          ? voucherStockByRestaurant[featuredDetail.name].remaining_qty
                          : voucher.left)}{' '}
                        vouchers left
                      </div>
                    </div>
                    <button
                      type="button"
                      className="voucher-card-cta"
                      onClick={() => {
                        const valueRm = Number(String(voucher.value || '').replace(/[^\d]/g, '')) || 5;
                        const minSpendRm = Number(String(voucher.minSpend || '').replace(/[^\d]/g, '')) || 30;
                        setPendingVoucher({
                          merchant_name: featuredDetail.name,
                          merchant_logo: featuredDetail.logo || null,
                          value_rm: valueRm,
                          min_spend_rm: minSpendRm,
                        });
                        setShowVoucherOffer(true);
                      }}
                    >
                      Collect voucher
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Voucher offer */}
      {showVoucherOffer ? (
        <VoucherOfferModal
          voucher={pendingVoucher}
          onAccept={handleKeepVoucher}
          onDecline={handleDeclineVoucher}
          user={user}
        />
      ) : null}

      {/* Voucher wallet */}
      {showVoucherWallet ? (
        <VoucherWalletModal
          vouchers={vouchers}
          onClose={() => setShowVoucherWallet(false)}
        />
      ) : null}
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  // When a guest taps "Claim", we store the intended voucher here so after Google login we can auto-claim it.
  const [pendingVoucherClaim, setPendingVoucherClaim] = useState(null);

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

    // Track page view
    let userId = null;
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        userId = userData.id || null;
      } catch (e) {
        // Ignore parse errors
      }
    }
    trackPageView(window.location.pathname, userId);
  }, []);

  // Handle login success
  const handleLogin = async (userData, previousUserIdFromLogin = null) => {
    console.log('=== handleLogin called ===');
    console.log('User data received:', userData);
    console.log('Previous user ID (from Login component):', previousUserIdFromLogin);

    // Determine guest ID that may hold vouchers:
    // 1) Prefer explicit previousUserId from Login (guest_)
    // 2) Fallback to anon ID used by wheel when spinning without login
    let guestUserIdForTransfer = previousUserIdFromLogin;
    if (!guestUserIdForTransfer) {
      try {
        const anonId = localStorage.getItem('wheeleat_anon_user_id');
        if (anonId) {
          guestUserIdForTransfer = anonId;
          console.log('Using anon user ID for voucher transfer:', anonId);
        }
      } catch (e) {
        console.debug('Could not read anon user id:', e);
      }
    }

    let isGuestSource = false;
    if (guestUserIdForTransfer) {
      isGuestSource =
        String(guestUserIdForTransfer).startsWith('anon_') ||
        String(guestUserIdForTransfer).startsWith('guest_');
    }
    console.log('Guest source for transfer:', {
      guestUserIdForTransfer,
      isGuestSource,
    });

    // If previous user was a guest/anon and new user is Google, transfer vouchers
    if (isGuestSource && guestUserIdForTransfer && userData && userData.loginType !== 'guest') {
      try {
        console.log('Transferring vouchers from guest/anon to Google account...', {
          guestUserId: guestUserIdForTransfer,
          googleUserId: userData.id,
        });
        const result = await transferVouchers({
          guestUserId: guestUserIdForTransfer,
          googleUserId: userData.id,
        });
        console.log('Voucher transfer result:', result);
        if (result.transferred > 0) {
          console.log(`Successfully transferred ${result.transferred} voucher(s) to Google account`);
        } else {
          console.log('No vouchers were transferred (may already exist or none found)');
        }
      } catch (e) {
        console.error('Failed to transfer vouchers:', e);
        console.error('Transfer error details:', e.message, e.stack);
        // Continue with login even if transfer fails
      }
    } else {
      console.log('Skipping transfer:', {
        isGuestSource,
        guestUserIdForTransfer,
        hasUserData: !!userData,
        userLoginType: userData?.loginType,
      });
    }

    setUser(userData);
    setShowLogin(false);
    console.log('User state updated');
    // User data is already saved in localStorage by Login component
  };

  const handleLogout = () => {
    localStorage.removeItem('wheeleat_user');
    setUser(null);
    setPendingVoucherClaim(null);
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
      pendingVoucherClaim={pendingVoucherClaim}
      setPendingVoucherClaim={setPendingVoucherClaim}
    />
  );
}

export default App;
