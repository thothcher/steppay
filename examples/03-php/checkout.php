<?php
// checkout.php — calculates the price on the server and sends the customer to StepPay
require 'config.php';

$amount = 0;
$lines = [];
foreach ($_POST['qty'] ?? [] as $id => $qty) {
    $qty = (int) $qty;
    if ($qty > 0 && isset(MENU[$id])) {
        $amount += MENU[$id]['price'] * $qty;
        $lines[] = MENU[$id]['name'] . ' × ' . $qty;
    }
}
if ($amount === 0) {
    exit('Your cart is empty. <a href="index.php">Back</a>');
}

$orderId = 'order_' . time() . '_' . random_int(100, 999);
// TODO: save the order in your database with status "created"

$response = steppay_request('checkout/url', [
    'merchant_id'  => MERCHANT_ID,
    'order_id'     => $orderId,
    'order_desc'   => implode(', ', $lines),
    'amount'       => $amount,
    'currency'     => 'GEL',
    'response_url' => SHOP_URL . '/thank-you.php',
    // 'server_callback_url' => 'https://YOUR-PUBLIC-DOMAIN/callback.php',
]);

if (($response['response_status'] ?? '') === 'success') {
    header('Location: ' . $response['checkout_url']);
    exit;
}
echo 'Payment error ' . htmlspecialchars((string) ($response['error_code'] ?? '')) . ': ' . htmlspecialchars($response['error_message'] ?? '');
