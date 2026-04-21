import "/build/_shared/chunk-2YAGQO5N.js";
import {
  AppProvider
} from "/build/_shared/chunk-MXCNBY4K.js";
import {
  Outlet
} from "/build/_shared/chunk-BXLZ67WE.js";
import "/build/_shared/chunk-U4FRFQSK.js";
import {
  require_jsx_dev_runtime
} from "/build/_shared/chunk-XGOTYLZ5.js";
import "/build/_shared/chunk-7M6SC7J5.js";
import {
  createHotContext
} from "/build/_shared/chunk-YFGTCILZ.js";
import "/build/_shared/chunk-UWV35TSL.js";
import {
  __toESM
} from "/build/_shared/chunk-PNG5AS42.js";

// node_modules/@shopify/app-bridge-react/build/esm/components/NavMenu.js
var NavMenu = "ui-nav-menu";

// app/routes/app.jsx
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app\\\\routes\\\\app.jsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app\\routes\\app.jsx"
  );
}
function App() {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AppProvider, { children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(NavMenu, { children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("a", { href: "/app", children: "Dashboard" }, void 0, false, {
        fileName: "app/routes/app.jsx",
        lineNumber: 28,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("a", { href: "/app/rewards", children: "Rewards" }, void 0, false, {
        fileName: "app/routes/app.jsx",
        lineNumber: 29,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/app.jsx",
      lineNumber: 27,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Outlet, {}, void 0, false, {
      fileName: "app/routes/app.jsx",
      lineNumber: 33,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/app.jsx",
    lineNumber: 25,
    columnNumber: 10
  }, this);
}
_c = App;
var _c;
$RefreshReg$(_c, "App");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;
export {
  App as default
};
//# sourceMappingURL=/build/routes/app-NSODYKLW.js.map
