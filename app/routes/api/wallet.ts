export async function loader() {
  const points = 123;

  return new Response(`
    <html>
      <head>
        <title>Rewards</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #667eea, #764ba2);
            padding: 40px;
            margin: 0;
          }
          .card {
            background: white;
            padding: 40px;
            border-radius: 20px;
            max-width: 420px;
            margin: auto;
            box-shadow: 0 20px 60px rgba(0,0,0,0.2);
            text-align: center;
          }
          h1 {
            margin-bottom: 10px;
            font-size: 24px;
          }
          .points {
            font-size: 64px;
            font-weight: bold;
            color: #6a11cb;
            margin: 20px 0;
          }
          .subtitle {
            color: #666;
            margin-bottom: 20px;
          }
          .btn {
            display: inline-block;
            padding: 12px 20px;
            background: #6a11cb;
            color: white;
            border-radius: 8px;
            text-decoration: none;
            margin-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🎁 Your Rewards</h1>
          <div class="points">${points}</div>
          <div class="subtitle">Available points</div>
          <a href="#" class="btn">Use Points</a>
        </div>
      </body>
    </html>
  `, {
    headers: { "Content-Type": "text/html" },
  });
}
