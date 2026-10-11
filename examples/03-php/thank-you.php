<?php
// thank-you.php — StepPay redirects the customer here (GET parameters + signature)
require 'config.php';

$data = $_GET;
$valid = isset($data['signature']) && $data['signature'] === steppay_sign($data);
$paid = $valid && ($data['order_status'] ?? '') === 'approved';
// TODO: for real orders also trust only callback.php or the status API
?>
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Thank you</title></head>
<body style="font-family: system-ui, sans-serif; text-align: center; margin-top: 80px">
  <?php if (!$valid): ?>
    <h1>⚠️ Invalid or missing payment data</h1>
  <?php elseif ($paid): ?>
    <h1>✅ Thank you! Order <?= htmlspecialchars($data['order_id']) ?> is paid.</h1>
    <p><?= number_format($data['amount'] / 100, 2) ?> <?= htmlspecialchars($data['currency']) ?> · <?= htmlspecialchars($data['masked_card'] ?? '') ?></p>
  <?php else: ?>
    <h1>❌ Payment <?= htmlspecialchars($data['order_status']) ?></h1>
    <p><?= htmlspecialchars($data['response_description'] ?? '') ?></p>
  <?php endif; ?>
  <a href="index.php">Back to the menu</a>
</body>
</html>
