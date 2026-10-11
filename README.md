# StepPay — sandbox payment gateway for IT Step Academy

StepPay is an **educational imitation of a bank payment gateway** (modelled on the
structure of [Flitt](https://flitt.com)). Students create a merchant, get a
`merchant_id` + secret key, connect their online restaurant / shop and accept
**test** card payments — with a real-looking checkout, 3-D Secure, refunds,
settlements, disputes, callbacks and a merchant dashboard.

No real money is ever processed. Only test cards are accepted.

```
Student's shop ──POST /api/checkout/url──▶ StepPay ──checkout_url──▶ Customer pays with a test card
       ▲                                                                     │
       └──────── redirect to response_url  +  POST server_callback_url ◀─────┘
```

## What is inside

| Part | URL | For |
| --- | --- | --- |
| Landing page | `/` | Everyone |
| Merchant portal | `/portal/*` | Students: activation, dashboard, payments, settlements, disputes, reports, developer logs, payment links, integration guide, API playground, merchant settings |
| Lecturer panel | `/portal/admin` | Lecturers: all students, groups, payments, password resets |
| Hosted checkout | `/checkout/:token` | Customers (test cards, 3-D Secure, result page) |
| Payment links | `/pay/:slug` | No-code payments |
| Public API | `/api/checkout/url`, `/api/status/order_id`, `/api/reverse/order_id`, `/api/capture/order_id` | Students' backends |
| JavaScript SDK | `/sdk/steppay.js` | Students' frontends |
| Documentation | `/docs` | Step-by-step guide, API reference, signature, callbacks, test cards, going live |
| Examples | [`examples/`](examples) | Static HTML shop, Node.js/Express shop, PHP shop |

## Test cards

| Card | Result |
| --- | --- |
| 4242 4242 4242 4242 | Approved |
| 5555 5555 5555 4444 | Approved (Mastercard) |
| 4000 0027 6000 3184 | Approved after 3-D Secure (code **1234**) |
| 4000 0000 0000 0002 | Declined — do not honor |
| 4000 0000 0000 9995 | Declined — insufficient funds |
| 4000 0000 0000 0069 | Declined — expired card |
| 4000 0000 0000 0259 | Approved, then a dispute (chargeback) opens |

Any future expiry date and any CVV.

---

## Run it on your computer

Requirements: **Node.js 20.9+**. No database installation needed.

```bash
cd steppay
npm install
npm run dev
```

Open http://localhost:3000. Without `DATABASE_URL` the app creates an embedded
PostgreSQL (PGlite) in `./.data` — delete that folder to start from scratch.

To become a lecturer locally, create `.env.local`:

```bash
ADMIN_EMAILS=you@example.com
```

…and register with that e-mail.

---

## Deploy for the whole academy (recommended: Vercel + Neon Postgres)

**Why this combination:** both have free plans suitable for a classroom, the app
never "sleeps" (a sleeping server would make the checkout hang for a minute),
Neon is real PostgreSQL with automatic backups, and Vercel connects the two in a
few clicks. Check their current free-plan limits before a large rollout.

1. **Put the code on GitHub.** Create a repository and push the `steppay` folder.
2. **Create the Vercel project.** vercel.com → *Add New → Project* → import the
   repository. If the repo contains more than this folder, set *Root Directory*
   to `steppay`. Framework preset: Next.js (detected automatically).
3. **Add the database.** In the Vercel project → *Storage* → *Create Database* →
   **Neon (Postgres)** → connect it to the project. Vercel adds `DATABASE_URL`
   automatically. (Alternative: create a project on neon.tech and paste its
   *pooled* connection string as `DATABASE_URL`.)
4. **Environment variables** (Project → Settings → Environment Variables):

   | Variable | Example | Meaning |
   | --- | --- | --- |
   | `DATABASE_URL` | `postgres://…neon.tech/neondb?sslmode=require` | Added by the Neon integration |
   | `ADMIN_EMAILS` | `lecturer@itstep.org,second@itstep.org` | These users become lecturers |
   | `REGISTRATION_CODE` | `STEP-2026` | Optional: students must enter it to register |
   | `NEXT_PUBLIC_APP_URL` | `https://steppay.vercel.app` | Optional: public URL used in docs/snippets |
   | `APP_TIMEZONE` | `Asia/Tbilisi` | Dashboards and reports time zone |

5. **Deploy**, then open `https://YOUR-APP.vercel.app/api/health`. You should see
   `{"ok":true,"database":"postgres",…}`. Tables are created automatically on the
   first request.
6. **Register** with an e-mail from `ADMIN_EMAILS` → you get the *Lecturer panel*.
7. Share the URL (and the registration code) with your students and point them to
   `/docs/quick-start`.

### Other hosting options

StepPay is a standard Next.js app + PostgreSQL, so it also runs on Railway,
Render (paid plan, so it doesn't sleep), Fly.io, or your own server
(`npm run build && npm start`) with any PostgreSQL (Supabase, Railway, local).
Just set `DATABASE_URL`.

---

## Project structure

```
src/
  app/
    (auth)/            login + registration
    portal/            merchant portal (activation, home, payments, settlements,
                       disputes, reports, logs, links, integration, playground,
                       merchants, profile, admin)
    checkout/          hosted checkout, 3-D Secure page, result page
    pay/[slug]/        payment links
    api/               public API (checkout/url, status, reverse, capture) + CSV export
    docs/              documentation pages
  lib/
    gateway.ts         payment engine: orders, cards, 3DS, refunds, disputes, callbacks
    signature.ts       SHA-1 signature algorithm
    api.ts             request parsing, auth, logging for the public API
    schema.ts          database schema (auto-applied)
    db.ts              Postgres / PGlite connection
    stats.ts           dashboard + settlement aggregations
    snippets.ts        integration code shown in the portal and docs
    testcards.ts       test card numbers and outcomes
  components/          UI kit, portal shell, charts
public/sdk/steppay.js  browser SDK
examples/              student example projects
```

Rename the product in `src/lib/brand.ts`. Colors live in `src/app/globals.css`.

## Security notes (it's a sandbox, but still)

- Passwords are hashed with scrypt; sessions are random tokens stored as SHA-256 hashes.
- Card numbers are never stored — only masked numbers like `424242XXXXXX4242`. Real card numbers are rejected.
- Callbacks to `localhost`/private networks are blocked in production (set `ALLOW_PRIVATE_CALLBACKS=1` to allow).
- Ask students to use invented data in the activation forms.
