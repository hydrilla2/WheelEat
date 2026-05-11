import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './App.css';
import SpinWheel from './components/SpinWheel';
import CategorySelector from './components/CategorySelector';
import BudgetSelector from './components/BudgetSelector';
import DietarySelector from './components/DietarySelector';
import MallSelector from './components/MallSelector';
import ResultModal from './components/ResultModal';
import Login from './components/Login';
import {
  fetchMalls,
  fetchRestaurants,
  recordSpin,
  trackPageView,
  // Voucher methods disabled:
  // fetchUserVouchers,
  // Restaurant-of-the-day voucher method disabled:
  // claimRestaurantVoucher,
  // fetchVoucherStocks,
} from './services/api';
import Leaderboard from './components/Leaderboard';
// Restaurant-of-the-day voucher method disabled:
// import VoucherOfferModal from './components/VoucherOfferModal';
// Voucher wallet disabled:
// import VoucherWalletModal from './components/VoucherWalletModal';
import AdminVouchers from './components/AdminVouchers';
import { useSessionTracker } from './hooks/useSessionTracker';
import { getEffectiveUserId } from './utils/userId';
import { budgetTiersForRestaurant } from './data/priceRanges';
// Restaurant-of-the-day detail helpers disabled:
// import { getPriceRange } from './data/priceRanges';
// import { getGoogleMapsLink } from './data/googleMapsLinks';

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
function WheelEatApp({ user, onLogout, onShowLogin }) {
  const [mallId, setMallId] = useState('sunway_square');
  const [malls, setMalls] = useState([]);
  const [mallsLoading, setMallsLoading] = useState(true);
  const [dietaryNeed, setDietaryNeed] = useState('any');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedBudgets, setSelectedBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [restaurantsCache, setRestaurantsCache] = useState([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const spinSeqRef = useRef(0);
  const [spinSeq, setSpinSeq] = useState(0);
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState(null);
  const spinTimeoutRef = useRef(0);
  const spinShowRef = useRef(0);
  const spinHardStopRef = useRef(0);
  const [activeView, setActiveView] = useState('wheel'); // 'wheel' | 'leaderboard' | 'admin'
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const menuRef = useRef(null);
  const ringAudioRef = useRef(null);
  const clickAudioRef = useRef(null);

  // Vouchers disabled:
  // const [vouchers, setVouchers] = useState([]);
  // const [showVoucherWallet, setShowVoucherWallet] = useState(false);

  // Restaurant of the day (spotlight) disabled:
  // const [showRestaurantList, setShowRestaurantList] = useState(false);
  // const [spotlightIndex, setSpotlightIndex] = useState(0);
  // const [spotlightList, setSpotlightList] = useState([]);
  // const [showFeaturedDetail, setShowFeaturedDetail] = useState(false);
  // const [featuredDetail, setFeaturedDetail] = useState(null);

  // Restaurant-of-the-day voucher claiming disabled:
  // const [showVoucherOffer, setShowVoucherOffer] = useState(false);
  // const [pendingVoucher, setPendingVoucher] = useState(null);
  // const [voucherStockByRestaurant, setVoucherStockByRestaurant] = useState({});
  // const promoVouchers = useMemo(
  //   () => [{ value: 'RM 5', minSpend: 'Min spend RM 30', restaurant: 'Ba Shu Jia Yan', left: 10 }],
  //   []
  // );

  // Voucher methods disabled:
  // const effectiveUserId = useMemo(() => getEffectiveUserId(user), [user]);
  // Restaurant-of-the-day voucher claiming disabled:
  // const isGuest = useMemo(() => !user || user.loginType === 'guest', [user]);
  const isAdmin = useMemo(() => {
    const email = String(user?.email || '').toLowerCase();
    return (
      user?.loginType === 'google' &&
      (email === 'ybtan6666@gmail.com' || email === 'zixiuong@gmail.com' || email === 'zkho0011@student.monash.edu')
    );
  }, [user]);

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

  // Load minimal restaurant list ONCE per mall, cache it in memory/state.
  useEffect(() => {
    if (!mallId) return;

    // Track page view
    trackPageView(user?.id || 'anonymous', mallId);

    // Reset selections when mall changes
    setSelectedCategories([]);
    setSelectedBudgets([]);
    setResult(null);
    setShowResult(false);
    setError(null);
    setRestaurantsCache([]);
    setCategories([]);

    setRestaurantsLoading(true);
    fetchRestaurants({ mallId, dietaryNeed: 'any' })
        .then((data) => {
        const list = Array.isArray(data?.restaurants) ? data.restaurants : [];
        setRestaurantsCache(list);
        const cats = Array.from(new Set(list.map((r) => r?.category).filter(Boolean))).sort();
        setCategories(cats);
        })
        .catch((err) => {
        console.error('Failed to load restaurants cache:', err);
        setRestaurantsCache([]);
          setCategories([]);
      })
      .finally(() => setRestaurantsLoading(false));
  }, [mallId, user?.id]);

  // Filter restaurants in-memory (no refetch) based on current UI selections.
  const restaurants = useMemo(() => {
    const list = Array.isArray(restaurantsCache) ? restaurantsCache : [];
    if (list.length === 0) return [];

    const categorySet = selectedCategories.length > 0 ? new Set(selectedCategories) : null;
    const budgetSet = selectedBudgets.length > 0 ? new Set(selectedBudgets) : null;
    const dietary = String(dietaryNeed || 'any');

    return list.filter((r) => {
      if (!r) return false;
      if (categorySet && !categorySet.has(r.category)) return false;
      if (budgetSet) {
        const tiers = budgetTiersForRestaurant(r.name);
        // If we have a known price range, use overlap tiers; else fall back to backend-provided single tier.
        const ok = tiers.length > 0 ? tiers.some((t) => budgetSet.has(t)) : budgetSet.has(r.budget);
        if (!ok) return false;
      }
      if (dietary === 'halal_pork_free' && !r.isHalal) return false;
      return true;
    });
  }, [restaurantsCache, selectedCategories, selectedBudgets, dietaryNeed]);

  // Vouchers disabled:
  // const refreshVouchers = useCallback(async () => {
  //   try {
  //     const data = await fetchUserVouchers(effectiveUserId);
  //     const active = Array.isArray(data?.vouchers)
  //       ? data.vouchers.filter((v) => v.status === 'active').map((v) => ({ ...v, logo: v.merchant_logo || v.logo || null }))
  //       : [];
  //     setVouchers(active);
  //   } catch (e) {
  //     console.debug('Failed to load vouchers:', e);
  //     setVouchers([]);
  //   }
  // }, [effectiveUserId]);

  // Restaurant-of-the-day voucher stock method disabled:
  // const refreshVoucherStocks = useCallback(async (merchantNames) => {
  //   try {
  //     const names = Array.isArray(merchantNames) ? merchantNames.filter(Boolean) : [];
  //     if (names.length === 0) return;
  //     const data = await fetchVoucherStocks(names);
  //     const stocks = data?.stocks || {};
  //     setVoucherStockByRestaurant((prev) => ({ ...prev, ...stocks }));
  //   } catch (e) {
  //     console.debug('Failed to load voucher stocks:', e);
  //   }
  // }, []);

  // Voucher loading disabled:
  // useEffect(() => {
  //   refreshVouchers();
  // }, [refreshVouchers]);

  // useEffect(() => {
  //   if (!showVoucherWallet) return;
  //   refreshVouchers();
  // }, [showVoucherWallet, refreshVouchers]);

  // Restaurant of the day spotlight methods disabled:
  // useEffect(() => {
  //   if (!restaurantsCache.length) {
  //     setSpotlightList([]);
  //     setSpotlightIndex(0);
  //     return;
  //   }
  //   const featuredPrimary = restaurantsCache.find((r) => r?.name === 'Ba Shu Jia Yan');
  //   const copy = [featuredPrimary].filter(Boolean);
  //   if (copy.length === 0) copy.push(...restaurantsCache);
  //   setSpotlightList(copy.slice(0, 1)); // only show one for "restaurant of the day"
  //   setSpotlightIndex(0);
  // }, [restaurantsCache, mallId]);

  // Restaurant-of-the-day voucher stock loading disabled:
  // useEffect(() => {
  //   if (!showRestaurantList) return;
  //   refreshVoucherStocks(spotlightList.map((r) => r?.name));
  // }, [showRestaurantList, spotlightList, refreshVoucherStocks]);

  // useEffect(() => {
  //   if (!showFeaturedDetail || !featuredDetail?.name) return;
  //   refreshVoucherStocks([featuredDetail.name]);
  // }, [showFeaturedDetail, featuredDetail, refreshVoucherStocks]);

  const handleSpin = async () => {
    // Guard: prevent concurrent spins.
    if (spinning) return;

    // If no categories selected, use all categories
    const categoriesToUse = selectedCategories.length > 0 ? selectedCategories : categories;
    
    if (categoriesToUse.length === 0) {
      setError('No restaurant categories available');
      return;
    }

    if (restaurantsLoading) {
      setError('Loading restaurants… please try again.');
      return;
    }

    if (restaurants.length === 0) {
      setError('No restaurants found');
      return;
    }

    setError(null);
    setShowResult(false);
    
    // Pre-calculate result synchronously from cached data BEFORE animation starts.
    const selectedRestaurant = restaurants[Math.floor(Math.random() * restaurants.length)];
    const timestampIso = new Date().toISOString();
    const googleMapsUrl = `https://maps.google.com/?q=${encodeURIComponent(`${selectedRestaurant.name} Sunway Square`)}`;

    const nextResult = {
      restaurant_name: selectedRestaurant.name,
      restaurant_unit: selectedRestaurant.unit || null,
      restaurant_floor: selectedRestaurant.floor || null,
      category: selectedRestaurant.category || null,
      budget: selectedRestaurant.budget || null,
      timestamp: timestampIso,
      spin_id: null,
      logo: selectedRestaurant.logo || null,
      google_maps_url: googleMapsUrl,
      google_maps_mobile_url: googleMapsUrl,
      restaurant_location: selectedRestaurant.unit || null,
    };

    // Ensure wheel animates even if the same restaurant is selected twice in a row.
    spinSeqRef.current += 1;
    setSpinSeq(spinSeqRef.current);

    setResult(nextResult);

    // Start spinning animation immediately (no async/network dependency).
    setSpinning(true);

    // Clear any previous timers.
    clearTimeout(spinTimeoutRef.current);
    clearTimeout(spinShowRef.current);
    clearTimeout(spinHardStopRef.current);

    const SPIN_ANIM_MS = 3200; // should match SpinWheel transition
    const SHOW_DELAY_MS = 300;
    const HARD_STOP_MS = SPIN_ANIM_MS + 2000; // never allow infinite spin

    spinTimeoutRef.current = setTimeout(() => {
        setSpinning(false);
      spinShowRef.current = setTimeout(() => setShowResult(true), SHOW_DELAY_MS);
    }, SPIN_ANIM_MS);

    // Fallback: if anything goes wrong, force stop and show result.
    spinHardStopRef.current = setTimeout(() => {
      setSpinning((prev) => {
        if (!prev) return prev;
          setShowResult(true);
        return false;
      });
    }, HARD_STOP_MS);

    // Optional: async log to backend (leaderboard/analytics) without blocking the spin.
    try {
      recordSpin({
        restaurantName: selectedRestaurant.name,
        selectedCategories: categoriesToUse,
        mallId,
        dietaryNeed,
        selectedBudgets,
      }).catch(() => {});
    } catch {
      // ignore
    }
  };

  const handleCloseResult = () => {
    setShowResult(false);
    setResult(null);
  };

  // Restaurant-of-the-day voucher claim methods disabled:
  // const handleDeclineVoucher = () => {
  //   setShowVoucherOffer(false);
  //   setPendingVoucher(null);
  // };

  // const handleKeepVoucher = async () => {
  //   const merchantName = pendingVoucher?.merchant_name;
  //   if (!merchantName) {
  //     setShowVoucherOffer(false);
  //     setPendingVoucher(null);
  //     return;
  //   }
  //
  //   if (isGuest) {
  //     setShowVoucherOffer(false);
  //     setPendingVoucher(null);
  //     onShowLogin();
  //     alert('Please sign in with Google to claim this voucher.');
  //     return;
  //   }
  //
  //   const currentStock = voucherStockByRestaurant?.[merchantName]?.remaining_qty;
  //   const hasActiveVoucher = vouchers.some((v) => String(v.merchant_name) === String(merchantName));
  //   if (currentStock !== undefined && currentStock !== null && Number(currentStock) <= 0) {
  //     alert('Sorry, there is no voucher left.');
  //     setShowVoucherOffer(false);
  //     setPendingVoucher(null);
  //     return;
  //   }
  //   if (hasActiveVoucher) {
  //     alert('You already claimed this voucher.');
  //     setShowVoucherOffer(false);
  //     setPendingVoucher(null);
  //     return;
  //   }
  //
  //   const merchantLogo = pendingVoucher?.merchant_logo || pendingVoucher?.logo || null;
  //   const valueRm = pendingVoucher?.value_rm;
  //   const minSpendRm = pendingVoucher?.min_spend_rm;
  //
  //   try {
  //     const out = await claimRestaurantVoucher({
  //       userId: effectiveUserId,
  //       merchantName,
  //       merchantLogo,
  //       valueRm,
  //       minSpendRm,
  //     });
  //
  //     if (out?.won) {
  //       await refreshVouchers();
  //       if (out?.remainingQty !== undefined) {
  //         setVoucherStockByRestaurant((prev) => ({
  //           ...prev,
  //           [merchantName]: { ...(prev?.[merchantName] || {}), remaining_qty: Number(out.remainingQty) },
  //         }));
  //       } else {
  //         refreshVoucherStocks([merchantName]);
  //       }
  //       setShowVoucherOffer(false);
  //       setPendingVoucher(null);
  //       setShowVoucherWallet(true);
  //     } else if (out?.reason === 'sold_out') {
  //       alert('Sorry, this restaurant voucher is sold out.');
  //       setShowVoucherOffer(false);
  //       setPendingVoucher(null);
  //     } else if (out?.reason === 'already_has_voucher' || out?.reason === 'already_claimed') {
  //       alert('You already claimed this voucher.');
  //       setShowVoucherOffer(false);
  //       setPendingVoucher(null);
  //     } else {
  //       alert('No voucher won this time.');
  //       setShowVoucherOffer(false);
  //       setPendingVoucher(null);
  //     }
  //   } catch (e) {
  //     alert(e?.message || 'Failed to claim voucher');
  //     setShowVoucherOffer(false);
  //     setPendingVoucher(null);
  //   }
  // };

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
                {/*
                Voucher notification disabled:
                {vouchers.length > 0 ? <span className="header-menu-dot" aria-hidden="true" /> : null}
                */}
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

                  {/*
                  Voucher wallet menu item disabled:
                  <button
                    type="button"
                    role="menuitem"
                    className="header-menu-item"
                    onClick={() => {
                      setMenuOpen(false);
                      setShowVoucherWallet(true);
                    }}
                  >
                    <span className="header-menu-check" aria-hidden="true" />
                    <span className="header-menu-label">
                      Vouchers {vouchers.length > 0 ? <span className="header-menu-badge">{vouchers.length}</span> : null}
                    </span>
                  </button>
                  */}

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
              {/*
              Restaurant of the day spotlight disabled:
              <div className="spotlight-panel">
                <div className="spotlight-header">
                  <span className="spotlight-title">Restaurant of the day</span>
                  <button type="button" className="spotlight-viewall" onClick={() => setShowRestaurantList(true)}>
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
                        <div className="spotlight-name">{spotlightList[spotlightIndex]?.name}</div>
                        <div className="spotlight-meta">
                          {spotlightList[spotlightIndex]?.category || 'Category'}
                          {spotlightList[spotlightIndex]?.unit ? ` | ${spotlightList[spotlightIndex]?.unit}` : ''}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="spotlight-empty">Loading restaurants...</div>
                  )}
                </button>
              </div>
              */}
              <DietarySelector
                value={dietaryNeed}
                onChange={setDietaryNeed}
                onClickSound={playClick}
                disabled={spinning}
              />
              <BudgetSelector
                selected={selectedBudgets}
                onChange={setSelectedBudgets}
                onClickSound={playClick}
                disabled={spinning}
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
                spinSeq={spinSeq}
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
              categories={categories}
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

      {/*
      Restaurant of the day modal and voucher collection UI disabled:
      {showRestaurantList ? (
        <div className="restaurant-list-overlay" onClick={() => setShowRestaurantList(false)} role="presentation">
          <div className="restaurant-list-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="restaurant-list-close"
              onClick={() => setShowRestaurantList(false)}
              aria-label="Close restaurant list"
            >
              X
            </button>
            <h2>Restaurant of the day</h2>
            <div className="restaurant-list-count">{spotlightList.length} total</div>

            <div className="restaurant-list-scroll">
              {spotlightList.map((r) => {
                const vouchersForRestaurant = promoVouchers.filter((voucher) => voucher.restaurant === r.name);
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
                                if (isGuest) {
                                  alert('Please sign in with Google to claim this voucher.');
                                  onShowLogin();
                                  return;
                                }
                                const leftNow = dynamicLeft !== null ? Number(dynamicLeft) : Number(voucher.left);
                                if (Number.isFinite(leftNow) && leftNow <= 0) {
                                  alert('Sorry, there is no voucher left.');
                                  return;
                                }
                                if (!isGuest && vouchers.some((vv) => String(vv.merchant_name) === String(r.name))) {
                                  alert('You already claimed this voucher.');
                                  return;
                                }
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
                              {(() => {
                                const leftNow = dynamicLeft !== null ? Number(dynamicLeft) : Number(voucher.left);
                                if (Number.isFinite(leftNow) && leftNow <= 0) return 'Sold out';
                                if (!isGuest && vouchers.some((vv) => String(vv.merchant_name) === String(r.name))) return 'Already claimed';
                                return 'Collect voucher';
                              })()}
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
        <div className="restaurant-detail-overlay" onClick={() => setShowFeaturedDetail(false)} role="presentation">
          <div className="restaurant-detail-modal" onClick={(e) => e.stopPropagation()}>
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
                <span className="restaurant-detail-value">{getPriceRange(featuredDetail.name)}</span>
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
                          if (isGuest) {
                            alert('Please sign in with Google to claim this voucher.');
                            onShowLogin();
                            return;
                          }
                          const dynamicLeft = voucherStockByRestaurant?.[featuredDetail.name]?.remaining_qty;
                          const leftNow = dynamicLeft !== undefined ? Number(dynamicLeft) : Number(voucher.left);
                          if (Number.isFinite(leftNow) && leftNow <= 0) {
                            alert('Sorry, there is no voucher left.');
                            return;
                          }
                          if (!isGuest && vouchers.some((vv) => String(vv.merchant_name) === String(featuredDetail.name))) {
                            alert('You already claimed this voucher.');
                            return;
                          }
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
                        {(() => {
                          const dynamicLeft = voucherStockByRestaurant?.[featuredDetail.name]?.remaining_qty;
                          const leftNow = dynamicLeft !== undefined ? Number(dynamicLeft) : Number(voucher.left);
                          if (Number.isFinite(leftNow) && leftNow <= 0) return 'Sold out';
                          if (!isGuest && vouchers.some((vv) => String(vv.merchant_name) === String(featuredDetail.name)))
                            return 'Already claimed';
                          return 'Collect voucher';
                        })()}
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showVoucherOffer ? (
        <VoucherOfferModal voucher={pendingVoucher} onAccept={handleKeepVoucher} onDecline={handleDeclineVoucher} user={user} />
      ) : null}
      */}

      {/*
      Voucher wallet modal disabled:
      {showVoucherWallet ? <VoucherWalletModal vouchers={vouchers} onClose={() => setShowVoucherWallet(false)} /> : null}
      */}
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  // Track user session time (always use a user ID - either Google or anonymous)
  const userId = getEffectiveUserId(user);
  useSessionTracker(userId);

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

    // Track page view (use effective user ID - Google or anonymous)
    let userId = null;
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        userId = getEffectiveUserId(userData);
      } catch (e) {
        // If parse fails, use anonymous ID
        userId = getEffectiveUserId(null);
      }
    } else {
      // No saved user - use anonymous ID
      userId = getEffectiveUserId(null);
    }
    trackPageView(window.location.pathname, userId);
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
