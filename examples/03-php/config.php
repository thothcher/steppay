<?php
// config.php — your StepPay keys. Keep this file out of public Git repositories!
const STEPPAY_API = 'http://localhost:3000/api';
const MERCHANT_ID = 1234567;
const SECRET_KEY  = 'sk_test_YOUR_SECRET_KEY';
const SHOP_URL    = 'http://localhost:8000';   // where this shop runs

// sha1("SECRET|value1|value2|...") — values sorted by parameter name, empty ones skipped
function steppay_sign(array $params): string
{
    unset($params['signature'], $params['response_signature_string']);
    ksort($params, SORT_STRING);
    $values = [SECRET_KEY];
    foreach ($params as $value) {
        if ($value === '' || $value === null || is_array($value)) continue;
        $values[] = (string) $value;
    }
    return sha1(implode('|', $values));
}

function steppay_request(string $endpoint, array $request): array
{
    $request['signature'] = steppay_sign($request);
    $ch = curl_init(STEPPAY_API . '/' . $endpoint);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS     => json_encode(['request' => $request]),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
    ]);
    $body = curl_exec($ch);
    curl_close($ch);
    return json_decode($body ?: '{}', true)['response'] ?? ['response_status' => 'failure', 'error_message' => 'No answer from StepPay'];
}

// Prices live on the server (in tetri)
const MENU = [
    'margherita' => ['name' => 'Margherita', 'price' => 1850],
    'pepperoni'  => ['name' => 'Pepperoni',  'price' => 2200],
    'lemonade'   => ['name' => 'Lemonade',   'price' => 400],
];
