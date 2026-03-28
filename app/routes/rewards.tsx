import { useEffect, useState } from "react";

export default function Rewards() {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const customerId = "123"; // 🔥 потом заменим на реальный

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/proxy/wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ customerId }),
      });

      const data = await res.json();

      setBalance(data.balance || 0);
      setHistory(data.history || []);
      setLoading(false);
    }

    load();
  }, []);

  async function redeem() {
    const res = await fetch("/api/redeem", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ customerId }),
    });

    const data = await res.json();

    if (data.code) {
      window.location.href = data.checkoutUrl;
    }
  }

  if (loading) {
    return <div style={{ padding: 40 }}>Loading...</div>;
  }

  return (
    <div style={{ padding: 40, fontFamily: "Inter, Arial" }}>
      
      <h1 style={{ fontSize: 28 }}>🎁 Terrea Rewards</h1>

      {/* BALANCE CARD */}
      <div style={{
        marginTop: 20,
        padding: 20,
        borderRadius: 16,
        background: "#111",
        color: "#fff",
      }}>
        <h2>Your Balance</h2>
        <h1 style={{ fontSize: 40 }}>{balance} pts</h1>

        <button
          onClick={redeem}
          style={{
            marginTop: 10,
            padding: "10px 20px",
            background: "#00c853",
            border: "none",
            borderRadius: 8,
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Redeem 10 pts
        </button>
      </div>

      {/* HISTORY */}
      <div style={{ marginTop: 30 }}>
        <h2>History</h2>

        <div style={{
          marginTop: 10,
          borderRadius: 12,
          border: "1px solid #eee",
        }}>
          {history.map((item: any) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: 12,
                borderBottom: "1px solid #eee",
              }}
            >
              <div>
                <b>{item.type}</b><br />
                <small>{new Date(item.createdAt).toLocaleDateString()}</small>
              </div>

              <div style={{
                color: item.type === "earn" ? "green" : "red"
              }}>
                {item.type === "earn" ? "+" : "-"}{item.points}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}