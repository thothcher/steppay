<?php
// callback.php — StepPay POSTs JSON here when the payment status changes.
// Needs a public URL (deploy, or `ngrok http 8000`).
require 'config.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!is_array($data) || ($data['signature'] ?? '') !== steppay_sign($data)) {
    http_response_code(400);
    exit('Invalid signature');
}

if ($data['order_status'] === 'approved') {
    // TODO: UPDATE orders SET status = 'paid' WHERE order_id = $data['order_id'] AND status <> 'paid'
    file_put_contents(__DIR__ . '/paid-orders.log', $data['order_id'] . PHP_EOL, FILE_APPEND);
}

http_response_code(200);
echo 'OK';
