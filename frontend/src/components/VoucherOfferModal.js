import React from 'react';
import './VoucherOfferModal.css';

function formatRm(value) {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 'RM10';
  return `RM${n.toFixed(0)}`;
}

function formatMytExpiry(ms) {
  if (!ms) return '24 hours after you claim';
  try {
    // Malaysia Time (GMT+8)
    const d = new Date(Number(ms));
    return d.toLocaleString('en-MY', {
      timeZone: 'Asia/Kuala_Lumpur',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '24 hours after you claim';
  }
}

export default function VoucherOfferModal({ voucher, onAccept, onDecline, user }) {
  if (!voucher) return null;

  const merchantName = voucher.merchant_name || 'Far Coffee';
  const logoPath = (voucher.merchant_logo || voucher.logo) ? `/${voucher.merchant_logo || voucher.logo}` : null;
  const amountLabel = formatRm(voucher.value_rm ?? 10);
  const minSpendRm = Number(voucher.min_spend_rm);
  const minSpendLabel = Number.isFinite(minSpendRm) ? `Min spend RM${minSpendRm}` : null;

  const code = String(voucher.id || '').slice(-6).toUpperCase();
  const voucherPreview = code ? `WE-${code}` : 'WE-XXXXXX';
  const expiryLabel = formatMytExpiry(voucher.expired_at_ms);

  // Check if user is a guest (not signed in with Google)
  const isGuest = !user || user.loginType === 'guest' || String(user?.id || '').startsWith('anon_');

  return (
    <div className="voucher-offer-overlay" onClick={onDecline}>
      <div className="voucher-offer" onClick={(e) => e.stopPropagation()}>
        <button className="voucher-offer-close" onClick={onDecline} aria-label="Close voucher">
          ×
        </button>

        <div className="voucher-offer-badge" aria-hidden="true">
          {amountLabel}
        </div>

        <div className="voucher-offer-header">
          <div className="voucher-offer-title">Limited-time voucher</div>
          <div className="voucher-offer-subtitle">
            {minSpendLabel ? `${minSpendLabel} • ` : ''}Use it at {merchantName}
          </div>
        </div>

        <div className="voucher-offer-card">
          {logoPath ? (
            <div className="voucher-offer-logoWrap">
              <img
                src={logoPath}
                alt={merchantName}
                className="voucher-offer-logo"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          ) : null}

          <div className="voucher-offer-restaurantName">{merchantName}</div>
          <div className="voucher-offer-code" aria-label="Voucher code preview">
            {voucherPreview}
          </div>
          <div className="voucher-offer-terms">
            {minSpendLabel ? `${minSpendLabel}. ` : ''}
            {amountLabel} off. Expires: {expiryLabel} (MYT).
          </div>
        </div>

        {isGuest && (
          <div className="voucher-offer-guest-notice" style={{
            padding: '12px',
            margin: '16px 0',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            color: '#856404',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            ⚠️ Sign in with Google to claim this voucher.
          </div>
        )}
        <div className="voucher-offer-actions">
          <button
            type="button"
            className="voucher-offer-primary"
            onClick={() => onAccept?.()}
          >
            {isGuest ? 'Sign in to Claim' : `Claim ${amountLabel}`}
          </button>
          <button type="button" className="voucher-offer-secondary" onClick={onDecline}>
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}


