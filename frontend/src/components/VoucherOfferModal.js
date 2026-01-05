import React from 'react';
import './VoucherOfferModal.css';

function formatRm(value) {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 'RM10';
  return `RM${n.toFixed(0)}`;
}

export default function VoucherOfferModal({ result, valueRm = 10, onAccept, onDecline }) {
  if (!result) return null;

  const restaurantName = result.restaurant_name || 'Selected restaurant';
  const logoPath = result.logo ? `/${result.logo}` : null;
  const amountLabel = formatRm(valueRm);

  const code = String(result.spin_id || '').slice(-6).toUpperCase();
  const voucherPreview = code ? `WE-${code}` : 'WE-XXXXXX';

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
          <div className="voucher-offer-subtitle">Use it at your spun restaurant</div>
        </div>

        <div className="voucher-offer-card">
          {logoPath ? (
            <div className="voucher-offer-logoWrap">
              <img
                src={logoPath}
                alt={restaurantName}
                className="voucher-offer-logo"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          ) : null}

          <div className="voucher-offer-restaurantName">{restaurantName}</div>
          <div className="voucher-offer-code" aria-label="Voucher code preview">
            {voucherPreview}
          </div>
          <div className="voucher-offer-terms">
            {amountLabel} off. One voucher per spin. Subject to availability.
          </div>
        </div>

        <div className="voucher-offer-actions">
          <button
            type="button"
            className="voucher-offer-primary"
            onClick={() => onAccept?.({ valueRm })}
          >
            Claim {amountLabel}
          </button>
          <button type="button" className="voucher-offer-secondary" onClick={onDecline}>
            No thanks
          </button>
        </div>
      </div>
    </div>
  );
}


