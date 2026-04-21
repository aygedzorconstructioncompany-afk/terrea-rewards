import {
  createHotContext
} from "/build/_shared/chunk-YFGTCILZ.js";
import "/build/_shared/chunk-UWV35TSL.js";
import {
  __commonJS,
  __toESM
} from "/build/_shared/chunk-PNG5AS42.js";

// empty-module:../shopify.server
var require_shopify = __commonJS({
  "empty-module:../shopify.server"(exports, module) {
    module.exports = {};
  }
});

// app/routes/auth.$.jsx
var import_shopify = __toESM(require_shopify(), 1);
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app\\\\routes\\\\auth.$.jsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app\\routes\\auth.$.jsx"
  );
  import.meta.hot.lastModified = "1774368914710.8662";
}
function Page() {
  return null;
}
_c = Page;
var _c;
$RefreshReg$(_c, "Page");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;
export {
  Page as default
};
//# sourceMappingURL=/build/routes/auth.$-3XMYYTHD.js.map
