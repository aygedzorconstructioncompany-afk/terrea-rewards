import {
  Banner,
  BlockStack,
  Button,
  Card,
  InlineStack,
  Page,
  Text
} from "/build/_shared/chunk-MXCNBY4K.js";
import {
  useLoaderData
} from "/build/_shared/chunk-BXLZ67WE.js";
import "/build/_shared/chunk-U4FRFQSK.js";
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
  __commonJS,
  __toESM
} from "/build/_shared/chunk-PNG5AS42.js";

// empty-module:@remix-run/node
var require_node = __commonJS({
  "empty-module:@remix-run/node"(exports, module) {
    module.exports = {};
  }
});

// empty-module:../db.server
var require_db = __commonJS({
  "empty-module:../db.server"(exports, module) {
    module.exports = {};
  }
});

// app/routes/app.rewards.jsx
var import_node = __toESM(require_node(), 1);
var import_db = __toESM(require_db(), 1);
var import_react2 = __toESM(require_react(), 1);
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app\\\\routes\\\\app.rewards.jsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app\\routes\\app.rewards.jsx"
  );
  import.meta.hot.lastModified = "1774379034690.0742";
}
function RewardsPage() {
  _s();
  const {
    balance,
    transactions
  } = useLoaderData();
  const [loading, setLoading] = (0, import_react2.useState)(false);
  const [code, setCode] = (0, import_react2.useState)(null);
  const [currentBalance, setCurrentBalance] = (0, import_react2.useState)(balance);
  const handleRedeem = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customerId: "1",
          points: 500
        })
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
        setLoading(false);
        return;
      }
      setCode(data.code);
      setCurrentBalance((prev) => prev - 500);
    } catch (e) {
      console.error(e);
      alert("Error");
    }
    setLoading(false);
  };
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Page, { title: "Terrea Rewards", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(BlockStack, { gap: "400", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Card, { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(BlockStack, { gap: "200", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Text, { variant: "headingMd", children: "Your Balance" }, void 0, false, {
        fileName: "app/routes/app.rewards.jsx",
        lineNumber: 93,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Text, { variant: "heading2xl", children: [
        currentBalance,
        " pts"
      ] }, void 0, true, {
        fileName: "app/routes/app.rewards.jsx",
        lineNumber: 94,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/app.rewards.jsx",
      lineNumber: 92,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "app/routes/app.rewards.jsx",
      lineNumber: 91,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Card, { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(BlockStack, { gap: "300", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Text, { variant: "headingMd", children: "Redeem Rewards" }, void 0, false, {
        fileName: "app/routes/app.rewards.jsx",
        lineNumber: 100,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Button, { variant: "primary", size: "large", loading, onClick: handleRedeem, disabled: currentBalance < 500, children: "Redeem 500 pts \u2192 Get Discount" }, void 0, false, {
        fileName: "app/routes/app.rewards.jsx",
        lineNumber: 102,
        columnNumber: 13
      }, this),
      currentBalance < 500 && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Text, { tone: "critical", children: "Not enough points" }, void 0, false, {
        fileName: "app/routes/app.rewards.jsx",
        lineNumber: 106,
        columnNumber: 38
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/app.rewards.jsx",
      lineNumber: 99,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "app/routes/app.rewards.jsx",
      lineNumber: 98,
      columnNumber: 9
    }, this),
    code && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Banner, { tone: "success", title: "\u{1F389} Reward Ready!", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(BlockStack, { gap: "200", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Text, { children: "Your discount code:" }, void 0, false, {
        fileName: "app/routes/app.rewards.jsx",
        lineNumber: 113,
        columnNumber: 15
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(InlineStack, { gap: "200", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Text, { variant: "headingLg", children: code }, void 0, false, {
          fileName: "app/routes/app.rewards.jsx",
          lineNumber: 116,
          columnNumber: 17
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Button, { onClick: () => navigator.clipboard.writeText(code), children: "Copy" }, void 0, false, {
          fileName: "app/routes/app.rewards.jsx",
          lineNumber: 118,
          columnNumber: 17
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/app.rewards.jsx",
        lineNumber: 115,
        columnNumber: 15
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Button, { variant: "primary", onClick: () => window.top.location.href = "https://terrea-dev-store.myshopify.com/discount/" + code, children: "Apply & Checkout" }, void 0, false, {
        fileName: "app/routes/app.rewards.jsx",
        lineNumber: 123,
        columnNumber: 15
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/app.rewards.jsx",
      lineNumber: 111,
      columnNumber: 13
    }, this) }, void 0, false, {
      fileName: "app/routes/app.rewards.jsx",
      lineNumber: 110,
      columnNumber: 18
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Card, { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(BlockStack, { gap: "200", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Text, { variant: "headingMd", children: "Activity" }, void 0, false, {
        fileName: "app/routes/app.rewards.jsx",
        lineNumber: 132,
        columnNumber: 13
      }, this),
      transactions.map((t) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(InlineStack, { gap: "200", align: "space-between", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Text, { children: t.type }, void 0, false, {
          fileName: "app/routes/app.rewards.jsx",
          lineNumber: 135,
          columnNumber: 17
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Text, { children: [
          t.amount,
          " pts"
        ] }, void 0, true, {
          fileName: "app/routes/app.rewards.jsx",
          lineNumber: 136,
          columnNumber: 17
        }, this)
      ] }, t.id, true, {
        fileName: "app/routes/app.rewards.jsx",
        lineNumber: 134,
        columnNumber: 36
      }, this))
    ] }, void 0, true, {
      fileName: "app/routes/app.rewards.jsx",
      lineNumber: 131,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "app/routes/app.rewards.jsx",
      lineNumber: 130,
      columnNumber: 9
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/app.rewards.jsx",
    lineNumber: 89,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "app/routes/app.rewards.jsx",
    lineNumber: 88,
    columnNumber: 10
  }, this);
}
_s(RewardsPage, "UbWjnvlhRv9eR2FIxMPItK5pmzU=", false, function() {
  return [useLoaderData];
});
_c = RewardsPage;
var _c;
$RefreshReg$(_c, "RewardsPage");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;
export {
  RewardsPage as default
};
//# sourceMappingURL=/build/routes/app.rewards-DRYNB32R.js.map
