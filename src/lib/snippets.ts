// Ready-to-paste integration code. Used by the portal (filled with real keys)
// and by the docs (with placeholders).

export type SnippetVars = {
  base: string; // https://steppay.example.com
  merchantId: string; // 1234567
  secret: string; // sk_test_...
};

export function htmlShop(v: SnippetVars) {
  return `<!-- index.html — a tiny shop page. No backend needed. -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Pizza Step</title>
  <!-- 1. Load the StepPay SDK -->
  <script src="${v.base}/sdk/steppay.js"></script>
</head>
<body>
  <h1>Pizza Margherita — 25.50 GEL</h1>
  <button id="pay-btn">Pay 25.50 GEL</button>

  <script>
    // 2. Start a payment when the customer clicks "Pay"
    document.getElementById("pay-btn").addEventListener("click", function () {
      StepPay.checkout({
        merchant_id: ${v.merchantId},          // your Merchant ID
        amount: 2550,                    // 25.50 GEL in tetri (× 100)
        currency: "GEL",
        order_desc: "Pizza Margherita",
        response_url: location.origin + "/thank-you.html",
      });
    });
  </script>
</body>
</html>`;
}

export function htmlCart(v: SnippetVars) {
  return `<!-- cart.html — pay for the whole cart, checkout opens in a popup -->
<script src="${v.base}/sdk/steppay.js"></script>
<script>
  const cart = [
    { name: "Pizza Margherita", price: 18.50, qty: 2 },
    { name: "Lemonade",         price: 4.00,  qty: 1 },
  ];

  function payForCart() {
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    StepPay.checkout({
      merchant_id: ${v.merchantId},
      amount: StepPay.toMinor(total),          // 41.00 → 4100
      currency: "GEL",
      order_desc: cart.map((i) => i.name + " × " + i.qty).join(", "),
      mode: "modal",                           // popup instead of redirect
      onSuccess(result) {
        alert("Thank you! Payment ID: " + result.payment_id);
        localStorage.removeItem("cart");
      },
      onDecline(result) {
        alert("Payment declined: " + result.response_description);
      },
      onClose() {
        console.log("Customer closed the checkout");
      },
    });
  }
</script>
<button onclick="payForCart()">Checkout</button>`;
}

export function thankYouPage(v: SnippetVars) {
  return `<!-- thank-you.html — StepPay sends the customer here after paying -->
<script src="${v.base}/sdk/steppay.js"></script>
<h1 id="title">Checking payment…</h1>
<p id="details"></p>

<script>
  // Reads ?order_status=approved&order_id=...&amount=... from the URL
  const result = StepPay.parseResult();

  if (!result) {
    document.getElementById("title").textContent = "No payment information";
  } else if (result.approved) {
    document.getElementById("title").textContent = "Thank you for your order! 🎉";
    document.getElementById("details").textContent =
      "Paid " + StepPay.formatAmount(result.amount, result.currency) +
      " · order " + result.order_id;
  } else {
    document.getElementById("title").textContent = "Payment " + result.order_status;
    document.getElementById("details").textContent = result.response_description || "";
  }
</script>`;
}

export function reactSnippet(v: SnippetVars) {
  return `// 1) index.html → inside <head>:
//    <script src="${v.base}/sdk/steppay.js"></script>

// 2) PayButton.jsx
export default function PayButton({ total, description }) {
  function handlePay() {
    window.StepPay.checkout({
      merchant_id: ${v.merchantId},
      amount: window.StepPay.toMinor(total), // 25.5 → 2550
      currency: "GEL",
      order_desc: description,
      mode: "modal",
      onSuccess: (result) => alert("Paid! Payment ID " + result.payment_id),
      onDecline: (result) => alert("Declined: " + result.response_description),
    });
  }

  return <button onClick={handlePay}>Pay {total.toFixed(2)} GEL</button>;
}`;
}

export function envFile(v: SnippetVars) {
  return `# .env — keep this file out of Git (add it to .gitignore)
STEPPAY_API=${v.base}/api
STEPPAY_MERCHANT_ID=${v.merchantId}
STEPPAY_SECRET_KEY=${v.secret}`;
}

export function nodeServer(v: SnippetVars) {
  return `// server.js — Node.js 18+ with Express
// npm install express dotenv      →   node server.js
require("dotenv").config();
const express = require("express");
const crypto = require("crypto");

const app = express();
app.use(express.json());
app.use(express.static("public")); // your shop pages

const API = process.env.STEPPAY_API;                       // ${v.base}/api
const MERCHANT_ID = Number(process.env.STEPPAY_MERCHANT_ID); // ${v.merchantId}
const SECRET_KEY = process.env.STEPPAY_SECRET_KEY;          // never send this to the browser!

// Signature: sha1("SECRET|value1|value2|...") — values sorted by parameter name, empty ones skipped
function sign(params) {
  const values = Object.keys(params)
    .filter((key) => key !== "signature" && key !== "response_signature_string")
    .sort()
    .map((key) => params[key])
    .filter((value) => value !== undefined && value !== null && value !== "" && typeof value !== "object")
    .map(String);
  return crypto.createHash("sha1").update([SECRET_KEY, ...values].join("|")).digest("hex");
}

// Prices live on the SERVER. Never trust a price sent by the browser.
const MENU = { margherita: 1850, pepperoni: 2200, lemonade: 400 }; // in tetri

// 1) The browser sends the cart → we create a payment → return the checkout link
app.post("/api/checkout", async (req, res) => {
  const items = req.body.items || []; // [{ id: "margherita", qty: 2 }]
  const amount = items.reduce((sum, i) => sum + (MENU[i.id] || 0) * i.qty, 0);
  if (amount <= 0) return res.status(400).json({ error: "Cart is empty" });

  const request = {
    merchant_id: MERCHANT_ID,
    order_id: "order_" + Date.now(),
    order_desc: items.map((i) => i.id + " x" + i.qty).join(", "),
    amount,
    currency: "GEL",
    response_url: "http://localhost:3000/thank-you.html",
    server_callback_url: "https://YOUR-PUBLIC-DOMAIN/api/steppay-callback",
  };
  request.signature = sign(request);

  const r = await fetch(API + "/checkout/url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ request }),
  });
  const { response } = await r.json();
  if (response.response_status !== "success") {
    console.error("StepPay error", response);
    return res.status(400).json({ error: response.error_message });
  }
  // TODO: save the order in your database with status "created"
  res.json({ checkout_url: response.checkout_url });
});

// 2) StepPay calls this URL (POST, JSON) when the payment status changes
app.post("/api/steppay-callback", (req, res) => {
  const data = req.body;
  if (data.signature !== sign(data)) return res.status(400).send("Invalid signature");

  if (data.order_status === "approved") {
    // TODO: mark order data.order_id as PAID in your database
    console.log("Order paid:", data.order_id, data.amount / 100, data.currency);
  }
  res.sendStatus(200); // always answer 200 OK
});

app.listen(3000, () => console.log("Shop running on http://localhost:3000"));`;
}

export function nodeFrontend() {
  return `<!-- public/index.html — the browser only sends the cart to YOUR server -->
<button id="pay">Pay</button>
<script>
  document.getElementById("pay").onclick = async () => {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [{ id: "margherita", qty: 2 }, { id: "lemonade", qty: 1 }] }),
    });
    const data = await res.json();
    if (data.checkout_url) location.href = data.checkout_url; // go to StepPay checkout
    else alert(data.error);
  };
</script>`;
}

export function phpConfig(v: SnippetVars) {
  return `<?php
// config.php
const STEPPAY_API = '${v.base}/api';
const MERCHANT_ID = ${v.merchantId};
const SECRET_KEY  = '${v.secret}'; // keep it on the server only

// sha1("SECRET|value1|value2|...") — values sorted by parameter name, empty ones skipped
function steppay_sign(array $params): string {
    unset($params['signature'], $params['response_signature_string']);
    ksort($params, SORT_STRING);
    $values = [SECRET_KEY];
    foreach ($params as $value) {
        if ($value === '' || $value === null || is_array($value)) continue;
        $values[] = (string) $value;
    }
    return sha1(implode('|', $values));
}`;
}

export function phpCheckout() {
  return `<?php
// checkout.php — <form method="post" action="checkout.php"> sends the cart here
require 'config.php';

$prices = ['margherita' => 1850, 'pepperoni' => 2200, 'lemonade' => 400]; // tetri
$amount = 0;
foreach ($_POST['qty'] ?? [] as $id => $qty) {
    $amount += ($prices[$id] ?? 0) * (int) $qty;
}

$request = [
    'merchant_id'         => MERCHANT_ID,
    'order_id'            => 'order_' . time(),
    'order_desc'          => 'Pizza order',
    'amount'              => $amount,
    'currency'            => 'GEL',
    'response_url'        => 'http://localhost:8000/thank-you.php',
    'server_callback_url' => 'https://YOUR-PUBLIC-DOMAIN/callback.php',
];
$request['signature'] = steppay_sign($request);

$ch = curl_init(STEPPAY_API . '/checkout/url');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS     => json_encode(['request' => $request]),
    CURLOPT_RETURNTRANSFER => true,
]);
$response = json_decode(curl_exec($ch), true)['response'];

if ($response['response_status'] === 'success') {
    header('Location: ' . $response['checkout_url']); // go to StepPay checkout
    exit;
}
echo 'Payment error: ' . htmlspecialchars($response['error_message']);`;
}

export function phpCallback() {
  return `<?php
// callback.php — StepPay POSTs JSON here when the payment status changes
require 'config.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || ($data['signature'] ?? '') !== steppay_sign($data)) {
    http_response_code(400);
    exit('Invalid signature');
}

if ($data['order_status'] === 'approved') {
    // TODO: mark order $data['order_id'] as paid in your database
}

http_response_code(200);
echo 'OK';`;
}

export function pythonFlask(v: SnippetVars) {
  return `# app.py — pip install flask requests   →   flask run
import hashlib, time, requests
from flask import Flask, request, jsonify, redirect

API = "${v.base}/api"
MERCHANT_ID = ${v.merchantId}
SECRET_KEY = "${v.secret}"  # better: os.environ["STEPPAY_SECRET_KEY"]

app = Flask(__name__)

def sign(params):
    # sha1("SECRET|value1|value2|...") — values sorted by name, empty ones skipped
    values = [str(v) for k, v in sorted(params.items())
              if k not in ("signature", "response_signature_string")
              and v not in ("", None) and not isinstance(v, (dict, list))]
    return hashlib.sha1("|".join([SECRET_KEY] + values).encode()).hexdigest()

@app.post("/checkout")
def checkout():
    req = {
        "merchant_id": MERCHANT_ID,
        "order_id": f"order_{int(time.time())}",
        "order_desc": "Pizza order",
        "amount": 2550,  # 25.50 GEL
        "currency": "GEL",
        "response_url": "http://localhost:5000/thank-you",
        "server_callback_url": "https://YOUR-PUBLIC-DOMAIN/steppay-callback",
    }
    req["signature"] = sign(req)
    res = requests.post(f"{API}/checkout/url", json={"request": req}).json()["response"]
    if res["response_status"] != "success":
        return jsonify(res), 400
    return redirect(res["checkout_url"])

@app.post("/steppay-callback")
def callback():
    data = request.get_json()
    if data.get("signature") != sign(data):
        return "Invalid signature", 400
    if data["order_status"] == "approved":
        pass  # TODO: mark data["order_id"] as paid
    return "OK", 200`;
}

export function curlSnippet(v: SnippetVars, signature = "<calculated signature>") {
  return `curl -X POST ${v.base}/api/checkout/url \\
  -H "Content-Type: application/json" \\
  -d '{
    "request": {
      "merchant_id": ${v.merchantId},
      "order_id": "order_1001",
      "order_desc": "Test order",
      "amount": 2550,
      "currency": "GEL",
      "signature": "${signature}"
    }
  }'`;
}

export function signJs() {
  return `// Browser-free JavaScript (Node.js) — the same algorithm in every language
const crypto = require("crypto");

function sign(params, secretKey) {
  const values = Object.keys(params)
    .filter((key) => key !== "signature" && key !== "response_signature_string")
    .sort()                                         // 1. sort by parameter NAME
    .map((key) => params[key])
    .filter((v) => v !== undefined && v !== null && v !== "" && typeof v !== "object") // 2. skip empty
    .map(String);
  const text = [secretKey, ...values].join("|");    // 3. SECRET|v1|v2|...
  return crypto.createHash("sha1").update(text).digest("hex"); // 4. sha1
}`;
}
