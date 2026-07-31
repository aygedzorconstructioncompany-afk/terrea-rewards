import { useState, useEffect, useCallback } from "react";

export function clientLoader() { return null; }
export function HydrateFallback() { return null; }

const SECRET = "terrea-admin-2024";
const SHOP = "hrwxgq-ka.myshopify.com";
const S: Record<string, React.CSSProperties> = {
  wrap: { fontFamily: "'Cabin', -apple-system, sans-serif", background: "#FFFAE4", minHeight: "100vh", padding: "32px 40px", color: "#1A1B18" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" },
  title: { fontSize: "22px", fontWeight: 600, color: "#1A1B18", margin: 0 },
  subtitle: { fontSize: "13px", color: "#888", margin: "2px 0 0" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px", marginBottom: "24px" },
  statBox: { background: "#1A1B18", borderRadius: "12px", padding: "20px 24px" },
  statVal: { fontSize: "28px", fontWeight: 600, color: "#FFFAE4", margin: 0, lineHeight: 1 },
  statLbl: { fontSize: "11px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px", marginTop: "6px" },
  card: { background: "#fff", border: "1px solid rgba(26,27,24,0.1)", borderRadius: "12px", padding: "24px", marginBottom: "20px" },
  cardTitle: { fontSize: "14px", fontWeight: 600, color: "#1A1B18", margin: "0 0 16px", paddingBottom: "12px", borderBottom: "1px solid rgba(26,27,24,0.08)" },
  tiersGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "16px" },
  tierBox: { background: "#FFFAE4", border: "1px solid rgba(26,27,24,0.08)", borderRadius: "10px", padding: "14px", textAlign: "center" as const },
  tierName: { fontSize: "11px", color: "#888", marginBottom: "8px" },
  tierInput: { width: "100%", padding: "8px", textAlign: "center" as const, border: "1px solid rgba(26,27,24,0.2)", borderRadius: "8px", fontSize: "16px", fontWeight: 600, background: "#fff", color: "#1A1B18", fontFamily: "inherit" },
  saveBtn: { width: "100%", padding: "12px", background: "#1A1B18", color: "#FFFAE4", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer", letterSpacing: "0.5px" },
  searchInput: { width: "100%", padding: "10px 14px", border: "1px solid rgba(26,27,24,0.2)", borderRadius: "10px", fontSize: "14px", fontFamily: "inherit", background: "#FFFAE4", color: "#1A1B18", marginBottom: "16px", boxSizing: "border-box" as const },
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: "13px" },
  th: { textAlign: "left" as const, padding: "8px 12px", fontSize: "10px", color: "#999", textTransform: "uppercase" as const, letterSpacing: "1px", borderBottom: "1px solid rgba(26,27,24,0.08)", fontWeight: 600 },
  td: { padding: "12px", borderBottom: "1px solid rgba(26,27,24,0.06)", color: "#1A1B18", verticalAlign: "middle" as const },
  editBtn: { padding: "5px 14px", background: "transparent", border: "1px solid rgba(26,27,24,0.2)", borderRadius: "8px", fontSize: "12px", cursor: "pointer", color: "#1A1B18", fontFamily: "inherit" },
  badge: { display: "inline-block", padding: "3px 10px", borderRadius: "99px", fontSize: "11px", fontWeight: 500 },
  banner: { padding: "12px 16px", borderRadius: "10px", marginBottom: "16px", fontSize: "13px", fontWeight: 500 },
  editCard: { background: "#fff", border: "2px solid #D72C0D", borderRadius: "12px", padding: "24px", marginBottom: "20px" },
  input: { width: "100%", padding: "10px 14px", border: "1px solid rgba(26,27,24,0.2)", borderRadius: "10px", fontSize: "14px", fontFamily: "inherit", background: "#fff", color: "#1A1B18", marginBottom: "12px", boxSizing: "border-box" as const },
  applyBtn: { padding: "10px 24px", background: "#D72C0D", color: "#FFFAE4", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer", marginRight: "10px", fontFamily: "inherit" },
  cancelBtn: { padding: "10px 24px", background: "transparent", border: "1px solid rgba(26,27,24,0.2)", borderRadius: "10px", fontSize: "13px", cursor: "pointer", fontFamily: "inherit", color: "#1A1B18" },
};

const tierColors: Record<string, React.CSSProperties> = {
  "start":   { background: "#F1EFE8", color: "#5F5E5A" },
  "stay":    { background: "#EAF3DE", color: "#3B6D11" },
  "belong":  { background: "#E1F5EE", color: "#0F6E56" },
  "belong+": { background: "#FAEEDA", color: "#854F0B" },
};

export default function AdminPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [rates, setRates] = useState({ start: 10, stay: 15, belong: 20, "belong+": 20 });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("success");
  const [editCustomer, setEditCustomer] = useState<any>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [search, setSearch] = useState("");

  const showMsg = (text: string, type = "success") => {
    setMsg(text); setMsgType(type);
    setTimeout(() => setMsg(""), 4000);
  };

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/customers?secret=${SECRET}&shop=${SHOP}`);
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  const loadRates = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/rates?secret=${SECRET}`);
      const data = await res.json();
      if (data.rates) setRates(data.rates);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadCustomers(); loadRates(); }, []);

  const saveRates = async () => {
    try {
      const res = await fetch("/api/admin/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: SECRET, rates }),
      });
      const data = await res.json();
      if (data.success) showMsg("✅ Rates saved successfully!");
      else showMsg("❌ Error: " + data.error, "error");
    } catch { showMsg("❌ Error saving rates", "error"); }
  };

  const adjustBalance = async () => {
    if (!editCustomer || !adjustAmount) return;
    try {
      const res = await fetch("/api/admin/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: SECRET,
          customer_id: editCustomer.customerId,
          shop: SHOP,
          amount: parseInt(adjustAmount),
          description: adjustNote || "Admin adjustment",
        }),
      });
      const data = await res.json();
      if (data.success) {
        showMsg(`✅ Balance updated! New: ${data.newBalance} pts`);
        setEditCustomer(null); setAdjustAmount(""); setAdjustNote("");
        loadCustomers();
      } else showMsg("❌ " + data.error, "error");
    } catch { showMsg("❌ Error", "error"); }
  };

  // ✅ ИСПРАВЛЕНО: поиск по email и tier (убран поиск по ID)
  const filtered = customers.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.email || "").toLowerCase().includes(q) ||
           (c.tier || "").toLowerCase().includes(q);
  });

  const totalBalance = customers.reduce((s, c) => s + c.balance, 0);
  const activeSubs = customers.filter(c => c.status === "active").length;

  return (
    <div style={S.wrap}>
      <link href="https://fonts.googleapis.com/css2?family=Cabin:wght@400;500;600&display=swap" rel="stylesheet" />

      <div style={S.header}>
        <div>
          <p style={S.title}>Terrea Rewards</p>
          <p style={S.subtitle}>Admin Dashboard · {SHOP}</p>
        </div>
        <button onClick={loadCustomers} style={{ ...S.editBtn, padding: "8px 16px" }}>↻ Refresh</button>
      </div>

      {msg && (
        <div style={{ ...S.banner, background: msgType === "error" ? "#FCEBEB" : "#EAF3DE", color: msgType === "error" ? "#A32D2D" : "#3B6D11", border: `1px solid ${msgType === "error" ? "#F7C1C1" : "#C0DD97"}` }}>
          {msg}
        </div>
      )}

      <div style={S.statsRow}>
        <div style={S.statBox}>
          <p style={S.statVal}>{customers.length}</p>
          <p style={S.statLbl}>Total customers</p>
        </div>
        <div style={{ ...S.statBox, background: "#D72C0D" }}>
          <p style={S.statVal}>{totalBalance.toLocaleString()}</p>
          <p style={S.statLbl}>Total pts issued</p>
        </div>
        <div style={{ ...S.statBox, background: "#2C5F2E" }}>
          <p style={S.statVal}>{activeSubs}</p>
          <p style={S.statLbl}>Active subscriptions</p>
        </div>
      </div>

      <div style={S.card}>
        <p style={S.cardTitle}>Cashback rates by tier</p>
        <div style={S.tiersGrid}>
          {(["start","stay","belong","belong+"] as const).map(tier => (
            <div key={tier} style={S.tierBox}>
              <p style={S.tierName}>{tier === "start" ? "🌱 Start 1–3mo" : tier === "stay" ? "🌿 Stay 4–6mo" : tier === "belong" ? "🌳 Belong 7–9mo" : "⭐ Belong+ 10+mo"}</p>
              <input
                style={S.tierInput}
                type="number"
                value={(rates as any)[tier]}
                onChange={e => setRates(r => ({ ...r, [tier]: parseInt(e.target.value) || 0 }))}
              />
              <p style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>%</p>
            </div>
          ))}
        </div>
        <button style={S.saveBtn} onClick={saveRates}>Save rates</button>
      </div>

      {editCustomer && (
        <div style={S.editCard}>
          <p style={{ ...S.cardTitle, borderColor: "rgba(215,44,13,0.2)" }}>
            Adjust balance — <span style={{ fontFamily: "monospace" }}>{editCustomer.email || editCustomer.customerId}</span>
          </p>
          <p style={{ fontSize: "13px", color: "#888", marginBottom: "16px" }}>Current balance: <strong>{editCustomer.balance} pts</strong></p>
          <input style={S.input} type="number" placeholder="Amount (e.g. +100 or -50)" value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)} />
          <input style={S.input} type="text" placeholder="Note (optional)" value={adjustNote} onChange={e => setAdjustNote(e.target.value)} />
          <div>
            <button style={S.applyBtn} onClick={adjustBalance}>Apply</button>
            <button style={S.cancelBtn} onClick={() => { setEditCustomer(null); setAdjustAmount(""); }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={S.card}>
        <p style={S.cardTitle}>Customer balances ({customers.length})</p>
        {/* ✅ ИСПРАВЛЕНО: placeholder обновлён */}
        <input style={S.searchInput} type="text" placeholder="Search by email or tier..." value={search} onChange={e => setSearch(e.target.value)} />
        {loading ? (
          <p style={{ color: "#888", textAlign: "center", padding: "32px" }}>Loading...</p>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                {/* ✅ ИСПРАВЛЕНО: заголовок колонки */}
                <th style={S.th}>Customer</th>
                <th style={S.th}>Tier</th>
                <th style={S.th}>Months</th>
                <th style={S.th}>Status</th>
                <th style={S.th}>Balance</th>
                <th style={S.th}>Adjust</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ ...S.td, textAlign: "center", color: "#bbb", padding: "32px" }}>No customers found</td></tr>
              ) : filtered.map(c => (
                <tr key={c.customerId}>
                  <td style={S.td}>
                    <span style={{ fontFamily: "monospace", fontSize: "11px", color: "#888" }}>{c.customerId}</span>
                    {c.email && <div style={{ fontSize: "13px", color: "#1A1B18", marginTop: "2px" }}>{c.email}</div>}
                  </td>
                  <td style={S.td}><span style={{ ...S.badge, ...(tierColors[c.tier] || tierColors.start) }}>{c.tier || "start"}</span></td>
                  <td style={S.td}>{c.monthsActive} mo</td>
                  <td style={S.td}>
                    <span style={{ ...S.badge, background: c.status === "active" ? "#EAF3DE" : "#F1EFE8", color: c.status === "active" ? "#3B6D11" : "#888" }}>
                      {c.status || "none"}
                    </span>
                  </td>
                  <td style={{ ...S.td, fontWeight: 600, color: c.balance > 0 ? "#D72C0D" : "#1A1B18" }}>{c.balance} pts</td>
                  <td style={S.td}><button style={S.editBtn} onClick={() => setEditCustomer(c)}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
