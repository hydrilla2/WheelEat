import React, { useState } from 'react';
import './VoucherWalletModal.css';
import ClaimCashbackModal from './ClaimCashbackModal';

function formatRm(value) {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 'RM10';
  return `RM${n.toFixed(0)}`;
}

function formatDateFromMs(ms) {
  try {
    return new Date(Number(ms)).toLocaleString();
  } catch {
    return '';
  }
}

function formatExpiry(ms) {
  if (!ms) return '';
  try {
    return new Date(Number(ms)).toLocaleString();
  } catch {
    return '';
  }
}

export default function VoucherWalletModal({ vouchers, onClose, onRemove, onUse, onClear }) {
  const list = Array.isArray(vouchers) ? vouchers : [];
  const [claimingVoucher, setClaimingVoucher] = useState(null);

  return (
    <div className="voucher-wallet-overlay" onClick={onClose}>
      <div className="voucher-wallet" onClick={(e) => e.stopPropagation()}>
        <button className="voucher-wallet-close" onClick={onClose} aria-label="Close vouchers">
          ×
        </button>

        <div className="voucher-wallet-header">
          <h2 className="voucher-wallet-title">Your Vouchers</h2>
          <div className="voucher-wallet-subtitle">{list.length} saved</div>
        </div>

        {list.length === 0 ? (
          <div className="voucher-wallet-empty">
            <div className="voucher-wallet-emptyTitle">No vouchers yet</div>
            <div className="voucher-wallet-emptyText">Spin the wheel and claim a voucher when it pops up.</div>
          </div>
        ) : (
          <>
            <div className="voucher-wallet-list" role="list">
              {list.map((v) => {
                const logoPath = (v.merchant_logo || v.logo) ? `/${v.merchant_logo || v.logo}` : null;
                const code = `WE-${String(v.id || '').slice(-6).toUpperCase()}`;
                return (
                  <div key={v.id} className="voucher-wallet-item" role="listitem">
                    <div className="voucher-wallet-itemLeft">
                      {logoPath ? (
                        <img
                          src={logoPath}
                          alt={v.merchant_name || 'Far Coffee'}
                          className="voucher-wallet-logo"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="voucher-wallet-logoPlaceholder" aria-hidden="true">
                          RM
                        </div>
                      )}
                    </div>

                    <div className="voucher-wallet-itemMain">
                      <div className="voucher-wallet-amount">{formatRm(v.value_rm)}</div>
                      <div className="voucher-wallet-restaurant">{v.merchant_name || 'Far Coffee'}</div>
                      <div className="voucher-wallet-meta">
                        <span className="voucher-wallet-code">{code}</span>
                        <span className="voucher-wallet-date">{formatDateFromMs(v.issued_at_ms)}</span>
                        {v.expired_at_ms ? (
                          <span className="voucher-wallet-date">
                            Expires: {formatExpiry(v.expired_at_ms)}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="voucher-wallet-itemRight">
                      <button
                        type="button"
                        className="voucher-wallet-open"
                        onClick={() => setClaimingVoucher(v)}
                        aria-label={`Open voucher actions for ${v.merchant_name || 'Far Coffee'}`}
                        title="Open"
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        className="voucher-wallet-open"
                        onClick={() => onUse?.(v.id)}
                        aria-label={`Mark voucher as used for ${v.merchant_name || 'Restaurant'}`}
                        title="Used"
                      >
                        Used
                      </button>
                      <button
                        type="button"
                        className="voucher-wallet-remove"
                        onClick={() => onRemove?.(v.id)}
                        aria-label={`Remove voucher for ${v.merchant_name || 'Far Coffee'}`}
                        title="Remove"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="voucher-wallet-footer">
              <button type="button" className="voucher-wallet-clear" onClick={onClear}>
                Clear all
              </button>
            </div>
          </>
        )}
      </div>

      {claimingVoucher ? (
        <ClaimCashbackModal voucher={claimingVoucher} onClose={() => setClaimingVoucher(null)} />
      ) : null}
    </div>
  );
}


