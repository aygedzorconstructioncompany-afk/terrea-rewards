var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: !0 });
};

// app/entry.server.jsx
var entry_server_exports = {};
__export(entry_server_exports, {
  default: () => handleRequest,
  streamTimeout: () => streamTimeout
});
import { PassThrough } from "stream";
import { renderToPipeableStream } from "react-dom/server";
import { RemixServer } from "@remix-run/react";
import { createReadableStreamFromReadable } from "@remix-run/node";
import { isbot } from "isbot";

// app/shopify.server.ts
var authenticate = {
  admin: async () => ({
    session: {
      shop: "terrea-dev-store.myshopify.com",
      accessToken: "demo"
    },
    admin: {
      graphql: async () => ({}),
      rest: {}
    }
  })
};
var login = async () => ({}), registerWebhooks = async () => ({}), addDocumentResponseHeaders = () => ({});

// app/entry.server.jsx
import { jsxDEV } from "react/jsx-dev-runtime";
var streamTimeout = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, remixContext) {
  addDocumentResponseHeaders(request, responseHeaders);
  let userAgent = request.headers.get("user-agent"), callbackName = isbot(userAgent ?? "") ? "onAllReady" : "onShellReady";
  return new Promise((resolve, reject) => {
    let { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsxDEV(RemixServer, { context: remixContext, url: request.url }, void 0, !1, {
        fileName: "app/entry.server.jsx",
        lineNumber: 25,
        columnNumber: 7
      }, this),
      {
        [callbackName]: () => {
          let body = new PassThrough(), stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html"), resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          ), pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500, console.error(error);
        }
      }
    );
    setTimeout(abort, streamTimeout + 1e3);
  });
}

// app/root.jsx
var root_exports = {};
__export(root_exports, {
  default: () => App
});
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react";
import { AppProvider } from "@shopify/polaris";
import { jsxDEV as jsxDEV2 } from "react/jsx-dev-runtime";
function App() {
  return /* @__PURE__ */ jsxDEV2("html", { children: [
    /* @__PURE__ */ jsxDEV2("head", { children: [
      /* @__PURE__ */ jsxDEV2(Meta, {}, void 0, !1, {
        fileName: "app/root.jsx",
        lineNumber: 9,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV2(Links, {}, void 0, !1, {
        fileName: "app/root.jsx",
        lineNumber: 10,
        columnNumber: 9
      }, this)
    ] }, void 0, !0, {
      fileName: "app/root.jsx",
      lineNumber: 8,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV2("body", { children: [
      /* @__PURE__ */ jsxDEV2(AppProvider, { i18n: {}, children: /* @__PURE__ */ jsxDEV2(Outlet, {}, void 0, !1, {
        fileName: "app/root.jsx",
        lineNumber: 14,
        columnNumber: 11
      }, this) }, void 0, !1, {
        fileName: "app/root.jsx",
        lineNumber: 13,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV2(ScrollRestoration, {}, void 0, !1, {
        fileName: "app/root.jsx",
        lineNumber: 17,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV2(Scripts, {}, void 0, !1, {
        fileName: "app/root.jsx",
        lineNumber: 18,
        columnNumber: 9
      }, this)
    ] }, void 0, !0, {
      fileName: "app/root.jsx",
      lineNumber: 12,
      columnNumber: 7
    }, this)
  ] }, void 0, !0, {
    fileName: "app/root.jsx",
    lineNumber: 7,
    columnNumber: 5
  }, this);
}

// app/routes/api.webhooks.orders.create.jsx
var api_webhooks_orders_create_exports = {};
__export(api_webhooks_orders_create_exports, {
  action: () => action
});

// app/db.server.ts
import { PrismaClient } from "@prisma/client";
var globalForPrisma = global, prisma = globalForPrisma.prisma || new PrismaClient({
  log: ["query"]
});
globalForPrisma.prisma = prisma;
var db_server_default = prisma;

// app/routes/api.webhooks.orders.create.jsx
function getTier(totalSpent) {
  return totalSpent >= 1e3 ? { name: "Gold", cashback: 0.2 } : totalSpent >= 500 ? { name: "Silver", cashback: 0.15 } : { name: "Basic", cashback: 0.1 };
}
var action = async ({ request }) => {
  try {
    if (request.method !== "POST")
      return new Response("Method not allowed", { status: 405 });
    let body = await request.json(), shop = "terrea-dev-store.myshopify.com", customerId = body.customer?.id?.toString(), orderId = String(body.id), totalPrice = parseFloat(body.total_price || "0");
    if (!customerId)
      return new Response("OK");
    if (await db_server_default.pointsTransaction.findFirst({
      where: { orderId }
    }))
      return new Response("Already processed");
    let wallet = await db_server_default.wallet.findFirst({
      where: { customerId, shop }
    });
    wallet || (wallet = await db_server_default.wallet.create({
      data: {
        shop,
        customerId,
        balance: 0,
        totalSpent: 0,
        tier: "Basic"
      }
    }));
    let newTotalSpent = wallet.totalSpent + totalPrice, tier = getTier(newTotalSpent), points = Math.floor(totalPrice * tier.cashback);
    return await db_server_default.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: { increment: points },
        totalSpent: newTotalSpent,
        tier: tier.name
      }
    }), await db_server_default.pointsTransaction.create({
      data: {
        walletId: wallet.id,
        shop,
        customerId,
        orderId,
        type: "EARN",
        amount: points,
        description: `Cashback ${tier.cashback * 100}%`
      }
    }), new Response(JSON.stringify({ success: !0 }));
  } catch (error) {
    return console.error("WEBHOOK ERROR:", error), new Response("Error", { status: 500 });
  }
};

// app/routes/api.webhooks.orders-paid.jsx
var api_webhooks_orders_paid_exports = {};
__export(api_webhooks_orders_paid_exports, {
  action: () => action2
});
var action2 = async ({ request }) => {
  try {
    let order = await request.json(), customerId = order.customer?.id?.toString(), shop = request.headers.get("x-shopify-shop-domain");
    if (!customerId)
      return new Response(JSON.stringify({ ok: !0 }), {
        headers: { "Content-Type": "application/json" }
      });
    let match = (order.note || "").match(/USED_POINTS:(\d+)/);
    if (!match)
      return new Response(JSON.stringify({ ok: !0 }), {
        headers: { "Content-Type": "application/json" }
      });
    let usedPoints = parseInt(match[1], 10);
    if (!usedPoints || usedPoints <= 0)
      return new Response(JSON.stringify({ ok: !0 }), {
        headers: { "Content-Type": "application/json" }
      });
    let wallet = await db_server_default.wallet.findFirst({
      where: {
        customerId,
        shop
      }
    });
    return wallet ? (await db_server_default.$transaction([
      db_server_default.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            decrement: usedPoints
          }
        }
      }),
      db_server_default.pointsTransaction.create({
        data: {
          walletId: wallet.id,
          shop,
          customerId,
          orderId: order.id.toString(),
          type: "SPEND",
          amount: -usedPoints,
          description: "Redeemed points"
        }
      })
    ]), new Response(JSON.stringify({ ok: !0 }), {
      headers: { "Content-Type": "application/json" }
    })) : new Response(JSON.stringify({ error: "Wallet not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return console.error(err), new Response(JSON.stringify({ error: "Webhook error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

// app/routes/webhooks.orders.create.ts
var webhooks_orders_create_exports = {};
__export(webhooks_orders_create_exports, {
  action: () => action3
});
var action3 = async ({ request }) => {
  try {
    if (request.method !== "POST")
      return new Response("Method not allowed", { status: 405 });
    let body = await request.json(), shop = "terrea-dev-store.myshopify.com", customerId = body.customer?.id?.toString(), orderId = String(body.id), totalPrice = parseFloat(body.total_price || "0");
    if (!customerId)
      return new Response("OK");
    let points = Math.floor(totalPrice * 0.1);
    if (await db_server_default.pointsTransaction.findFirst({
      where: {
        orderId,
        type: "earn"
      }
    }))
      return console.log("\u26A0\uFE0F Already processed order:", orderId), new Response("Already processed");
    let wallet = await db_server_default.wallet.findFirst({
      where: {
        customerId,
        shop
      }
    });
    return wallet || (wallet = await db_server_default.wallet.create({
      data: {
        shop,
        customerId,
        balance: 0,
        totalSpent: 0
      }
    })), await db_server_default.$transaction([
      db_server_default.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            increment: points
            // ✅ правильно
          },
          totalSpent: {
            increment: totalPrice
          }
        }
      }),
      db_server_default.pointsTransaction.create({
        data: {
          walletId: wallet.id,
          shop,
          customerId,
          orderId,
          type: "earn",
          amount: points,
          // ✅ ВАЖНО (не points!)
          description: "Order reward"
        }
      })
    ]), console.log(`\u2705 Points added: +${points} (order ${orderId})`), new Response(JSON.stringify({ success: !0 }), {
      status: 200
    });
  } catch (error) {
    return console.error("\u274C WEBHOOK ERROR:", error), new Response("Error", { status: 500 });
  }
};

// app/routes/api.proxy.wallet.ts
var api_proxy_wallet_exports = {};
__export(api_proxy_wallet_exports, {
  action: () => action4
});
import { json } from "@remix-run/node";
var action4 = async ({ request }) => {
  try {
    let { customerId } = await request.json();
    if (!customerId)
      return json({ error: "No customerId" }, { status: 400 });
    let wallet = await db_server_default.wallet.findFirst({
      where: { customerId }
    });
    wallet || (wallet = await db_server_default.wallet.create({
      data: {
        customerId,
        balance: 0,
        tier: "Bronze"
      }
    }));
    let history = await db_server_default.pointsTransaction.findMany({
      where: {
        walletId: wallet.id
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 10
    });
    return json({
      balance: wallet.balance,
      history
    });
  } catch (e) {
    return console.error(e), json({ error: "Server error" }, { status: 500 });
  }
};

// app/routes/api.wallet.add.ts
var api_wallet_add_exports = {};
__export(api_wallet_add_exports, {
  loader: () => loader
});
import { json as json2 } from "@remix-run/node";
var SHOP = "terrea-dev-store.myshopify.com";
async function loader({ request }) {
  let url = new URL(request.url), customerId = url.searchParams.get("customerId"), amount = Number(url.searchParams.get("amount"));
  if (!customerId || !amount)
    return json2(
      { error: "Missing data" },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );
  let wallet = await db_server_default.wallet.upsert({
    where: {
      shop_customer: {
        shop: SHOP,
        customerId: String(customerId)
      }
    },
    update: {
      balance: { increment: amount }
    },
    create: {
      shop: SHOP,
      customerId: String(customerId),
      balance: amount
    }
  });
  return json2(
    { success: !0, balance: wallet.balance },
    {
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    }
  );
}

// app/routes/app.additional.jsx
var app_additional_exports = {};
__export(app_additional_exports, {
  default: () => AdditionalPage
});
import { jsxDEV as jsxDEV3 } from "react/jsx-dev-runtime";
function AdditionalPage() {
  return /* @__PURE__ */ jsxDEV3("s-page", { heading: "Additional page", children: [
    /* @__PURE__ */ jsxDEV3("s-section", { heading: "Multiple pages", children: [
      /* @__PURE__ */ jsxDEV3("s-paragraph", { children: [
        "The app template comes with an additional page which demonstrates how to create multiple pages within app navigation using",
        " ",
        /* @__PURE__ */ jsxDEV3(
          "s-link",
          {
            href: "https://shopify.dev/docs/apps/tools/app-bridge",
            target: "_blank",
            children: "App Bridge"
          },
          void 0,
          !1,
          {
            fileName: "app/routes/app.additional.jsx",
            lineNumber: 8,
            columnNumber: 11
          },
          this
        ),
        "."
      ] }, void 0, !0, {
        fileName: "app/routes/app.additional.jsx",
        lineNumber: 5,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV3("s-paragraph", { children: [
        "To create your own page and have it show up in the app navigation, add a page inside ",
        /* @__PURE__ */ jsxDEV3("code", { children: "app/routes" }, void 0, !1, {
          fileName: "app/routes/app.additional.jsx",
          lineNumber: 18,
          columnNumber: 25
        }, this),
        ", and a link to it in the",
        " ",
        /* @__PURE__ */ jsxDEV3("code", { children: "<ui-nav-menu>" }, void 0, !1, {
          fileName: "app/routes/app.additional.jsx",
          lineNumber: 19,
          columnNumber: 11
        }, this),
        " component found in",
        " ",
        /* @__PURE__ */ jsxDEV3("code", { children: "app/routes/app.jsx" }, void 0, !1, {
          fileName: "app/routes/app.additional.jsx",
          lineNumber: 20,
          columnNumber: 11
        }, this),
        "."
      ] }, void 0, !0, {
        fileName: "app/routes/app.additional.jsx",
        lineNumber: 16,
        columnNumber: 9
      }, this)
    ] }, void 0, !0, {
      fileName: "app/routes/app.additional.jsx",
      lineNumber: 4,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV3("s-section", { slot: "aside", heading: "Resources", children: /* @__PURE__ */ jsxDEV3("s-unordered-list", { children: /* @__PURE__ */ jsxDEV3("s-list-item", { children: /* @__PURE__ */ jsxDEV3(
      "s-link",
      {
        href: "https://shopify.dev/docs/apps/design-guidelines/navigation#app-nav",
        target: "_blank",
        children: "App nav best practices"
      },
      void 0,
      !1,
      {
        fileName: "app/routes/app.additional.jsx",
        lineNumber: 26,
        columnNumber: 13
      },
      this
    ) }, void 0, !1, {
      fileName: "app/routes/app.additional.jsx",
      lineNumber: 25,
      columnNumber: 11
    }, this) }, void 0, !1, {
      fileName: "app/routes/app.additional.jsx",
      lineNumber: 24,
      columnNumber: 9
    }, this) }, void 0, !1, {
      fileName: "app/routes/app.additional.jsx",
      lineNumber: 23,
      columnNumber: 7
    }, this)
  ] }, void 0, !0, {
    fileName: "app/routes/app.additional.jsx",
    lineNumber: 3,
    columnNumber: 5
  }, this);
}

// app/routes/proxy.transfer.ts
var proxy_transfer_exports = {};
__export(proxy_transfer_exports, {
  action: () => action5
});
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
var action5 = async ({ request }) => {
  try {
    let body = await request.json(), { fromCustomerId, toCustomerId, points } = body;
    if (!fromCustomerId || !toCustomerId)
      return jsonResponse({ error: "Missing customer id" }, 400);
    if (points <= 0)
      return jsonResponse({ error: "Invalid points amount" }, 400);
    let senderWallet = await db_server_default.wallet.findUnique({
      where: { customerId: fromCustomerId }
    });
    return !senderWallet || senderWallet.balance < points ? jsonResponse({ error: "Not enough points" }, 400) : (await db_server_default.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { customerId: fromCustomerId },
        data: {
          balance: { decrement: points }
        }
      }), await tx.wallet.upsert({
        where: { customerId: toCustomerId },
        update: {
          balance: { increment: points }
        },
        create: {
          customerId: toCustomerId,
          balance: points
        }
      });
      let expires = /* @__PURE__ */ new Date();
      expires.setMonth(expires.getMonth() + 6), await tx.pointsTransaction.create({
        data: {
          customerId: fromCustomerId,
          orderId: "transfer-out",
          type: "transfer",
          points: -points,
          expiresAt: expires
        }
      }), await tx.pointsTransaction.create({
        data: {
          customerId: toCustomerId,
          orderId: "transfer-in",
          type: "transfer",
          points,
          expiresAt: expires
        }
      });
    }), jsonResponse({ success: !0 }));
  } catch (error) {
    return console.error(error), jsonResponse({ error: "Transfer failed" }, 500);
  }
};

// app/routes/apps.rewards.tsx
var apps_rewards_exports = {};
__export(apps_rewards_exports, {
  default: () => RewardsPage
});
import { useEffect, useState } from "react";
import { jsxDEV as jsxDEV4 } from "react/jsx-dev-runtime";
function RewardsPage() {
  let [wallet, setWallet] = useState(null), [loading, setLoading] = useState(!0), loadWallet = async () => {
    try {
      let customerId = new URLSearchParams(window.location.search).get("customerId") || "demo-user", res = await fetch(`/api/wallet?customerId=${customerId}`);
      if (!res.ok)
        throw new Error("Failed to load wallet");
      let data = await res.json();
      setWallet(data);
    } catch (err) {
      console.error("Wallet load error:", err);
    } finally {
      setLoading(!1);
    }
  };
  return useEffect(() => {
    loadWallet();
  }, []), loading ? /* @__PURE__ */ jsxDEV4("div", { style: { padding: 20 }, children: "Loading..." }, void 0, !1, {
    fileName: "app/routes/apps.rewards.tsx",
    lineNumber: 32,
    columnNumber: 12
  }, this) : /* @__PURE__ */ jsxDEV4("div", { style: { padding: 20 }, children: [
    /* @__PURE__ */ jsxDEV4("h1", { children: "Rewards" }, void 0, !1, {
      fileName: "app/routes/apps.rewards.tsx",
      lineNumber: 37,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV4("p", { children: [
      "Balance: ",
      wallet?.points || 0,
      " pts"
    ] }, void 0, !0, {
      fileName: "app/routes/apps.rewards.tsx",
      lineNumber: 39,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV4("p", { children: [
      "Total spent: $",
      wallet?.totalSpent || 0
    ] }, void 0, !0, {
      fileName: "app/routes/apps.rewards.tsx",
      lineNumber: 40,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV4(
      "button",
      {
        onClick: async () => {
          if (!wallet || wallet.points < 100) {
            alert("Not enough points");
            return;
          }
          try {
            await fetch("/api/redeem", { method: "POST" }), await loadWallet();
          } catch (err) {
            console.error("Redeem error:", err);
          }
        },
        children: "Redeem 100 pts"
      },
      void 0,
      !1,
      {
        fileName: "app/routes/apps.rewards.tsx",
        lineNumber: 42,
        columnNumber: 7
      },
      this
    )
  ] }, void 0, !0, {
    fileName: "app/routes/apps.rewards.tsx",
    lineNumber: 36,
    columnNumber: 5
  }, this);
}

// app/routes/proxy.redeem.ts
var proxy_redeem_exports = {};
__export(proxy_redeem_exports, {
  action: () => action6
});
function jsonResponse2(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
var action6 = async ({ request }) => {
  try {
    let body = await request.json(), { customerId, points } = body;
    if (!customerId)
      return jsonResponse2({ error: "No customerId" }, 400);
    if (!points || points <= 0)
      return jsonResponse2({ error: "Invalid points" }, 400);
    let wallet = await db_server_default.wallet.findFirst({
      where: { customerId }
    });
    return wallet ? wallet.balance < points ? jsonResponse2({ error: "Not enough points" }, 400) : (await db_server_default.pointsTransaction.create({
      data: {
        customerId,
        // ✅ ВОТ ЭТО ДОБАВИЛИ
        type: "redeem_pending",
        amount: -points,
        walletId: wallet.id,
        shop: wallet.shop
      }
    }), jsonResponse2({
      success: !0,
      message: "Redeem pending created"
    })) : jsonResponse2({ error: "Wallet not found" }, 404);
  } catch (error) {
    return console.error("REDEEM ERROR:", error), jsonResponse2(
      { error: "Redeem failed" },
      500
    );
  }
};

// app/routes/proxy.wallet.ts
var proxy_wallet_exports = {};

// app/routes/app.rewards.jsx
var app_rewards_exports = {};
__export(app_rewards_exports, {
  default: () => RewardsPage2,
  loader: () => loader2
});
import { json as json3 } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useState as useState2 } from "react";
import {
  Page,
  Card,
  Text,
  Button,
  Banner,
  BlockStack,
  InlineStack
} from "@shopify/polaris";
import { jsxDEV as jsxDEV5 } from "react/jsx-dev-runtime";
var loader2 = async () => {
  let customerId = "1", wallet = await db_server_default.wallet.findFirst({
    where: { customerId }
  }), transactions = await db_server_default.pointsTransaction.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    take: 20
  });
  return json3({
    balance: wallet?.balance || 0,
    transactions
  });
};
function RewardsPage2() {
  let { balance, transactions } = useLoaderData(), [loading, setLoading] = useState2(!1), [code, setCode] = useState2(null), [currentBalance, setCurrentBalance] = useState2(balance);
  return /* @__PURE__ */ jsxDEV5(Page, { title: "Terrea Rewards", children: /* @__PURE__ */ jsxDEV5(BlockStack, { gap: "400", children: [
    /* @__PURE__ */ jsxDEV5(Card, { children: /* @__PURE__ */ jsxDEV5(BlockStack, { gap: "200", children: [
      /* @__PURE__ */ jsxDEV5(Text, { variant: "headingMd", children: "Your Balance" }, void 0, !1, {
        fileName: "app/routes/app.rewards.jsx",
        lineNumber: 86,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV5(Text, { variant: "heading2xl", children: [
        currentBalance,
        " pts"
      ] }, void 0, !0, {
        fileName: "app/routes/app.rewards.jsx",
        lineNumber: 87,
        columnNumber: 13
      }, this)
    ] }, void 0, !0, {
      fileName: "app/routes/app.rewards.jsx",
      lineNumber: 85,
      columnNumber: 11
    }, this) }, void 0, !1, {
      fileName: "app/routes/app.rewards.jsx",
      lineNumber: 84,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV5(Card, { children: /* @__PURE__ */ jsxDEV5(BlockStack, { gap: "300", children: [
      /* @__PURE__ */ jsxDEV5(Text, { variant: "headingMd", children: "Redeem Rewards" }, void 0, !1, {
        fileName: "app/routes/app.rewards.jsx",
        lineNumber: 93,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV5(
        Button,
        {
          variant: "primary",
          size: "large",
          loading,
          onClick: async () => {
            setLoading(!0);
            try {
              let data = await (await fetch("/api/redeem", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  customerId: "1",
                  points: 500
                })
              })).json();
              if (data.error) {
                alert(data.error), setLoading(!1);
                return;
              }
              setCode(data.code), setCurrentBalance((prev) => prev - 500);
            } catch (e) {
              console.error(e), alert("Error");
            }
            setLoading(!1);
          },
          disabled: currentBalance < 500,
          children: "Redeem 500 pts \u2192 Get Discount"
        },
        void 0,
        !1,
        {
          fileName: "app/routes/app.rewards.jsx",
          lineNumber: 95,
          columnNumber: 13
        },
        this
      ),
      currentBalance < 500 && /* @__PURE__ */ jsxDEV5(Text, { tone: "critical", children: "Not enough points" }, void 0, !1, {
        fileName: "app/routes/app.rewards.jsx",
        lineNumber: 106,
        columnNumber: 15
      }, this)
    ] }, void 0, !0, {
      fileName: "app/routes/app.rewards.jsx",
      lineNumber: 92,
      columnNumber: 11
    }, this) }, void 0, !1, {
      fileName: "app/routes/app.rewards.jsx",
      lineNumber: 91,
      columnNumber: 9
    }, this),
    code && /* @__PURE__ */ jsxDEV5(Banner, { tone: "success", title: "\u{1F389} Reward Ready!", children: /* @__PURE__ */ jsxDEV5(BlockStack, { gap: "200", children: [
      /* @__PURE__ */ jsxDEV5(Text, { children: "Your discount code:" }, void 0, !1, {
        fileName: "app/routes/app.rewards.jsx",
        lineNumber: 115,
        columnNumber: 15
      }, this),
      /* @__PURE__ */ jsxDEV5(InlineStack, { gap: "200", children: [
        /* @__PURE__ */ jsxDEV5(Text, { variant: "headingLg", children: code }, void 0, !1, {
          fileName: "app/routes/app.rewards.jsx",
          lineNumber: 118,
          columnNumber: 17
        }, this),
        /* @__PURE__ */ jsxDEV5(
          Button,
          {
            onClick: () => navigator.clipboard.writeText(code),
            children: "Copy"
          },
          void 0,
          !1,
          {
            fileName: "app/routes/app.rewards.jsx",
            lineNumber: 120,
            columnNumber: 17
          },
          this
        )
      ] }, void 0, !0, {
        fileName: "app/routes/app.rewards.jsx",
        lineNumber: 117,
        columnNumber: 15
      }, this),
      /* @__PURE__ */ jsxDEV5(
        Button,
        {
          variant: "primary",
          onClick: () => window.top.location.href = "https://terrea-dev-store.myshopify.com/discount/" + code,
          children: "Apply & Checkout"
        },
        void 0,
        !1,
        {
          fileName: "app/routes/app.rewards.jsx",
          lineNumber: 127,
          columnNumber: 15
        },
        this
      )
    ] }, void 0, !0, {
      fileName: "app/routes/app.rewards.jsx",
      lineNumber: 113,
      columnNumber: 13
    }, this) }, void 0, !1, {
      fileName: "app/routes/app.rewards.jsx",
      lineNumber: 112,
      columnNumber: 11
    }, this),
    /* @__PURE__ */ jsxDEV5(Card, { children: /* @__PURE__ */ jsxDEV5(BlockStack, { gap: "200", children: [
      /* @__PURE__ */ jsxDEV5(Text, { variant: "headingMd", children: "Activity" }, void 0, !1, {
        fileName: "app/routes/app.rewards.jsx",
        lineNumber: 143,
        columnNumber: 13
      }, this),
      transactions.map((t) => /* @__PURE__ */ jsxDEV5(InlineStack, { gap: "200", align: "space-between", children: [
        /* @__PURE__ */ jsxDEV5(Text, { children: t.type }, void 0, !1, {
          fileName: "app/routes/app.rewards.jsx",
          lineNumber: 147,
          columnNumber: 17
        }, this),
        /* @__PURE__ */ jsxDEV5(Text, { children: [
          t.amount,
          " pts"
        ] }, void 0, !0, {
          fileName: "app/routes/app.rewards.jsx",
          lineNumber: 148,
          columnNumber: 17
        }, this)
      ] }, t.id, !0, {
        fileName: "app/routes/app.rewards.jsx",
        lineNumber: 146,
        columnNumber: 15
      }, this))
    ] }, void 0, !0, {
      fileName: "app/routes/app.rewards.jsx",
      lineNumber: 142,
      columnNumber: 11
    }, this) }, void 0, !1, {
      fileName: "app/routes/app.rewards.jsx",
      lineNumber: 141,
      columnNumber: 9
    }, this)
  ] }, void 0, !0, {
    fileName: "app/routes/app.rewards.jsx",
    lineNumber: 82,
    columnNumber: 7
  }, this) }, void 0, !1, {
    fileName: "app/routes/app.rewards.jsx",
    lineNumber: 81,
    columnNumber: 5
  }, this);
}

// app/routes/redeem-test.jsx
var redeem_test_exports = {};
__export(redeem_test_exports, {
  default: () => Index
});
import { useState as useState3 } from "react";
import { jsxDEV as jsxDEV6 } from "react/jsx-dev-runtime";
function Index() {
  let [code, setCode] = useState3(""), [loading, setLoading] = useState3(!1);
  async function redeem() {
    try {
      console.log("CLICK \u{1F525}"), setLoading(!0);
      let formData = new FormData();
      formData.append("customerId", "123"), formData.append("points", "500"), console.log("BEFORE FETCH");
      let res = await fetch(
        "https://stayed-mile-loans-centuries.trycloudflare.com/api/redeem",
        {
          method: "POST",
          body: formData
        }
      );
      console.log("AFTER FETCH", res);
      let data = await res.json();
      if (console.log("DATA:", data), data.error) {
        alert(data.error), setLoading(!1);
        return;
      }
      setCode(data.code), setLoading(!1);
    } catch (err) {
      console.error("ERROR:", err), alert("ERROR: " + err.message), setLoading(!1);
    }
  }
  return /* @__PURE__ */ jsxDEV6("div", { style: { padding: 40 }, children: [
    /* @__PURE__ */ jsxDEV6("h1", { children: "\u{1F525} Terrea Demo" }, void 0, !1, {
      fileName: "app/routes/redeem-test.jsx",
      lineNumber: 51,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV6(
      "button",
      {
        onClick: redeem,
        disabled: loading,
        style: {
          padding: "12px 20px",
          fontSize: "16px",
          cursor: "pointer"
        },
        children: loading ? "Processing..." : "Redeem"
      },
      void 0,
      !1,
      {
        fileName: "app/routes/redeem-test.jsx",
        lineNumber: 53,
        columnNumber: 7
      },
      this
    ),
    code && /* @__PURE__ */ jsxDEV6("div", { style: { marginTop: 20 }, children: [
      /* @__PURE__ */ jsxDEV6("h2", { children: code }, void 0, !1, {
        fileName: "app/routes/redeem-test.jsx",
        lineNumber: 67,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV6(
        "a",
        {
          href: `https://terrea-dev-store.myshopify.com/discount/${code}`,
          style: {
            display: "inline-block",
            marginTop: "10px"
          },
          children: "\u{1F449} Go to checkout"
        },
        void 0,
        !1,
        {
          fileName: "app/routes/redeem-test.jsx",
          lineNumber: 69,
          columnNumber: 11
        },
        this
      )
    ] }, void 0, !0, {
      fileName: "app/routes/redeem-test.jsx",
      lineNumber: 66,
      columnNumber: 9
    }, this)
  ] }, void 0, !0, {
    fileName: "app/routes/redeem-test.jsx",
    lineNumber: 50,
    columnNumber: 5
  }, this);
}

// app/routes/api.redeem.ts
var api_redeem_exports = {};
__export(api_redeem_exports, {
  loader: () => loader3
});
import { json as json4 } from "@remix-run/node";
async function loader3() {
  let shop = "terrea-dev-store.myshopify.com", customerId = "demo-user-1", wallet = await db_server_default.wallet.findUnique({
    where: {
      shop_customer: { shop, customerId }
    }
  });
  if (!wallet || wallet.balance < 100)
    return json4({ error: "Not enough points" });
  await db_server_default.wallet.update({
    where: {
      shop_customer: { shop, customerId }
    },
    data: {
      balance: { decrement: 100 }
    }
  });
  let discount = await db_server_default.discount.create({
    data: {
      code: "DEMO-" + Math.random().toString(36).substring(7),
      customerId,
      shop,
      amount: 10,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3)
    }
  });
  return json4(discount);
}

// app/routes/api.wallet.ts
var api_wallet_exports = {};
__export(api_wallet_exports, {
  action: () => action7,
  loader: () => loader4
});
async function loader4({ request }) {
  try {
    let url = new URL(request.url);
    return console.log("\u{1F525} PROXY HIT"), console.log("QUERY:", url.searchParams.toString()), new Response(
      JSON.stringify({
        ok: !0,
        points: 123
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  } catch (e) {
    return console.error("ERROR:", e), new Response(
      JSON.stringify({ ok: !1 }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
}
async function action7({ request }) {
  return new Response(
    JSON.stringify({ ok: !0 }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}

// app/routes/app._index.jsx
var app_index_exports = {};
__export(app_index_exports, {
  default: () => PremiumUI
});
import {
  Page as Page2,
  Card as Card2,
  Text as Text2,
  BlockStack as BlockStack2,
  InlineStack as InlineStack2,
  Button as Button2,
  Badge,
  ProgressBar,
  Divider
} from "@shopify/polaris";
import { useState as useState4 } from "react";
import { jsxDEV as jsxDEV7 } from "react/jsx-dev-runtime";
function PremiumUI() {
  let [loading, setLoading] = useState4(!1), points = 1200, nextTier = 2e3, progress = points / nextTier * 100;
  async function redeem(pointsToUse) {
    setLoading(!0);
    try {
      let data = await (await fetch("/api/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customerId: "gid://shopify/Customer/123",
          points: pointsToUse
        })
      })).json();
      data.code ? window.location.href = `/discount/${data.code}` : alert("Redeem success (no redirect yet)");
    } catch (e) {
      console.error(e), alert("Redeem failed");
    }
    setLoading(!1);
  }
  return /* @__PURE__ */ jsxDEV7(Page2, { fullWidth: !0, children: [
    /* @__PURE__ */ jsxDEV7(
      "div",
      {
        style: {
          background: "linear-gradient(135deg, #0f172a, #1e293b)",
          borderRadius: 20,
          padding: 30,
          color: "white",
          marginBottom: 20
        },
        children: /* @__PURE__ */ jsxDEV7(BlockStack2, { gap: "300", children: [
          /* @__PURE__ */ jsxDEV7(Text2, { variant: "headingLg", children: "Terrea Rewards" }, void 0, !1, {
            fileName: "app/routes/app._index.jsx",
            lineNumber: 64,
            columnNumber: 11
          }, this),
          /* @__PURE__ */ jsxDEV7(InlineStack2, { align: "space-between", children: [
            /* @__PURE__ */ jsxDEV7(BlockStack2, { children: [
              /* @__PURE__ */ jsxDEV7(Text2, { variant: "heading2xl", children: [
                points,
                " pts"
              ] }, void 0, !0, {
                fileName: "app/routes/app._index.jsx",
                lineNumber: 68,
                columnNumber: 15
              }, this),
              /* @__PURE__ */ jsxDEV7(Text2, { tone: "subdued", children: "Available balance" }, void 0, !1, {
                fileName: "app/routes/app._index.jsx",
                lineNumber: 69,
                columnNumber: 15
              }, this)
            ] }, void 0, !0, {
              fileName: "app/routes/app._index.jsx",
              lineNumber: 67,
              columnNumber: 13
            }, this),
            /* @__PURE__ */ jsxDEV7(Badge, { tone: "success", children: "Gold Member" }, void 0, !1, {
              fileName: "app/routes/app._index.jsx",
              lineNumber: 72,
              columnNumber: 13
            }, this)
          ] }, void 0, !0, {
            fileName: "app/routes/app._index.jsx",
            lineNumber: 66,
            columnNumber: 11
          }, this),
          /* @__PURE__ */ jsxDEV7(BlockStack2, { children: [
            /* @__PURE__ */ jsxDEV7(Text2, { tone: "subdued", children: [
              "Progress to Platinum (",
              nextTier,
              " pts)"
            ] }, void 0, !0, {
              fileName: "app/routes/app._index.jsx",
              lineNumber: 76,
              columnNumber: 13
            }, this),
            /* @__PURE__ */ jsxDEV7(ProgressBar, { progress, size: "small" }, void 0, !1, {
              fileName: "app/routes/app._index.jsx",
              lineNumber: 79,
              columnNumber: 13
            }, this)
          ] }, void 0, !0, {
            fileName: "app/routes/app._index.jsx",
            lineNumber: 75,
            columnNumber: 11
          }, this)
        ] }, void 0, !0, {
          fileName: "app/routes/app._index.jsx",
          lineNumber: 63,
          columnNumber: 9
        }, this)
      },
      void 0,
      !1,
      {
        fileName: "app/routes/app._index.jsx",
        lineNumber: 54,
        columnNumber: 7
      },
      this
    ),
    /* @__PURE__ */ jsxDEV7(BlockStack2, { gap: "500", children: [
      /* @__PURE__ */ jsxDEV7(Card2, { children: /* @__PURE__ */ jsxDEV7(BlockStack2, { gap: "400", children: [
        /* @__PURE__ */ jsxDEV7(Text2, { variant: "headingMd", children: "Redeem Rewards" }, void 0, !1, {
          fileName: "app/routes/app._index.jsx",
          lineNumber: 88,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV7(InlineStack2, { gap: "300", children: [
          { pts: 100, value: "$1" },
          { pts: 500, value: "$5" },
          { pts: 1e3, value: "$10" }
        ].map((r) => /* @__PURE__ */ jsxDEV7(
          "div",
          {
            style: {
              border: "1px solid #e5e7eb",
              borderRadius: 16,
              padding: 20,
              width: 180,
              textAlign: "center"
            },
            children: /* @__PURE__ */ jsxDEV7(BlockStack2, { gap: "200", children: [
              /* @__PURE__ */ jsxDEV7(Text2, { variant: "headingMd", children: r.value }, void 0, !1, {
                fileName: "app/routes/app._index.jsx",
                lineNumber: 107,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV7(Text2, { tone: "subdued", children: [
                r.pts,
                " pts"
              ] }, void 0, !0, {
                fileName: "app/routes/app._index.jsx",
                lineNumber: 108,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV7(
                Button2,
                {
                  variant: r.pts === 1e3 ? "primary" : "secondary",
                  onClick: () => redeem(r.pts),
                  loading,
                  children: "Redeem"
                },
                void 0,
                !1,
                {
                  fileName: "app/routes/app._index.jsx",
                  lineNumber: 110,
                  columnNumber: 21
                },
                this
              )
            ] }, void 0, !0, {
              fileName: "app/routes/app._index.jsx",
              lineNumber: 106,
              columnNumber: 19
            }, this)
          },
          r.pts,
          !1,
          {
            fileName: "app/routes/app._index.jsx",
            lineNumber: 96,
            columnNumber: 17
          },
          this
        )) }, void 0, !1, {
          fileName: "app/routes/app._index.jsx",
          lineNumber: 90,
          columnNumber: 13
        }, this)
      ] }, void 0, !0, {
        fileName: "app/routes/app._index.jsx",
        lineNumber: 87,
        columnNumber: 11
      }, this) }, void 0, !1, {
        fileName: "app/routes/app._index.jsx",
        lineNumber: 86,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV7(Card2, { children: /* @__PURE__ */ jsxDEV7(BlockStack2, { gap: "300", children: [
        /* @__PURE__ */ jsxDEV7(Text2, { variant: "headingMd", children: "Membership Tiers" }, void 0, !1, {
          fileName: "app/routes/app._index.jsx",
          lineNumber: 127,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV7(InlineStack2, { gap: "200", children: [
          /* @__PURE__ */ jsxDEV7(Badge, { children: "Silver" }, void 0, !1, {
            fileName: "app/routes/app._index.jsx",
            lineNumber: 130,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV7(Badge, { tone: "success", children: "Gold" }, void 0, !1, {
            fileName: "app/routes/app._index.jsx",
            lineNumber: 131,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV7(Badge, { tone: "attention", children: "Platinum" }, void 0, !1, {
            fileName: "app/routes/app._index.jsx",
            lineNumber: 132,
            columnNumber: 15
          }, this)
        ] }, void 0, !0, {
          fileName: "app/routes/app._index.jsx",
          lineNumber: 129,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV7(Text2, { tone: "subdued", children: "Higher tiers unlock better rewards and cashback." }, void 0, !1, {
          fileName: "app/routes/app._index.jsx",
          lineNumber: 135,
          columnNumber: 13
        }, this)
      ] }, void 0, !0, {
        fileName: "app/routes/app._index.jsx",
        lineNumber: 126,
        columnNumber: 11
      }, this) }, void 0, !1, {
        fileName: "app/routes/app._index.jsx",
        lineNumber: 125,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV7(Card2, { children: /* @__PURE__ */ jsxDEV7(BlockStack2, { gap: "200", children: [
        /* @__PURE__ */ jsxDEV7(Text2, { variant: "headingMd", children: "Recent Activity" }, void 0, !1, {
          fileName: "app/routes/app._index.jsx",
          lineNumber: 144,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV7(Divider, {}, void 0, !1, {
          fileName: "app/routes/app._index.jsx",
          lineNumber: 145,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV7(InlineStack2, { align: "space-between", children: [
          /* @__PURE__ */ jsxDEV7(Text2, { children: "+200 pts \u2014 Order #1234" }, void 0, !1, {
            fileName: "app/routes/app._index.jsx",
            lineNumber: 148,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV7(Text2, { tone: "subdued", children: "Today" }, void 0, !1, {
            fileName: "app/routes/app._index.jsx",
            lineNumber: 149,
            columnNumber: 15
          }, this)
        ] }, void 0, !0, {
          fileName: "app/routes/app._index.jsx",
          lineNumber: 147,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV7(InlineStack2, { align: "space-between", children: [
          /* @__PURE__ */ jsxDEV7(Text2, { children: "-100 pts \u2014 Redeemed" }, void 0, !1, {
            fileName: "app/routes/app._index.jsx",
            lineNumber: 153,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV7(Text2, { tone: "subdued", children: "Yesterday" }, void 0, !1, {
            fileName: "app/routes/app._index.jsx",
            lineNumber: 154,
            columnNumber: 15
          }, this)
        ] }, void 0, !0, {
          fileName: "app/routes/app._index.jsx",
          lineNumber: 152,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV7(InlineStack2, { align: "space-between", children: [
          /* @__PURE__ */ jsxDEV7(Text2, { children: "+500 pts \u2014 Subscription" }, void 0, !1, {
            fileName: "app/routes/app._index.jsx",
            lineNumber: 158,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV7(Text2, { tone: "subdued", children: "2 days ago" }, void 0, !1, {
            fileName: "app/routes/app._index.jsx",
            lineNumber: 159,
            columnNumber: 15
          }, this)
        ] }, void 0, !0, {
          fileName: "app/routes/app._index.jsx",
          lineNumber: 157,
          columnNumber: 13
        }, this)
      ] }, void 0, !0, {
        fileName: "app/routes/app._index.jsx",
        lineNumber: 143,
        columnNumber: 11
      }, this) }, void 0, !1, {
        fileName: "app/routes/app._index.jsx",
        lineNumber: 142,
        columnNumber: 9
      }, this)
    ] }, void 0, !0, {
      fileName: "app/routes/app._index.jsx",
      lineNumber: 84,
      columnNumber: 7
    }, this)
  ] }, void 0, !0, {
    fileName: "app/routes/app._index.jsx",
    lineNumber: 52,
    columnNumber: 5
  }, this);
}

// app/routes/api.order.ts
var api_order_exports = {};
__export(api_order_exports, {
  loader: () => loader5
});
import { json as json5 } from "@remix-run/node";
async function loader5() {
  let shop = "terrea-dev-store.myshopify.com", customerId = "demo-user-1", wallet = await db_server_default.wallet.upsert({
    where: {
      shop_customer: { shop, customerId }
    },
    update: {
      balance: { increment: 100 },
      totalSpent: { increment: 50 }
    },
    create: {
      shop,
      customerId,
      balance: 100,
      totalSpent: 50
    }
  });
  return await db_server_default.pointsTransaction.create({
    data: {
      walletId: wallet.id,
      shop,
      customerId,
      type: "earn",
      amount: 100,
      description: "Order reward"
    }
  }), json5(wallet);
}

// app/routes/customer.jsx
var customer_exports = {};
__export(customer_exports, {
  loader: () => loader6
});
function jsonResponse3(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
async function loader6() {
  return jsonResponse3({
    points: 1200
  });
}

// app/routes/rewards.tsx
var rewards_exports = {};
__export(rewards_exports, {
  default: () => RewardsPage3,
  loader: () => loader7
});
import { useLoaderData as useLoaderData2 } from "react-router";
import {
  Page as Page3,
  Card as Card3,
  Text as Text3,
  BlockStack as BlockStack3,
  InlineStack as InlineStack3,
  Badge as Badge2,
  List
} from "@shopify/polaris";
import { jsxDEV as jsxDEV8 } from "react/jsx-dev-runtime";
var loader7 = async ({ request }) => ({
  balance: 850,
  transactions: [
    {
      id: "1",
      amount: 300,
      type: "earn",
      description: "Auto-order #1001",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "2",
      amount: 250,
      type: "earn",
      description: "Auto-order #1002",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "3",
      amount: 200,
      type: "earn",
      description: "Referral bonus",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "4",
      amount: 100,
      type: "spend",
      description: "Order discount",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  ],
  tier: 15
});
function RewardsPage3() {
  let { balance, transactions, tier } = useLoaderData2(), badge = ((tierValue) => tierValue >= 20 ? { status: "success", label: "20% Tier (Fixed)" } : tierValue >= 15 ? { status: "warning", label: "15% Tier" } : { status: "info", label: "10% Tier" })(tier);
  return /* @__PURE__ */ jsxDEV8(Page3, { title: "Terrea Wallet - Rewards", children: /* @__PURE__ */ jsxDEV8(BlockStack3, { gap: "400", children: [
    /* @__PURE__ */ jsxDEV8(Card3, { children: /* @__PURE__ */ jsxDEV8(BlockStack3, { gap: "400", children: [
      /* @__PURE__ */ jsxDEV8(InlineStack3, { distribute: "space-between", align: "center", children: [
        /* @__PURE__ */ jsxDEV8("div", { children: /* @__PURE__ */ jsxDEV8(Text3, { as: "h2", variant: "headingLg", children: "\u{1F4B0} Your Points Balance" }, void 0, !1, {
          fileName: "app/routes/rewards.tsx",
          lineNumber: 79,
          columnNumber: 17
        }, this) }, void 0, !1, {
          fileName: "app/routes/rewards.tsx",
          lineNumber: 78,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV8(Badge2, { status: badge.status, children: badge.label }, void 0, !1, {
          fileName: "app/routes/rewards.tsx",
          lineNumber: 83,
          columnNumber: 15
        }, this)
      ] }, void 0, !0, {
        fileName: "app/routes/rewards.tsx",
        lineNumber: 77,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV8("div", { style: { fontSize: "48px", fontWeight: "bold", color: "#008000" }, children: [
        balance,
        " points"
      ] }, void 0, !0, {
        fileName: "app/routes/rewards.tsx",
        lineNumber: 86,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV8(Text3, { as: "p", tone: "subdued", children: [
        "Worth approximately \u20BD",
        (balance * 0.5).toFixed(0),
        " in discounts"
      ] }, void 0, !0, {
        fileName: "app/routes/rewards.tsx",
        lineNumber: 90,
        columnNumber: 13
      }, this)
    ] }, void 0, !0, {
      fileName: "app/routes/rewards.tsx",
      lineNumber: 76,
      columnNumber: 11
    }, this) }, void 0, !1, {
      fileName: "app/routes/rewards.tsx",
      lineNumber: 75,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV8(Card3, { children: /* @__PURE__ */ jsxDEV8(BlockStack3, { gap: "300", children: [
      /* @__PURE__ */ jsxDEV8(Text3, { as: "h2", variant: "headingMd", children: "\u{1F4CA} Loyalty Tier" }, void 0, !1, {
        fileName: "app/routes/rewards.tsx",
        lineNumber: 98,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV8(Text3, { children: [
        "You're earning ",
        /* @__PURE__ */ jsxDEV8("strong", { children: [
          tier,
          "%"
        ] }, void 0, !0, {
          fileName: "app/routes/rewards.tsx",
          lineNumber: 102,
          columnNumber: 30
        }, this),
        " cashback on auto-orders"
      ] }, void 0, !0, {
        fileName: "app/routes/rewards.tsx",
        lineNumber: 101,
        columnNumber: 13
      }, this),
      tier < 20 && /* @__PURE__ */ jsxDEV8(Text3, { tone: "subdued", children: "Continue your auto-orders to reach the next tier!" }, void 0, !1, {
        fileName: "app/routes/rewards.tsx",
        lineNumber: 105,
        columnNumber: 15
      }, this)
    ] }, void 0, !0, {
      fileName: "app/routes/rewards.tsx",
      lineNumber: 97,
      columnNumber: 11
    }, this) }, void 0, !1, {
      fileName: "app/routes/rewards.tsx",
      lineNumber: 96,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV8(Card3, { children: /* @__PURE__ */ jsxDEV8(BlockStack3, { gap: "300", children: [
      /* @__PURE__ */ jsxDEV8(Text3, { as: "h2", variant: "headingMd", children: "\u{1F4DD} Transaction History" }, void 0, !1, {
        fileName: "app/routes/rewards.tsx",
        lineNumber: 114,
        columnNumber: 13
      }, this),
      transactions.length === 0 ? /* @__PURE__ */ jsxDEV8(Text3, { tone: "subdued", children: "No transactions yet" }, void 0, !1, {
        fileName: "app/routes/rewards.tsx",
        lineNumber: 118,
        columnNumber: 15
      }, this) : /* @__PURE__ */ jsxDEV8(List, { children: transactions.map((tx) => /* @__PURE__ */ jsxDEV8(List.Item, { children: /* @__PURE__ */ jsxDEV8(InlineStack3, { distribute: "space-between", children: [
        /* @__PURE__ */ jsxDEV8("div", { children: [
          /* @__PURE__ */ jsxDEV8(Text3, { children: tx.description }, void 0, !1, {
            fileName: "app/routes/rewards.tsx",
            lineNumber: 125,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV8(Text3, { tone: "subdued", size: "small", children: new Date(tx.createdAt).toLocaleDateString() }, void 0, !1, {
            fileName: "app/routes/rewards.tsx",
            lineNumber: 126,
            columnNumber: 25
          }, this)
        ] }, void 0, !0, {
          fileName: "app/routes/rewards.tsx",
          lineNumber: 124,
          columnNumber: 23
        }, this),
        /* @__PURE__ */ jsxDEV8(
          Text3,
          {
            weight: "semibold",
            color: tx.type === "earn" ? "success" : "warning",
            children: [
              tx.type === "earn" ? "+" : "-",
              tx.amount
            ]
          },
          void 0,
          !0,
          {
            fileName: "app/routes/rewards.tsx",
            lineNumber: 130,
            columnNumber: 23
          },
          this
        )
      ] }, void 0, !0, {
        fileName: "app/routes/rewards.tsx",
        lineNumber: 123,
        columnNumber: 21
      }, this) }, tx.id, !1, {
        fileName: "app/routes/rewards.tsx",
        lineNumber: 122,
        columnNumber: 19
      }, this)) }, void 0, !1, {
        fileName: "app/routes/rewards.tsx",
        lineNumber: 120,
        columnNumber: 15
      }, this)
    ] }, void 0, !0, {
      fileName: "app/routes/rewards.tsx",
      lineNumber: 113,
      columnNumber: 11
    }, this) }, void 0, !1, {
      fileName: "app/routes/rewards.tsx",
      lineNumber: 112,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV8(Card3, { children: /* @__PURE__ */ jsxDEV8(BlockStack3, { gap: "300", children: [
      /* @__PURE__ */ jsxDEV8(Text3, { as: "h2", variant: "headingMd", children: "\u2139\uFE0F How It Works" }, void 0, !1, {
        fileName: "app/routes/rewards.tsx",
        lineNumber: 147,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV8(List, { children: [
        /* @__PURE__ */ jsxDEV8(List.Item, { children: "Every auto-order gives you 10% cashback (points)" }, void 0, !1, {
          fileName: "app/routes/rewards.tsx",
          lineNumber: 151,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV8(List.Item, { children: "After 3 months: upgrade to 15% cashback" }, void 0, !1, {
          fileName: "app/routes/rewards.tsx",
          lineNumber: 152,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV8(List.Item, { children: "After 6 months: upgrade to 20% cashback (fixed forever)" }, void 0, !1, {
          fileName: "app/routes/rewards.tsx",
          lineNumber: 153,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV8(List.Item, { children: "Points expire after 6 months" }, void 0, !1, {
          fileName: "app/routes/rewards.tsx",
          lineNumber: 154,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV8(List.Item, { children: "Use points for up to 50% discount on next order" }, void 0, !1, {
          fileName: "app/routes/rewards.tsx",
          lineNumber: 155,
          columnNumber: 15
        }, this)
      ] }, void 0, !0, {
        fileName: "app/routes/rewards.tsx",
        lineNumber: 150,
        columnNumber: 13
      }, this)
    ] }, void 0, !0, {
      fileName: "app/routes/rewards.tsx",
      lineNumber: 146,
      columnNumber: 11
    }, this) }, void 0, !1, {
      fileName: "app/routes/rewards.tsx",
      lineNumber: 145,
      columnNumber: 9
    }, this)
  ] }, void 0, !0, {
    fileName: "app/routes/rewards.tsx",
    lineNumber: 74,
    columnNumber: 7
  }, this) }, void 0, !1, {
    fileName: "app/routes/rewards.tsx",
    lineNumber: 73,
    columnNumber: 5
  }, this);
}

// app/routes/auth.$.jsx
var auth_exports = {};
__export(auth_exports, {
  default: () => Page4,
  loader: () => loader8
});
var loader8 = async ({ request }) => {
  let { session } = await authenticate.admin(request);
  return await registerWebhooks({ session }), null;
};
function Page4() {
  return null;
}

// app/routes/redeem.jsx
var redeem_exports = {};
__export(redeem_exports, {
  default: () => Redeem
});
import { useState as useState5 } from "react";
import {
  Card as Card4,
  Button as Button3,
  TextField,
  Text as Text4,
  BlockStack as BlockStack4,
  InlineStack as InlineStack4,
  Banner as Banner2
} from "@shopify/polaris";
import { jsxDEV as jsxDEV9 } from "react/jsx-dev-runtime";
function Redeem() {
  let [points, setPoints] = useState5(""), [customerId, setCustomerId] = useState5(""), [loading, setLoading] = useState5(!1), [error, setError] = useState5(""), [success, setSuccess] = useState5("");
  async function handleRedeem() {
    if (setError(""), setSuccess(""), !points || !customerId) {
      setError("Fill all fields");
      return;
    }
    setLoading(!0);
    try {
      let res = await fetch("/api/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customerId,
          points: Number(points)
        })
      }), data = await res.json();
      if (!res.ok) {
        setError(
          data?.error?.[0]?.message || "Something went wrong"
        );
        return;
      }
      setSuccess(`Discount created: ${data.code}`), window.location.href = `/discount/${data.code}`;
    } catch (e) {
      console.error(e), setError("Network error");
    } finally {
      setLoading(!1);
    }
  }
  return /* @__PURE__ */ jsxDEV9(Card4, { children: /* @__PURE__ */ jsxDEV9(BlockStack4, { gap: "400", children: [
    /* @__PURE__ */ jsxDEV9(Text4, { variant: "headingMd", children: "Redeem Points" }, void 0, !1, {
      fileName: "app/routes/redeem.jsx",
      lineNumber: 68,
      columnNumber: 9
    }, this),
    error && /* @__PURE__ */ jsxDEV9(Banner2, { status: "critical", children: error }, void 0, !1, {
      fileName: "app/routes/redeem.jsx",
      lineNumber: 71,
      columnNumber: 11
    }, this),
    success && /* @__PURE__ */ jsxDEV9(Banner2, { status: "success", children: success }, void 0, !1, {
      fileName: "app/routes/redeem.jsx",
      lineNumber: 77,
      columnNumber: 11
    }, this),
    /* @__PURE__ */ jsxDEV9(
      TextField,
      {
        label: "Customer ID (gid://...)",
        value: customerId,
        onChange: setCustomerId,
        autoComplete: "off"
      },
      void 0,
      !1,
      {
        fileName: "app/routes/redeem.jsx",
        lineNumber: 82,
        columnNumber: 9
      },
      this
    ),
    /* @__PURE__ */ jsxDEV9(
      TextField,
      {
        label: "Points",
        type: "number",
        value: points,
        onChange: setPoints,
        autoComplete: "off"
      },
      void 0,
      !1,
      {
        fileName: "app/routes/redeem.jsx",
        lineNumber: 89,
        columnNumber: 9
      },
      this
    ),
    /* @__PURE__ */ jsxDEV9(InlineStack4, { children: /* @__PURE__ */ jsxDEV9(
      Button3,
      {
        variant: "primary",
        loading,
        onClick: handleRedeem,
        children: "Redeem"
      },
      void 0,
      !1,
      {
        fileName: "app/routes/redeem.jsx",
        lineNumber: 98,
        columnNumber: 11
      },
      this
    ) }, void 0, !1, {
      fileName: "app/routes/redeem.jsx",
      lineNumber: 97,
      columnNumber: 9
    }, this)
  ] }, void 0, !0, {
    fileName: "app/routes/redeem.jsx",
    lineNumber: 66,
    columnNumber: 7
  }, this) }, void 0, !1, {
    fileName: "app/routes/redeem.jsx",
    lineNumber: 65,
    columnNumber: 5
  }, this);
}

// app/routes/_index/route.jsx
var route_exports = {};
__export(route_exports, {
  action: () => action8,
  default: () => Auth,
  loader: () => loader9
});
import { AppProvider as AppProvider2 } from "@shopify/polaris";
import { useState as useState6 } from "react";
import { Form, useActionData, useLoaderData as useLoaderData3 } from "@remix-run/react";
import { jsxDEV as jsxDEV10 } from "react/jsx-dev-runtime";
var loader9 = async ({ request }) => ({ errors: await login(request) || {} }), action8 = async ({ request }) => ({ errors: await login(request) || {} });
function Auth() {
  let loaderData = useLoaderData3(), actionData = useActionData(), [shop, setShop] = useState6(""), { errors } = actionData || loaderData;
  return /* @__PURE__ */ jsxDEV10(AppProvider2, { children: /* @__PURE__ */ jsxDEV10("div", { style: { padding: 20 }, children: /* @__PURE__ */ jsxDEV10(Form, { method: "post", children: [
    /* @__PURE__ */ jsxDEV10("h2", { children: "Log in" }, void 0, !1, {
      fileName: "app/routes/_index/route.jsx",
      lineNumber: 26,
      columnNumber: 11
    }, this),
    /* @__PURE__ */ jsxDEV10(
      "input",
      {
        name: "shop",
        placeholder: "example.myshopify.com",
        value: shop,
        onChange: (e) => setShop(e.target.value),
        style: { padding: 8, width: 300 }
      },
      void 0,
      !1,
      {
        fileName: "app/routes/_index/route.jsx",
        lineNumber: 28,
        columnNumber: 11
      },
      this
    ),
    errors?.shop && /* @__PURE__ */ jsxDEV10("div", { style: { color: "red" }, children: errors.shop }, void 0, !1, {
      fileName: "app/routes/_index/route.jsx",
      lineNumber: 37,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV10("br", {}, void 0, !1, {
      fileName: "app/routes/_index/route.jsx",
      lineNumber: 40,
      columnNumber: 11
    }, this),
    /* @__PURE__ */ jsxDEV10("br", {}, void 0, !1, {
      fileName: "app/routes/_index/route.jsx",
      lineNumber: 40,
      columnNumber: 17
    }, this),
    /* @__PURE__ */ jsxDEV10("button", { type: "submit", children: "Log in" }, void 0, !1, {
      fileName: "app/routes/_index/route.jsx",
      lineNumber: 42,
      columnNumber: 11
    }, this)
  ] }, void 0, !0, {
    fileName: "app/routes/_index/route.jsx",
    lineNumber: 25,
    columnNumber: 9
  }, this) }, void 0, !1, {
    fileName: "app/routes/_index/route.jsx",
    lineNumber: 24,
    columnNumber: 7
  }, this) }, void 0, !1, {
    fileName: "app/routes/_index/route.jsx",
    lineNumber: 23,
    columnNumber: 5
  }, this);
}

// app/routes/proxy.ts
var proxy_exports = {};
__export(proxy_exports, {
  action: () => action9,
  loader: () => loader10
});
import { json as json6 } from "@remix-run/node";
var loader10 = async ({ request }) => {
  try {
    let url = new URL(request.url), customerId = url.searchParams.get("logged_in_customer_id") || url.searchParams.get("customerId") || "demo-user", wallet = await prisma.wallet.findUnique({
      where: { customerId }
    });
    return wallet || (wallet = await prisma.wallet.create({
      data: {
        customerId,
        balance: 0
      }
    })), json6({
      points: wallet.balance,
      totalSpent: 0
    });
  } catch (e) {
    return console.error("Wallet loader error:", e), json6({
      points: 0,
      totalSpent: 0
    });
  }
}, action9 = async ({ request }) => {
  try {
    let body = await request.json(), { customerId, points } = body;
    if (!customerId || !points)
      return json6({ error: "Missing data" }, { status: 400 });
    let wallet = await prisma.wallet.upsert({
      where: { customerId },
      update: {
        balance: {
          increment: points
        }
      },
      create: {
        customerId,
        balance: points
      }
    });
    return json6({
      success: !0,
      balance: wallet.balance
    });
  } catch (e) {
    return console.error("Wallet action error:", e), json6({ error: "Failed" }, { status: 500 });
  }
};

// app/routes/app.jsx
var app_exports = {};
__export(app_exports, {
  default: () => App2
});
import { Outlet as Outlet2 } from "@remix-run/react";
import { AppProvider as AppProvider3 } from "@shopify/polaris";
import { NavMenu } from "@shopify/app-bridge-react";
import { jsxDEV as jsxDEV11 } from "react/jsx-dev-runtime";
function App2() {
  return /* @__PURE__ */ jsxDEV11(AppProvider3, { children: [
    /* @__PURE__ */ jsxDEV11(NavMenu, { children: [
      /* @__PURE__ */ jsxDEV11("a", { href: "/app", children: "Dashboard" }, void 0, !1, {
        fileName: "app/routes/app.jsx",
        lineNumber: 11,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV11("a", { href: "/app/rewards", children: "Rewards" }, void 0, !1, {
        fileName: "app/routes/app.jsx",
        lineNumber: 12,
        columnNumber: 9
      }, this)
    ] }, void 0, !0, {
      fileName: "app/routes/app.jsx",
      lineNumber: 10,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV11(Outlet2, {}, void 0, !1, {
      fileName: "app/routes/app.jsx",
      lineNumber: 16,
      columnNumber: 7
    }, this)
  ] }, void 0, !0, {
    fileName: "app/routes/app.jsx",
    lineNumber: 8,
    columnNumber: 5
  }, this);
}

// server-assets-manifest:@remix-run/dev/assets-manifest
var assets_manifest_default = { entry: { module: "/build/entry.client-LXT3FSMT.js", imports: ["/build/_shared/chunk-O4BRYNJ4.js", "/build/_shared/chunk-BXLZ67WE.js", "/build/_shared/chunk-U4FRFQSK.js", "/build/_shared/chunk-XGOTYLZ5.js", "/build/_shared/chunk-7M6SC7J5.js", "/build/_shared/chunk-YFGTCILZ.js", "/build/_shared/chunk-UWV35TSL.js", "/build/_shared/chunk-PNG5AS42.js"] }, routes: { root: { id: "root", parentId: void 0, path: "", index: void 0, caseSensitive: void 0, module: "/build/root-T7PRX5I3.js", imports: ["/build/_shared/chunk-2YAGQO5N.js", "/build/_shared/chunk-MXCNBY4K.js"], hasAction: !1, hasLoader: !1, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/_index": { id: "routes/_index", parentId: "root", path: void 0, index: !0, caseSensitive: void 0, module: "/build/routes/_index-5LHHGRJJ.js", imports: void 0, hasAction: !0, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/api.order": { id: "routes/api.order", parentId: "root", path: "api/order", index: void 0, caseSensitive: void 0, module: "/build/routes/api.order-M7X6DBMI.js", imports: void 0, hasAction: !1, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/api.proxy.wallet": { id: "routes/api.proxy.wallet", parentId: "root", path: "api/proxy/wallet", index: void 0, caseSensitive: void 0, module: "/build/routes/api.proxy.wallet-OY6MHAPN.js", imports: void 0, hasAction: !0, hasLoader: !1, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/api.redeem": { id: "routes/api.redeem", parentId: "root", path: "api/redeem", index: void 0, caseSensitive: void 0, module: "/build/routes/api.redeem-AATNJMON.js", imports: void 0, hasAction: !1, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/api.wallet": { id: "routes/api.wallet", parentId: "root", path: "api/wallet", index: void 0, caseSensitive: void 0, module: "/build/routes/api.wallet-TFZMDIWM.js", imports: void 0, hasAction: !0, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/api.wallet.add": { id: "routes/api.wallet.add", parentId: "routes/api.wallet", path: "add", index: void 0, caseSensitive: void 0, module: "/build/routes/api.wallet.add-TRHM4JYM.js", imports: void 0, hasAction: !1, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/api.webhooks.orders-paid": { id: "routes/api.webhooks.orders-paid", parentId: "root", path: "api/webhooks/orders-paid", index: void 0, caseSensitive: void 0, module: "/build/routes/api.webhooks.orders-paid-GUHQ756E.js", imports: void 0, hasAction: !0, hasLoader: !1, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/api.webhooks.orders.create": { id: "routes/api.webhooks.orders.create", parentId: "root", path: "api/webhooks/orders/create", index: void 0, caseSensitive: void 0, module: "/build/routes/api.webhooks.orders.create-72ND4FSN.js", imports: void 0, hasAction: !0, hasLoader: !1, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/app": { id: "routes/app", parentId: "root", path: "app", index: void 0, caseSensitive: void 0, module: "/build/routes/app-NSODYKLW.js", imports: void 0, hasAction: !1, hasLoader: !1, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/app._index": { id: "routes/app._index", parentId: "routes/app", path: void 0, index: !0, caseSensitive: void 0, module: "/build/routes/app._index-7G6EBCAV.js", imports: ["/build/_shared/chunk-MXCNBY4K.js"], hasAction: !1, hasLoader: !1, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/app.additional": { id: "routes/app.additional", parentId: "routes/app", path: "additional", index: void 0, caseSensitive: void 0, module: "/build/routes/app.additional-4AVEGYMS.js", imports: void 0, hasAction: !1, hasLoader: !1, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/app.rewards": { id: "routes/app.rewards", parentId: "routes/app", path: "rewards", index: void 0, caseSensitive: void 0, module: "/build/routes/app.rewards-DRYNB32R.js", imports: ["/build/_shared/chunk-MXCNBY4K.js"], hasAction: !1, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/apps.rewards": { id: "routes/apps.rewards", parentId: "root", path: "apps/rewards", index: void 0, caseSensitive: void 0, module: "/build/routes/apps.rewards-BM325WSY.js", imports: void 0, hasAction: !1, hasLoader: !1, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/auth.$": { id: "routes/auth.$", parentId: "root", path: "auth/*", index: void 0, caseSensitive: void 0, module: "/build/routes/auth.$-3XMYYTHD.js", imports: void 0, hasAction: !1, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/customer": { id: "routes/customer", parentId: "root", path: "customer", index: void 0, caseSensitive: void 0, module: "/build/routes/customer-HUUNDW53.js", imports: void 0, hasAction: !1, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/proxy": { id: "routes/proxy", parentId: "root", path: "proxy", index: void 0, caseSensitive: void 0, module: "/build/routes/proxy-S7IOINNE.js", imports: void 0, hasAction: !0, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/proxy.redeem": { id: "routes/proxy.redeem", parentId: "routes/proxy", path: "redeem", index: void 0, caseSensitive: void 0, module: "/build/routes/proxy.redeem-RE5M4ZY7.js", imports: void 0, hasAction: !0, hasLoader: !1, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/proxy.transfer": { id: "routes/proxy.transfer", parentId: "routes/proxy", path: "transfer", index: void 0, caseSensitive: void 0, module: "/build/routes/proxy.transfer-ETHQVV2E.js", imports: void 0, hasAction: !0, hasLoader: !1, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/proxy.wallet": { id: "routes/proxy.wallet", parentId: "routes/proxy", path: "wallet", index: void 0, caseSensitive: void 0, module: "/build/routes/proxy.wallet-HEKRX7JP.js", imports: void 0, hasAction: !1, hasLoader: !1, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/redeem": { id: "routes/redeem", parentId: "root", path: "redeem", index: void 0, caseSensitive: void 0, module: "/build/routes/redeem-7DZNFQFQ.js", imports: void 0, hasAction: !1, hasLoader: !1, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/redeem-test": { id: "routes/redeem-test", parentId: "root", path: "redeem-test", index: void 0, caseSensitive: void 0, module: "/build/routes/redeem-test-43PVWMMV.js", imports: void 0, hasAction: !1, hasLoader: !1, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/rewards": { id: "routes/rewards", parentId: "root", path: "rewards", index: void 0, caseSensitive: void 0, module: "/build/routes/rewards-2XQC2GEC.js", imports: void 0, hasAction: !1, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/webhooks.orders.create": { id: "routes/webhooks.orders.create", parentId: "root", path: "webhooks/orders/create", index: void 0, caseSensitive: void 0, module: "/build/routes/webhooks.orders.create-PXY3AAOI.js", imports: void 0, hasAction: !0, hasLoader: !1, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 } }, version: "fe3dcda7", hmr: { runtime: "/build/_shared\\chunk-YFGTCILZ.js", timestamp: 1774911529743 }, url: "/build/manifest-FE3DCDA7.js" };

// server-entry-module:@remix-run/dev/server-build
var mode = "development", assetsBuildDirectory = "public\\build", future = { v3_fetcherPersist: !0, v3_relativeSplatPath: !0, v3_throwAbortReason: !0, v3_routeConfig: !1, v3_singleFetch: !0, v3_lazyRouteDiscovery: !0, unstable_optimizeDeps: !1 }, publicPath = "/build/", entry = { module: entry_server_exports }, routes = {
  root: {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: root_exports
  },
  "routes/api.webhooks.orders.create": {
    id: "routes/api.webhooks.orders.create",
    parentId: "root",
    path: "api/webhooks/orders/create",
    index: void 0,
    caseSensitive: void 0,
    module: api_webhooks_orders_create_exports
  },
  "routes/api.webhooks.orders-paid": {
    id: "routes/api.webhooks.orders-paid",
    parentId: "root",
    path: "api/webhooks/orders-paid",
    index: void 0,
    caseSensitive: void 0,
    module: api_webhooks_orders_paid_exports
  },
  "routes/webhooks.orders.create": {
    id: "routes/webhooks.orders.create",
    parentId: "root",
    path: "webhooks/orders/create",
    index: void 0,
    caseSensitive: void 0,
    module: webhooks_orders_create_exports
  },
  "routes/api.proxy.wallet": {
    id: "routes/api.proxy.wallet",
    parentId: "root",
    path: "api/proxy/wallet",
    index: void 0,
    caseSensitive: void 0,
    module: api_proxy_wallet_exports
  },
  "routes/api.wallet.add": {
    id: "routes/api.wallet.add",
    parentId: "routes/api.wallet",
    path: "add",
    index: void 0,
    caseSensitive: void 0,
    module: api_wallet_add_exports
  },
  "routes/app.additional": {
    id: "routes/app.additional",
    parentId: "routes/app",
    path: "additional",
    index: void 0,
    caseSensitive: void 0,
    module: app_additional_exports
  },
  "routes/proxy.transfer": {
    id: "routes/proxy.transfer",
    parentId: "routes/proxy",
    path: "transfer",
    index: void 0,
    caseSensitive: void 0,
    module: proxy_transfer_exports
  },
  "routes/apps.rewards": {
    id: "routes/apps.rewards",
    parentId: "root",
    path: "apps/rewards",
    index: void 0,
    caseSensitive: void 0,
    module: apps_rewards_exports
  },
  "routes/proxy.redeem": {
    id: "routes/proxy.redeem",
    parentId: "routes/proxy",
    path: "redeem",
    index: void 0,
    caseSensitive: void 0,
    module: proxy_redeem_exports
  },
  "routes/proxy.wallet": {
    id: "routes/proxy.wallet",
    parentId: "routes/proxy",
    path: "wallet",
    index: void 0,
    caseSensitive: void 0,
    module: proxy_wallet_exports
  },
  "routes/app.rewards": {
    id: "routes/app.rewards",
    parentId: "routes/app",
    path: "rewards",
    index: void 0,
    caseSensitive: void 0,
    module: app_rewards_exports
  },
  "routes/redeem-test": {
    id: "routes/redeem-test",
    parentId: "root",
    path: "redeem-test",
    index: void 0,
    caseSensitive: void 0,
    module: redeem_test_exports
  },
  "routes/api.redeem": {
    id: "routes/api.redeem",
    parentId: "root",
    path: "api/redeem",
    index: void 0,
    caseSensitive: void 0,
    module: api_redeem_exports
  },
  "routes/api.wallet": {
    id: "routes/api.wallet",
    parentId: "root",
    path: "api/wallet",
    index: void 0,
    caseSensitive: void 0,
    module: api_wallet_exports
  },
  "routes/app._index": {
    id: "routes/app._index",
    parentId: "routes/app",
    path: void 0,
    index: !0,
    caseSensitive: void 0,
    module: app_index_exports
  },
  "routes/api.order": {
    id: "routes/api.order",
    parentId: "root",
    path: "api/order",
    index: void 0,
    caseSensitive: void 0,
    module: api_order_exports
  },
  "routes/customer": {
    id: "routes/customer",
    parentId: "root",
    path: "customer",
    index: void 0,
    caseSensitive: void 0,
    module: customer_exports
  },
  "routes/rewards": {
    id: "routes/rewards",
    parentId: "root",
    path: "rewards",
    index: void 0,
    caseSensitive: void 0,
    module: rewards_exports
  },
  "routes/auth.$": {
    id: "routes/auth.$",
    parentId: "root",
    path: "auth/*",
    index: void 0,
    caseSensitive: void 0,
    module: auth_exports
  },
  "routes/redeem": {
    id: "routes/redeem",
    parentId: "root",
    path: "redeem",
    index: void 0,
    caseSensitive: void 0,
    module: redeem_exports
  },
  "routes/_index": {
    id: "routes/_index",
    parentId: "root",
    path: void 0,
    index: !0,
    caseSensitive: void 0,
    module: route_exports
  },
  "routes/proxy": {
    id: "routes/proxy",
    parentId: "root",
    path: "proxy",
    index: void 0,
    caseSensitive: void 0,
    module: proxy_exports
  },
  "routes/app": {
    id: "routes/app",
    parentId: "root",
    path: "app",
    index: void 0,
    caseSensitive: void 0,
    module: app_exports
  }
};
export {
  assets_manifest_default as assets,
  assetsBuildDirectory,
  entry,
  future,
  mode,
  publicPath,
  routes
};
//# sourceMappingURL=index.js.map
