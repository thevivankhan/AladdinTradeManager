export default function handler(req, res) {
  const queryText = (req.query && req.query.text) || '';
  const encoded = encodeURIComponent(queryText);
  const tgProtocol = `tg://resolve?domain=AladdinAISupport${encoded ? `&text=${encoded}` : ''}`;
  const androidIntent = `intent://resolve?domain=AladdinAISupport${encoded ? `&text=${encoded}` : ''}#Intent;package=org.telegram.messenger;scheme=tg;end;`;
  const tgDogUrl = `https://telegram.dog/AladdinAISupport${encoded ? `?text=${encoded}` : ''}`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Opening Aladdin AI Support...</title>
  <meta http-equiv="refresh" content="1;url=${tgDogUrl}">
  <style>
    body {
      background: #090e17;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 16px;
      text-align: center;
    }
    .card {
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 16px;
      padding: 24px;
      max-width: 360px;
      width: 100%;
    }
    .btn {
      display: block;
      background: #0088cc;
      color: #fff;
      padding: 12px 16px;
      border-radius: 10px;
      text-decoration: none;
      font-weight: bold;
      margin: 10px 0;
    }
    .btn-green {
      background: #10b981;
      color: #022c22;
    }
  </style>
</head>
<body>
  <div class="card">
    <h2 style="font-size: 18px; margin-top: 0;">Opening Telegram Support...</h2>
    <p style="color: #94a3b8; font-size: 13px;">Connecting you directly to <strong>@AladdinAISupport</strong></p>
    <a href="${tgProtocol}" class="btn btn-green">📲 Open in Telegram App</a>
    <a href="${tgDogUrl}" class="btn">🌐 Open in Browser</a>
  </div>
  <script>
    var isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = ${JSON.stringify(tgProtocol)};
      setTimeout(function() {
        window.location.href = ${JSON.stringify(tgDogUrl)};
      }, 1200);
    } else {
      window.location.href = ${JSON.stringify(tgDogUrl)};
    }
  </script>
</body>
</html>`);
}
