<?php
/**
 * Address suggestions for the booking form, limited to Regina, from Google Places (New).
 * The Google key stays on the server. Without a key this answers {"enabled": false} and the
 * booking form keeps working as a normal text box.
 *
 *   GET ?q=2405 alb&session=…    → suggestions while typing
 *   GET ?place=<id>&session=…    → the chosen address, its postal code and whether it's in Regina
 */
declare(strict_types=1);
require __DIR__ . '/lib.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

$s = clearlot_settings();
$key = $s['googleMapsApiKey'];
if ($key === '') {
    echo json_encode(['enabled' => false, 'suggestions' => []]);
    exit;
}
if (!clearlot_rate_ok('address', 300, 3600)) {
    http_response_code(429);
    echo json_encode(['enabled' => true, 'suggestions' => [], 'error' => 'busy']);
    exit;
}

// Regina city limits with a small margin.
const REGINA = ['south' => 50.385, 'north' => 50.525, 'west' => -104.78, 'east' => -104.49];
$session = substr(preg_replace('/[^A-Za-z0-9-]/', '', (string) ($_GET['session'] ?? '')) ?? '', 0, 64);

function google(string $method, string $url, string $key, array $headers = [], ?array $body = null): ?array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 8,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => array_merge(['X-Goog-Api-Key: ' . $key, 'Content-Type: application/json'], $headers),
    ]);
    if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    $raw = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    if ($raw === false || $status >= 400) {
        error_log('clearlot address lookup failed: HTTP ' . $status . ' ' . substr((string) $raw, 0, 300));
        return null;
    }
    return json_decode((string) $raw, true);
}

if (isset($_GET['place'])) {
    $id = preg_replace('/[^A-Za-z0-9_-]/', '', (string) $_GET['place']) ?? '';
    if ($id === '' || strlen($id) > 300) {
        http_response_code(400);
        echo json_encode(['error' => 'bad place']);
        exit;
    }
    $url = 'https://places.googleapis.com/v1/places/' . rawurlencode($id) . ($session !== '' ? '?sessionToken=' . rawurlencode($session) : '');
    $data = google('GET', $url, $key, ['X-Goog-FieldMask: formattedAddress,addressComponents,location']);
    if ($data === null) {
        echo json_encode(['error' => 'lookup failed']);
        exit;
    }
    $parts = [];
    foreach ($data['addressComponents'] ?? [] as $c) {
        foreach ($c['types'] ?? [] as $t) $parts[$t] = $c['shortText'] ?? $c['longText'] ?? '';
    }
    $street = trim(($parts['street_number'] ?? '') . ' ' . ($parts['route'] ?? ''));
    if (isset($parts['subpremise']) && $parts['subpremise'] !== '') $street = $parts['subpremise'] . '-' . $street;
    $lat = (float) ($data['location']['latitude'] ?? 0);
    $lng = (float) ($data['location']['longitude'] ?? 0);
    echo json_encode([
        'address' => $street !== '' ? $street : (string) ($data['formattedAddress'] ?? ''),
        'postal' => strtoupper((string) ($parts['postal_code'] ?? '')),
        'inRegina' => $lat >= REGINA['south'] && $lat <= REGINA['north'] && $lng >= REGINA['west'] && $lng <= REGINA['east'],
    ]);
    exit;
}

$q = trim(mb_substr((string) ($_GET['q'] ?? ''), 0, 120));
if (mb_strlen($q) < 3) {
    echo json_encode(['enabled' => true, 'suggestions' => []]);
    exit;
}
$body = [
    'input' => $q,
    'includedRegionCodes' => ['ca'],
    'includedPrimaryTypes' => ['street_address', 'premise', 'subpremise'],
    'locationRestriction' => ['rectangle' => [
        'low' => ['latitude' => REGINA['south'], 'longitude' => REGINA['west']],
        'high' => ['latitude' => REGINA['north'], 'longitude' => REGINA['east']],
    ]],
];
if ($session !== '') $body['sessionToken'] = $session;
$data = google('POST', 'https://places.googleapis.com/v1/places:autocomplete', $key, [], $body);
$out = [];
foreach (array_slice($data['suggestions'] ?? [], 0, 5) as $sug) {
    $p = $sug['placePrediction'] ?? null;
    if (!$p || empty($p['placeId'])) continue;
    $out[] = [
        'id' => $p['placeId'],
        'main' => $p['structuredFormat']['mainText']['text'] ?? ($p['text']['text'] ?? ''),
        'secondary' => $p['structuredFormat']['secondaryText']['text'] ?? '',
    ];
}
echo json_encode(['enabled' => true, 'suggestions' => $out]);
