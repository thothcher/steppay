const { STEPPAY_URL, MERCHANT_ID, CURRENCY } = window.SHOP_CONFIG;

// ── Menu (prices in GEL) ─────────────────────────────────────
const MENU = [
  { id: "margherita", name: "Margherita", price: 18.5, emoji: "🍕" },
  { id: "pepperoni", name: "Pepperoni", price: 22.0, emoji: "🌶️" },
  { id: "khachapuri", name: "Khachapuri", price: 16.0, emoji: "🧀" },
  { id: "lemonade", name: "Lemonade", price: 4.0, emoji: "🍋" },
];

let cart = JSON.parse(localStorage.getItem("cart") || "{}"); // { margherita: 2 }

function renderMenu() {
  document.getElementById("menu").innerHTML = MENU.map(
    (item) => `
      <article class="dish">
        <div class="emoji">${item.emoji}</div>
        <h3>${item.name}</h3>
        <p>${item.price.toFixed(2)} ${CURRENCY}</p>
        <button data-id="${item.id}">Add</button>
      </article>`,
  ).join("");
  document.querySelectorAll(".dish button").forEach((btn) => {
    btn.onclick = () => {
      cart[btn.dataset.id] = (cart[btn.dataset.id] || 0) + 1;
      saveCart();
    };
  });
}

function cartTotal() {
  return MENU.reduce((sum, item) => sum + item.price * (cart[item.id] || 0), 0);
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  renderCart();
}

function renderCart() {
  const lines = MENU.filter((item) => cart[item.id]);
  document.getElementById("cart-items").innerHTML = lines.length
    ? lines.map((item) => `<li>${item.name} × ${cart[item.id]} <span>${(item.price * cart[item.id]).toFixed(2)}</span></li>`).join("")
    : "<li class='empty'>Cart is empty</li>";
  const total = cartTotal();
  document.getElementById("cart-total").textContent = `${total.toFixed(2)} ${CURRENCY}`;
  const btn = document.getElementById("pay-btn");
  btn.disabled = total === 0 || !window.StepPay;
  btn.textContent = total ? `Pay ${total.toFixed(2)} ${CURRENCY}` : "Pay";
}

// ── Payment ──────────────────────────────────────────────────
function pay() {
  const description = MENU.filter((i) => cart[i.id])
    .map((i) => `${i.name} × ${cart[i.id]}`)
    .join(", ");
  const popup = document.getElementById("popup").checked;

  StepPay.checkout({
    merchant_id: MERCHANT_ID,
    amount: StepPay.toMinor(cartTotal()), // 41.00 GEL → 4100 tetri
    currency: CURRENCY,
    order_desc: description,
    merchant_data: { cart }, // comes back in the result
    mode: popup ? "modal" : "redirect",
    response_url: new URL("thank-you.html", location.href).href, // used in redirect mode
    onSuccess(result) {
      cart = {};
      saveCart();
      location.href = "thank-you.html?" + new URLSearchParams(result).toString();
    },
    onDecline(result) {
      alert("Payment declined: " + result.response_description + "\nTry another card.");
    },
    onError(error) {
      alert("Could not start the payment: " + error.message);
    },
  });
}

// Load the StepPay SDK from your portal
const sdk = document.createElement("script");
sdk.src = `${STEPPAY_URL}/sdk/steppay.js`;
sdk.onload = renderCart;
sdk.onerror = () => alert("Could not load the StepPay SDK. Check STEPPAY_URL in config.js");
document.head.appendChild(sdk);

document.getElementById("pay-btn").onclick = pay;
renderMenu();
renderCart();
