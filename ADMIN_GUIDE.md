# Admin Guide (WheelEat)

This guide explains how the **Admin → Vouchers** page works, what each **status** means, and what happens when you click **Revoke** or **Delete**.

## Access / Permissions

- The **Admin** menu item only appears when you are signed in with Google and your email is in the admin allowlist:
  - `ybtan6666@gmail.com`
  - `zixiuong@gmail.com`
- The backend also verifies admin access **server-side** using your Google access token (it calls Google UserInfo).  
  If Admin actions return `Unauthorized`, sign out and sign in again so your browser has a fresh Google token.

## Voucher Data Model (Important)

There are **two layers**:

### 1) Voucher type / stock (`vouchers` table)

One row per restaurant voucher type.

- `id`: voucher type id (example: `voucher_ba-shu-jia-yan`)
- `total_qty`: total number of vouchers available for that restaurant
- `remaining_qty`: how many vouchers are currently available to claim (stock)

### 2) Fixed voucher codes (`voucher_codes` table)

This is the pool of **fixed, unique codes** (e.g. `BSJY-001` … `BSJY-010`).

Each code has:

- `status`:
  - `available`: not issued; can be claimed
  - `assigned`: currently held by an **active** user voucher
  - `used`: consumed forever (never returned)
  - `disabled`: deleted forever by admin (never returned)

### 3) Issued vouchers (`user_vouchers` table)

Each claim creates a `user_vouchers` row.

- `status`: the user’s voucher lifecycle status (see below)
- `code`: the fixed code from `voucher_codes` (e.g. `BSJY-003`)
- `issued_at_ms`: when the user claimed it
- `expired_at_ms`: when it expires

## User voucher status meanings (`user_vouchers.status`)

- **`active`**
  - Voucher is valid for the user.
  - It has a fixed code assigned in `user_vouchers.code`.
  - The matching `voucher_codes.status` should be `assigned`.

- **`expired`**
  - Voucher reached `expired_at_ms`.
  - The system returns the code to the pool:
    - `voucher_codes.status` becomes `available`
  - Stock is restocked by +1 (up to `total_qty`).

- **`removed`**
  - Voucher was revoked/removed.
  - Code is returned to the pool:
    - `voucher_codes.status` becomes `available`
  - Stock is restocked by +1 (up to `total_qty`).

- **`used`**
  - Voucher was marked as used.
  - Code is consumed:
    - `voucher_codes.status` becomes `used`
  - Stock is **NOT** restocked.

## Admin actions: Revoke vs Delete

On **Admin → Vouchers** you will see:

- **Revoke (+1)**
  - Intended meaning: “Take this voucher back and make it claimable again.”
  - Backend behavior:
    - If the voucher is `active`, it becomes `removed`
    - Its code returns to pool (`voucher_codes.status = available`)
    - Stock increases by +1 (capped by `total_qty`)

- **Delete (disable)**
  - Intended meaning: “Remove this voucher from the user, and permanently disable its code.”
  - Backend behavior:
    - The user voucher becomes `removed` (so it disappears from the user inventory)
    - The code becomes `disabled` (never re-issued)
    - Stock is **NOT** restocked

- **Restore (+1)** *(only shown when `code_status = disabled`)*
  - Intended meaning: “Undo a delete, re-enable the code and add it back to inventory.”
  - Backend behavior:
    - The code becomes `available` again
    - Stock increases by +1 (capped by `total_qty`)
    - The user voucher stays `removed` (it is **not** given back to the user)

## Search / Filters

- **Status filter**
  - Filters by `user_vouchers.status` (active/used/removed/expired)
- **Search**
  - Matches either `user_id` or `users.email`

## Notes / Gotchas

- If you “Delete forever” many codes, the restaurant will eventually run out of claimable codes even if `total_qty` is 10.
- If the admin page shows `—` for email, it means that user_id is not present in the `users` table (common for anon IDs unless you store them).


