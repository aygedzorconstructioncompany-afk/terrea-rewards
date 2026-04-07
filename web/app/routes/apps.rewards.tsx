import { useEffect, useState } from "react";

export default function RewardsPage() {
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadWallet = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const customerId = params.get("customerId") || "demo-user"; // ✅ fallback

      const res = await fetch(`/api/wallet?customerId=${customerId}`);

      if (!res.ok) {
        throw new Error("Failed to load wallet");
      }

      const data = await res.json();
      setWallet(data);
    } catch (err) {
      console.error("Wallet load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  if (loading) {
    return <div style={{ padding: 20 }}>Loading...</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Rewards</h1>

      <p>Balance: {wallet?.points || 0} pts</p>
      <p>Total spent: ${wallet?.totalSpent || 0}</p>

      <button
        onClick={async () => {
          if (!wallet || wallet.points < 100) {
            alert("Not enough points");
            return;
          }

          try {
            await fetch("/api/redeem", { method: "POST" });
            await loadWallet();
          } catch (err) {
            console.error("Redeem error:", err);
          }
        }}
      >
        Redeem 100 pts
      </button>
    </div>
  );
}