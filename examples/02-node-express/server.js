// Example 2 — Node.js + Express shop with a secure StepPay integration
//   npm install
//   cp .env.example .env   (and fill in your keys)
//   npm start              → http://localhost:3000
require("dotenv").config();
const express = require("express");
const crypto = require("crypto");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const API = process.env.STEPPAY_API; // e.g. https://steppay.vercel.app/api
const MERCHANT_ID = Number(process.env.STEPPAY_MERCHANT_ID);
const SECRET_KEY = process.env.STEPPAY_SECRET_KEY;
const PUBLIC_URL = process.env.PUBLIC_URL || "http://localhost:3000";

// ── Signature: sha1("SECRET|value1|value2|...") ─────────────────────────────
function sign(params) {
  const values = Object.keys(params)
    .filter((key) => key !== "signature" && key !== "response_signature_string")
    .sort()
    .map((key) => params[key])
    .filter((value) => value !== undefined && value !== null && value !== "" && typeof value !== "object")
    .map(String);
  return crypto
    .createHash("sha1")
    .update([SECRET_KEY, ...values].join("|"))
    .digest("hex");
}

async function steppay(endpoint, request) {
  request.signature = sign(request);
  const res = await fetch(`${API}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ request }),
  });
  const { response } = await res.json();
  return response;
}

// ── "Database" (in memory for the example — use a real DB in your project) ──
const MENU = {
  margherita: { name: "Margherita", price: 1850 }, // prices in tetri
  pepperoni: { name: "Pepperoni", price: 2200 },
  khachapuri: { name: "Khachapuri", price: 1600 },
  lemonade: { name: "Lemonade", price: 400 },
};
const orders = new Map(); // order_id → { items, amount, status }

app.get("/api/menu", (_req, res) => res.json(MENU));

// 1) Browser sends the cart → server calculates the price and creates the payment
app.post("/api/checkout", async (req, res) => {
  const items = (req.body.items || []).filter((i) => MENU[i.id] && i.qty > 0);
  const amount = items.reduce((sum, i) => sum + MENU[i.id].price * i.qty, 0);
  if (!amount) return res.status(400).json({ error: "Cart is empty" });

  const orderId = "order_" + Date.now();
  orders.set(orderId, { items, amount, status: "created" });

  const response = await steppay("checkout/url", {
    merchant_id: MERCHANT_ID,
    order_id: orderId,
    order_desc: items.map((i) => `${MENU[i.id].name} × ${i.qty}`).join(", "),
    amount,
    currency: "GEL",
    response_url: `${PUBLIC_URL}/thank-you.html`,
    // Callbacks need a public address (deploy, or run "npx ngrok http 3000" and set PUBLIC_URL)
    server_callback_url: PUBLIC_URL.startsWith("http://localhost") ? undefined : `${PUBLIC_URL}/api/steppay-callback`,
  });

  if (response.response_status !== "success") {
    console.error("StepPay error:", response);
    return res.status(400).json({ error: response.error_message });
  }
  res.json({ checkout_url: response.checkout_url });
});

// 2) StepPay → your server (POST JSON). The trustworthy source of truth.
app.post("/api/steppay-callback", (req, res) => {
  const data = req.body;
  if (data.signature !== sign(data)) return res.status(400).send("Invalid signature");
  const order = orders.get(data.order_id);
  if (order && order.status !== data.order_status) {
    order.status = data.order_status; // approved | declined | reversed
    console.log(`Callback: order ${data.order_id} is now ${data.order_status}`);
  }
  res.sendStatus(200);
});

// 3) Thank-you page asks the server; the server asks StepPay (works on localhost too)
app.get("/api/orders/:id", async (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: "Unknown order" });
  const status = await steppay("status/order_id", { merchant_id: MERCHANT_ID, order_id: req.params.id });
  if (status.response_status === "success" && status.signature === sign(status)) {
    order.status = status.order_status;
  }
  res.json({ order_id: req.params.id, ...order });
});

app.listen(3000, () => console.log(`Shop running on ${PUBLIC_URL}`));
