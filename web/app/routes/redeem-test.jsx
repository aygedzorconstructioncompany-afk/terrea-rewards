import { useState } from "react";

// ================= COMPONENT =================
export default function Index() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function redeem() {
    try {
      console.log("CLICK 🔥");
      setLoading(true);

      const formData = new FormData();
      formData.append("customerId", "123");
      formData.append("points", "500");

      console.log("BEFORE FETCH");

      const res = await fetch(
        "https://stayed-mile-loans-centuries.trycloudflare.com/api/redeem",
        {
          method: "POST",
          body: formData,
        }
      );

      console.log("AFTER FETCH", res);

      const data = await res.json();

      console.log("DATA:", data);

      if (data.error) {
        alert(data.error);
        setLoading(false);
        return;
      }

      setCode(data.code);
      setLoading(false);

    } catch (err) {
      console.error("ERROR:", err);
      alert("ERROR: " + err.message);
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>🔥 Terrea Demo</h1>

      <button
        onClick={redeem}
        disabled={loading}
        style={{
          padding: "12px 20px",
          fontSize: "16px",
          cursor: "pointer"
        }}
      >
        {loading ? "Processing..." : "Redeem"}
      </button>

      {code && (
        <div style={{ marginTop: 20 }}>
          <h2>{code}</h2>

          <a
            href={`https://terrea-home-rituals.myshopify.com/discount/${code}`}
            style={{
              display: "inline-block",
              marginTop: "10px"
            }}
          >
            👉 Go to checkout
          </a>
        </div>
      )}
    </div>
  );
}
