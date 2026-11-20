<?php
/**
 * Receives a booking from /book/, re-checks every choice and recomputes the price, saves it,
 * emails the booking to you and a confirmation to the customer, then sends the customer to the
 * thank-you page. Prices always come from catalog.json, never from the browser.
 */
declare(strict_types=1);
require __DIR__ . '/lib.php';

$cfg = clearlot_settings();
$catalog = json_decode((string) file_get_contents(__DIR__ . '/catalog.json'), true);

function page(int $status, string $title, string $message): void
{
    global $cfg;
    http_response_code($status);
    $phone = $cfg['phone'] !== '' ? '<p class="text-2" style="margin-top:16px">Or call us at <a href="tel:' . preg_replace('/[^\d+]/', '', $cfg['phone']) . '">' . htmlspecialchars($cfg['phone']) . '</a>.</p>' : '';
    echo '<!doctype html><html lang="en-CA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
        . '<meta name="robots" content="noindex"><title>' . htmlspecialchars($title) . '</title><link rel="stylesheet" href="/assets/style.css"></head>'
        . '<body><main class="section"><div class="wrap stack" style="max-width:640px"><h1>' . htmlspecialchars($title) . '</h1>'
        . '<p class="lede">' . htmlspecialchars($message) . '</p>' . $phone
        . '<p style="margin-top:32px"><a class="btn btn-primary" href="javascript:history.back()">Go back to your booking</a></p></div></main></body></html>';
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Location: /book/', true, 303);
    exit;
}

function field(string $key, int $max = 200): string
{
    $v = (string) ($_POST[$key] ?? '');
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v) ?? '';
    return trim(mb_substr($v, 0, $max));
}

// Bots: a filled honeypot or a form sent faster than a person could fill it in.
$started = (int) ($_POST['started'] ?? 0);
if (field('website') !== '' || ($started > 0 && (microtime(true) * 1000 - $started) < 4000)) {
    header('Location: /thank-you/', true, 303);
    exit;
}

$plan = field('plan', 10);
$driveway = field('driveway', 10);
$sidewalk = field('sidewalk', 10);
$walkway = field('walkway', 10);
$steps = field('steps', 1) === '1';
$ice = field('iceMelt', 1) === '1';
$address = field('address', 160);
$postal = strtoupper(field('postal', 7));
$verified = field('placeId', 300) !== '';
$name = field('name', 80);
$phone = field('phone', 30);
$email = field('email', 120);
$forOther = field('forOther', 1) === '1';
$otherName = $forOther ? field('otherName', 80) : '';
$otherPhone = $forOther ? field('otherPhone', 30) : '';
$notes = field('notes', 600);

$P = $catalog['prices'];
$L = $catalog['labels'];
$months = (int) $catalog['months'];

if (!isset($P[$plan]) || !isset($P[$plan]['driveway'][$driveway]) || !isset($P[$plan]['sidewalk'][$sidewalk]) || !isset($P[$plan]['walkway'][$walkway])) {
    page(400, 'Some choices are missing', 'Please go back and pick your plan, driveway, sidewalk and walkway.');
}
if (mb_strlen($address) < 5 || !preg_match('/\d/', $address)) {
    page(400, 'Please check your address', 'Type your street address with the house number, for example 2405 Albert St.');
}
if (mb_strlen($name) < 2) {
    page(400, 'Please add your name', 'We need your name to confirm the booking.');
}
if (strlen(preg_replace('/\D/', '', $phone) ?? '') < 10) {
    page(400, 'Please check your phone number', 'Type your phone number with the area code, like 306 555 0123.');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    page(400, 'Please check your email', 'We send your booking confirmation by email. Please type a valid email address.');
}
if (!clearlot_rate_ok('book', 6, 3600)) {
    page(429, 'Too many bookings at once', 'Please wait a little and try again.');
}

$p = $P[$plan];
$money = fn ($n) => '$' . number_format((float) $n, 2);
$lines = [[$L['driveway'][$driveway], $p['driveway'][$driveway]]];
if ($sidewalk !== 'none') $lines[] = [$L['sidewalk'][$sidewalk], $p['sidewalk'][$sidewalk]];
if ($walkway !== 'none') $lines[] = [$L['walkway'][$walkway], $p['walkway'][$walkway]];
if ($steps) $lines[] = ['Front steps', $p['steps']];
if ($ice) $lines[] = ['Ice melt', $p['iceMelt']];
$total = array_sum(array_column($lines, 1));
$gst = round($total * $catalog['gst'], 2);
$unit = $plan === 'winter' ? 'for the winter' : 'per visit';
$monthly = $plan === 'winter' ? round(($total + $gst) / $months, 2) : 0;

$ref = 'CL-' . strtoupper(bin2hex(random_bytes(3)));
$now = new DateTimeImmutable('now', new DateTimeZone('America/Regina'));
$due = $plan === 'once' ? $now->modify('+24 hours')->format('D M j, g:i a') : 'within 24 hours after each snowfall';
$fullAddress = $address . ', Regina, SK' . ($postal !== '' ? " $postal" : '');

$workOrder = [];
foreach ($lines as [$label, $amount]) $workOrder[] = '  ' . str_pad($label, 28) . $money($amount);
$workOrder[] = '  ' . str_repeat('-', 38);
$workOrder[] = '  ' . str_pad('Subtotal ' . $unit, 28) . $money($total);
$workOrder[] = '  ' . str_pad('GST (5%)', 28) . $money($gst);
$workOrder[] = '  ' . str_pad('Total', 28) . $money($total + $gst);
if ($plan === 'winter') $workOrder[] = '  or ' . $months . ' monthly payments of ' . $money($monthly) . ', November to March';

// ---------- Your copy ----------
$owner = array_merge([
    "New booking $ref",
    '',
    "CLEAR BY: $due",
    '',
    'Address:   ' . $fullAddress . ($verified ? '  (picked from Google suggestions)' : ''),
    'Map:       https://www.google.com/maps/search/?api=1&query=' . rawurlencode($fullAddress),
    'Plan:      ' . $L['plan'][$plan],
    '',
    'WORK ORDER',
], $workOrder, [
    '',
    'Customer:  ' . $name,
    'Phone:     ' . $phone,
    'Email:     ' . $email,
]);
if ($forOther) $owner[] = 'Booked for: ' . $otherName . ($otherPhone !== '' ? ", $otherPhone" : '');
if ($notes !== '') {
    $owner[] = '';
    $owner[] = 'Notes: ' . $notes;
}

// ---------- The customer's confirmation ----------
$first = explode(' ', $name)[0];
$customer = array_merge([
    "Hi $first,",
    '',
    'Thank you for booking snow removal with ' . $cfg['siteName'] . '. Here is your work order.',
    '',
    "  Booking number: $ref",
    "  Address: $fullAddress",
    '  Plan: ' . $L['plan'][$plan],
    $plan === 'once' ? "  Cleared by: $due" : '  We clear within 24 hours after every snowfall of ' . ($catalog['triggerCm'] ?? 5) . ' cm or more',
    '',
], $workOrder, [
    '',
    'What happens next',
    '  1. We call you at ' . $phone . ' to confirm the details.',
    '  2. We clear your snow ' . ($plan === 'once' ? 'within 24 hours of your booking.' : 'after every snowfall, within 24 hours after it stops.'),
    '  3. You pay after we confirm. Nothing has been charged.',
    '',
    'Need to change something? ' . ($cfg['phone'] !== '' ? 'Call us at ' . $cfg['phone'] . ' or reply to this email.' : 'Reply to this email.'),
    '',
    $cfg['siteName'] . ', snow removal in Regina',
]);
if ($forOther) array_splice($customer, 7, 0, ['  Booked for: ' . $otherName]);

$ownerMailed = $cfg['bookingEmail'] !== ''
    ? clearlot_send($cfg, $cfg['bookingEmail'], "New booking $ref: " . $L['driveway'][$driveway] . ', ' . $L['plan'][$plan] . " at $address", implode("\n", $owner), $email)
    : false;
$customerMailed = clearlot_send($cfg, $email, "Your snow removal booking $ref", implode("\n", $customer), $cfg['bookingEmail']);

$booking = [
    'ref' => $ref,
    'created' => $now->format(DATE_ATOM),
    'clearBy' => $due,
    'plan' => $plan,
    'driveway' => $driveway,
    'sidewalk' => $sidewalk,
    'walkway' => $walkway,
    'steps' => $steps,
    'iceMelt' => $ice,
    'price' => $total,
    'gst' => $gst,
    'address' => $address,
    'postal' => $postal,
    'addressFromGoogle' => $verified,
    'name' => $name,
    'phone' => $phone,
    'email' => $email,
    'otherName' => $otherName,
    'otherPhone' => $otherPhone,
    'notes' => $notes,
    'emailedYou' => $ownerMailed,
    'emailedCustomer' => $customerMailed,
];
$saved = (bool) @file_put_contents(clearlot_data_dir() . '/bookings.jsonl', json_encode($booking, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n", FILE_APPEND | LOCK_EX);

if (!$saved && !$ownerMailed) {
    page(500, 'We couldn’t send your booking', 'Something went wrong on our side. Please try again in a minute.');
}

header('Location: /thank-you/?ref=' . $ref . '&plan=' . $plan . '&t=' . time() . ($customerMailed ? '&mail=1' : ''), true, 303);
