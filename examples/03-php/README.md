# Example 3 — PHP

Plain PHP 8 with cURL, no framework.

## Run it

1. Edit `config.php`: `STEPPAY_API`, `MERCHANT_ID`, `SECRET_KEY` (Portal → Merchant settings).
2. Start PHP's built-in server in this folder:
   ```bash
   php -S localhost:8000
   ```
3. Open http://localhost:8000, choose pizzas, pay with `4242 4242 4242 4242`.

## Files

| File | What it does |
| --- | --- |
| `config.php` | Keys, `steppay_sign()` and `steppay_request()` helpers, menu with prices |
| `index.php` | Menu form |
| `checkout.php` | Calculates the price, creates the payment, redirects to the checkout |
| `thank-you.php` | Shows the result and **checks the signature** of the redirect parameters |
| `callback.php` | Receives the server callback (needs a public URL) |
