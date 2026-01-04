<?php
require_once __DIR__ . '/config.php';

function post_json($url, $data, $auth=null, $extraHeaders=null) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $headers = ['Content-Type: application/json'];
    if ($extraHeaders && is_array($extraHeaders)) {
        $headers = array_merge($headers, $extraHeaders);
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    if ($auth) curl_setopt($ch, CURLOPT_USERPWD, $auth);

    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));

    $res = curl_exec($ch);
    if ($res === false) {
        $err = curl_error($ch);
        curl_close($ch);
        throw new Exception('cURL error: ' . $err);
    }
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return [$code, $res];
}

try {
    $payload = [];

    if (!empty($_POST['text'])) {
        $payload['text'] = trim($_POST['text']);
    }

    if (!empty($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $b = base64_encode(file_get_contents($_FILES['image']['tmp_name']));
        $payload['image'] = $b; // mock expects base64 or text
    }

    if (!empty($_POST['userId'])) $payload['userId'] = trim($_POST['userId']);
    if (!empty($_POST['region'])) $payload['region'] = trim($_POST['region']);

    if (!empty($_POST['medicalHistory'])) {
        $payload['medicalHistory'] = array_values($_POST['medicalHistory']);
    }

    if (empty($payload)) throw new Exception('No input provided. Please enter text or upload an image.');

    // Extra headers example
    $extraHeaders = null;
    if (!empty($API_KEY_HEADER)) $extraHeaders = [$API_KEY_HEADER];

    list($code, $res) = post_json($WEBHOOK_URL, $payload, $N8N_AUTH, $extraHeaders);

    header('Content-Type: text/html; charset=utf-8');
    echo '<h3>Response (HTTP ' . htmlspecialchars($code) . ')</h3>';
    echo '<pre>' . htmlspecialchars($res) . '</pre>';
    echo '<p><a href="index.html">Back</a></p>';

} catch (Exception $e) {
    echo '<h3>Error</h3><pre>' . htmlspecialchars($e->getMessage()) . '</pre><p><a href="index.html">Back</a></p>';
}
?>