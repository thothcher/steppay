# Example 2 — Node.js + Express (secure integration)

How real shops do it:

1. The browser sends only the cart (product IDs + quantities).
2. The **server** calculates the price, signs the request with the secret key and asks StepPay for a `checkout_url`.
3. The customer pays on the StepPay checkout and returns to `thank-you.html`.
4. The thank-you page asks **our server**, which confirms the status with `POST /api/status/order_id` (signed).
5. When the shop has a public URL, StepPay also sends a signed **callback** to `/api/steppay-callback`.

## Run it

```bash
npm install
cp .env.example .env      # Windows: copy .env.example .env
# edit .env: STEPPAY_API, STEPPAY_MERCHANT_ID, STEPPAY_SECRET_KEY
npm start
```

Open http://localhost:3000, choose pizzas, press **Checkout** and pay with `4242 4242 4242 4242`.

> The StepPay portal and this shop both like port 3000. If you run the portal locally,
> start it on another port (`npm run dev -- -p 3100`) and set `STEPPAY_API=http://localhost:3100/api`.

## Receiving callbacks

StepPay cannot call `localhost`. Either deploy the shop (Render, Railway…) or run a tunnel:

```bash
npx ngrok http 3000
```

Put the https address it prints into `PUBLIC_URL` in `.env` and restart. Every callback appears in the
portal → Reports center → Developer logs → Server callbacks.
