import React, { useEffect, useMemo, useRef, useState } from 'react';
import './SpinWheel.css';

function SpinWheel({ restaurants, spinning, result }) {
  const rotationRef = useRef(0); // current rotation in degrees (normalized 0..360)
  const lastSpinKeyRef = useRef(null);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [transitionMs, setTransitionMs] = useState(0);

  const items = useMemo(() => {
    if (!restaurants || restaurants.length === 0) return [];
    return restaurants.map((r) => (typeof r === 'string' ? { name: r } : r));
  }, [restaurants]);

  const wheelGeom = useMemo(() => {
    const wheelSize = Math.min(420, window.innerWidth - 80);
    const pointerSize = 20;
    const pointerGap = 10;
    const padding = 14;
    const extra = pointerSize + pointerGap + padding;
    return {
      wheelSize,
      size: wheelSize + extra * 2,
      extra,
      pointerSize,
      pointerGap,
      padding,
    };
  }, []);

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
                const label = r.name.length > 16 ? `${r.name.slice(0, 16)}…` : r.name;
                const mid = (start + end) / 2;
                const textPos = polarToCartesian(50, 50, 30, mid);
                const fill = palette[i % palette.length];

                return (
                  <g key={`${r.name}-${i}`}>
                    <path d={d} fill={fill} stroke="#ffffff" strokeWidth="0.8" filter="url(#wheelShadow)" />
                    <text
                      x={textPos.x}
                      y={textPos.y}
                      fill="#ffffff"
                      fontSize="4"
                      fontWeight="700"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${mid + 90} ${textPos.x} ${textPos.y})`}
                    >
                      {label}
                    </text>
                  </g>
                );
              })
            )}

          </svg>
        </div>

        {spinning && <div className="spinning-overlay">Spinning...</div>}
      </div>
    </div>
  );
}

export default SpinWheel;
