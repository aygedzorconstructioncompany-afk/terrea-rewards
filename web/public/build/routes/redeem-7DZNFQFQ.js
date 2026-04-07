import {
  Banner,
  BlockStack,
  Button,
  Card,
  InlineStack,
  Text,
  TextField
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

// app/routes/redeem.jsx
var import_react = __toESM(require_react(), 1);
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app\\\\routes\\\\redeem.jsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app\\routes\\redeem.jsx"
  );
  import.meta.hot.lastModified = "1774202031098.2024";
}
function Redeem() {
  _s();
  const [points, setPoints] = (0, import_react.useState)("");
  const [customerId, setCustomerId] = (0, import_react.useState)("");
  const [loading, setLoading] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)("");
  const [success, setSuccess] = (0, import_react.useState)("");
  async function handleRedeem() {
    setError("");
    setSuccess("");
    if (!points || !customerId) {
      setError("Fill all fields");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customerId,
          points: Number(points)
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.[0]?.message || "Something went wrong");
        return;
      }
      setSuccess(`Discount created: ${data.code}`);
      window.location.href = `/discount/${data.code}`;
    } catch (e) {
      console.error(e);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Card, { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(BlockStack, { gap: "400", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Text, { variant: "headingMd", children: "Redeem Points" }, void 0, false, {
      fileName: "app/routes/redeem.jsx",
      lineNumber: 69,
      columnNumber: 9
    }, this),
    error && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Banner, { status: "critical", children: error }, void 0, false, {
      fileName: "app/routes/redeem.jsx",
      lineNumber: 71,
      columnNumber: 19
    }, this),
    success && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Banner, { status: "success", children: success }, void 0, false, {
      fileName: "app/routes/redeem.jsx",
      lineNumber: 75,
      columnNumber: 21
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(TextField, { label: "Customer ID (gid://...)", value: customerId, onChange: setCustomerId, autoComplete: "off" }, void 0, false, {
      fileName: "app/routes/redeem.jsx",
      lineNumber: 79,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(TextField, { label: "Points", type: "number", value: points, onChange: setPoints, autoComplete: "off" }, void 0, false, {
      fileName: "app/routes/redeem.jsx",
      lineNumber: 81,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(InlineStack, { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Button, { variant: "primary", loading, onClick: handleRedeem, children: "Redeem" }, void 0, false, {
      fileName: "app/routes/redeem.jsx",
      lineNumber: 84,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "app/routes/redeem.jsx",
      lineNumber: 83,
      columnNumber: 9
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/redeem.jsx",
    lineNumber: 67,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "app/routes/redeem.jsx",
    lineNumber: 66,
    columnNumber: 10
  }, this);
}
_s(Redeem, "bfCIHgcX0mcngLwunptcr8M1fsE=");
_c = Redeem;
var _c;
$RefreshReg$(_c, "Redeem");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;
export {
  Redeem as default
};
//# sourceMappingURL=/build/routes/redeem-7DZNFQFQ.js.map
