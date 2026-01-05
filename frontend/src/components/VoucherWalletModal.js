import React, { useState } from 'react';
import './VoucherWalletModal.css';
import ClaimCashbackModal from './ClaimCashbackModal';

function formatRm(value) {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 'RM10';
  return `RM${n.toFixed(0)}`;
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return '';
  }
}

export default function VoucherWalletModal({ vouchers, onClose, onRemove, onClear }) {
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
                const logoPath = v.logo ? `/${v.logo}` : null;
                return (
                  <div key={v.id} className="voucher-wallet-item" role="listitem">
                    <div className="voucher-wallet-itemLeft">
                      {logoPath ? (
                        <img
                          src={logoPath}
                          alt={v.restaurantName}
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
                      <div className="voucher-wallet-amount">{formatRm(v.valueRm)}</div>
                      <div className="voucher-wallet-restaurant">{v.restaurantName}</div>
                      <div className="voucher-wallet-meta">
                        <span className="voucher-wallet-code">{v.code}</span>
                        <span className="voucher-wallet-date">{formatDate(v.issuedAt)}</span>
                      </div>
                    </div>

                    <div className="voucher-wallet-itemRight">
                      <button
                        type="button"
                        className="voucher-wallet-open"
                        onClick={() => setClaimingVoucher(v)}
                        aria-label={`Open voucher actions for ${v.restaurantName}`}
                        title="Open"
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        className="voucher-wallet-remove"
                        onClick={() => onRemove?.(v.id)}
                        aria-label={`Remove voucher for ${v.restaurantName}`}
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


