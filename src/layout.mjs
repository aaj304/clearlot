import { ICON, tel } from "./ui.mjs";

const NAV = [
  ["/prices/", "Prices"],
  ["/driveway-snow-removal/", "Driveways"],
  ["/sidewalk-snow-removal/", "Sidewalks"],
  ["/snow-removal-for-seniors/", "Seniors"],
  ["/faq/", "Questions"],
];

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

function logo() {
  return `<a class="logo" href="/" aria-label="ClearLot YQR home">
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><rect x="1" y="1" width="30" height="30" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><rect x="11" y="7" width="10" height="24" fill="#ef6a22"/><rect x="1" y="23" width="30" height="5" fill="currentColor"/></svg>
    <span>ClearLot <span class="logo-yqr">YQR</span></span>
  </a>`;
}

function header(site, path) {
  const phone = site.phone
    ? `<a class="header-phone" href="${tel(site.phone)}" data-call>${ICON.phone}<span>${esc(site.phone)}</span></a>`
    : "";
  const links = NAV.map(([href, label]) => `<a href="${href}"${path === href ? ' aria-current="page"' : ""}>${label}</a>`).join("");
  return `<header class="site-header">
  <div class="wrap header-row">
    ${logo()}
    <nav class="nav-desktop" aria-label="Main">${links}</nav>
    <div class="header-actions">
      ${phone}
      ${path === "/book/" ? "" : `<a class="btn btn-primary btn-sm" href="/book/">Book now</a>`}
      <details class="nav-mobile">
        <summary aria-label="Menu">${ICON.menu}<span>Menu</span></summary>
        <nav class="nav-mobile-panel" aria-label="Main">
          ${links}
          <a href="/areas-we-serve/">Areas we serve</a>
          <a href="/contact/">Contact</a>
          ${site.phone ? `<a class="btn btn-quiet" href="${tel(site.phone)}" data-call>${ICON.phone} Call ${esc(site.phone)}</a>` : ""}
        </nav>
      </details>
    </div>
  </div>
</header>`;
}

function footer(site) {
  const year = new Date().getFullYear();
  return `<footer class="site-footer">
  <div class="wrap footer-grid">
    <div>
      ${logo()}
      <p class="footer-about">Snow removal for homes in Regina, Saskatchewan. Driveways, sidewalks and walkways, cleared within 24 hours.</p>
    </div>
    <nav aria-label="Services">
      <p class="footer-head">Services</p>
      <a href="/driveway-snow-removal/">Driveway snow removal</a>
      <a href="/sidewalk-snow-removal/">Sidewalk snow removal</a>
      <a href="/snow-removal-for-seniors/">Snow removal for seniors</a>
      <a href="/book/">Book snow removal</a>
    </nav>
    <nav aria-label="Help">
      <p class="footer-head">Help</p>
      <a href="/prices/">Prices</a>
      <a href="/faq/">Questions</a>
      <a href="/areas-we-serve/">Areas we serve</a>
      <a href="/contact/">Contact</a>
      <a href="/privacy/">Privacy</a>
    </nav>
    <div>
      <p class="footer-head">Talk to us</p>
      ${site.phone ? `<a class="footer-phone" href="${tel(site.phone)}" data-call>${esc(site.phone)}</a>` : ""}
      ${site.publicEmail ? `<a href="mailto:${esc(site.publicEmail)}">${esc(site.publicEmail)}</a>` : ""}
      <p class="footer-small">Prices in Canadian dollars, plus GST</p>
    </div>
  </div>
  <div class="wrap footer-base"><p>© ${year} ${esc(site.name)}</p></div>
</footer>`;
}

function stickyBar(site, path) {
  if (path === "/book/" || path === "/thank-you/") return "";
  return `<div class="sticky-bar">
  ${site.phone ? `<a class="btn btn-quiet" href="${tel(site.phone)}" data-call>${ICON.phone}<span>Call</span></a>` : ""}
  <a class="btn btn-primary" href="/book/">Book snow removal</a>
</div>`;
}

function gtag(site) {
  if (!site.googleAdsId) return "";
  const call = site.callConversionLabel
    ? `document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('[data-call]');if(a)gtag('event','conversion',{send_to:'${site.googleAdsId}/${site.callConversionLabel}'});});`
    : "";
  return `<script async src="https://www.googletagmanager.com/gtag/js?id=${site.googleAdsId}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${site.googleAdsId}');${call}</script>`;
}

export function layout(site, page) {
  const url = site.siteUrl.replace(/\/$/, "") + page.path;
  const schema = [].concat(page.schema || []).map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join("\n");
  return `<!doctype html>
<html lang="en-CA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>document.documentElement.classList.add("js")</script>
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
<link rel="canonical" href="${url}">
${page.noindex || site.preview ? '<meta name="robots" content="noindex">' : ""}
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${site.siteUrl.replace(/\/$/, "")}/assets/share.png">
<meta property="og:locale" content="en_CA">
<meta name="theme-color" content="#f6f4ef">
<link rel="icon" href="/assets/icon.svg" type="image/svg+xml">
<link rel="preload" href="/assets/fonts/public-sans.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/newsreader.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/style.css?v=${page.version}">
${schema}
${gtag(site)}
${page.head || ""}
</head>
<body class="${page.bodyClass || ""}">
<a class="skip" href="#main">Skip to content</a>
${header(site, page.path)}
<main id="main">
${page.body}
</main>
${footer(site)}
${stickyBar(site, page.path)}
<script src="/assets/site.js?v=${page.version}" defer></script>
${page.scripts || ""}
</body>
</html>`;
}
