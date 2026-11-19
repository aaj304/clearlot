<?php
/**
 * Receives a booking from /book/, re-checks every choice and recomputes the price,
 * saves it, emails it to you (and a confirmation to the customer), then sends the
 * customer to the thank-you page. Prices always come from catalog.json, never the browser.
 */
declare(strict_types=1);

$cfg = require __DIR__ . '/config.php';
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

// Bots: a filled honeypot or a form sent faster than a person could type it.
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
$name = field('name', 80);
$phone = field('phone', 30);
$email = field('email', 120);
$forOther = field('forOther', 1) === '1';
$otherName = $forOther ? field('otherName', 80) : '';
$otherPhone = $forOther ? field('otherPhone', 30) : '';
$notes = field('notes', 600);

$P = $catalog['prices'];
$L = $catalog['labels'];

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
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    page(400, 'Please check your email', 'That email address doesn’t look right. You can also leave it empty.');
}

// A light limit so one visitor can't flood your inbox.
$dataDir = dirname(__DIR__, 2) . '/clearlot-bookings';
if (!is_dir($dataDir) && !@mkdir($dataDir, 0750, true)) {
    $dataDir = __DIR__ . '/data';
    if (!is_dir($dataDir)) @mkdir($dataDir, 0750, true);
    if (!file_exists($dataDir . '/.htaccess')) @file_put_contents($dataDir . '/.htaccess', "Require all denied\nDeny from all\n");
}
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateFile = $dataDir . '/rate-' . substr(hash('sha256', $ip), 0, 16) . '.txt';
$recent = array_filter(
    array_map('intval', @file($rateFile, FILE_IGNORE_NEW_LINES) ?: []),
    fn ($t) => $t > time() - 3600
);
if (count($recent) >= 6) {
    page(429, 'Too many bookings at once', 'Please wait a little and try again.');
}
$recent[] = time();
@file_put_contents($rateFile, implode("\n", $recent));

$p = $P[$plan];
$total = $p['driveway'][$driveway] + $p['sidewalk'][$sidewalk] + $p['walkway'][$walkway]
    + ($steps ? $p['steps'] : 0) + ($ice ? $p['iceMelt'] : 0);
$gst = round($total * $catalog['gst'], 2);
$ref = 'CL-' . strtoupper(bin2hex(random_bytes(3)));
$now = new DateTimeImmutable('now', new DateTimeZone('America/Regina'));
$due = $plan === 'once' ? $now->modify('+24 hours')->format('D M j, g:i a') : 'within 24 hours after each snowfall';

$extras = array_filter([$steps ? 'Front steps' : null, $ice ? 'Ice melt' : null]);
$unit = $plan === 'winter' ? 'for the winter' : 'per visit';
$money = fn ($n) => '$' . number_format((float) $n, 2);

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
    'name' => $name,
    'phone' => $phone,
    'email' => $email,
    'otherName' => $otherName,
    'otherPhone' => $otherPhone,
    'notes' => $notes,
];

$saved = (bool) @file_put_contents($dataDir . '/bookings.jsonl', json_encode($booking, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n", FILE_APPEND | LOCK_EX);

$lines = [
    "New booking $ref",
    '',
    "CLEAR BY: $due",
    '',
    'Address:   ' . $address . ', Regina' . ($postal !== '' ? " $postal" : ''),
    'Map:       https://www.google.com/maps/search/?api=1&query=' . rawurlencode("$address, Regina, SK"),
    '',
    'Plan:      ' . $L['plan'][$plan],
    'Driveway:  ' . $L['driveway'][$driveway],
    'Sidewalk:  ' . $L['sidewalk'][$sidewalk],
    'Walkway:   ' . $L['walkway'][$walkway],
    'Extras:    ' . ($extras ? implode(', ', $extras) : 'None'),
    'Price:     ' . $money($total) . " $unit + " . $money($gst) . ' GST = ' . $money($total + $gst),
    '',
    'Customer:  ' . $name,
    'Phone:     ' . $phone,
    'Email:     ' . ($email !== '' ? $email : '(none)'),
];
if ($forOther) {
    $lines[] = 'Booked for: ' . $otherName . ($otherPhone !== '' ? ", $otherPhone" : '');
}
if ($notes !== '') {
    $lines[] = '';
    $lines[] = 'Notes: ' . $notes;
}
$body = implode("\n", $lines);

$mailed = false;
$headerSafe = fn ($s) => str_replace(["\r", "\n"], '', $s);
if ($cfg['bookingEmail'] !== '') {
    $from = $cfg['fromEmail'] !== '' ? $cfg['fromEmail'] : $cfg['bookingEmail'];
    $headers = ['From: ' . $headerSafe($cfg['siteName']) . ' <' . $headerSafe($from) . '>', 'Content-Type: text/plain; charset=UTF-8'];
    if ($email !== '') $headers[] = 'Reply-To: ' . $headerSafe($email);
    $subject = $headerSafe("New booking $ref: " . $L['driveway'][$driveway] . ', ' . $L['plan'][$plan] . " at $address");
    $mailed = @mail($cfg['bookingEmail'], '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, implode("\r\n", $headers));

    if ($email !== '') {
        $c = [
            "Hi $name,",
            '',
            'Thanks for booking snow removal with ' . $cfg['siteName'] . '. Here is what we have:',
            '',
            "  Booking number: $ref",
            "  Address: $address, Regina",
            '  ' . $L['plan'][$plan] . ': ' . $L['driveway'][$driveway] . ', ' . $L['sidewalk'][$sidewalk] . ', ' . $L['walkway'][$walkway] . ($extras ? ', ' . implode(', ', $extras) : ''),
            '  Price: ' . $money($total) . " $unit, plus GST",
            $plan === 'once' ? "  Cleared by: $due" : '  We clear within 24 hours after each snowfall',
            '',
            'We will call you to confirm before we come. Nothing has been charged.',
            '',
            $cfg['siteName'] . ($cfg['phone'] !== '' ? ' · ' . $cfg['phone'] : ''),
        ];
        $ch = ['From: ' . $headerSafe($cfg['siteName']) . ' <' . $headerSafe($from) . '>', 'Reply-To: ' . $headerSafe($cfg['bookingEmail']), 'Content-Type: text/plain; charset=UTF-8'];
        @mail($email, '=?UTF-8?B?' . base64_encode("Your snow removal booking ($ref)") . '?=', implode("\n", $c), implode("\r\n", $ch));
    }
}

if (!$saved && !$mailed) {
    page(500, 'We couldn’t send your booking', 'Something went wrong on our side. Please try again in a minute.');
}

header('Location: /thank-you/?ref=' . $ref . '&plan=' . $plan . '&t=' . time(), true, 303);
