import React from 'react';
import './ClaimCashbackModal.css';

export const WHATSAPP_CLAIM_LINK = 'https://wa.link/oullbd';

export default function ClaimCashbackModal({ voucher, onClose }) {
  if (!voucher) return null;

  const logoPath = (voucher.merchant_logo || voucher.logo) ? `/${voucher.merchant_logo || voucher.logo}` : null;
  const merchantName = voucher.merchant_name || 'Far Coffee';
  const code = `WE-${String(voucher.id || '').slice(-6).toUpperCase()}`;

  return (
    <div className="claim-overlay" onClick={onClose}>
      <div className="claim-modal" onClick={(e) => e.stopPropagation()}>
        <button className="claim-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="claim-header">
          <h2 className="claim-title">How to Claim Your Cashback</h2>
          <p className="claim-subtitle">
            Thank you for using our Spinwheel! To receive your cashback, please follow these simple steps:
          </p>
        </div>

        <div className="claim-voucherCard" aria-label="Voucher to claim">
          {logoPath ? (
            <img
              src={logoPath}
              alt={merchantName}
              className="claim-logo"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : null}
          <div className="claim-voucherInfo">
            <div className="claim-voucherName">{merchantName}</div>
            <div className="claim-voucherCode">{code}</div>
          </div>
        </div>

        <ol className="claim-steps">
          <li>
            <strong>Redeem &amp; Enjoy:</strong> Visit the restaurant and use your voucher. Make sure to keep your original receipt.
          </li>
          <li>
            <strong>Submit via WhatsApp:</strong> Click the “Claim Cashback” button below to connect with our support team.
          </li>
          <li>
            <strong>Provide Proof:</strong> Send us a clear photo of:
            <ul>
              <li>Your Digital Voucher (screenshot).</li>
              <li>Your Final Bill/Receipt.</li>
            </ul>
          </li>
          <li>
            <strong>Verification:</strong> Our team will manually verify your submission.
          </li>
          <li>
            <strong>Get Paid:</strong> Once approved, we will process your refund/cashback via your preferred payment method.
          </li>
        </ol>

        <div className="claim-note">
          <strong>Note:</strong> Please be informed that all claims are handled manually to ensure security. Processing may
          take <strong>1 working day</strong>. We appreciate your patience!
        </div>

        <a className="claim-cta" href={WHATSAPP_CLAIM_LINK} target="_blank" rel="noopener noreferrer">
          Claim Cashback
        </a>
      </div>
    </div>
  );
}


