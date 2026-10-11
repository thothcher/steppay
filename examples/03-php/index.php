<?php require 'config.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Pizza Step — PHP</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 560px; margin: 40px auto; padding: 0 16px; }
    label { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    input { width: 60px; }
    button { margin-top: 20px; padding: 14px 20px; border: 0; border-radius: 10px; background: #0e8653; color: #fff; font-weight: 700; cursor: pointer; }
  </style>
</head>
<body>
  <h1>🍕 Pizza Step (PHP)</h1>
  <form method="post" action="checkout.php">
    <?php foreach (MENU as $id => $item): ?>
      <label>
        <?= htmlspecialchars($item['name']) ?> — <?= number_format($item['price'] / 100, 2) ?> GEL
        <input type="number" name="qty[<?= $id ?>]" min="0" value="0">
      </label>
    <?php endforeach; ?>
    <button type="submit">Checkout</button>
  </form>
</body>
</html>
