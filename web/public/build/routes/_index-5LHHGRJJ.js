import {
  AppProvider
} from "/build/_shared/chunk-MXCNBY4K.js";
import {
  Form,
  useActionData,
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

// empty-module:../../shopify.server
var require_shopify = __commonJS({
  "empty-module:../../shopify.server"(exports, module) {
    module.exports = {};
  }
});

// app/routes/_index/route.jsx
var import_react = __toESM(require_react(), 1);
var import_shopify = __toESM(require_shopify(), 1);
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app\\\\routes\\\\_index\\\\route.jsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app\\routes\\_index\\route.jsx"
  );
  import.meta.hot.lastModified = "1774371758522.5";
}
function Auth() {
  _s();
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const [shop, setShop] = (0, import_react.useState)("");
  const {
    errors
  } = actionData || loaderData;
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AppProvider, { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { style: {
    padding: 20
  }, children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Form, { method: "post", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h2", { children: "Log in" }, void 0, false, {
      fileName: "app/routes/_index/route.jsx",
      lineNumber: 55,
      columnNumber: 11
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("input", { name: "shop", placeholder: "example.myshopify.com", value: shop, onChange: (e) => setShop(e.target.value), style: {
      padding: 8,
      width: 300
    } }, void 0, false, {
      fileName: "app/routes/_index/route.jsx",
      lineNumber: 57,
      columnNumber: 11
    }, this),
    errors?.shop && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { style: {
      color: "red"
    }, children: errors.shop }, void 0, false, {
      fileName: "app/routes/_index/route.jsx",
      lineNumber: 62,
      columnNumber: 28
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("br", {}, void 0, false, {
      fileName: "app/routes/_index/route.jsx",
      lineNumber: 66,
      columnNumber: 11
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("br", {}, void 0, false, {
      fileName: "app/routes/_index/route.jsx",
      lineNumber: 66,
      columnNumber: 17
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", { type: "submit", children: "Log in" }, void 0, false, {
      fileName: "app/routes/_index/route.jsx",
      lineNumber: 68,
      columnNumber: 11
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/_index/route.jsx",
    lineNumber: 54,
    columnNumber: 9
  }, this) }, void 0, false, {
    fileName: "app/routes/_index/route.jsx",
    lineNumber: 51,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "app/routes/_index/route.jsx",
    lineNumber: 50,
    columnNumber: 10
  }, this);
}
_s(Auth, "Hygkc0EhEXxwK+5D3KbBFFhIADs=", false, function() {
  return [useLoaderData, useActionData];
});
_c = Auth;
var _c;
$RefreshReg$(_c, "Auth");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;
export {
  Auth as default
};
//# sourceMappingURL=/build/routes/_index-5LHHGRJJ.js.map
