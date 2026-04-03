# Society Hub

Full-stack society management platform — notices, complaints, payments, real-time alerts.

## Stack
- **Frontend**: React Native (Expo)
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **Auth**: JWT + OTP Email (SMTP)
- **Realtime**: WebSocket

## Quick Start

```bash
cd society-hub
cp .env.example .env        # Edit with your secrets
cd backend && npm install
cd ../frontend && npm install
cd .. && node run.js        # Starts API :4000 + Expo
```

## Tests

```bash
# Unit tests (no server needed)
node tests/frontend/components.test.js

# API tests (backend must be running)
API_URL=http://localhost:4000 node tests/api/auth.test.js
API_URL=http://localhost:4000 node tests/api/notices.test.js
```

## API Reference

| Method | Path | Auth | Role |
|--------|------|------|------|
| POST | /auth/register | — | — |
| POST | /auth/verify-otp | — | — |
| POST | /auth/login | — | — |
| POST | /auth/resend-otp | — | — |
| POST | /auth/forgot-password | — | — |
| POST | /auth/reset-password | — | — |
| GET | /auth/me | JWT | any |
| GET | /notices | JWT | any |
| POST | /notices | JWT | admin |
| PUT | /notices/:id | JWT | admin |
| DELETE | /notices/:id | JWT | admin |
| GET | /complaints | JWT | any |
| POST | /complaints | JWT | any |
| PATCH | /complaints/:id | JWT | admin |
| GET | /payments | JWT | any |
| POST | /payments | JWT | admin |
| PATCH | /payments/:id/pay | JWT | resident |
| GET | /payments/summary | JWT | admin |
| GET | /users | JWT | admin |
| PUT | /users/:id | JWT | admin |
| PUT | /users/me/profile | JWT | any |

## WebSocket Events (`ws://host:4000/ws`)

| Event | Trigger |
|-------|---------|
| `notice:new` | Notice created |
| `notice:update` | Notice updated |
| `notice:delete` | Notice deleted |
| `complaint:new` | Complaint filed |
| `complaint:update` | Status changed |

## Security (CIA Triad)
- **Confidentiality**: bcrypt-12 passwords, JWT auth, role-based access, `password: select:false`
- **Integrity**: Mongoose schema validation, single-use OTPs with 10-min expiry, PATCH-only status updates
- **Availability**: WS auto-reconnect (3s), error boundaries on all routes, graceful DB error handling
