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

// app/routes/redeem-test.jsx
var import_react = __toESM(require_react(), 1);
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app\\\\routes\\\\redeem-test.jsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app\\routes\\redeem-test.jsx"
  );
  import.meta.hot.lastModified = "1774101922679.935";
}
function Index() {
  _s();
  const [code, setCode] = (0, import_react.useState)("");
  const [loading, setLoading] = (0, import_react.useState)(false);
  async function redeem() {
    try {
      console.log("CLICK \u{1F525}");
      setLoading(true);
      const formData = new FormData();
      formData.append("customerId", "123");
      formData.append("points", "500");
      console.log("BEFORE FETCH");
      const res = await fetch("https://stayed-mile-loans-centuries.trycloudflare.com/api/redeem", {
        method: "POST",
        body: formData
      });
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
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { style: {
    padding: 40
  }, children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h1", { children: "\u{1F525} Terrea Demo" }, void 0, false, {
      fileName: "app/routes/redeem-test.jsx",
      lineNumber: 60,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", { onClick: redeem, disabled: loading, style: {
      padding: "12px 20px",
      fontSize: "16px",
      cursor: "pointer"
    }, children: loading ? "Processing..." : "Redeem" }, void 0, false, {
      fileName: "app/routes/redeem-test.jsx",
      lineNumber: 62,
      columnNumber: 7
    }, this),
    code && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { style: {
      marginTop: 20
    }, children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h2", { children: code }, void 0, false, {
        fileName: "app/routes/redeem-test.jsx",
        lineNumber: 73,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("a", { href: `https://terrea-dev-store.myshopify.com/discount/${code}`, style: {
        display: "inline-block",
        marginTop: "10px"
      }, children: "\u{1F449} Go to checkout" }, void 0, false, {
        fileName: "app/routes/redeem-test.jsx",
        lineNumber: 75,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/redeem-test.jsx",
      lineNumber: 70,
      columnNumber: 16
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/redeem-test.jsx",
    lineNumber: 57,
    columnNumber: 10
  }, this);
}
_s(Index, "0fPBrTyXauRfy8TC/OQuTFeDuyE=");
_c = Index;
var _c;
$RefreshReg$(_c, "Index");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;
export {
  Index as default
};
//# sourceMappingURL=/build/routes/redeem-test-43PVWMMV.js.map
