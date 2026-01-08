import React, { useEffect, useMemo, useRef, useState } from 'react';
import './SpinWheel.css';

function getViewportSize() {
  // visualViewport is more accurate on mobile (esp. iOS address bar / safe areas)
  const vv = typeof window !== 'undefined' ? window.visualViewport : null;
  return {
    width: Math.round(vv?.width ?? window.innerWidth),
    height: Math.round(vv?.height ?? window.innerHeight),
  };
}

function useViewportSize() {
  const [vp, setVp] = useState(() => {
    if (typeof window === 'undefined') return { width: 0, height: 0 };
    return getViewportSize();
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setVp(getViewportSize()));
    };

    const vv = window.visualViewport;
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    vv?.addEventListener('resize', update);
    vv?.addEventListener('scroll', update);

    // Ensure correct size on first paint (fixes “refresh-to-fix”)
    update();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      vv?.removeEventListener('resize', update);
      vv?.removeEventListener('scroll', update);
    };
  }, []);

  return vp;
}

function SpinWheel({ restaurants, spinning, result }) {
  const rotationRef = useRef(0); // current rotation in degrees (normalized 0..360)
  const lastSpinKeyRef = useRef(null);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [transitionMs, setTransitionMs] = useState(0);
  const spinAudioRef = useRef(null);
  const viewport = useViewportSize();

  const items = useMemo(() => {
    if (!restaurants || restaurants.length === 0) return [];
    return restaurants.map((r) => (typeof r === 'string' ? { name: r } : r));
  }, [restaurants]);

  const wheelGeom = useMemo(() => {
    // More responsive sizing for mobile phones - ensure it fits on screen
    const screenWidth = viewport.width || window.innerWidth;
    const screenHeight = viewport.height || window.innerHeight;
    
    // Account for all spacing: container padding, header, buttons, etc.
    const containerPadding = screenWidth <= 480 ? 50 : 80; // Account for container padding (25px each side on mobile)
    const headerSpace = screenWidth <= 480 ? 100 : 120; // Space for header and subtitle
    const buttonSpace = screenWidth <= 480 ? 100 : 100; // Space for spin button and other elements
    const extraMargin = screenWidth <= 480 ? 50 : 60; // Extra margin for safety
    
    // Calculate available space - use the smaller of width or height constraints
    const availableWidth = screenWidth - containerPadding;
    const availableHeight = screenHeight - headerSpace - buttonSpace - extraMargin;
    
    const isSmallMobile = screenWidth <= 360;
    const isMobile = screenWidth <= 480;
    const isLargeMobile = screenWidth <= 600;
    
    let wheelSize;
    if (isSmallMobile) {
      // Very small phones: ensure it fits in height with more aggressive sizing
      const widthBased = Math.floor(availableWidth * 0.55);
      const heightBased = Math.floor(availableHeight * 0.75);
      wheelSize = Math.min(200, widthBased, heightBased);
    } else if (isMobile) {
      // Regular mobile phones: use smaller percentage to ensure it fits
      const widthBased = Math.floor(availableWidth * 0.50);
      const heightBased = Math.floor(availableHeight * 0.70);
      wheelSize = Math.min(220, widthBased, heightBased);
    } else if (isLargeMobile) {
      // Large mobile phones / small tablets
      wheelSize = Math.min(320, Math.floor(availableWidth * 0.70));
    } else {
      // Tablets and desktop: original sizing
      wheelSize = Math.min(420, availableWidth);
    }
    
    // Scale pointer and padding for mobile - make them even smaller
    const pointerSize = isMobile ? 10 : 20;
    const pointerGap = isMobile ? 4 : 10;
    const padding = isMobile ? 4 : 14;
    const extra = pointerSize + pointerGap + padding;
    
    return {
      wheelSize,
      size: wheelSize + extra * 2,
      extra,
      pointerSize,
      pointerGap,
      padding,
      isMobile,
      isSmallMobile,
    };
  }, [viewport.width, viewport.height]);

  const sliceDeg = items.length > 0 ? 360 / items.length : 0;

  const palette = useMemo(
    () => [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
      '#FFB347', '#87CEEB', '#DDA0DD', '#F0E68C',
    ],
    []
  );

  const polarToCartesian = (cx, cy, r, angleDeg) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const describeSlice = (cx, cy, r, startDeg, endDeg) => {
    const start = polarToCartesian(cx, cy, r, startDeg);
    const end = polarToCartesian(cx, cy, r, endDeg);
    const largeArcFlag = endDeg - startDeg <= 180 ? '0' : '1';
    return [
      `M ${cx} ${cy}`,
      `L ${start.x} ${start.y}`,
      `A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
      'Z',
    ].join(' ');
  };

  const getLabelStyleForCount = (count, isMobile, isSmallMobile) => {
    // Adjust font sizes for mobile - make them larger for better readability
    const baseMultiplier = isSmallMobile ? 1.1 : isMobile ? 1.0 : 0.95;
    
    // Tweak these thresholds to your taste. Goal: keep labels readable as slices get thinner.
    if (count <= 8) return { fontSize: 4.5 * baseMultiplier, maxChars: isMobile ? 16 : 18 };
    if (count <= 12) return { fontSize: 4.0 * baseMultiplier, maxChars: isMobile ? 14 : 16 };
    if (count <= 18) return { fontSize: 3.5 * baseMultiplier, maxChars: isMobile ? 12 : 14 };
    if (count <= 26) return { fontSize: 3.0 * baseMultiplier, maxChars: isMobile ? 10 : 11 };
    if (count <= 36) return { fontSize: 2.6 * baseMultiplier, maxChars: isMobile ? 8 : 9 };
    return { fontSize: 2.3 * baseMultiplier, maxChars: isMobile ? 7 : 8 };
  };

  // Spinning sound (frontend/public/sounds/spin.mp3 -> /sounds/spin.mp3)
  useEffect(() => {
    const audio = new Audio('/sounds/spin.mp3');
    audio.loop = true;
    audio.volume = 0.6;
    audio.preload = 'auto';
    spinAudioRef.current = audio;

    return () => {
      audio.pause();
      audio.currentTime = 0;
      spinAudioRef.current = null;
    };
  }, []);

  // Play/pause sound based on `spinning`
  useEffect(() => {
    const audio = spinAudioRef.current;
    if (!audio) return;

    if (spinning) {
      // Reset to start each spin for consistency
      audio.currentTime = 0;
      const p = audio.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          // Autoplay may be blocked in some browsers; user interaction usually fixes it.
        });
      }
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [spinning]);

  // Reset when list changes (mall/categories)
  useEffect(() => {
    rotationRef.current = 0;
    setTransitionMs(0);
    setRotationDeg(0);
    lastSpinKeyRef.current = null;
  }, [items.length]);

  // Start a spin ONLY when we have both `spinning === true` and a concrete result name.
  // This avoids the old mismatch where the wheel started moving before the backend result arrived.
  useEffect(() => {
    if (!spinning) return;
    if (!items || items.length === 0) return;
    if (!result) return;

    const resultName = typeof result === 'string' ? result : result?.restaurant_name;
    if (!resultName) return;

    const spinKey = `${resultName}__${items.length}`;
    if (lastSpinKeyRef.current === spinKey) return;
    lastSpinKeyRef.current = spinKey;

    const targetIndex = items.findIndex((r) => r.name === resultName);
    if (targetIndex === -1) {
      console.warn('Restaurant not found in wheel:', resultName);
      return;
    }

    const targetCenterDegFromTop = targetIndex * sliceDeg + sliceDeg / 2;
    // rotation=0 means slice 0 boundary starts at top; pointer is at top.
    // To bring target center to top, rotate by -(targetCenterDegFromTop)
    const desiredFinal = ((-targetCenterDegFromTop % 360) + 360) % 360;

    // We animate to a big value, then normalize on transition end.
    const fullRotations = 5 * 360; // fixed 5 turns for consistency
    const target = fullRotations + desiredFinal;

    setTransitionMs(3200);
    setRotationDeg(target);
  }, [spinning, result, items, sliceDeg]);

  const onTransitionEnd = () => {
    // Normalize rotation to 0..360 (no animation jump)
    const normalized = ((rotationDeg % 360) + 360) % 360;
    rotationRef.current = normalized;
    setTransitionMs(0);
    setRotationDeg(normalized);
  };

  return (
    <div className="spin-wheel-container v2">
      <div className="spin-wheel-frame" style={{ width: wheelGeom.size, height: wheelGeom.size }}>
        <div className="spin-wheel-pointer" aria-hidden="true" />

        <div
          className="spin-wheel-rotator"
          style={{
            width: wheelGeom.wheelSize,
            height: wheelGeom.wheelSize,
            transform: `rotate(${rotationDeg}deg)`,
            transitionDuration: `${transitionMs}ms`,
          }}
          onTransitionEnd={onTransitionEnd}
        >
          <svg
            className="spin-wheel-svg"
            width={wheelGeom.wheelSize}
            height={wheelGeom.wheelSize}
            viewBox="0 0 100 100"
            role="img"
            aria-label="Spin wheel"
          >
            <defs>
              <filter id="wheelShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="rgba(0,0,0,0.25)" />
              </filter>
            </defs>

            {items.length === 0 ? (
              <circle cx="50" cy="50" r="48" fill="#f0f0f0" />
            ) : items.length === 1 ? (
              (() => {
                const r = items[0];
                const fill = palette[0];
                const label = r.name;
                return (
                  <g>
                    <circle cx="50" cy="50" r="48" fill={fill} stroke="#ffffff" strokeWidth="0.8" filter="url(#wheelShadow)" />
                    <text
                      x="50"
                      y="50"
                      fill="#ffffff"
                      fontSize="6"
                      fontWeight="800"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      paintOrder="stroke"
                      stroke="rgba(0,0,0,0.18)"
                      strokeWidth="0.8"
                    >
                      {label}
                    </text>
                  </g>
                );
              })()
            ) : (
              items.map((r, i) => {
                // Build slices starting at top (-90deg) and going clockwise.
                const start = -90 + i * sliceDeg;
                const end = -90 + (i + 1) * sliceDeg;
                const d = describeSlice(50, 50, 48, start, end);
                const { fontSize, maxChars } = getLabelStyleForCount(items.length, wheelGeom.isMobile, wheelGeom.isSmallMobile);
                const label =
                  r.name.length > maxChars ? `${r.name.slice(0, Math.max(1, maxChars - 1))}…` : r.name;
                const mid = (start + end) / 2;
                // Adjust text position for mobile - move it slightly closer to center for better readability
                const textRadius = wheelGeom.isMobile ? 28 : 30;
                const textPos = polarToCartesian(50, 50, textRadius, mid);
                const fill = palette[i % palette.length];
                
                // Rotate text to align with the radial line (slice divider)
                // mid is the angle from positive x-axis, so we use it directly for rotation
                // SVG rotate() rotates from positive x-axis, so mid is the correct rotation angle
                const textRotation = mid;

                return (
                  <g key={`${r.name}-${i}`}>
                    <path d={d} fill={fill} stroke="#ffffff" strokeWidth="0.8" filter="url(#wheelShadow)" />
                    <text
                      x={textPos.x}
                      y={textPos.y}
                      fill="#ffffff"
                      fontSize={fontSize}
                      fontWeight="700"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      paintOrder="stroke"
                      stroke="rgba(0,0,0,0.18)"
                      strokeWidth="0.6"
                      transform={`rotate(${textRotation} ${textPos.x} ${textPos.y})`}
                    >
                      {label}
                    </text>
                  </g>
                );
              })
            )}

          </svg>
        </div>

        {spinning && <div className="spinning-overlay" />}
      </div>
    </div>
  );
}

export default SpinWheel;
