# Example 1 — Static shop (no backend)

A small online restaurant in plain HTML/CSS/JS. Payments are created in the
browser with the StepPay JavaScript SDK — perfect for Netlify / GitHub Pages.

## Run it

1. Open `config.js` and set:
   - `STEPPAY_URL` — the address of the StepPay portal (for example `https://steppay.vercel.app`)
   - `MERCHANT_ID` — your Merchant ID (Portal → Merchant settings)
2. Serve the folder with any static server, for example:
   ```bash
   npx serve .
   ```
   or the VS Code "Live Server" extension. (Opening the file with `file://` will not work.)
3. Add dishes to the cart, press **Pay**, use the test card `4242 4242 4242 4242`, `12/30`, `123`.
4. See the order in the portal → Transactions → Payments.

## Files

| File | What it does |
| --- | --- |
| `config.js` | Your StepPay address and Merchant ID |
| `app.js` | Menu, cart and the `StepPay.checkout()` call |
| `thank-you.html` | Reads the payment result from the URL |

## Try this next

- Pay with `4000 0000 0000 0002` — how does your shop show a declined payment?
- Switch off "Pay in a popup" to see the redirect flow.
- Read why this is not secure enough for a real shop, then try example 02.
