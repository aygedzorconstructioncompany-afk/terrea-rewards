import {
  require_jsx_dev_runtime
} from "/build/_shared/chunk-XGOTYLZ5.js";
import {
  require_react
} from "/build/_shared/chunk-7M6SC7J5.js";
import {
  createHotContext
} from "/build/_shared/chunk-YFGTCILZ.js";
import "/build/_shared/chunk-UWV35TSL.js";
import {
  __toESM
} from "/build/_shared/chunk-PNG5AS42.js";

// app/routes/apps.rewards.tsx
var import_react = __toESM(require_react(), 1);
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app\\\\routes\\\\apps.rewards.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app\\routes\\apps.rewards.tsx"
  );
  import.meta.hot.lastModified = "1774644346372.5212";
}
function RewardsPage() {
  _s();
  const [wallet, setWallet] = (0, import_react.useState)(null);
  const [loading, setLoading] = (0, import_react.useState)(true);
  const loadWallet = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const customerId = params.get("customerId") || "demo-user";
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
  (0, import_react.useEffect)(() => {
    loadWallet();
  }, []);
  if (loading) {
    return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { style: {
      padding: 20
    }, children: "Loading..." }, void 0, false, {
      fileName: "app/routes/apps.rewards.tsx",
      lineNumber: 48,
      columnNumber: 12
    }, this);
  }
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { style: {
    padding: 20
  }, children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h1", { children: "Rewards" }, void 0, false, {
      fileName: "app/routes/apps.rewards.tsx",
      lineNumber: 55,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { children: [
      "Balance: ",
      wallet?.points || 0,
      " pts"
    ] }, void 0, true, {
      fileName: "app/routes/apps.rewards.tsx",
      lineNumber: 57,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { children: [
      "Total spent: $",
      wallet?.totalSpent || 0
    ] }, void 0, true, {
      fileName: "app/routes/apps.rewards.tsx",
      lineNumber: 58,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", { onClick: async () => {
      if (!wallet || wallet.points < 100) {
        alert("Not enough points");
        return;
      }
      try {
        await fetch("/api/redeem", {
          method: "POST"
        });
        await loadWallet();
      } catch (err) {
        console.error("Redeem error:", err);
      }
    }, children: "Redeem 100 pts" }, void 0, false, {
      fileName: "app/routes/apps.rewards.tsx",
      lineNumber: 60,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/apps.rewards.tsx",
    lineNumber: 52,
    columnNumber: 10
  }, this);
}
_s(RewardsPage, "902r1Q/Im/pvpXXWzZijBgBiO7g=");
_c = RewardsPage;
var _c;
$RefreshReg$(_c, "RewardsPage");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;
export {
  RewardsPage as default
};
//# sourceMappingURL=/build/routes/apps.rewards-BM325WSY.js.map
