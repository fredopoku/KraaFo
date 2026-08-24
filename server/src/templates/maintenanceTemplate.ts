// Self-contained maintenance page - no external requests (fonts, images, JS)
// so nothing about it can itself fail while the site is down. The real logo
// is embedded as a base64 data URI rather than linked (an <img src="/krafo-logo.png">
// request would itself get intercepted by maintenanceGate and come back as
// this same HTML page instead of image bytes, since the gate runs before
// static file serving and only exempts /api/health and /api/admin).
// Auto-refreshes every 30s so a visitor doesn't have to remember to check back.
const LOGO_DATA_URI = 'data:image/png;base64,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';

export function buildMaintenancePage(message: string): string {
  const safeMessage = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="30">
<title>KraaFo - Down for maintenance</title>
<style>
  * { box-sizing: border-box; }
  html, body { overflow-x: hidden; }
  body {
    position: relative;
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: linear-gradient(135deg, #eef2ff 0%, #eff6ff 55%, #f5f3ff 100%);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  }

  /* Soft, slow-drifting colour fields so the rest of the viewport reads as
     "designed" rather than empty on large screens - not literally stretching
     the card, since a huge card looks worse than a focused one. The field
     wrapper is fixed at exactly the viewport size (never larger) with its
     own overflow:hidden, so the oversized blobs inside it are clipped by a
     safe ancestor instead of having their own boxes poke past the viewport -
     letting a position:fixed element's box exceed the viewport can make
     mobile browsers expand the whole layout viewport to fit it, distorting
     everything else on the page. */
  .blob-field { position: fixed; inset: 0; overflow: hidden; pointer-events: none; z-index: 0; }
  .blob { position: absolute; border-radius: 50%; filter: blur(60px); }
  .blob1 { width: 420px; height: 420px; top: -120px; left: -120px; background: radial-gradient(circle, #6366f1 0%, transparent 70%); opacity: 0.25; animation: drift1 22s ease-in-out infinite; }
  .blob2 { width: 380px; height: 380px; bottom: -140px; right: -100px; background: radial-gradient(circle, #7c3aed 0%, transparent 70%); opacity: 0.22; animation: drift2 26s ease-in-out infinite; }
  .blob3 { width: 300px; height: 300px; top: 40%; right: 8%; background: radial-gradient(circle, #4f46e5 0%, transparent 70%); opacity: 0.15; animation: drift3 19s ease-in-out infinite; }
  @keyframes drift1 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(30px, 20px) scale(1.08); } }
  @keyframes drift2 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-25px, -20px) scale(1.06); } }
  @keyframes drift3 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-20px, 25px) scale(0.94); } }

  .card {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 480px;
    background: #ffffff;
    border-radius: 24px;
    box-shadow: 0 20px 25px -5px rgba(79,70,229,0.12), 0 8px 10px -6px rgba(79,70,229,0.08);
    overflow: hidden;
  }
  .header {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    padding: 28px 32px 24px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .logo-badge {
    flex: none;
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }
  .logo-badge img { width: 30px; height: 30px; border-radius: 6px; display: block; }
  .wordmark { font-size: 20px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff; }
  .wordmark span { color: #c7d2fe; }
  .scene {
    background: linear-gradient(180deg, #eef2ff 0%, #ffffff 100%);
    padding: 28px 20px 8px;
  }
  .scene svg { display: block; margin: 0 auto; max-width: 100%; height: auto; }

  /* Building floors rise into place and settle, one after another, like
     construction that never actually stops - a visual echo of "still working". */
  .floor { animation: rise 3.6s ease-in-out infinite; transform-origin: bottom center; }
  .floor1 { animation-delay: 0s; }
  .floor2 { animation-delay: 0.25s; }
  .floor3 { animation-delay: 0.5s; }
  .floor4 { animation-delay: 0.75s; }
  @keyframes rise {
    0% { transform: translateY(0); }
    8% { transform: translateY(-6px); }
    16% { transform: translateY(0); }
    100% { transform: translateY(0); }
  }

  /* Crane arm gives a slow, deliberate swing - not frantic, just steady work. */
  .crane-arm { animation: swing 4.5s ease-in-out infinite; transform-origin: 205px 16px; }
  @keyframes swing {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(-5deg); }
  }
  .hook { animation: hoist 4.5s ease-in-out infinite; }
  @keyframes hoist {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(8px); }
  }

  .gear { animation: spin 7s linear infinite; transform-origin: 36px 110px; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

  .body { padding: 22px 32px 8px; text-align: center; }
  h1 { margin: 0 0 10px; font-size: 22px; font-weight: 900; color: #111827; letter-spacing: -0.4px; }
  .msg { margin: 0; font-size: 14px; line-height: 1.6; color: #6b7280; }

  .notes {
    margin: 22px 32px 0;
    background: #eef2ff;
    border: 1px solid #e0e7ff;
    border-radius: 16px;
    padding: 18px 20px;
    text-align: left;
  }
  .notes-title {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #4f46e5;
    margin: 0 0 10px;
  }
  .notes ul { margin: 0; padding: 0; list-style: none; }
  .notes li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 13px;
    line-height: 1.5;
    color: #3730a3;
    margin-bottom: 8px;
  }
  .notes li:last-child { margin-bottom: 0; }
  .notes li svg { flex: none; margin-top: 2px; }

  .footer {
    padding: 20px 32px 28px;
    text-align: center;
  }
  .footnote { font-size: 12px; color: #9ca3af; margin: 0; }
  .footnote a { color: #4f46e5; font-weight: 600; text-decoration: none; }

  @media (max-width: 380px) {
    body { padding: 16px; }
    .header { padding: 22px 20px 20px; }
    .body { padding: 18px 20px 4px; }
    .notes { margin-left: 20px; margin-right: 20px; padding: 14px 16px; }
    .footer { padding: 16px 20px 22px; }
    h1 { font-size: 19px; }
  }
</style>
</head>
<body>
  <div class="blob-field">
    <div class="blob blob1"></div>
    <div class="blob blob2"></div>
    <div class="blob blob3"></div>
  </div>
  <div class="card">
    <div class="header">
      <div class="logo-badge"><img src="${LOGO_DATA_URI}" alt="KraaFo" width="30" height="30"></div>
      <div class="wordmark">Kraa<span>Fo</span></div>
    </div>

    <div class="scene">
      <svg width="260" height="150" viewBox="0 0 260 150" fill="none">
        <line x1="8" y1="134" x2="252" y2="134" stroke="#c7d2fe" stroke-width="2" stroke-linecap="round"/>

        <g class="gear" opacity="0.55">
          <circle cx="36" cy="110" r="16" stroke="#a5b4fc" stroke-width="4"/>
          <path d="M36 87v7M36 126v7M13 110h7M52 110h7M25 99l-5-5M47 99l5-5M25 121l-5 5M47 121l5 5"
            stroke="#a5b4fc" stroke-width="4" stroke-linecap="round"/>
        </g>

        <g class="floor floor1">
          <rect x="64" y="104" width="112" height="30" rx="3" fill="#4f46e5"/>
          <rect x="74" y="112" width="14" height="14" rx="2" fill="#eef2ff"/>
          <rect x="100" y="112" width="14" height="14" rx="2" fill="#eef2ff"/>
          <rect x="126" y="112" width="14" height="14" rx="2" fill="#eef2ff"/>
          <rect x="152" y="112" width="14" height="14" rx="2" fill="#eef2ff"/>
        </g>
        <g class="floor floor2">
          <rect x="64" y="76" width="112" height="28" rx="3" fill="#6366f1"/>
          <rect x="74" y="83" width="14" height="14" rx="2" fill="#eef2ff"/>
          <rect x="100" y="83" width="14" height="14" rx="2" fill="#eef2ff"/>
          <rect x="126" y="83" width="14" height="14" rx="2" fill="#eef2ff"/>
          <rect x="152" y="83" width="14" height="14" rx="2" fill="#eef2ff"/>
        </g>
        <g class="floor floor3">
          <rect x="64" y="48" width="112" height="28" rx="3" fill="#7c7ff2"/>
          <rect x="74" y="55" width="14" height="14" rx="2" fill="#eef2ff"/>
          <rect x="100" y="55" width="14" height="14" rx="2" fill="#eef2ff"/>
          <rect x="126" y="55" width="14" height="14" rx="2" fill="#eef2ff"/>
          <rect x="152" y="55" width="14" height="14" rx="2" fill="#eef2ff"/>
        </g>
        <g class="floor floor4">
          <rect x="78" y="26" width="84" height="22" rx="3" fill="#8b8ff7"/>
          <rect x="97" y="32" width="14" height="14" rx="2" fill="#eef2ff"/>
          <rect x="130" y="32" width="14" height="14" rx="2" fill="#eef2ff"/>
          <rect x="108" y="10" width="24" height="16" rx="2" fill="#a5b4fc"/>
        </g>

        <line x1="205" y1="16" x2="205" y2="134" stroke="#4f46e5" stroke-width="5" stroke-linecap="round"/>
        <g class="crane-arm">
          <line x1="182" y1="16" x2="250" y2="16" stroke="#4f46e5" stroke-width="5" stroke-linecap="round"/>
          <rect x="172" y="10" width="14" height="12" rx="2" fill="#4f46e5"/>
          <line x1="205" y1="30" x2="234" y2="16" stroke="#a5b4fc" stroke-width="2.5" stroke-linecap="round"/>
          <g class="hook">
            <line x1="234" y1="16" x2="234" y2="50" stroke="#a5b4fc" stroke-width="2"/>
            <rect x="226" y="50" width="16" height="12" rx="2" fill="#c7d2fe" stroke="#4f46e5" stroke-width="1.5"/>
          </g>
        </g>
      </svg>
    </div>

    <div class="body">
      <h1>We're building something better</h1>
      <p class="msg">${safeMessage}</p>
    </div>

    <div class="notes">
      <p class="notes-title">A quick note from the team</p>
      <ul>
        <li>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          We haven't gone anywhere - we're online and actively working right now.
        </li>
        <li>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          Your account, invoices and data are safe and untouched.
        </li>
        <li>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          This page checks again automatically - no need to keep refreshing.
        </li>
      </ul>
    </div>

    <div class="footer">
      <p class="footnote">Need something urgent? <a href="mailto:kraafo.invoice.receipt@gmail.com">Email us</a> and we'll get back to you.</p>
    </div>
  </div>
</body>
</html>`;
}
