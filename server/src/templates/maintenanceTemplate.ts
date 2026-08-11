// Self-contained maintenance page - no external requests (fonts, images, JS)
// so nothing about it can itself fail while the site is down. Auto-refreshes
// every 30s so a visitor doesn't have to remember to check back manually.
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
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  }
  .card {
    width: 100%;
    max-width: 400px;
    background: #ffffff;
    border-radius: 20px;
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.05);
    overflow: hidden;
    text-align: center;
  }
  .header {
    background: #4f46e5;
    padding: 32px 32px 28px;
  }
  .logo {
    font-size: 22px;
    font-weight: 900;
    letter-spacing: -0.5px;
    color: #ffffff;
  }
  .logo span { color: #c7d2fe; }
  .icon {
    width: 56px;
    height: 56px;
    margin: 20px auto 0;
    border-radius: 50%;
    background: rgba(255,255,255,0.15);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .icon svg { animation: spin 3s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .body { padding: 32px; }
  h1 { margin: 0 0 12px; font-size: 20px; font-weight: 800; color: #111827; letter-spacing: -0.3px; }
  p { margin: 0; font-size: 14px; line-height: 1.6; color: #6b7280; }
  .footnote { margin-top: 24px; font-size: 12px; color: #9ca3af; }
</style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo">Kraa<span>Fo</span></div>
      <div class="icon">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      </div>
    </div>
    <div class="body">
      <h1>We'll be right back</h1>
      <p>${safeMessage}</p>
      <p class="footnote">This page refreshes automatically - no need to reload.</p>
    </div>
  </div>
</body>
</html>`;
}
