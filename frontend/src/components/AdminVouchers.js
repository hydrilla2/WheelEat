import React, { useCallback, useMemo, useState } from 'react';
import './AdminVouchers.css';
import { adminDeleteVoucher, adminFetchUserVouchers, adminRevokeVoucher } from '../services/api';

function formatMs(ms) {
  if (!ms) return '—';
  try {
    return new Date(Number(ms)).toLocaleString();
  } catch {
    return '—';
  }
}

export default function AdminVouchers({ user }) {
  const isAdmin = useMemo(() => {
    return user?.loginType === 'google' && String(user?.email || '').toLowerCase() === 'ybtan6666@gmail.com';
  }, [user]);

  const [status, setStatus] = useState('active');
  const [q, setQ] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const accessToken = user?.accessToken || '';

  const refresh = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const out = await adminFetchUserVouchers({
        accessToken,
        status: status || undefined,
        q: q || undefined,
        limit: 200,
        offset: 0,
      });
      setRows(Array.isArray(out?.vouchers) ? out.vouchers : []);
    } catch (e) {
      setError(e?.message || 'Failed to load vouchers');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, q, status]);

  const revoke = useCallback(
    async (userVoucherId) => {
      if (!window.confirm('Revoke this voucher and RESTOCK +1?')) return;
      await adminRevokeVoucher({ accessToken, userVoucherId });
      await refresh();
    },
    [accessToken, refresh]
  );

  const del = useCallback(
    async (userVoucherId) => {
      if (!window.confirm('DELETE this voucher forever (NO restock)?')) return;
      await adminDeleteVoucher({ accessToken, userVoucherId });
      await refresh();
    },
    [accessToken, refresh]
  );

  if (!isAdmin) {
    return (
      <div className="admin-vouchers">
        <h2 className="admin-title">Admin</h2>
        <div className="admin-muted">You are not authorized to view this page.</div>
      </div>
    );
  }

  return (
    <div className="admin-vouchers">
      <h2 className="admin-title">Admin • Vouchers</h2>

      <div className="admin-card">
        <div className="admin-muted">
          Admin is verified server-side using your Google sign-in token.
          {accessToken ? null : ' (Missing access token — please sign out and sign in again.)'}
        </div>

        <div className="admin-row admin-row-2">
          <label className="admin-label">
            Status
            <select className="admin-input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="used">Used</option>
              <option value="removed">Removed</option>
              <option value="expired">Expired</option>
            </select>
          </label>

          <label className="admin-label">
            Search (user id or email)
            <input className="admin-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="anon_... or user@gmail.com" />
          </label>
        </div>

        <div className="admin-row admin-actions">
          <button className="admin-btn" type="button" onClick={refresh} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
          {error ? <div className="admin-error">{error}</div> : null}
        </div>
      </div>

      <div className="admin-table">
        <div className="admin-table-head">
          <div>User</div>
          <div>Restaurant</div>
          <div>Code</div>
          <div>Status</div>
          <div>Issued</div>
          <div>Expires</div>
          <div>Actions</div>
        </div>

        {rows.map((r) => (
          <div key={r.user_voucher_id} className="admin-table-row">
            <div className="admin-mono">
              <div title={r.user_id}>{r.user_id}</div>
              <div className="admin-muted" title={r.user_email || ''}>
                {r.user_email || '—'}
              </div>
            </div>
            <div>{r.merchant_name || '—'}</div>
            <div className="admin-mono">{r.code || '—'}</div>
            <div className="admin-badge">{r.status}</div>
            <div className="admin-mono">{formatMs(r.issued_at_ms)}</div>
            <div className="admin-mono">{formatMs(r.expired_at_ms)}</div>
            <div className="admin-actions">
              <button className="admin-btn-secondary" type="button" onClick={() => revoke(r.user_voucher_id)} disabled={loading}>
                Revoke (+1)
              </button>
              <button className="admin-btn-danger" type="button" onClick={() => del(r.user_voucher_id)} disabled={loading}>
                Delete
              </button>
            </div>
          </div>
        ))}

        {rows.length === 0 && !loading ? <div className="admin-empty">No vouchers found.</div> : null}
      </div>
    </div>
  );
}


