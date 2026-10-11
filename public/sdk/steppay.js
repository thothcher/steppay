/*!
 * StepPay JavaScript SDK v1.0 — educational sandbox payment gateway
 *
 *   <script src="https://YOUR-STEPPAY-DOMAIN/sdk/steppay.js"></script>
 *   <script>
 *     StepPay.checkout({
 *       merchant_id: 1234567,
 *       amount: 2550,            // in minor units: 25.50 GEL → 2550
 *       currency: "GEL",
 *       order_desc: "Pizza Margherita × 2",
 *       response_url: location.origin + "/thank-you.html",
 *     });
 *   </script>
 *
 * Docs: https://YOUR-STEPPAY-DOMAIN/docs/sdk
 */
(function (window, document) {
  "use strict";

  var script = document.currentScript;
  var BASE = (script && script.src ? new URL(script.src).origin : window.location.origin).replace(/\/+$/, "");
  var VERSION = "1.0.0";

  function log() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift("%c[StepPay]", "color:#0e8653;font-weight:bold");
    console.log.apply(console, args);
  }

  function StepPayError(code, message, details) {
    var err = new Error("[" + code + "] " + message);
    err.name = "StepPayError";
    err.code = code;
    err.details = details || {};
    return err;
  }

  function randomOrderId() {
    return "order_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
  }

  /** 25.5 → 2550 */
  function toMinor(major) {
    return Math.round(Number(major) * 100);
  }

  /** 2550, "GEL" → "25.50 GEL" */
  function formatAmount(minor, currency) {
    return (Number(minor) / 100).toFixed(2) + (currency ? " " + currency : "");
  }

  var ALLOWED = [
    "merchant_id",
    "order_id",
    "order_desc",
    "amount",
    "currency",
    "response_url",
    "server_callback_url",
    "sender_email",
    "merchant_data",
    "lang",
    "lifetime",
    "preauth",
  ];

  function buildRequest(options) {
    var o = options || {};
    var req = {};
    ALLOWED.forEach(function (k) {
      if (o[k] !== undefined && o[k] !== null && o[k] !== "") req[k] = o[k];
    });
    if (!req.order_id) req.order_id = randomOrderId();
    if (!req.currency) req.currency = "GEL";
    if (!req.response_url && o.mode !== "modal") req.response_url = window.location.href.split("#")[0];
    if (typeof req.merchant_data === "object") req.merchant_data = JSON.stringify(req.merchant_data);
    return req;
  }

  /**
   * Creates a payment and returns { checkout_url, payment_id, order_id }.
   * Without a signature this only works when "Allow frontend payments" is ON for the merchant.
   */
  function createPayment(options) {
    var request = buildRequest(options);
    if (!request.merchant_id) return Promise.reject(StepPayError(1001, "merchant_id is required"));
    if (!/^\d+$/.test(String(request.amount))) {
      return Promise.reject(StepPayError(1004, "amount must be a whole number in minor units (25.50 → 2550). Use StepPay.toMinor(25.5)."));
    }
    return fetch(BASE + "/api/checkout/url", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-StepPay-Client": "sdk" },
      body: JSON.stringify({ request: request }),
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (body) {
        var r = (body && body.response) || {};
        if (r.response_status !== "success") {
          console.error("[StepPay] " + r.error_code + " — " + r.error_message, r);
          throw StepPayError(r.error_code, r.error_message, r);
        }
        return { checkout_url: r.checkout_url, payment_id: r.payment_id, order_id: r.order_id };
      });
  }

  // ── Modal (iframe) checkout ────────────────────────────────────────────────
  var STYLE_ID = "steppay-modal-style";
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var css =
      ".steppay-overlay{position:fixed;inset:0;z-index:2147483000;background:rgba(6,23,18,.55);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:16px;animation:steppay-fade .2s ease-out}" +
      ".steppay-box{position:relative;display:flex;flex-direction:column;width:100%;max-width:480px;height:min(780px,calc(100vh - 32px));background:#fff;border-radius:22px;overflow:hidden;box-shadow:0 24px 64px -12px rgba(0,0,0,.45);animation:steppay-up .25s cubic-bezier(.2,.9,.3,1.2)}" +
      ".steppay-head{display:flex;align-items:center;gap:8px;height:48px;padding:0 8px 0 18px;background:#0b2a21;color:#fff;font:600 14px system-ui,sans-serif;flex-shrink:0}" +
      ".steppay-head span{flex:1;opacity:.9}" +
      ".steppay-close{width:34px;height:34px;border-radius:999px;border:0;background:rgba(255,255,255,.1);color:#fff;font:400 22px/34px system-ui,sans-serif;cursor:pointer}" +
      ".steppay-close:hover{background:rgba(255,255,255,.2)}" +
      ".steppay-body{position:relative;flex:1}" +
      ".steppay-body iframe{position:relative;z-index:1;width:100%;height:100%;border:0;display:block;background:transparent}" +
      ".steppay-loading{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:600 14px system-ui,sans-serif;color:#7c8a83}" +
      "@keyframes steppay-fade{from{opacity:0}to{opacity:1}}@keyframes steppay-up{from{transform:translateY(16px) scale(.98);opacity:0}to{transform:none;opacity:1}}";
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  function openModal(checkoutUrl, handlers) {
    injectStyle();
    var overlay = document.createElement("div");
    overlay.className = "steppay-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.innerHTML =
      '<div class="steppay-box"><div class="steppay-head"><span>🔒 Secure checkout · StepPay</span>' +
      '<button type="button" class="steppay-close" aria-label="Close">×</button></div>' +
      '<div class="steppay-body"><div class="steppay-loading">Loading secure checkout…</div></div></div>';
    var box = overlay.firstChild;
    var body = box.querySelector(".steppay-body");
    var iframe = document.createElement("iframe");
    iframe.src = checkoutUrl + (checkoutUrl.indexOf("?") === -1 ? "?" : "&") + "embed=1";
    iframe.title = "StepPay checkout";
    iframe.allow = "payment";
    iframe.addEventListener("load", function () {
      var loading = body.querySelector(".steppay-loading");
      if (loading) loading.parentNode.removeChild(loading);
    });
    body.appendChild(iframe);
    document.body.appendChild(overlay);
    var prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    var finished = false;
    function close(reason) {
      window.removeEventListener("message", onMessage);
      document.removeEventListener("keydown", onKey);
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      document.body.style.overflow = prevOverflow;
      if (!finished && handlers.onClose) handlers.onClose(reason);
    }
    function onMessage(event) {
      if (event.origin !== BASE) return;
      var msg = event.data || {};
      if (msg.source !== "steppay" || msg.type !== "result") return;
      finished = true;
      var result = parseResultObject(msg.data);
      setTimeout(
        function () {
          close("result");
          handlers.onResult(result);
        },
        result.approved ? 1600 : 2600,
      );
    }
    function onKey(e) {
      if (e.key === "Escape") close("escape");
    }
    box.querySelector(".steppay-close").addEventListener("click", function () {
      close("button");
    });
    window.addEventListener("message", onMessage);
    document.addEventListener("keydown", onKey);
  }

  /**
   * Starts a payment.
   *   mode: "redirect" (default) → the browser goes to the hosted checkout page.
   *   mode: "modal"              → the checkout opens in a popup on your page.
   * Callbacks (modal mode): onSuccess(result), onDecline(result), onClose(), onError(error)
   * Returns a Promise.
   */
  function checkout(options) {
    var o = options || {};
    var mode = o.mode === "modal" ? "modal" : "redirect";
    return createPayment(o).then(
      function (payment) {
        log("payment created", payment);
        if (mode === "redirect") {
          window.location.href = payment.checkout_url;
          return payment;
        }
        return new Promise(function (resolve) {
          openModal(payment.checkout_url, {
            onResult: function (result) {
              if (result.approved && o.onSuccess) o.onSuccess(result);
              if (!result.approved && o.onDecline) o.onDecline(result);
              resolve(result);
            },
            onClose: function (reason) {
              if (o.onClose) o.onClose(reason);
              resolve({ approved: false, order_status: "closed", order_id: payment.order_id, payment_id: payment.payment_id });
            },
          });
        });
      },
      function (err) {
        if (o.onError) o.onError(err);
        else alert("Payment error: " + err.message);
        throw err;
      },
    );
  }

  function parseResultObject(obj) {
    var r = {};
    for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) r[k] = obj[k];
    if (r.amount !== undefined) r.amount = Number(r.amount);
    if (r.payment_id !== undefined) r.payment_id = Number(r.payment_id);
    r.approved = r.order_status === "approved";
    return r;
  }

  /**
   * Reads the payment result from the URL of your thank-you page (response_url).
   * Returns null when the page was opened without a result.
   * ⚠ Anyone can type these parameters in the address bar — confirm important
   * orders on your server (signature check or /api/status/order_id).
   */
  function parseResult(url) {
    var u = new URL(url || window.location.href);
    if (!u.searchParams.get("order_status")) return null;
    var obj = {};
    u.searchParams.forEach(function (v, k) {
      obj[k] = v;
    });
    return parseResultObject(obj);
  }

  // ── No-code buttons: <button data-steppay-pay data-merchant-id="..." data-amount="2500"> ──
  function bindButtons() {
    var buttons = document.querySelectorAll("[data-steppay-pay]");
    Array.prototype.forEach.call(buttons, function (btn) {
      if (btn.__steppayBound) return;
      btn.__steppayBound = true;
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var d = btn.dataset;
        checkout({
          merchant_id: d.merchantId,
          amount: d.amount,
          currency: d.currency || "GEL",
          order_desc: d.description || btn.textContent.trim() || "Order",
          response_url: d.responseUrl,
          mode: d.mode,
        });
      });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bindButtons);
  else bindButtons();

  window.StepPay = {
    version: VERSION,
    baseUrl: BASE,
    checkout: checkout,
    createPayment: createPayment,
    parseResult: parseResult,
    toMinor: toMinor,
    formatAmount: formatAmount,
    bindButtons: bindButtons,
  };
})(window, document);
