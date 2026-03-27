export async function loader() {
  const points = 123;

  return new Response(`
    <html>
      <head>
        <title>Rewards</title>
        <style>
          body {
            font-family: Arial;
            background: #f5f5f5;
            padding: 40px;
          }
          .card {
            background: white;
            padding: 30px;
            border-radius: 12px;
            max-width: 400px;
            margin: auto;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            text-align: center;
          }
          h1 {
            margin-bottom: 10px;
          }
          .points {
            font-size: 48px;
            font-weight: bold;
            color: #2e7d32;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Your Rewards</h1>
          <div class="points">${points}</div>
          <p>Available points</p>
        </div>
      </body>
    </html>
  `, {
    headers: { "Content-Type": "text/html" },
  });
}

export async function action() {
  return new Response("OK");
}
