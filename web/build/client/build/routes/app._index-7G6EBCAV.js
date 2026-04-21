import {
  Badge,
  BlockStack,
  Button,
  Card,
  Divider,
  InlineStack,
  Page,
  ProgressBar,
  Text
} from "/build/_shared/chunk-MXCNBY4K.js";
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
  __toESM
} from "/build/_shared/chunk-PNG5AS42.js";

// app/routes/app._index.jsx
var import_react = __toESM(require_react(), 1);
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app\\\\routes\\\\app._index.jsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app\\routes\\app._index.jsx"
  );
  import.meta.hot.lastModified = "1774209631360.1658";
}
function PremiumUI() {
  _s();
  const [loading, setLoading] = (0, import_react.useState)(false);
  const points = 1200;
  const nextTier = 2e3;
  const progress = points / nextTier * 100;
  async function redeem(pointsToUse) {
    setLoading(true);
    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customerId: "gid://shopify/Customer/123",
          points: pointsToUse
        })
      });
      const data = await res.json();
      if (data.code) {
        window.location.href = `/discount/${data.code}`;
      } else {
        alert("Redeem success (no redirect yet)");
      }
    } catch (e) {
      console.error(e);
      alert("Redeem failed");
    }
    setLoading(false);
  }
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Page, { fullWidth: true, children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { style: {
      background: "linear-gradient(135deg, #0f172a, #1e293b)",
      borderRadius: 20,
      padding: 30,
      color: "white",
      marginBottom: 20
    }, children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(BlockStack, { gap: "300", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Text, { variant: "headingLg", children: "Terrea Rewards" }, void 0, false, {
        fileName: "app/routes/app._index.jsx",
        lineNumber: 65,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(InlineStack, { align: "space-between", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(BlockStack, { children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Text, { variant: "heading2xl", children: [
            points,
            " pts"
          ] }, void 0, true, {
            fileName: "app/routes/app._index.jsx",
            lineNumber: 69,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Text, { tone: "subdued", children: "Available balance" }, void 0, false, {
            fileName: "app/routes/app._index.jsx",
            lineNumber: 70,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "app/routes/app._index.jsx",
          lineNumber: 68,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Badge, { tone: "success", children: "Gold Member" }, void 0, false, {
          fileName: "app/routes/app._index.jsx",
          lineNumber: 73,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/app._index.jsx",
        lineNumber: 67,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(BlockStack, { children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Text, { tone: "subdued", children: [
          "Progress to Platinum (",
          nextTier,
          " pts)"
        ] }, void 0, true, {
          fileName: "app/routes/app._index.jsx",
          lineNumber: 77,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ProgressBar, { progress, size: "small" }, void 0, false, {
          fileName: "app/routes/app._index.jsx",
          lineNumber: 80,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/app._index.jsx",
        lineNumber: 76,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/app._index.jsx",
      lineNumber: 64,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "app/routes/app._index.jsx",
      lineNumber: 57,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(BlockStack, { gap: "500", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Card, { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(BlockStack, { gap: "400", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Text, { variant: "headingMd", children: "Redeem Rewards" }, void 0, false, {
          fileName: "app/routes/app._index.jsx",
          lineNumber: 89,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(InlineStack, { gap: "300", children: [{
          pts: 100,
          value: "$1"
        }, {
          pts: 500,
          value: "$5"
        }, {
          pts: 1e3,
          value: "$10"
        }].map((r) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { style: {
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: 20,
          width: 180,
          textAlign: "center"
        }, children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(BlockStack, { gap: "200", children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Text, { variant: "headingMd", children: r.value }, void 0, false, {
            fileName: "app/routes/app._index.jsx",
            lineNumber: 109,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Text, { tone: "subdued", children: [
            r.pts,
            " pts"
          ] }, void 0, true, {
            fileName: "app/routes/app._index.jsx",
            lineNumber: 110,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Button, { variant: r.pts === 1e3 ? "primary" : "secondary", onClick: () => redeem(r.pts), loading, children: "Redeem" }, void 0, false, {
            fileName: "app/routes/app._index.jsx",
            lineNumber: 112,
            columnNumber: 21
          }, this)
        ] }, void 0, true, {
          fileName: "app/routes/app._index.jsx",
          lineNumber: 108,
          columnNumber: 19
        }, this) }, r.pts, false, {
          fileName: "app/routes/app._index.jsx",
          lineNumber: 101,
          columnNumber: 25
        }, this)) }, void 0, false, {
          fileName: "app/routes/app._index.jsx",
          lineNumber: 91,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/app._index.jsx",
        lineNumber: 88,
        columnNumber: 11
      }, this) }, void 0, false, {
        fileName: "app/routes/app._index.jsx",
        lineNumber: 87,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Card, { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(BlockStack, { gap: "300", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Text, { variant: "headingMd", children: "Membership Tiers" }, void 0, false, {
          fileName: "app/routes/app._index.jsx",
          lineNumber: 124,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(InlineStack, { gap: "200", children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Badge, { children: "Silver" }, void 0, false, {
            fileName: "app/routes/app._index.jsx",
            lineNumber: 127,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Badge, { tone: "success", children: "Gold" }, void 0, false, {
            fileName: "app/routes/app._index.jsx",
            lineNumber: 128,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Badge, { tone: "attention", children: "Platinum" }, void 0, false, {
            fileName: "app/routes/app._index.jsx",
            lineNumber: 129,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "app/routes/app._index.jsx",
          lineNumber: 126,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Text, { tone: "subdued", children: "Higher tiers unlock better rewards and cashback." }, void 0, false, {
          fileName: "app/routes/app._index.jsx",
          lineNumber: 132,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/app._index.jsx",
        lineNumber: 123,
        columnNumber: 11
      }, this) }, void 0, false, {
        fileName: "app/routes/app._index.jsx",
        lineNumber: 122,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Card, { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(BlockStack, { gap: "200", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Text, { variant: "headingMd", children: "Recent Activity" }, void 0, false, {
          fileName: "app/routes/app._index.jsx",
          lineNumber: 141,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Divider, {}, void 0, false, {
          fileName: "app/routes/app._index.jsx",
          lineNumber: 142,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(InlineStack, { align: "space-between", children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Text, { children: "+200 pts \u2014 Order #1234" }, void 0, false, {
            fileName: "app/routes/app._index.jsx",
            lineNumber: 145,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Text, { tone: "subdued", children: "Today" }, void 0, false, {
            fileName: "app/routes/app._index.jsx",
            lineNumber: 146,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "app/routes/app._index.jsx",
          lineNumber: 144,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(InlineStack, { align: "space-between", children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Text, { children: "-100 pts \u2014 Redeemed" }, void 0, false, {
            fileName: "app/routes/app._index.jsx",
            lineNumber: 150,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Text, { tone: "subdued", children: "Yesterday" }, void 0, false, {
            fileName: "app/routes/app._index.jsx",
            lineNumber: 151,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "app/routes/app._index.jsx",
          lineNumber: 149,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(InlineStack, { align: "space-between", children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Text, { children: "+500 pts \u2014 Subscription" }, void 0, false, {
            fileName: "app/routes/app._index.jsx",
            lineNumber: 155,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Text, { tone: "subdued", children: "2 days ago" }, void 0, false, {
            fileName: "app/routes/app._index.jsx",
            lineNumber: 156,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "app/routes/app._index.jsx",
          lineNumber: 154,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/app._index.jsx",
        lineNumber: 140,
        columnNumber: 11
      }, this) }, void 0, false, {
        fileName: "app/routes/app._index.jsx",
        lineNumber: 139,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/app._index.jsx",
      lineNumber: 85,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/app._index.jsx",
    lineNumber: 55,
    columnNumber: 10
  }, this);
}
_s(PremiumUI, "/Rjh5rPqCCqf0XYnTUk9ZNavw3Q=");
_c = PremiumUI;
var _c;
$RefreshReg$(_c, "PremiumUI");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;
export {
  PremiumUI as default
};
//# sourceMappingURL=/build/routes/app._index-7G6EBCAV.js.map
