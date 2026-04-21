import { useState, useEffect, useCallback } from "react";
import { Page, Card, Text, Button, BlockStack, InlineStack, TextField, Badge, Banner } from "@shopify/polaris";

export function clientLoader() { return null; }
export function HydrateFallback() { return null; }

const API = "";
const SECRET = "terrea-admin-2024";
const SHOP = "terrea-home-rituals.myshopify.com";

export default function AdminPage() {
  const [customers, setCustomers] = useState([]);
  const [rates, setRates] = useState({ start: 10, stay: 15, belong: 20, "belong+": 20 });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [editCustomer, setEditCustomer] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [search, setSearch] = useState("");

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

  useEffect(() => {
    loadCustomers();
    loadRates();
  }, []);

  const saveRates = async () => {
    try {
      const res = await fetch("/api/admin/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: SECRET, rates }),
      });
      const data = await res.json();
      if (data.success) setMsg("✅ Rates saved!");
      else setMsg("❌ Error: " + data.error);
    } catch (e) { setMsg("❌ Error"); }
    setTimeout(() => setMsg(""), 3000);
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
          description: adjustNote || `Admin adjustment`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg(`✅ Balance updated! New balance: ${data.newBalance} pts`);
        setEditCustomer(null);
        setAdjustAmount("");
        setAdjustNote("");
        loadCustomers();
      } else setMsg("❌ Error: " + data.error);
    } catch (e) { setMsg("❌ Error"); }
    setTimeout(() => setMsg(""), 4000);
  };

  const tierColor = (tier) => {
    if (tier === "belong+") return "warning";
    if (tier === "belong") return "success";
    if (tier === "stay") return "info";
    return "new";
  };

  const filtered = customers.filter(c =>
    c.customerId.includes(search) || c.tier.includes(search.toLowerCase())
  );

  return (
    <Page title="Terrea Rewards — Admin">
      <BlockStack gap="400">

        {msg && <Banner tone={msg.includes("✅") ? "success" : "critical"}><Text>{msg}</Text></Banner>}

        <Card>
          <BlockStack gap="300">
            <Text variant="headingMd">Overview</Text>
            <InlineStack gap="400">
              <BlockStack>
                <Text variant="headingSm">{customers.length}</Text>
                <Text tone="subdued">Total customers</Text>
              </BlockStack>
              <BlockStack>
                <Text variant="headingSm">{customers.reduce((s, c) => s + c.balance, 0)} pts</Text>
                <Text tone="subdued">Total balance</Text>
              </BlockStack>
              <BlockStack>
                <Text variant="headingSm">{customers.filter(c => c.status === "active").length}</Text>
                <Text tone="subdued">Active subscriptions</Text>
              </BlockStack>
            </InlineStack>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text variant="headingMd">Cashback rates</Text>
            <InlineStack gap="300">
              {Object.entries(rates).map(([tier, rate]) => (
                <BlockStack key={tier} gap="100">
                  <Text tone="subdued">{tier} tier</Text>
                  <TextField
                    label=""
                    type="number"
                    value={String(rate)}
                    onChange={(v) => setRates(r => ({ ...r, [tier]: parseInt(v) || 0 }))}
                    suffix="%"
                    autoComplete="off"
                  />
                </BlockStack>
              ))}
            </InlineStack>
            <Button variant="primary" onClick={saveRates}>Save rates</Button>
          </BlockStack>
        </Card>

        {editCustomer && (
          <Card>
            <BlockStack gap="300">
              <Text variant="headingMd">Adjust balance — {editCustomer.customerId}</Text>
              <Text tone="subdued">Current balance: {editCustomer.balance} pts</Text>
              <TextField
                label="Amount (positive to add, negative to subtract)"
                type="number"
                value={adjustAmount}
                onChange={setAdjustAmount}
                placeholder="e.g. 100 or -50"
                autoComplete="off"
              />
              <TextField
                label="Note (optional)"
                value={adjustNote}
                onChange={setAdjustNote}
                placeholder="Reason for adjustment"
                autoComplete="off"
              />
              <InlineStack gap="200">
                <Button variant="primary" onClick={adjustBalance}>Apply</Button>
                <Button onClick={() => { setEditCustomer(null); setAdjustAmount(""); }}>Cancel</Button>
              </InlineStack>
            </BlockStack>
          </Card>
        )}

        <Card>
          <BlockStack gap="300">
            <Text variant="headingMd">Customer balances</Text>
            <TextField
              label=""
              placeholder="Search by customer ID or tier..."
              value={search}
              onChange={setSearch}
              autoComplete="off"
            />
            {loading ? <Text>Loading...</Text> : (
              <BlockStack gap="200">
                {filtered.map(c => (
                  <InlineStack key={c.customerId} align="space-between">
                    <BlockStack gap="100">
                      <Text variant="bodySm">{c.customerId}</Text>
                      <InlineStack gap="100">
                        <Badge tone={tierColor(c.tier)}>{c.tier}</Badge>
                        <Text tone="subdued">{c.monthsActive} mo</Text>
                      </InlineStack>
                    </BlockStack>
                    <InlineStack gap="200" align="center">
                      <Text variant="headingSm">{c.balance} pts</Text>
                      <Button size="slim" onClick={() => setEditCustomer(c)}>Edit</Button>
                    </InlineStack>
                  </InlineStack>
                ))}
                {filtered.length === 0 && <Text tone="subdued">No customers found</Text>}
              </BlockStack>
            )}
          </BlockStack>
        </Card>

      </BlockStack>
    </Page>
  );
}
