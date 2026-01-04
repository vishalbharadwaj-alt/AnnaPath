<?php
require_once __DIR__ . '/config.php';

$payload = [
    'text' => 'Sugar, salt, wheat flour',
    'medicalHistory' => ['diabetes']
];

$ch = curl_init($WEBHOOK_URL);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
if ($N8N_AUTH) curl_setopt($ch, CURLOPT_USERPWD, $N8N_AUTH);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));

$res = curl_exec($ch);
if ($res === false) { die('Curl error: ' . curl_error($ch)); }
curl_close($ch);

header('Content-Type: application/json');
echo $res;
