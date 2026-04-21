import { PassThrough } from "stream";
import { renderToPipeableStream } from "react-dom/server";
import { Links, Meta, Outlet, Scripts, ScrollRestoration, ServerRouter, UNSAFE_withComponentProps, UNSAFE_withHydrateFallbackProps } from "react-router";
import { createReadableStreamFromReadable } from "@react-router/node";
import { isbot } from "isbot";
import "@shopify/shopify-app-remix/adapters/node";
import { ApiVersion, AppDistribution, DeliveryMethod, shopifyApp } from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { PrismaClient } from "@prisma/client";
import { jsx, jsxs } from "react/jsx-runtime";
import { AppProvider, Banner, BlockStack, Button, Card, InlineStack, Page, Text } from "@shopify/polaris";
import { useCallback, useEffect, useState } from "react";
//#region \0rolldown/runtime.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
//#endregion
//#region app/db.server.js
var prisma$1;
if (process.env.NODE_ENV === "production") prisma$1 = new PrismaClient();
else {
	if (!global.prisma) global.prisma = new PrismaClient();
	prisma$1 = global.prisma;
}
var db_server_default = prisma$1;
//#endregion
//#region app/shopify.server.js
var shopify = shopifyApp({
	apiKey: process.env.SHOPIFY_API_KEY,
	apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
	apiVersion: ApiVersion.October25,
	scopes: process.env.SCOPES?.split(","),
	appUrl: process.env.SHOPIFY_APP_URL || "",
	authPathPrefix: "/auth",
	sessionStorage: new PrismaSessionStorage(db_server_default),
	distribution: AppDistribution.AppStore,
	webhooks: {
		ORDERS_PAID: {
			deliveryMethod: DeliveryMethod.Http,
			callbackUrl: "/webhooks/orders/paid"
		},
		ORDERS_CANCELLED: {
			deliveryMethod: DeliveryMethod.Http,
			callbackUrl: "/webhooks/orders/cancelled"
		},
		REFUNDS_CREATE: {
			deliveryMethod: DeliveryMethod.Http,
			callbackUrl: "/webhooks/refunds/create"
		}
	},
	future: { expiringOfflineAccessTokens: true },
	...process.env.SHOP_CUSTOM_DOMAIN ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] } : {}
});
ApiVersion.October25;
var addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
shopify.authenticate;
shopify.unauthenticated;
shopify.login;
shopify.registerWebhooks;
shopify.sessionStorage;
//#endregion
//#region app/entry.server.jsx
var entry_server_exports = /* @__PURE__ */ __exportAll({
	default: () => handleRequest,
	streamTimeout: () => streamTimeout
});
var streamTimeout = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, routerContext) {
	addDocumentResponseHeaders(request, responseHeaders);
	const callbackName = isbot(request.headers.get("user-agent") ?? "") ? "onAllReady" : "onShellReady";
	return new Promise((resolve, reject) => {
		const { pipe, abort } = renderToPipeableStream(/* @__PURE__ */ jsx(ServerRouter, {
			context: routerContext,
			url: request.url
		}), {
			[callbackName]: () => {
				const body = new PassThrough();
				const stream = createReadableStreamFromReadable(body);
				responseHeaders.set("Content-Type", "text/html");
				resolve(new Response(stream, {
					headers: responseHeaders,
					status: responseStatusCode
				}));
				pipe(body);
			},
			onShellError(error) {
				reject(error);
			},
			onError(error) {
				responseStatusCode = 500;
				console.error(error);
			}
		});
		setTimeout(abort, streamTimeout + 1e3);
	});
}
//#endregion
//#region app/root.tsx
var root_exports = /* @__PURE__ */ __exportAll({
	HydrateFallback: () => HydrateFallback$2,
	default: () => root_default,
	headers: () => headers
});
function headers() {
	return { "Content-Security-Policy": "frame-ancestors https://admin.shopify.com https://*.myshopify.com;" };
}
var HydrateFallback$2 = UNSAFE_withHydrateFallbackProps(function HydrateFallback() {
	return /* @__PURE__ */ jsx("div", { children: "Loading..." });
});
var root_default = UNSAFE_withComponentProps(function App() {
	return /* @__PURE__ */ jsxs("html", {
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ jsxs("head", { children: [/* @__PURE__ */ jsx(Meta, {}), /* @__PURE__ */ jsx(Links, {})] }), /* @__PURE__ */ jsxs("body", {
			suppressHydrationWarning: true,
			children: [
				/* @__PURE__ */ jsx(AppProvider, {
					i18n: {},
					children: /* @__PURE__ */ jsx(Outlet, {})
				}),
				/* @__PURE__ */ jsx(ScrollRestoration, {}),
				/* @__PURE__ */ jsx(Scripts, {})
			]
		})]
	});
});
//#endregion
//#region app/routes/app.rewards.jsx
var app_rewards_exports = /* @__PURE__ */ __exportAll({
	HydrateFallback: () => HydrateFallback$1,
	clientLoader: () => clientLoader$1,
	default: () => app_rewards_default
});
function clientLoader$1() {
	return null;
}
var HydrateFallback$1 = UNSAFE_withHydrateFallbackProps(function HydrateFallback() {
	return null;
});
var app_rewards_default = UNSAFE_withComponentProps(function RewardsPage() {
	const [currentBalance, setCurrentBalance] = useState(0);
	const [transactions, setTransactions] = useState([]);
	const [loading, setLoading] = useState(false);
	const [code, setCode] = useState(null);
	const loadData = useCallback(async () => {
		try {
			const shop = "terrea-home-rituals.myshopify.com";
			const customerId = window.customerId || "demo-user-1";
			const data = await (await fetch(`/api/balance?customer_id=${customerId}&shop=${shop}`)).json();
			setCurrentBalance(data.balance || 0);
			setTransactions(data.transactions || []);
		} catch (e) {
			console.error("Load error:", e);
		}
	}, []);
	useEffect(() => {
		loadData();
	}, [loadData]);
	const handleRedeem = async () => {
		setLoading(true);
		try {
			const data = await (await fetch("/api/redeem", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					customerId: window.customerId || "demo",
					points: 500
				})
			})).json();
			if (data.error) {
				alert(data.error);
				setLoading(false);
				return;
			}
			alert("🎉 Ваш код скидки: " + data.code + "\n\nСкопируйте и используйте при оформлении заказа!");
			setCode(data.code);
			await loadData();
		} catch (e) {
			console.error(e);
			alert("Error");
		}
		setLoading(false);
	};
	return /* @__PURE__ */ jsx(Page, {
		title: "Terrea Rewards",
		children: /* @__PURE__ */ jsxs(BlockStack, {
			gap: "400",
			children: [
				/* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, {
					gap: "200",
					children: [/* @__PURE__ */ jsx(Text, {
						variant: "headingMd",
						children: "Your Balance"
					}), /* @__PURE__ */ jsxs(Text, {
						variant: "heading2xl",
						children: [currentBalance, " pts"]
					})]
				}) }),
				/* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, {
					gap: "300",
					children: [
						/* @__PURE__ */ jsx(Text, {
							variant: "headingMd",
							children: "Redeem Rewards"
						}),
						/* @__PURE__ */ jsx(Button, {
							variant: "primary",
							size: "large",
							loading,
							onClick: handleRedeem,
							disabled: currentBalance < 500,
							children: "Redeem 500 pts → Get Discount"
						}),
						currentBalance < 500 && /* @__PURE__ */ jsx(Text, {
							tone: "critical",
							children: "Not enough points"
						})
					]
				}) }),
				code && /* @__PURE__ */ jsx(Banner, {
					tone: "success",
					title: "🎉 Reward Ready!",
					children: /* @__PURE__ */ jsxs(BlockStack, {
						gap: "200",
						children: [
							/* @__PURE__ */ jsx(Text, { children: "Your discount code:" }),
							/* @__PURE__ */ jsxs(InlineStack, {
								gap: "200",
								children: [/* @__PURE__ */ jsx(Text, {
									variant: "headingLg",
									children: code
								}), /* @__PURE__ */ jsx(Button, {
									onClick: () => navigator.clipboard.writeText(code),
									children: "Copy"
								})]
							}),
							/* @__PURE__ */ jsx(Button, {
								variant: "primary",
								onClick: () => window.top.location.href = "https://terrea-home-rituals.myshopify.com/discount/" + code,
								children: "Apply & Checkout"
							})
						]
					})
				}),
				/* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, {
					gap: "200",
					children: [
						/* @__PURE__ */ jsx(Text, {
							variant: "headingMd",
							children: "Activity"
						}),
						transactions.length === 0 && /* @__PURE__ */ jsx(Text, { children: "No activity yet" }),
						transactions.map((t) => /* @__PURE__ */ jsxs(InlineStack, {
							gap: "200",
							align: "space-between",
							children: [/* @__PURE__ */ jsx(Text, { children: t.description || t.type }), /* @__PURE__ */ jsxs(Text, {
								tone: t.amount > 0 ? "success" : "critical",
								children: [
									t.amount > 0 ? "+" : "",
									t.amount,
									" pts"
								]
							})]
						}, t.id))
					]
				}) })
			]
		})
	});
});
//#endregion
//#region app/routes/app.admin.tsx
var app_admin_exports = /* @__PURE__ */ __exportAll({
	HydrateFallback: () => HydrateFallback,
	clientLoader: () => clientLoader,
	default: () => app_admin_default
});
function clientLoader() {
	return null;
}
var HydrateFallback = UNSAFE_withHydrateFallbackProps(function HydrateFallback() {
	return null;
});
var SECRET = "terrea-admin-2024";
var SHOP$1 = "terrea-home-rituals.myshopify.com";
var S = {
	wrap: {
		fontFamily: "'Cabin', -apple-system, sans-serif",
		background: "#FFFAE4",
		minHeight: "100vh",
		padding: "32px 40px",
		color: "#1A1B18"
	},
	header: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: "28px"
	},
	title: {
		fontSize: "22px",
		fontWeight: 600,
		color: "#1A1B18",
		margin: 0
	},
	subtitle: {
		fontSize: "13px",
		color: "#888",
		margin: "2px 0 0"
	},
	statsRow: {
		display: "grid",
		gridTemplateColumns: "repeat(3,1fr)",
		gap: "16px",
		marginBottom: "24px"
	},
	statBox: {
		background: "#1A1B18",
		borderRadius: "12px",
		padding: "20px 24px"
	},
	statVal: {
		fontSize: "28px",
		fontWeight: 600,
		color: "#FFFAE4",
		margin: 0,
		lineHeight: 1
	},
	statLbl: {
		fontSize: "11px",
		color: "rgba(255,255,255,0.5)",
		textTransform: "uppercase",
		letterSpacing: "1px",
		marginTop: "6px"
	},
	card: {
		background: "#fff",
		border: "1px solid rgba(26,27,24,0.1)",
		borderRadius: "12px",
		padding: "24px",
		marginBottom: "20px"
	},
	cardTitle: {
		fontSize: "14px",
		fontWeight: 600,
		color: "#1A1B18",
		margin: "0 0 16px",
		paddingBottom: "12px",
		borderBottom: "1px solid rgba(26,27,24,0.08)"
	},
	tiersGrid: {
		display: "grid",
		gridTemplateColumns: "repeat(4,1fr)",
		gap: "12px",
		marginBottom: "16px"
	},
	tierBox: {
		background: "#FFFAE4",
		border: "1px solid rgba(26,27,24,0.08)",
		borderRadius: "10px",
		padding: "14px",
		textAlign: "center"
	},
	tierName: {
		fontSize: "11px",
		color: "#888",
		marginBottom: "8px"
	},
	tierInput: {
		width: "100%",
		padding: "8px",
		textAlign: "center",
		border: "1px solid rgba(26,27,24,0.2)",
		borderRadius: "8px",
		fontSize: "16px",
		fontWeight: 600,
		background: "#fff",
		color: "#1A1B18",
		fontFamily: "inherit"
	},
	saveBtn: {
		width: "100%",
		padding: "12px",
		background: "#1A1B18",
		color: "#FFFAE4",
		border: "none",
		borderRadius: "10px",
		fontSize: "13px",
		fontWeight: 600,
		cursor: "pointer",
		letterSpacing: "0.5px"
	},
	searchInput: {
		width: "100%",
		padding: "10px 14px",
		border: "1px solid rgba(26,27,24,0.2)",
		borderRadius: "10px",
		fontSize: "14px",
		fontFamily: "inherit",
		background: "#FFFAE4",
		color: "#1A1B18",
		marginBottom: "16px",
		boxSizing: "border-box"
	},
	table: {
		width: "100%",
		borderCollapse: "collapse",
		fontSize: "13px"
	},
	th: {
		textAlign: "left",
		padding: "8px 12px",
		fontSize: "10px",
		color: "#999",
		textTransform: "uppercase",
		letterSpacing: "1px",
		borderBottom: "1px solid rgba(26,27,24,0.08)",
		fontWeight: 600
	},
	td: {
		padding: "12px",
		borderBottom: "1px solid rgba(26,27,24,0.06)",
		color: "#1A1B18",
		verticalAlign: "middle"
	},
	editBtn: {
		padding: "5px 14px",
		background: "transparent",
		border: "1px solid rgba(26,27,24,0.2)",
		borderRadius: "8px",
		fontSize: "12px",
		cursor: "pointer",
		color: "#1A1B18",
		fontFamily: "inherit"
	},
	badge: {
		display: "inline-block",
		padding: "3px 10px",
		borderRadius: "99px",
		fontSize: "11px",
		fontWeight: 500
	},
	banner: {
		padding: "12px 16px",
		borderRadius: "10px",
		marginBottom: "16px",
		fontSize: "13px",
		fontWeight: 500
	},
	editCard: {
		background: "#fff",
		border: "2px solid #D72C0D",
		borderRadius: "12px",
		padding: "24px",
		marginBottom: "20px"
	},
	input: {
		width: "100%",
		padding: "10px 14px",
		border: "1px solid rgba(26,27,24,0.2)",
		borderRadius: "10px",
		fontSize: "14px",
		fontFamily: "inherit",
		background: "#fff",
		color: "#1A1B18",
		marginBottom: "12px",
		boxSizing: "border-box"
	},
	applyBtn: {
		padding: "10px 24px",
		background: "#D72C0D",
		color: "#FFFAE4",
		border: "none",
		borderRadius: "10px",
		fontSize: "13px",
		fontWeight: 600,
		cursor: "pointer",
		marginRight: "10px",
		fontFamily: "inherit"
	},
	cancelBtn: {
		padding: "10px 24px",
		background: "transparent",
		border: "1px solid rgba(26,27,24,0.2)",
		borderRadius: "10px",
		fontSize: "13px",
		cursor: "pointer",
		fontFamily: "inherit",
		color: "#1A1B18"
	}
};
var tierColors = {
	"start": {
		background: "#F1EFE8",
		color: "#5F5E5A"
	},
	"stay": {
		background: "#EAF3DE",
		color: "#3B6D11"
	},
	"belong": {
		background: "#E1F5EE",
		color: "#0F6E56"
	},
	"belong+": {
		background: "#FAEEDA",
		color: "#854F0B"
	}
};
var app_admin_default = UNSAFE_withComponentProps(function AdminPage() {
	const [customers, setCustomers] = useState([]);
	const [rates, setRates] = useState({
		start: 10,
		stay: 15,
		belong: 20,
		"belong+": 20
	});
	const [loading, setLoading] = useState(false);
	const [msg, setMsg] = useState("");
	const [msgType, setMsgType] = useState("success");
	const [editCustomer, setEditCustomer] = useState(null);
	const [adjustAmount, setAdjustAmount] = useState("");
	const [adjustNote, setAdjustNote] = useState("");
	const [search, setSearch] = useState("");
	const showMsg = (text, type = "success") => {
		setMsg(text);
		setMsgType(type);
		setTimeout(() => setMsg(""), 4e3);
	};
	const loadCustomers = useCallback(async () => {
		setLoading(true);
		try {
			setCustomers((await (await fetch(`/api/admin/customers?secret=${SECRET}&shop=${SHOP$1}`)).json()).customers || []);
		} catch (e) {
			console.error(e);
		}
		setLoading(false);
	}, []);
	const loadRates = useCallback(async () => {
		try {
			const data = await (await fetch(`/api/admin/rates?secret=${SECRET}`)).json();
			if (data.rates) setRates(data.rates);
		} catch (e) {
			console.error(e);
		}
	}, []);
	useEffect(() => {
		loadCustomers();
		loadRates();
	}, []);
	const saveRates = async () => {
		try {
			const data = await (await fetch("/api/admin/rates", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					secret: SECRET,
					rates
				})
			})).json();
			if (data.success) showMsg("✅ Rates saved successfully!");
			else showMsg("❌ Error: " + data.error, "error");
		} catch {
			showMsg("❌ Error saving rates", "error");
		}
	};
	const adjustBalance = async () => {
		if (!editCustomer || !adjustAmount) return;
		try {
			const data = await (await fetch("/api/admin/balance", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					secret: SECRET,
					customer_id: editCustomer.customerId,
					shop: SHOP$1,
					amount: parseInt(adjustAmount),
					description: adjustNote || "Admin adjustment"
				})
			})).json();
			if (data.success) {
				showMsg(`✅ Balance updated! New: ${data.newBalance} pts`);
				setEditCustomer(null);
				setAdjustAmount("");
				setAdjustNote("");
				loadCustomers();
			} else showMsg("❌ " + data.error, "error");
		} catch {
			showMsg("❌ Error", "error");
		}
	};
	const filtered = customers.filter((c) => c.customerId.includes(search) || (c.tier || "").includes(search.toLowerCase()) || (c.email || "").toLowerCase().includes(search.toLowerCase()));
	const totalBalance = customers.reduce((s, c) => s + c.balance, 0);
	const activeSubs = customers.filter((c) => c.status === "active").length;
	return /* @__PURE__ */ jsxs("div", {
		style: S.wrap,
		children: [
			/* @__PURE__ */ jsx("link", {
				href: "https://fonts.googleapis.com/css2?family=Cabin:wght@400;500;600&display=swap",
				rel: "stylesheet"
			}),
			/* @__PURE__ */ jsxs("div", {
				style: S.header,
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
					style: S.title,
					children: "Terrea Rewards"
				}), /* @__PURE__ */ jsxs("p", {
					style: S.subtitle,
					children: ["Admin Dashboard · ", SHOP$1]
				})] }), /* @__PURE__ */ jsx("button", {
					onClick: loadCustomers,
					style: {
						...S.editBtn,
						padding: "8px 16px"
					},
					children: "↻ Refresh"
				})]
			}),
			msg && /* @__PURE__ */ jsx("div", {
				style: {
					...S.banner,
					background: msgType === "error" ? "#FCEBEB" : "#EAF3DE",
					color: msgType === "error" ? "#A32D2D" : "#3B6D11",
					border: `1px solid ${msgType === "error" ? "#F7C1C1" : "#C0DD97"}`
				},
				children: msg
			}),
			/* @__PURE__ */ jsxs("div", {
				style: S.statsRow,
				children: [
					/* @__PURE__ */ jsxs("div", {
						style: S.statBox,
						children: [/* @__PURE__ */ jsx("p", {
							style: S.statVal,
							children: customers.length
						}), /* @__PURE__ */ jsx("p", {
							style: S.statLbl,
							children: "Total customers"
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						style: {
							...S.statBox,
							background: "#D72C0D"
						},
						children: [/* @__PURE__ */ jsx("p", {
							style: S.statVal,
							children: totalBalance.toLocaleString()
						}), /* @__PURE__ */ jsx("p", {
							style: S.statLbl,
							children: "Total pts issued"
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						style: {
							...S.statBox,
							background: "#2C5F2E"
						},
						children: [/* @__PURE__ */ jsx("p", {
							style: S.statVal,
							children: activeSubs
						}), /* @__PURE__ */ jsx("p", {
							style: S.statLbl,
							children: "Active subscriptions"
						})]
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				style: S.card,
				children: [
					/* @__PURE__ */ jsx("p", {
						style: S.cardTitle,
						children: "Cashback rates by tier"
					}),
					/* @__PURE__ */ jsx("div", {
						style: S.tiersGrid,
						children: [
							"start",
							"stay",
							"belong",
							"belong+"
						].map((tier) => /* @__PURE__ */ jsxs("div", {
							style: S.tierBox,
							children: [
								/* @__PURE__ */ jsx("p", {
									style: S.tierName,
									children: tier === "start" ? "🌱 Start 1–3mo" : tier === "stay" ? "🌿 Stay 4–6mo" : tier === "belong" ? "🌳 Belong 7–9mo" : "⭐ Belong+ 10+mo"
								}),
								/* @__PURE__ */ jsx("input", {
									style: S.tierInput,
									type: "number",
									value: rates[tier],
									onChange: (e) => setRates((r) => ({
										...r,
										[tier]: parseInt(e.target.value) || 0
									}))
								}),
								/* @__PURE__ */ jsx("p", {
									style: {
										fontSize: "11px",
										color: "#888",
										marginTop: "4px"
									},
									children: "%"
								})
							]
						}, tier))
					}),
					/* @__PURE__ */ jsx("button", {
						style: S.saveBtn,
						onClick: saveRates,
						children: "Save rates"
					})
				]
			}),
			editCustomer && /* @__PURE__ */ jsxs("div", {
				style: S.editCard,
				children: [
					/* @__PURE__ */ jsxs("p", {
						style: {
							...S.cardTitle,
							borderColor: "rgba(215,44,13,0.2)"
						},
						children: ["Adjust balance — ", /* @__PURE__ */ jsx("span", {
							style: { fontFamily: "monospace" },
							children: editCustomer.customerId
						})]
					}),
					/* @__PURE__ */ jsxs("p", {
						style: {
							fontSize: "13px",
							color: "#888",
							marginBottom: "16px"
						},
						children: ["Current balance: ", /* @__PURE__ */ jsxs("strong", { children: [editCustomer.balance, " pts"] })]
					}),
					/* @__PURE__ */ jsx("input", {
						style: S.input,
						type: "number",
						placeholder: "Amount (e.g. +100 or -50)",
						value: adjustAmount,
						onChange: (e) => setAdjustAmount(e.target.value)
					}),
					/* @__PURE__ */ jsx("input", {
						style: S.input,
						type: "text",
						placeholder: "Note (optional)",
						value: adjustNote,
						onChange: (e) => setAdjustNote(e.target.value)
					}),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("button", {
						style: S.applyBtn,
						onClick: adjustBalance,
						children: "Apply"
					}), /* @__PURE__ */ jsx("button", {
						style: S.cancelBtn,
						onClick: () => {
							setEditCustomer(null);
							setAdjustAmount("");
						},
						children: "Cancel"
					})] })
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				style: S.card,
				children: [
					/* @__PURE__ */ jsxs("p", {
						style: S.cardTitle,
						children: [
							"Customer balances (",
							customers.length,
							")"
						]
					}),
					/* @__PURE__ */ jsx("input", {
						style: S.searchInput,
						type: "text",
						placeholder: "Search by customer ID or tier...",
						value: search,
						onChange: (e) => setSearch(e.target.value)
					}),
					loading ? /* @__PURE__ */ jsx("p", {
						style: {
							color: "#888",
							textAlign: "center",
							padding: "32px"
						},
						children: "Loading..."
					}) : /* @__PURE__ */ jsxs("table", {
						style: S.table,
						children: [/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
							/* @__PURE__ */ jsx("th", {
								style: S.th,
								children: "Customer ID"
							}),
							/* @__PURE__ */ jsx("th", {
								style: S.th,
								children: "Tier"
							}),
							/* @__PURE__ */ jsx("th", {
								style: S.th,
								children: "Months"
							}),
							/* @__PURE__ */ jsx("th", {
								style: S.th,
								children: "Status"
							}),
							/* @__PURE__ */ jsx("th", {
								style: S.th,
								children: "Balance"
							}),
							/* @__PURE__ */ jsx("th", {
								style: S.th,
								children: "Adjust"
							})
						] }) }), /* @__PURE__ */ jsx("tbody", { children: filtered.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", {
							colSpan: 6,
							style: {
								...S.td,
								textAlign: "center",
								color: "#bbb",
								padding: "32px"
							},
							children: "No customers found"
						}) }) : filtered.map((c) => /* @__PURE__ */ jsxs("tr", { children: [
							/* @__PURE__ */ jsxs("td", {
								style: S.td,
								children: [/* @__PURE__ */ jsx("span", {
									style: {
										fontFamily: "monospace",
										fontSize: "11px",
										color: "#888"
									},
									children: c.customerId
								}), c.email && /* @__PURE__ */ jsx("div", {
									style: {
										fontSize: "13px",
										color: "#1A1B18",
										marginTop: "2px"
									},
									children: c.email
								})]
							}),
							/* @__PURE__ */ jsx("td", {
								style: S.td,
								children: /* @__PURE__ */ jsx("span", {
									style: {
										...S.badge,
										...tierColors[c.tier] || tierColors.start
									},
									children: c.tier || "start"
								})
							}),
							/* @__PURE__ */ jsxs("td", {
								style: S.td,
								children: [c.monthsActive, " mo"]
							}),
							/* @__PURE__ */ jsx("td", {
								style: S.td,
								children: /* @__PURE__ */ jsx("span", {
									style: {
										...S.badge,
										background: c.status === "active" ? "#EAF3DE" : "#F1EFE8",
										color: c.status === "active" ? "#3B6D11" : "#888"
									},
									children: c.status || "none"
								})
							}),
							/* @__PURE__ */ jsxs("td", {
								style: {
									...S.td,
									fontWeight: 600,
									color: c.balance > 0 ? "#D72C0D" : "#1A1B18"
								},
								children: [c.balance, " pts"]
							}),
							/* @__PURE__ */ jsx("td", {
								style: S.td,
								children: /* @__PURE__ */ jsx("button", {
									style: S.editBtn,
									onClick: () => setEditCustomer(c),
									children: "Edit"
								})
							})
						] }, c.customerId)) })]
					})
				]
			})
		]
	});
});
//#endregion
//#region app/routes/api.redeem.ts
var api_redeem_exports = /* @__PURE__ */ __exportAll({
	action: () => action$16,
	loader: () => loader$15
});
var corsHeaders$11 = (request) => {
	const origin = request.headers.get("Origin") || "*";
	return {
		"Access-Control-Allow-Origin": origin,
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, ngrok-skip-browser-warning",
		"Access-Control-Allow-Credentials": "true"
	};
};
var json$1 = (data, status = 200, request) => new Response(JSON.stringify(data), {
	status,
	headers: {
		"Content-Type": "application/json",
		...request ? corsHeaders$11(request) : {}
	}
});
async function loader$15({ request }) {
	if (request.method === "OPTIONS") return new Response(null, {
		status: 204,
		headers: corsHeaders$11(request)
	});
	const url = new URL(request.url);
	const customerId = url.searchParams.get("customer_id");
	const shop = url.searchParams.get("shop") || process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";
	const orderTotal = parseFloat(url.searchParams.get("order_total") || "0");
	if (!customerId) return json$1({ error: "No customer_id" }, 400, request);
	try {
		const wallet = await db_server_default.wallet.findUnique({
			where: { shop_customer: {
				shop,
				customerId
			} },
			include: { transactions: {
				orderBy: { createdAt: "desc" },
				take: 10
			} }
		});
		if (!wallet) return json$1({
			balance: 0,
			maxRedeem: 0,
			totalSpent: 0,
			tier: "start",
			transactions: []
		}, 200, request);
		const maxRedeem = orderTotal > 0 ? Math.min(wallet.balance, Math.floor(orderTotal * .5)) : wallet.balance;
		return json$1({
			balance: wallet.balance,
			maxRedeem,
			totalSpent: wallet.totalSpent,
			tier: wallet.tier,
			transactions: wallet.transactions.map((t) => ({
				type: t.type,
				amount: t.amount,
				description: t.description,
				createdAt: t.createdAt
			}))
		}, 200, request);
	} catch (e) {
		return json$1({ error: e.message }, 500, request);
	}
}
async function action$16({ request }) {
	if (request.method === "OPTIONS") return new Response(null, {
		status: 204,
		headers: corsHeaders$11(request)
	});
	let body;
	try {
		body = await request.json();
	} catch {
		return json$1({ error: "Bad JSON" }, 400, request);
	}
	const { customer_id: customerId, shop = process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com", order_id: orderId, order_total: orderTotal, redeem_amount: redeemAmount } = body;
	if (!customerId || !orderTotal) return json$1({ error: "Missing customer_id or order_total" }, 400, request);
	if (!redeemAmount || redeemAmount <= 0) return json$1({
		success: true,
		redeemed: 0,
		message: "Nothing to redeem"
	}, 200, request);
	try {
		const wallet = await db_server_default.wallet.findUnique({ where: { shop_customer: {
			shop,
			customerId
		} } });
		if (!wallet || wallet.balance <= 0) return json$1({ error: "No balance" }, 400, request);
		const maxAllowed = Math.min(wallet.balance, Math.floor(orderTotal * .5));
		const toRedeem = Math.min(redeemAmount, maxAllowed);
		if (toRedeem <= 0) return json$1({ error: "Redeem amount exceeds limit (max 50% of order total)" }, 400, request);
		await db_server_default.wallet.update({
			where: { shop_customer: {
				shop,
				customerId
			} },
			data: { balance: { decrement: toRedeem } }
		});
		await db_server_default.pointsTransaction.create({ data: {
			walletId: wallet.id,
			shop,
			customerId,
			orderId: orderId || "manual-" + Date.now(),
			type: "redeemed",
			amount: -toRedeem,
			description: `Списание ${toRedeem} pts (выбрано покупателем)`
		} });
		console.log(`[redeem] ✅ ${toRedeem} pts redeemed for ${customerId}`);
		return json$1({
			success: true,
			redeemed: toRedeem,
			newBalance: wallet.balance - toRedeem,
			message: `Списано ${toRedeem} pts`
		}, 200, request);
	} catch (e) {
		return json$1({ error: e.message }, 500, request);
	}
}
//#endregion
//#region app/routes/api.balance.ts
var api_balance_exports = /* @__PURE__ */ __exportAll({ loader: () => loader$14 });
var corsHeaders$10 = (request) => {
	const origin = request.headers.get("Origin") || "*";
	return {
		"Access-Control-Allow-Origin": origin,
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, ngrok-skip-browser-warning",
		"Access-Control-Allow-Credentials": "true"
	};
};
async function loader$14({ request }) {
	if (request.method === "OPTIONS") return new Response(null, {
		status: 204,
		headers: corsHeaders$10(request)
	});
	const url = new URL(request.url);
	const customerId = url.searchParams.get("customer_id");
	const shop = url.searchParams.get("shop") || process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";
	if (!customerId) return Response.json({ error: "No customerId" }, {
		status: 400,
		headers: corsHeaders$10(request)
	});
	try {
		const wallet = await db_server_default.wallet.findFirst({
			where: {
				customerId,
				shop
			},
			include: { transactions: {
				orderBy: { createdAt: "desc" },
				take: 10
			} }
		});
		if (!wallet) return Response.json({
			balance: 0,
			transactions: []
		}, { headers: corsHeaders$10(request) });
		return Response.json({
			balance: wallet.balance,
			tier: wallet.tier,
			totalSpent: wallet.totalSpent,
			transactions: wallet.transactions.map((t) => ({
				id: t.id,
				type: t.type,
				amount: t.amount,
				description: t.description,
				createdAt: t.createdAt
			}))
		}, { headers: corsHeaders$10(request) });
	} catch (e) {
		return Response.json({ error: e.message }, {
			status: 500,
			headers: corsHeaders$10(request)
		});
	}
}
//#endregion
//#region app/routes/api.wallet.ts
var api_wallet_exports = /* @__PURE__ */ __exportAll({
	action: () => action$15,
	loader: () => loader$13
});
var corsHeaders$9 = (request) => {
	const origin = request.headers.get("Origin") || "*";
	return {
		"Access-Control-Allow-Origin": origin,
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, ngrok-skip-browser-warning",
		"Access-Control-Allow-Credentials": "true"
	};
};
async function loader$13({ request }) {
	if (request.method === "OPTIONS") return new Response(null, {
		status: 204,
		headers: corsHeaders$9(request)
	});
	const url = new URL(request.url);
	const customerId = url.searchParams.get("customer_id") || url.searchParams.get("customerId");
	const shop = url.searchParams.get("shop") || "terrea-home-rituals.myshopify.com";
	if (!customerId) return Response.json({
		balance: 0,
		transactions: []
	}, { headers: corsHeaders$9(request) });
	try {
		const wallet = await db_server_default.wallet.findFirst({
			where: {
				shop,
				customerId: String(customerId)
			},
			include: { transactions: {
				orderBy: { createdAt: "desc" },
				take: 10
			} }
		});
		if (!wallet) return Response.json({
			balance: 0,
			transactions: []
		}, { headers: corsHeaders$9(request) });
		return Response.json({
			balance: wallet.balance,
			transactions: wallet.transactions.map((t) => ({
				id: t.id,
				type: t.type,
				amount: t.amount,
				description: t.description,
				createdAt: t.createdAt
			}))
		}, { headers: corsHeaders$9(request) });
	} catch (e) {
		console.error(e);
		return Response.json({ error: "Server error" }, {
			status: 500,
			headers: corsHeaders$9(request)
		});
	}
}
async function action$15({ request }) {
	if (request.method === "OPTIONS") return new Response(null, {
		status: 204,
		headers: corsHeaders$9(request)
	});
	try {
		const { customer_id, shop } = await request.json();
		const shopId = shop || "terrea-home-rituals.myshopify.com";
		if (!customer_id) return Response.json({ error: "No customer_id" }, {
			status: 400,
			headers: corsHeaders$9(request)
		});
		const wallet = await db_server_default.wallet.findFirst({ where: {
			shop: shopId,
			customerId: String(customer_id)
		} });
		if (!wallet || wallet.balance < 500) return Response.json({ error: "Insufficient points" }, {
			status: 400,
			headers: corsHeaders$9(request)
		});
		await db_server_default.wallet.update({
			where: { id: wallet.id },
			data: { balance: { decrement: 500 } }
		});
		const code = "REWARD-" + Math.random().toString(36).substring(2, 8).toUpperCase();
		await db_server_default.pointsTransaction.create({ data: {
			walletId: wallet.id,
			shop: shopId,
			customerId: String(customer_id),
			amount: -500,
			type: "REDEEM",
			description: "Redeemed for discount: " + code
		} });
		return Response.json({
			success: true,
			code
		}, { headers: corsHeaders$9(request) });
	} catch (e) {
		console.error(e);
		return Response.json({ error: "Server error" }, {
			status: 500,
			headers: corsHeaders$9(request)
		});
	}
}
//#endregion
//#region app/routes/api.proxy.wallet.ts
var api_proxy_wallet_exports = /* @__PURE__ */ __exportAll({
	action: () => action$14,
	loader: () => loader$12
});
async function loader$12({ request }) {
	try {
		const url = new URL(request.url);
		const customerId = url.searchParams.get("customer_id");
		const shop = url.searchParams.get("shop") || "terrea-home-rituals.myshopify.com";
		if (!customerId) return Response.json({ error: "No customerId" }, { status: 400 });
		let wallet = await db_server_default.wallet.findFirst({
			where: {
				customerId,
				shop
			},
			include: { transactions: {
				orderBy: { createdAt: "desc" },
				take: 10
			} }
		});
		if (!wallet) return Response.json({
			balance: 0,
			transactions: []
		});
		return Response.json({
			balance: wallet.balance,
			transactions: wallet.transactions.map((t) => ({
				id: t.id,
				type: t.type,
				amount: t.amount,
				description: t.description,
				createdAt: t.createdAt
			}))
		});
	} catch (e) {
		console.error(e);
		return Response.json({ error: "Server error" }, { status: 500 });
	}
}
async function action$14({ request }) {
	try {
		if (new URL(request.url).pathname.endsWith("/redeem")) {
			const { customer_id, points } = await request.json();
			const shop = "terrea-home-rituals.myshopify.com";
			const wallet = await db_server_default.wallet.findFirst({ where: {
				customerId: String(customer_id),
				shop
			} });
			if (!wallet || wallet.balance < 500) return Response.json({ error: "Insufficient points" }, { status: 400 });
			await db_server_default.wallet.update({
				where: { id: wallet.id },
				data: { balance: { decrement: 500 } }
			});
			const code = "REWARD-" + Math.random().toString(36).substring(2, 8).toUpperCase();
			await db_server_default.pointsTransaction.create({ data: {
				walletId: wallet.id,
				shop,
				customerId: String(customer_id),
				amount: -500,
				type: "REDEEM",
				description: "Redeemed for discount: " + code
			} });
			return Response.json({
				success: true,
				code
			});
		}
		return Response.json({ error: "Not found" }, { status: 404 });
	} catch (e) {
		console.error(e);
		return Response.json({ error: "Server error" }, { status: 500 });
	}
}
//#endregion
//#region app/routes/api.order.ts
var api_order_exports = /* @__PURE__ */ __exportAll({ action: () => action$13 });
async function action$13({ request }) {
	try {
		const order = await request.json();
		const shop = request.headers.get("x-shopify-shop-domain") || "terrea-home-rituals.myshopify.com";
		const customerId = order.customer?.id?.toString();
		if (!customerId) return Response.json({ ok: true });
		const orderTotal = parseFloat(order.total_price || "0");
		const pointsEarned = Math.floor(orderTotal);
		if (pointsEarned <= 0) return Response.json({ ok: true });
		const wallet = await db_server_default.wallet.upsert({
			where: { shop_customer: {
				shop,
				customerId
			} },
			update: { balance: { increment: pointsEarned } },
			create: {
				shop,
				customerId,
				balance: pointsEarned
			}
		});
		await db_server_default.pointsTransaction.create({ data: {
			walletId: wallet.id,
			shop,
			customerId,
			orderId: order.id?.toString(),
			type: "EARN",
			amount: pointsEarned,
			description: `Order #${order.order_number} - $${orderTotal}`
		} });
		return Response.json({
			ok: true,
			points: pointsEarned
		});
	} catch (err) {
		console.error(err);
		return Response.json({ error: "Webhook error" }, { status: 500 });
	}
}
//#endregion
//#region app/routes/api.referral.generate.ts
var api_referral_generate_exports = /* @__PURE__ */ __exportAll({ loader: () => loader$11 });
var corsHeaders$8 = (request) => {
	const origin = request.headers.get("Origin") || "*";
	return {
		"Access-Control-Allow-Origin": origin,
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
		"Access-Control-Allow-Credentials": "true"
	};
};
function generateCode(customerId) {
	const random = Math.random().toString(36).substring(2, 6).toUpperCase();
	return "REF-" + customerId.slice(-4) + "-" + random;
}
async function loader$11({ request }) {
	if (request.method === "OPTIONS") return new Response(null, {
		status: 204,
		headers: corsHeaders$8(request)
	});
	const url = new URL(request.url);
	const customerId = url.searchParams.get("customer_id");
	const shop = url.searchParams.get("shop") || process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";
	if (!customerId) return Response.json({ error: "No customerId" }, {
		status: 400,
		headers: corsHeaders$8(request)
	});
	try {
		let wallet = await db_server_default.wallet.findFirst({ where: {
			shop,
			customerId
		} });
		if (!wallet) wallet = await db_server_default.wallet.create({ data: {
			shop,
			customerId,
			balance: 0,
			referralCode: generateCode(customerId)
		} });
		else if (!wallet.referralCode) wallet = await db_server_default.wallet.update({
			where: { id: wallet.id },
			data: { referralCode: generateCode(customerId) }
		});
		const referrals = await db_server_default.referral.findMany({ where: {
			referrerId: customerId,
			shop
		} });
		const totalReferrals = referrals.length;
		const completedReferrals = referrals.filter((r) => r.status === "completed").length;
		const totalEarned = referrals.reduce((sum, r) => sum + r.totalBonus, 0);
		return Response.json({
			code: wallet.referralCode,
			stats: {
				total: totalReferrals,
				completed: completedReferrals,
				earned: totalEarned
			}
		}, { headers: corsHeaders$8(request) });
	} catch (e) {
		console.error(e);
		return Response.json({ error: e.message }, {
			status: 500,
			headers: corsHeaders$8(request)
		});
	}
}
//#endregion
//#region app/routes/api.referral.apply.ts
var api_referral_apply_exports = /* @__PURE__ */ __exportAll({
	action: () => action$12,
	loader: () => loader$10
});
var corsHeaders$7 = (request) => {
	const origin = request.headers.get("Origin") || "*";
	return {
		"Access-Control-Allow-Origin": origin,
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, ngrok-skip-browser-warning",
		"Access-Control-Allow-Credentials": "true"
	};
};
var json = (data, status = 200, request) => new Response(JSON.stringify(data), {
	status,
	headers: {
		"Content-Type": "application/json",
		...request ? corsHeaders$7(request) : {}
	}
});
async function loader$10({ request }) {
	return new Response(null, {
		status: 204,
		headers: corsHeaders$7(request)
	});
}
async function action$12({ request }) {
	if (request.method === "OPTIONS") return new Response(null, {
		status: 204,
		headers: corsHeaders$7(request)
	});
	try {
		const { customer_id, code, shop } = await request.json();
		const shopId = shop || process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";
		if (!customer_id || !code) return json({ error: "Missing data" }, 400, request);
		const referrerWallet = await db_server_default.wallet.findFirst({ where: {
			referralCode: code,
			shop: shopId
		} });
		if (!referrerWallet) return json({ error: "Invalid referral code" }, 404, request);
		if (referrerWallet.customerId === String(customer_id)) return json({ error: "Cannot use your own code" }, 400, request);
		let refereeWallet = await db_server_default.wallet.findFirst({ where: {
			shop: shopId,
			customerId: String(customer_id)
		} });
		if (refereeWallet?.referredBy) return json({ error: "You already used a referral code" }, 400, request);
		if (!refereeWallet) refereeWallet = await db_server_default.wallet.create({ data: {
			shop: shopId,
			customerId: String(customer_id),
			balance: 0,
			referredBy: referrerWallet.customerId
		} });
		else refereeWallet = await db_server_default.wallet.update({
			where: { id: refereeWallet.id },
			data: { referredBy: referrerWallet.customerId }
		});
		await db_server_default.referral.upsert({
			where: { referrerCode: code },
			create: {
				shop: shopId,
				referrerCode: code,
				referrerId: referrerWallet.customerId,
				refereeId: String(customer_id),
				status: "pending"
			},
			update: {
				refereeId: String(customer_id),
				status: "pending"
			}
		});
		console.log(`[referral/apply] ✅ ${customer_id} applied code ${code} from ${referrerWallet.customerId}`);
		return json({
			success: true,
			message: "Referral code applied! You'll earn bonus cashback on your purchases."
		}, 200, request);
	} catch (e) {
		console.error("[referral/apply] Error:", e);
		return json({ error: e.message }, 500, request);
	}
}
//#endregion
//#region app/routes/webhooks.orders.create.ts
var webhooks_orders_create_exports = /* @__PURE__ */ __exportAll({ action: () => action$11 });
var action$11 = async ({ request }) => {
	try {
		if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
		const body = await request.json();
		const shop = request.headers.get("x-shopify-shop-domain") || process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";
		const customerId = body.customer?.id?.toString();
		const orderId = String(body.id);
		const orderName = body.name || "";
		const totalPrice = parseFloat(body.total_price || "0");
		if (!customerId || totalPrice <= 0) return new Response("OK");
		if (await db_server_default.pointsTransaction.findFirst({ where: {
			orderId,
			type: { in: ["cashback", "cashback_pending"] }
		} })) {
			console.log("⚠️ Already processed order:", orderId);
			return new Response("Already processed");
		}
		const sub = await db_server_default.subscription.findFirst({ where: {
			shop,
			customerId
		} });
		if (!sub || sub.status !== "active") {
			console.log(`[orders/create] No active subscription for ${customerId}`);
			return new Response("OK");
		}
		await db_server_default.wallet.upsert({
			where: { shop_customer: {
				shop,
				customerId
			} },
			create: {
				shop,
				customerId,
				balance: 0,
				totalSpent: totalPrice,
				tier: sub.currentTier
			},
			update: {
				tier: sub.currentTier,
				totalSpent: { increment: totalPrice }
			}
		});
		const wallet = await db_server_default.wallet.findUnique({ where: { shop_customer: {
			shop,
			customerId
		} } });
		if (!wallet) return new Response("OK");
		const months = sub.monthsActive;
		let rate = .1;
		let pending = true;
		if (months >= 4) {
			rate = .15;
			pending = false;
		}
		if (months >= 7) {
			rate = .2;
			pending = false;
		}
		if (months >= 10) {
			rate = .2;
			pending = false;
		}
		const cashback = Math.round(totalPrice * rate);
		if (cashback > 0) if (pending) {
			await db_server_default.subscription.update({
				where: { id: sub.id },
				data: {
					pendingPoints: { increment: cashback },
					lastOrderAt: /* @__PURE__ */ new Date()
				}
			});
			await db_server_default.pointsTransaction.create({ data: {
				walletId: wallet.id,
				shop,
				customerId,
				orderId,
				type: "cashback_pending",
				amount: cashback,
				description: `Кэшбэк 10% за заказ ${orderName} (pending до 4 мес)`
			} });
			console.log(`⏳ Pending cashback +${cashback} for ${customerId} (month ${months})`);
		} else {
			await db_server_default.wallet.update({
				where: { shop_customer: {
					shop,
					customerId
				} },
				data: { balance: { increment: cashback } }
			});
			await db_server_default.subscription.update({
				where: { id: sub.id },
				data: { lastOrderAt: /* @__PURE__ */ new Date() }
			});
			await db_server_default.pointsTransaction.create({ data: {
				walletId: wallet.id,
				shop,
				customerId,
				orderId,
				type: "cashback",
				amount: cashback,
				description: `Кэшбэк ${Math.round(rate * 100)}% за заказ ${orderName}`
			} });
			console.log(`✅ Cashback +${cashback} (${Math.round(rate * 100)}%) for ${customerId} (month ${months})`);
		}
		const referral = await db_server_default.referral.findFirst({ where: {
			shop,
			refereeId: customerId
		} });
		if (referral) {
			const referrerWallet = await db_server_default.wallet.findFirst({ where: {
				shop,
				customerId: referral.referrerId
			} });
			if (referrerWallet) {
				const isFirstOrder = referral.status === "pending";
				const bonusRate = isFirstOrder ? .15 : .05;
				const bonus = Math.round(totalPrice * bonusRate);
				if (bonus > 0) {
					await db_server_default.wallet.update({
						where: { shop_customer: {
							shop,
							customerId: referral.referrerId
						} },
						data: { balance: { increment: bonus } }
					});
					await db_server_default.pointsTransaction.create({ data: {
						walletId: referrerWallet.id,
						shop,
						customerId: referral.referrerId,
						orderId,
						type: "referral_bonus",
						amount: bonus,
						description: `Реферал ${Math.round(bonusRate * 100)}% — заказ друга ${orderName}`
					} });
					await db_server_default.referral.update({
						where: { id: referral.id },
						data: {
							status: "active",
							firstOrderBonus: isFirstOrder ? bonus : referral.firstOrderBonus,
							totalBonus: { increment: bonus },
							completedAt: isFirstOrder ? /* @__PURE__ */ new Date() : referral.completedAt
						}
					});
					console.log(`🎁 Referral bonus +${bonus} (${Math.round(bonusRate * 100)}%) to ${referral.referrerId}`);
				}
			}
		}
		return new Response(JSON.stringify({ success: true }), { status: 200 });
	} catch (error) {
		console.error("❌ WEBHOOK ERROR:", error);
		return new Response("Error", { status: 500 });
	}
};
//#endregion
//#region app/routes/webhooks.app.uninstalled.ts
var webhooks_app_uninstalled_exports = /* @__PURE__ */ __exportAll({ action: () => action$10 });
async function action$10({ request }) {
	console.log("App uninstalled");
	return new Response("OK", { status: 200 });
}
//#endregion
//#region app/routes/webhooks.orders.paid.ts
var webhooks_orders_paid_exports = /* @__PURE__ */ __exportAll({ action: () => action$9 });
function getCashbackRate(monthsActive) {
	if (monthsActive >= 10) return .2;
	if (monthsActive >= 7) return .2;
	if (monthsActive >= 4) return .15;
	return .1;
}
function isPending(monthsActive) {
	return monthsActive < 10;
}
function getPendingDescription(monthsActive, rate, orderName) {
	if (monthsActive < 4) return `Кэшбэк ${Math.round(rate * 100)}% за заказ ${orderName} (pending, выплата на 4-м мес)`;
	if (monthsActive < 7) return `Кэшбэк ${Math.round(rate * 100)}% за заказ ${orderName} (pending, выплата на 7-м мес)`;
	return `Кэшбэк ${Math.round(rate * 100)}% за заказ ${orderName} (pending, выплата на 10-м мес)`;
}
async function action$9({ request }) {
	const shop = request.headers.get("x-shopify-shop-domain") || "";
	let payload;
	try {
		payload = await request.json();
	} catch {
		return new Response("Bad JSON", { status: 400 });
	}
	const customerId = String(payload.customer?.id || "");
	const orderTotal = parseFloat(payload.total_price || "0");
	const orderId = String(payload.id || "");
	const orderName = payload.name || "";
	console.log(`[orders/paid] shop=${shop} customer=${customerId} order=${orderName} total=${orderTotal}`);
	if (!customerId || !shop || orderTotal <= 0) return new Response("OK", { status: 200 });
	try {
		const sub = await db_server_default.subscription.findFirst({ where: {
			shop,
			customerId
		} });
		if (!sub || sub.status !== "active") {
			console.log(`[orders/paid] No active subscription for ${customerId}`);
			return new Response("OK", { status: 200 });
		}
		await db_server_default.wallet.upsert({
			where: { shop_customer: {
				shop,
				customerId
			} },
			create: {
				shop,
				customerId,
				balance: 0,
				totalSpent: orderTotal,
				tier: sub.currentTier
			},
			update: {
				tier: sub.currentTier,
				totalSpent: { increment: orderTotal }
			}
		});
		const wallet = await db_server_default.wallet.findUnique({ where: { shop_customer: {
			shop,
			customerId
		} } });
		if (!wallet) return new Response("OK", { status: 200 });
		const rate = getCashbackRate(sub.monthsActive);
		const cashback = Math.round(orderTotal * rate);
		const pending = isPending(sub.monthsActive);
		if (cashback > 0) if (pending) {
			await db_server_default.subscription.update({
				where: { id: sub.id },
				data: {
					pendingPoints: { increment: cashback },
					lastOrderAt: /* @__PURE__ */ new Date()
				}
			});
			await db_server_default.pointsTransaction.create({ data: {
				walletId: wallet.id,
				shop,
				customerId,
				orderId,
				type: "cashback_pending",
				amount: cashback,
				description: getPendingDescription(sub.monthsActive, rate, orderName)
			} });
			console.log(`[orders/paid] ⏳ Pending cashback=${cashback} for ${customerId} (month ${sub.monthsActive})`);
		} else {
			await db_server_default.wallet.update({
				where: { shop_customer: {
					shop,
					customerId
				} },
				data: { balance: { increment: cashback } }
			});
			await db_server_default.subscription.update({
				where: { id: sub.id },
				data: { lastOrderAt: /* @__PURE__ */ new Date() }
			});
			await db_server_default.pointsTransaction.create({ data: {
				walletId: wallet.id,
				shop,
				customerId,
				orderId,
				type: "cashback",
				amount: cashback,
				description: `Кэшбэк ${Math.round(rate * 100)}% за заказ ${orderName}`
			} });
			console.log(`[orders/paid] ✅ Cashback=${cashback} (${Math.round(rate * 100)}%) for ${customerId}`);
		}
		await processReferralBonus(shop, customerId, orderId, orderName, orderTotal, wallet.id);
		return new Response("OK", { status: 200 });
	} catch (e) {
		console.error("[orders/paid] Error:", e.message);
		return new Response("Error", { status: 500 });
	}
}
async function processReferralBonus(shop, customerId, orderId, orderName, orderTotal, walletId) {
	try {
		const referral = await db_server_default.referral.findFirst({ where: {
			shop,
			refereeId: customerId
		} });
		if (!referral) return;
		const referrerWallet = await db_server_default.wallet.findFirst({ where: {
			shop,
			customerId: referral.referrerId
		} });
		if (!referrerWallet) return;
		const isFirstOrder = referral.status === "pending";
		const bonusRate = isFirstOrder ? .15 : .05;
		const bonus = Math.round(orderTotal * bonusRate);
		if (bonus <= 0) return;
		await db_server_default.wallet.update({
			where: { shop_customer: {
				shop,
				customerId: referral.referrerId
			} },
			data: { balance: { increment: bonus } }
		});
		await db_server_default.pointsTransaction.create({ data: {
			walletId: referrerWallet.id,
			shop,
			customerId: referral.referrerId,
			orderId,
			type: "referral_bonus",
			amount: bonus,
			description: `Реферал ${Math.round(bonusRate * 100)}% — заказ друга ${orderName}`
		} });
		await db_server_default.referral.update({
			where: { id: referral.id },
			data: {
				status: "active",
				firstOrderBonus: isFirstOrder ? bonus : referral.firstOrderBonus,
				totalBonus: { increment: bonus },
				completedAt: isFirstOrder ? /* @__PURE__ */ new Date() : referral.completedAt
			}
		});
		console.log(`[referral] ✅ bonus=${bonus} to referrer=${referral.referrerId}`);
	} catch (e) {
		console.error("[referral] Error:", e.message);
	}
}
//#endregion
//#region app/routes/api.subscription.ts
var api_subscription_exports = /* @__PURE__ */ __exportAll({ loader: () => loader$9 });
var corsHeaders$6 = (request) => {
	const origin = request.headers.get("Origin") || "*";
	return {
		"Access-Control-Allow-Origin": origin,
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, ngrok-skip-browser-warning",
		"Access-Control-Allow-Credentials": "true"
	};
};
function getTier(monthsActive) {
	if (monthsActive >= 10) return {
		tier: "belong+",
		rate: .2,
		next: null,
		monthsToNext: 0
	};
	if (monthsActive >= 7) return {
		tier: "belong",
		rate: .2,
		next: "belong+",
		monthsToNext: 10 - monthsActive
	};
	if (monthsActive >= 4) return {
		tier: "stay",
		rate: .15,
		next: "belong",
		monthsToNext: 7 - monthsActive
	};
	return {
		tier: "start",
		rate: .1,
		next: "stay",
		monthsToNext: 4 - monthsActive
	};
}
async function loader$9({ request }) {
	if (request.method === "OPTIONS") return new Response(null, {
		status: 204,
		headers: corsHeaders$6(request)
	});
	const url = new URL(request.url);
	const customerId = url.searchParams.get("customer_id");
	const shop = url.searchParams.get("shop") || process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";
	if (!customerId) return Response.json({ error: "No customer_id" }, {
		status: 400,
		headers: corsHeaders$6(request)
	});
	try {
		const sub = await db_server_default.subscription.findFirst({ where: {
			shop,
			customerId: String(customerId)
		} });
		if (!sub) return Response.json({
			active: false,
			monthsActive: 0,
			tier: "start",
			rate: 10,
			pendingPoints: 0,
			next: "stay",
			monthsToNext: 4
		}, { headers: corsHeaders$6(request) });
		const tierInfo = getTier(sub.monthsActive);
		return Response.json({
			active: sub.status === "active",
			monthsActive: sub.monthsActive,
			tier: tierInfo.tier,
			rate: Math.round(tierInfo.rate * 100),
			pendingPoints: sub.pendingPoints,
			next: tierInfo.next,
			monthsToNext: tierInfo.monthsToNext,
			startedAt: sub.startedAt,
			lastOrderAt: sub.lastOrderAt
		}, { headers: corsHeaders$6(request) });
	} catch (e) {
		return Response.json({ error: e.message }, {
			status: 500,
			headers: corsHeaders$6(request)
		});
	}
}
//#endregion
//#region app/routes/api.subscription.manage.ts
var api_subscription_manage_exports = /* @__PURE__ */ __exportAll({
	action: () => action$8,
	loader: () => loader$8
});
var corsHeaders$5 = (request) => {
	const origin = request.headers.get("Origin") || "*";
	return {
		"Access-Control-Allow-Origin": origin,
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
		"Access-Control-Allow-Credentials": "true"
	};
};
async function loader$8({ request }) {
	return new Response(null, {
		status: 204,
		headers: corsHeaders$5(request)
	});
}
async function action$8({ request }) {
	if (request.method === "OPTIONS") return new Response(null, {
		status: 204,
		headers: corsHeaders$5(request)
	});
	try {
		const { customer_id, shop, action: subAction } = await request.json();
		const shopId = shop || process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";
		if (!customer_id || !subAction) return Response.json({ error: "Missing data" }, {
			status: 400,
			headers: corsHeaders$5(request)
		});
		let sub = await db_server_default.subscription.findFirst({ where: {
			shop: shopId,
			customerId: String(customer_id)
		} });
		if (!sub) sub = await db_server_default.subscription.create({ data: {
			shop: shopId,
			customerId: String(customer_id),
			status: "active",
			monthsActive: 0,
			currentTier: "bronze",
			pendingPoints: 0
		} });
		if (subAction === "pause") {
			await db_server_default.subscription.update({
				where: { id: sub.id },
				data: { status: "paused" }
			});
			return Response.json({
				success: true,
				status: "paused",
				message: "Subscription paused"
			}, { headers: corsHeaders$5(request) });
		}
		if (subAction === "cancel") {
			await db_server_default.subscription.update({
				where: { id: sub.id },
				data: {
					status: "cancelled",
					monthsActive: 0,
					pendingPoints: 0
				}
			});
			return Response.json({
				success: true,
				status: "cancelled",
				message: "Subscription cancelled. Progress reset."
			}, { headers: corsHeaders$5(request) });
		}
		if (subAction === "resume") {
			await db_server_default.subscription.update({
				where: { id: sub.id },
				data: { status: "active" }
			});
			return Response.json({
				success: true,
				status: "active",
				message: "Subscription resumed!"
			}, { headers: corsHeaders$5(request) });
		}
		return Response.json({ error: "Unknown action" }, {
			status: 400,
			headers: corsHeaders$5(request)
		});
	} catch (e) {
		return Response.json({ error: e.message }, {
			status: 500,
			headers: corsHeaders$5(request)
		});
	}
}
//#endregion
//#region app/routes/api.points.expire.ts
var api_points_expire_exports = /* @__PURE__ */ __exportAll({ loader: () => loader$7 });
var corsHeaders$4 = (request) => {
	const origin = request.headers.get("Origin") || "*";
	return {
		"Access-Control-Allow-Origin": origin,
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, ngrok-skip-browser-warning",
		"Access-Control-Allow-Credentials": "true"
	};
};
async function loader$7({ request }) {
	if (request.method === "OPTIONS") return new Response(null, {
		status: 204,
		headers: corsHeaders$4(request)
	});
	const url = new URL(request.url);
	const customerId = url.searchParams.get("customer_id");
	const shop = url.searchParams.get("shop") || process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";
	if (!customerId) return Response.json({ error: "No customer_id" }, {
		status: 400,
		headers: corsHeaders$4(request)
	});
	try {
		const now = /* @__PURE__ */ new Date();
		const expiredTx = await db_server_default.pointsTransaction.findMany({ where: {
			customerId: String(customerId),
			shop,
			expiresAt: { lte: now },
			type: { in: ["earn", "referral"] }
		} });
		const expiredPoints = expiredTx.reduce((sum, tx) => {
			return sum + (tx.amount > 0 ? tx.amount : 0);
		}, 0);
		const nextExpiry = await db_server_default.pointsTransaction.findFirst({
			where: {
				customerId: String(customerId),
				shop,
				expiresAt: { gt: now },
				type: { in: ["earn", "referral"] },
				amount: { gt: 0 }
			},
			orderBy: { expiresAt: "asc" }
		});
		return Response.json({
			expiredPoints,
			nextExpiryDate: nextExpiry?.expiresAt || null,
			expiredCount: expiredTx.length
		}, { headers: corsHeaders$4(request) });
	} catch (e) {
		return Response.json({ error: e.message }, {
			status: 500,
			headers: corsHeaders$4(request)
		});
	}
}
//#endregion
//#region app/routes/api.points.transfer.ts
var api_points_transfer_exports = /* @__PURE__ */ __exportAll({ action: () => action$7 });
var corsHeaders$3 = (request) => {
	const origin = request.headers.get("Origin") || "*";
	return {
		"Access-Control-Allow-Origin": origin,
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, ngrok-skip-browser-warning",
		"Access-Control-Allow-Credentials": "true"
	};
};
async function action$7({ request }) {
	if (request.method === "OPTIONS") return new Response(null, {
		status: 204,
		headers: corsHeaders$3(request)
	});
	try {
		const { customer_id, to_email, points, shop } = await request.json();
		const shopId = shop || process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";
		if (!customer_id || !to_email || !points) return Response.json({ error: "Missing data" }, {
			status: 400,
			headers: corsHeaders$3(request)
		});
		if (points < 10) return Response.json({ error: "Minimum transfer is 10 pts" }, {
			status: 400,
			headers: corsHeaders$3(request)
		});
		const senderWallet = await db_server_default.wallet.findFirst({ where: {
			shop: shopId,
			customerId: String(customer_id)
		} });
		if (!senderWallet) return Response.json({ error: "Sender wallet not found" }, {
			status: 404,
			headers: corsHeaders$3(request)
		});
		if (senderWallet.balance < points) return Response.json({ error: "Insufficient points" }, {
			status: 400,
			headers: corsHeaders$3(request)
		});
		const receiverWallet = await db_server_default.wallet.findFirst({ where: {
			shop: shopId,
			customerId: { not: String(customer_id) }
		} });
		if (!receiverWallet) return Response.json({ error: "Recipient not found" }, {
			status: 404,
			headers: corsHeaders$3(request)
		});
		const expiresAt = new Date(Date.now() + 4320 * 60 * 60 * 1e3);
		await db_server_default.$transaction([
			db_server_default.wallet.update({
				where: { id: senderWallet.id },
				data: { balance: { decrement: points } }
			}),
			db_server_default.pointsTransaction.create({ data: {
				walletId: senderWallet.id,
				shop: shopId,
				customerId: String(customer_id),
				type: "transfer_out",
				amount: -points,
				description: `Transfer to ${to_email}: -${points} pts`
			} }),
			db_server_default.wallet.update({
				where: { id: receiverWallet.id },
				data: { balance: { increment: points } }
			}),
			db_server_default.pointsTransaction.create({ data: {
				walletId: receiverWallet.id,
				shop: shopId,
				customerId: receiverWallet.customerId,
				type: "transfer_in",
				amount: points,
				description: `Transfer received: +${points} pts`,
				expiresAt
			} })
		]);
		return Response.json({
			success: true,
			message: `Successfully transferred ${points} pts!`
		}, { headers: corsHeaders$3(request) });
	} catch (e) {
		console.error(e);
		return Response.json({ error: e.message }, {
			status: 500,
			headers: corsHeaders$3(request)
		});
	}
}
//#endregion
//#region app/routes/api.points.checkout.ts
var api_points_checkout_exports = /* @__PURE__ */ __exportAll({ action: () => action$6 });
var corsHeaders$2 = (request) => {
	const origin = request.headers.get("Origin") || "*";
	return {
		"Access-Control-Allow-Origin": origin,
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, ngrok-skip-browser-warning",
		"Access-Control-Allow-Credentials": "true"
	};
};
async function action$6({ request }) {
	if (request.method === "OPTIONS") return new Response(null, {
		status: 204,
		headers: corsHeaders$2(request)
	});
	try {
		const { customer_id, order_total, points_to_use, shop } = await request.json();
		const shopId = shop || process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";
		if (!customer_id || !order_total || !points_to_use) return Response.json({ error: "Missing data" }, {
			status: 400,
			headers: corsHeaders$2(request)
		});
		const maxDiscount = Math.floor(order_total * .5);
		const discount = Math.min(points_to_use, maxDiscount);
		if (discount < 10) return Response.json({ error: "Minimum 10 pts to use" }, {
			status: 400,
			headers: corsHeaders$2(request)
		});
		const wallet = await db_server_default.wallet.findFirst({ where: {
			shop: shopId,
			customerId: String(customer_id)
		} });
		if (!wallet) return Response.json({ error: "Wallet not found" }, {
			status: 404,
			headers: corsHeaders$2(request)
		});
		if (wallet.balance < discount) return Response.json({ error: "Not enough points" }, {
			status: 400,
			headers: corsHeaders$2(request)
		});
		await db_server_default.wallet.update({
			where: { id: wallet.id },
			data: { balance: { decrement: discount } }
		});
		const code = "POINTS-" + Math.random().toString(36).substring(2, 8).toUpperCase();
		await db_server_default.pointsTransaction.create({ data: {
			walletId: wallet.id,
			shop: shopId,
			customerId: String(customer_id),
			type: "checkout",
			amount: -discount,
			description: `Used ${discount} pts for $${discount} discount at checkout`
		} });
		return Response.json({
			success: true,
			code,
			discount,
			message: `Use code ${code} for $${discount} off your order!`
		}, { headers: corsHeaders$2(request) });
	} catch (e) {
		console.error(e);
		return Response.json({ error: e.message }, {
			status: 500,
			headers: corsHeaders$2(request)
		});
	}
}
//#endregion
//#region app/routes/webhooks.subscriptions.create.ts
var webhooks_subscriptions_create_exports = /* @__PURE__ */ __exportAll({ action: () => action$5 });
var prisma = new PrismaClient();
async function action$5({ request }) {
	try {
		const payload = await request.json();
		const customerId = payload.customer_id?.toString();
		const shop = request.headers.get("x-shopify-shop-domain") || process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";
		if (!customerId) return new Response("No customer", { status: 400 });
		await prisma.customer.upsert({
			where: { shopifyCustomerId_shop: {
				shopifyCustomerId: customerId,
				shop
			} },
			create: {
				shopifyCustomerId: customerId,
				shop,
				subscriptionActive: true,
				subscriptionStartDate: /* @__PURE__ */ new Date(),
				monthsActive: 0,
				subscriptionContractId: payload.id?.toString()
			},
			update: {
				subscriptionActive: true,
				subscriptionStartDate: /* @__PURE__ */ new Date(),
				subscriptionContractId: payload.id?.toString()
			}
		});
		console.log(`Subscription created for customer ${customerId}`);
		return new Response("OK", { status: 200 });
	} catch (e) {
		console.error("Error:", e);
		return new Response("Error", { status: 500 });
	}
}
//#endregion
//#region app/routes/webhooks.subscriptions.billing.ts
var webhooks_subscriptions_billing_exports = /* @__PURE__ */ __exportAll({ action: () => action$4 });
async function action$4({ request }) {
	try {
		const shop = request.headers.get("x-shopify-shop-domain") || process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";
		const customerId = (await request.json()).customer_id?.toString();
		if (!customerId) return new Response("No customer", { status: 400 });
		const sub = await db_server_default.subscription.findFirst({ where: {
			shop,
			customerId
		} });
		if (!sub) return new Response("Subscription not found", { status: 404 });
		const newMonths = sub.monthsActive + 1;
		const newTier = newMonths >= 10 ? "belong+" : newMonths >= 7 ? "belong" : newMonths >= 4 ? "stay" : "start";
		await db_server_default.subscription.update({
			where: { id: sub.id },
			data: {
				monthsActive: newMonths,
				currentTier: newTier
			}
		});
		if ((newMonths === 4 || newMonths === 7 || newMonths === 10) && sub.pendingPoints > 0) {
			const pending = sub.pendingPoints;
			await db_server_default.wallet.upsert({
				where: { shop_customer: {
					shop,
					customerId
				} },
				create: {
					shop,
					customerId,
					balance: pending,
					totalSpent: 0,
					tier: newTier
				},
				update: {
					balance: { increment: pending },
					tier: newTier
				}
			});
			const walletRecord = await db_server_default.wallet.findUnique({ where: { shop_customer: {
				shop,
				customerId
			} } });
			if (walletRecord) await db_server_default.pointsTransaction.create({ data: {
				walletId: walletRecord.id,
				shop,
				customerId,
				orderId: `payout-month-${newMonths}`,
				type: "cashback",
				amount: pending,
				description: `Выплата накопленных баллов при переходе на тир ${newTier} (месяц ${newMonths})`
			} });
			await db_server_default.subscription.update({
				where: { id: sub.id },
				data: { pendingPoints: 0 }
			});
			console.log(`[billing] ✅ Payout ${pending} pts for ${customerId} at month ${newMonths} (${newTier})`);
		} else {
			await db_server_default.wallet.upsert({
				where: { shop_customer: {
					shop,
					customerId
				} },
				create: {
					shop,
					customerId,
					balance: 0,
					totalSpent: 0,
					tier: newTier
				},
				update: { tier: newTier }
			});
			console.log(`[billing] Month ${newMonths}, tier ${newTier}, no payout`);
		}
		return new Response("OK", { status: 200 });
	} catch (e) {
		console.error("[billing] Error:", e.message);
		return new Response("Error", { status: 500 });
	}
}
//#endregion
//#region app/routes/api.webhooks.register.ts
var api_webhooks_register_exports = /* @__PURE__ */ __exportAll({
	action: () => action$3,
	loader: () => loader$6
});
var SHOP = process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";
var BASE_URL = "https://terrea-rewards-1.onrender.com";
var corsHeaders$1 = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type"
};
async function registerWebhooks() {
	const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
	const API_URL = `https://${SHOP}/admin/api/2024-01/graphql.json`;
	const WEBHOOKS = [
		{
			topic: "ORDERS_PAID",
			endpoint: "/webhooks/orders/paid"
		},
		{
			topic: "SUBSCRIPTION_CONTRACTS_CREATE",
			endpoint: "/webhooks/subscriptions/create"
		},
		{
			topic: "SUBSCRIPTION_BILLING_ATTEMPTS_SUCCESS",
			endpoint: "/webhooks/subscriptions/billing"
		}
	];
	const results = [];
	for (const wh of WEBHOOKS) {
		const result = (await (await fetch(API_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Shopify-Access-Token": TOKEN
			},
			body: JSON.stringify({
				query: `
          mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
            webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
              webhookSubscription { id callbackUrl topic }
              userErrors { field message }
            }
          }
        `,
				variables: {
					topic: wh.topic,
					webhookSubscription: {
						callbackUrl: BASE_URL + wh.endpoint,
						format: "JSON"
					}
				}
			})
		})).json())?.data?.webhookSubscriptionCreate;
		const errors = result?.userErrors || [];
		results.push({
			topic: wh.topic,
			endpoint: BASE_URL + wh.endpoint,
			success: errors.length === 0,
			id: result?.webhookSubscription?.id || null,
			errors
		});
		console.log(`[webhook register] ${wh.topic}: ${errors.length === 0 ? "✅ OK" : "❌ " + JSON.stringify(errors)}`);
	}
	return results;
}
async function loader$6({ request }) {
	if (request.method === "OPTIONS") return new Response(null, {
		status: 204,
		headers: corsHeaders$1
	});
	const secret = new URL(request.url).searchParams.get("secret");
	if (secret !== process.env.ADMIN_SECRET && secret !== "terrea-admin-2024") return new Response("Unauthorized", { status: 401 });
	const results = await registerWebhooks();
	return new Response(JSON.stringify({
		success: true,
		results
	}, null, 2), {
		status: 200,
		headers: {
			...corsHeaders$1,
			"Content-Type": "application/json"
		}
	});
}
async function action$3({ request }) {
	const results = await registerWebhooks();
	return new Response(JSON.stringify({
		success: true,
		results
	}, null, 2), {
		status: 200,
		headers: {
			...corsHeaders$1,
			"Content-Type": "application/json"
		}
	});
}
//#endregion
//#region app/routes/api.admin.test.ts
var api_admin_test_exports = /* @__PURE__ */ __exportAll({ loader: () => loader$5 });
async function loader$5({ request }) {
	const url = new URL(request.url);
	const customerId = url.searchParams.get("customer_id");
	const months = parseInt(url.searchParams.get("months") || "0");
	if (url.searchParams.get("secret") !== "terrea-admin-2024") return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
	if (!customerId || !months) return new Response(JSON.stringify({ error: "customer_id and months required" }), { status: 400 });
	const date = /* @__PURE__ */ new Date();
	date.setMonth(date.getMonth() - months);
	const currentTier = months >= 10 ? "belong+" : months >= 7 ? "belong" : months >= 4 ? "stay" : "start";
	const shop = process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";
	try {
		const existing = await db_server_default.subscription.findFirst({ where: {
			shop,
			customerId
		} });
		const pendingToTransfer = months >= 4 && existing?.pendingPoints ? existing.pendingPoints : 0;
		const sub = await db_server_default.subscription.upsert({
			where: { shop_customerId: {
				customerId,
				shop
			} },
			create: {
				customerId,
				shop,
				startedAt: date,
				monthsActive: months,
				status: "active",
				currentTier,
				pendingPoints: 0
			},
			update: {
				startedAt: date,
				monthsActive: months,
				status: "active",
				currentTier,
				pendingPoints: 0
			}
		});
		if (pendingToTransfer > 0) {
			await db_server_default.wallet.upsert({
				where: { shop_customer: {
					shop,
					customerId
				} },
				create: {
					shop,
					customerId,
					balance: pendingToTransfer,
					totalSpent: 0,
					tier: currentTier
				},
				update: {
					balance: { increment: pendingToTransfer },
					tier: currentTier
				}
			});
			const wallet = await db_server_default.wallet.findUnique({ where: { shop_customer: {
				shop,
				customerId
			} } });
			if (wallet) await db_server_default.pointsTransaction.create({ data: {
				walletId: wallet.id,
				shop,
				customerId,
				type: "cashback",
				amount: pendingToTransfer,
				description: `Pending баллы зачислены при достижении ${currentTier} тира`
			} });
		} else await db_server_default.wallet.upsert({
			where: { shop_customer: {
				shop,
				customerId
			} },
			create: {
				shop,
				customerId,
				balance: 0,
				totalSpent: 0,
				tier: currentTier
			},
			update: {
				tier: currentTier,
				balance: months <= 3 ? 0 : void 0
			}
		});
		return new Response(JSON.stringify({
			success: true,
			customerId,
			months,
			sub,
			transferred: pendingToTransfer
		}), { headers: { "Content-Type": "application/json" } });
	} catch (e) {
		return new Response(JSON.stringify({ error: e.message }), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
}
//#endregion
//#region app/routes/api.cron.update-months.ts
var api_cron_update_months_exports = /* @__PURE__ */ __exportAll({ loader: () => loader$4 });
async function loader$4({ request }) {
	if (new URL(request.url).searchParams.get("secret") !== "terrea-admin-2024") return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
	try {
		const now = /* @__PURE__ */ new Date();
		const results = [];
		const subscriptions = await db_server_default.subscription.findMany({ where: { status: "active" } });
		console.log(`[cron] Processing ${subscriptions.length} active subscriptions`);
		for (const sub of subscriptions) try {
			const startedAt = new Date(sub.startedAt);
			const diffMs = now.getTime() - startedAt.getTime();
			const diffMonths = Math.floor(diffMs / (1e3 * 60 * 60 * 24 * 30));
			const monthsActive = Math.max(1, diffMonths);
			const currentTier = monthsActive >= 10 ? "belong+" : monthsActive >= 7 ? "belong" : monthsActive >= 4 ? "stay" : "start";
			const prevMonths = sub.monthsActive;
			const prevTier = sub.currentTier;
			const shouldTransferPending = prevMonths < 4 && monthsActive >= 4 && sub.pendingPoints > 0;
			await db_server_default.subscription.update({
				where: { id: sub.id },
				data: {
					monthsActive,
					currentTier,
					pendingPoints: shouldTransferPending ? 0 : sub.pendingPoints
				}
			});
			if (shouldTransferPending) {
				const wallet = await db_server_default.wallet.findUnique({ where: { shop_customer: {
					shop: sub.shop,
					customerId: sub.customerId
				} } });
				if (wallet) {
					await db_server_default.wallet.update({
						where: { shop_customer: {
							shop: sub.shop,
							customerId: sub.customerId
						} },
						data: {
							balance: { increment: sub.pendingPoints },
							tier: currentTier
						}
					});
					await db_server_default.pointsTransaction.create({ data: {
						walletId: wallet.id,
						shop: sub.shop,
						customerId: sub.customerId,
						type: "cashback",
						amount: sub.pendingPoints,
						description: `Pending баллы зачислены — достигнут тир ${currentTier} (${monthsActive} мес)`
					} });
					console.log(`[cron] ✅ Transferred ${sub.pendingPoints} pending pts for ${sub.customerId}`);
				}
			}
			await db_server_default.wallet.upsert({
				where: { shop_customer: {
					shop: sub.shop,
					customerId: sub.customerId
				} },
				create: {
					shop: sub.shop,
					customerId: sub.customerId,
					balance: 0,
					totalSpent: 0,
					tier: currentTier
				},
				update: { tier: currentTier }
			});
			results.push({
				customerId: sub.customerId,
				prevMonths,
				newMonths: monthsActive,
				prevTier,
				newTier: currentTier,
				transferred: shouldTransferPending ? sub.pendingPoints : 0
			});
			console.log(`[cron] ${sub.customerId}: ${prevMonths}→${monthsActive} мес, ${prevTier}→${currentTier}`);
		} catch (e) {
			console.error(`[cron] Error for ${sub.customerId}:`, e.message);
			results.push({
				customerId: sub.customerId,
				error: e.message
			});
		}
		return new Response(JSON.stringify({
			success: true,
			processed: results.length,
			timestamp: now.toISOString(),
			results
		}, null, 2), { headers: { "Content-Type": "application/json" } });
	} catch (e) {
		return new Response(JSON.stringify({ error: e.message }), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
}
//#endregion
//#region app/routes/api.admin.add-points.ts
var api_admin_add_points_exports = /* @__PURE__ */ __exportAll({ loader: () => loader$3 });
async function loader$3({ request }) {
	const url = new URL(request.url);
	const secret = url.searchParams.get("secret");
	const customerId = url.searchParams.get("customer_id");
	const shop = url.searchParams.get("shop") || "terrea-home-rituals.myshopify.com";
	const amount = parseInt(url.searchParams.get("amount") || "0");
	const type = url.searchParams.get("type") || "referral_bonus";
	const description = url.searchParams.get("description") || "Manual bonus";
	if (secret !== "terrea-admin-2024") return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
	if (!customerId || amount <= 0) return new Response(JSON.stringify({ error: "Missing params" }), { status: 400 });
	try {
		const wallet = await db_server_default.wallet.upsert({
			where: { shop_customer: {
				shop,
				customerId
			} },
			create: {
				shop,
				customerId,
				balance: amount,
				totalSpent: 0,
				tier: "stay"
			},
			update: { balance: { increment: amount } }
		});
		await db_server_default.pointsTransaction.create({ data: {
			walletId: wallet.id,
			shop,
			customerId,
			type,
			amount,
			description
		} });
		return new Response(JSON.stringify({
			success: true,
			newBalance: wallet.balance + amount
		}), { headers: { "Content-Type": "application/json" } });
	} catch (e) {
		return new Response(JSON.stringify({ error: e.message }), { status: 500 });
	}
}
//#endregion
//#region app/routes/api.admin.customers.ts
var api_admin_customers_exports = /* @__PURE__ */ __exportAll({ loader: () => loader$2 });
var corsHeaders = () => ({
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type"
});
async function getAndCacheEmail(customerId, walletId) {
	try {
		const shop = process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";
		const token = process.env.SHOPIFY_ACCESS_TOKEN;
		const email = (await (await fetch(`https://${shop}/admin/api/2024-01/customers/${customerId}.json`, { headers: { "X-Shopify-Access-Token": token } })).json()).customer?.email || "";
		if (email) await db_server_default.wallet.update({
			where: { id: walletId },
			data: { email }
		});
		return email;
	} catch {
		return "";
	}
}
async function loader$2({ request }) {
	if (request.method === "OPTIONS") return new Response(null, {
		status: 204,
		headers: corsHeaders()
	});
	const url = new URL(request.url);
	const secret = url.searchParams.get("secret");
	const shop = url.searchParams.get("shop") || process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";
	if (secret !== "terrea-admin-2024") return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
	try {
		const wallets = await db_server_default.wallet.findMany({
			where: { shop },
			include: { transactions: {
				orderBy: { createdAt: "desc" },
				take: 1
			} },
			orderBy: { balance: "desc" }
		});
		const subs = await db_server_default.subscription.findMany({ where: { shop } });
		const subMap = Object.fromEntries(subs.map((s) => [s.customerId, s]));
		const customers = await Promise.all(wallets.map(async (w) => {
			let email = w.email || "";
			if (!email) email = await getAndCacheEmail(w.customerId, w.id);
			return {
				customerId: w.customerId,
				email,
				balance: w.balance,
				tier: w.tier,
				totalSpent: w.totalSpent,
				monthsActive: subMap[w.customerId]?.monthsActive || 0,
				status: subMap[w.customerId]?.status || "none",
				lastTransaction: w.transactions[0]?.createdAt || null
			};
		}));
		return new Response(JSON.stringify({
			success: true,
			customers,
			total: customers.length
		}), { headers: {
			"Content-Type": "application/json",
			...corsHeaders()
		} });
	} catch (e) {
		return new Response(JSON.stringify({ error: e.message }), { status: 500 });
	}
}
//#endregion
//#region app/routes/api.admin.balance.ts
var api_admin_balance_exports = /* @__PURE__ */ __exportAll({ action: () => action$2 });
async function action$2({ request }) {
	if (request.method === "OPTIONS") return new Response(null, {
		status: 204,
		headers: { "Access-Control-Allow-Origin": "*" }
	});
	try {
		const { secret, customer_id, amount, type, description, shop } = await request.json();
		if (secret !== "terrea-admin-2024") return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
		const shopId = shop || process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";
		if (!customer_id || amount === void 0) return new Response(JSON.stringify({ error: "Missing customer_id or amount" }), { status: 400 });
		const wallet = await db_server_default.wallet.upsert({
			where: { shop_customer: {
				shop: shopId,
				customerId: String(customer_id)
			} },
			create: {
				shop: shopId,
				customerId: String(customer_id),
				balance: amount,
				totalSpent: 0,
				tier: "start"
			},
			update: { balance: { increment: amount } }
		});
		await db_server_default.pointsTransaction.create({ data: {
			walletId: wallet.id,
			shop: shopId,
			customerId: String(customer_id),
			type: type || "admin_adjustment",
			amount,
			description: description || `Admin adjustment: ${amount > 0 ? "+" : ""}${amount} pts`
		} });
		const updated = await db_server_default.wallet.findUnique({ where: { shop_customer: {
			shop: shopId,
			customerId: String(customer_id)
		} } });
		return new Response(JSON.stringify({
			success: true,
			newBalance: updated?.balance
		}), { headers: {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": "*"
		} });
	} catch (e) {
		return new Response(JSON.stringify({ error: e.message }), { status: 500 });
	}
}
//#endregion
//#region app/routes/api.admin.rates.ts
var api_admin_rates_exports = /* @__PURE__ */ __exportAll({
	action: () => action$1,
	loader: () => loader$1
});
var RATES_KEY = "cashback_rates";
async function loader$1({ request }) {
	if (new URL(request.url).searchParams.get("secret") !== "terrea-admin-2024") return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
	try {
		const setting = await db_server_default.setting.findUnique({ where: { key: RATES_KEY } });
		const rates = setting ? JSON.parse(setting.value) : {
			start: 10,
			stay: 15,
			belong: 20,
			"belong+": 20
		};
		return new Response(JSON.stringify({
			success: true,
			rates
		}), { headers: {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": "*"
		} });
	} catch (e) {
		return new Response(JSON.stringify({ error: e.message }), { status: 500 });
	}
}
async function action$1({ request }) {
	try {
		const { secret, rates } = await request.json();
		if (secret !== "terrea-admin-2024") return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
		await db_server_default.setting.upsert({
			where: { key: RATES_KEY },
			create: {
				key: RATES_KEY,
				value: JSON.stringify(rates)
			},
			update: { value: JSON.stringify(rates) }
		});
		return new Response(JSON.stringify({
			success: true,
			rates
		}), { headers: {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": "*"
		} });
	} catch (e) {
		return new Response(JSON.stringify({ error: e.message }), { status: 500 });
	}
}
//#endregion
//#region app/routes/api.admin.cache-emails.ts
var api_admin_cache_emails_exports = /* @__PURE__ */ __exportAll({ loader: () => loader });
async function loader({ request }) {
	if (new URL(request.url).searchParams.get("secret") !== "terrea-admin-2024") return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
	const shop = process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";
	const token = process.env.SHOPIFY_ACCESS_TOKEN;
	const wallets = await db_server_default.wallet.findMany({
		where: {
			shop,
			email: null
		},
		take: 50
	});
	let updated = 0;
	for (const w of wallets) try {
		const email = (await (await fetch(`https://${shop}/admin/api/2024-01/customers/${w.customerId}.json`, { headers: { "X-Shopify-Access-Token": token } })).json()).customer?.email || "";
		if (email) {
			await db_server_default.wallet.update({
				where: { id: w.id },
				data: { email }
			});
			updated++;
		}
	} catch {}
	const remaining = await db_server_default.wallet.count({ where: {
		shop,
		email: null
	} });
	return new Response(JSON.stringify({
		success: true,
		updated,
		remaining
	}), { headers: { "Content-Type": "application/json" } });
}
//#endregion
//#region app/routes/api.admin.reset.ts
var api_admin_reset_exports = /* @__PURE__ */ __exportAll({ action: () => action });
async function action({ request }) {
	try {
		const { secret } = await request.json();
		if (secret !== "terrea-admin-2024") return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
		await db_server_default.pointsTransaction.deleteMany({});
		await db_server_default.referral.deleteMany({});
		await db_server_default.wallet.deleteMany({});
		await db_server_default.subscription.deleteMany({});
		return new Response(JSON.stringify({
			success: true,
			message: "Database cleared!"
		}), { headers: { "Content-Type": "application/json" } });
	} catch (e) {
		return new Response(JSON.stringify({ error: e.message }), { status: 500 });
	}
}
//#endregion
//#region \0virtual:react-router/server-manifest
var server_manifest_default = {
	"entry": {
		"module": "/assets/entry.client-BdeSEyqY.js",
		"imports": ["/assets/jsx-runtime-BcmxfV-G.js", "/assets/react-dom-D9Fwu5mJ.js"],
		"css": []
	},
	"routes": {
		"root": {
			"id": "root",
			"parentId": void 0,
			"path": "",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/root-CyDYuf2w.js",
			"imports": [
				"/assets/jsx-runtime-BcmxfV-G.js",
				"/assets/react-dom-D9Fwu5mJ.js",
				"/assets/context-DimUrWZr.js"
			],
			"css": ["/assets/root-CAaziDo7.css"],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/app.rewards": {
			"id": "routes/app.rewards",
			"parentId": "root",
			"path": "/app/rewards",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": true,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/app.rewards-BclvgHss.js",
			"imports": [
				"/assets/jsx-runtime-BcmxfV-G.js",
				"/assets/context-DimUrWZr.js",
				"/assets/react-dom-D9Fwu5mJ.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/app.admin": {
			"id": "routes/app.admin",
			"parentId": "root",
			"path": "/app/admin",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": true,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/app.admin-b7Sc-ZqA.js",
			"imports": ["/assets/jsx-runtime-BcmxfV-G.js"],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.redeem": {
			"id": "routes/api.redeem",
			"parentId": "root",
			"path": "/api/redeem",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.redeem-f_Kd_J_V.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.balance": {
			"id": "routes/api.balance",
			"parentId": "root",
			"path": "/api/balance",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.balance-B9u7-eUv.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.wallet": {
			"id": "routes/api.wallet",
			"parentId": "root",
			"path": "/api/wallet",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.wallet-CXniQKLV.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.proxy.wallet": {
			"id": "routes/api.proxy.wallet",
			"parentId": "root",
			"path": "/api/proxy/wallet",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.proxy.wallet-qylcp9hz.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.order": {
			"id": "routes/api.order",
			"parentId": "root",
			"path": "/api/order",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.order-BbKEfxph.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.referral.generate": {
			"id": "routes/api.referral.generate",
			"parentId": "root",
			"path": "/api/referral/generate",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.referral.generate-CXEBwZAX.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.referral.apply": {
			"id": "routes/api.referral.apply",
			"parentId": "root",
			"path": "/api/referral/apply",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.referral.apply-DtqQKAqb.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/webhooks.orders.create": {
			"id": "routes/webhooks.orders.create",
			"parentId": "root",
			"path": "/webhooks/orders/create",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/webhooks.orders.create-hihr3aub.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/webhooks.app.uninstalled": {
			"id": "routes/webhooks.app.uninstalled",
			"parentId": "root",
			"path": "/webhooks/app/uninstalled",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/webhooks.app.uninstalled-CdkD4GOx.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/webhooks.orders.paid": {
			"id": "routes/webhooks.orders.paid",
			"parentId": "root",
			"path": "/webhooks/orders/paid",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/webhooks.orders.paid-D6dq3_Vl.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.subscription": {
			"id": "routes/api.subscription",
			"parentId": "root",
			"path": "/api/subscription",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.subscription-Jp4yd0kG.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.subscription.manage": {
			"id": "routes/api.subscription.manage",
			"parentId": "root",
			"path": "/api/subscription/manage",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.subscription.manage-BYEsDFYi.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.points.expire": {
			"id": "routes/api.points.expire",
			"parentId": "root",
			"path": "/api/points/expire",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.points.expire-D_5bsuDM.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.points.transfer": {
			"id": "routes/api.points.transfer",
			"parentId": "root",
			"path": "/api/points/transfer",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.points.transfer-PMTcEPHg.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.points.checkout": {
			"id": "routes/api.points.checkout",
			"parentId": "root",
			"path": "/api/points/checkout",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.points.checkout-Bt0RMRVz.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/webhooks.subscriptions.create": {
			"id": "routes/webhooks.subscriptions.create",
			"parentId": "root",
			"path": "/webhooks/subscriptions/create",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/webhooks.subscriptions.create-lBu0W4h3.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/webhooks.subscriptions.billing": {
			"id": "routes/webhooks.subscriptions.billing",
			"parentId": "root",
			"path": "/webhooks/subscriptions/billing",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/webhooks.subscriptions.billing-DbD35ni6.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.webhooks.register": {
			"id": "routes/api.webhooks.register",
			"parentId": "root",
			"path": "/api/webhooks/register",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.webhooks.register-Bs2M8ugr.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.admin.test": {
			"id": "routes/api.admin.test",
			"parentId": "root",
			"path": "/api/admin/test",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.admin.test-vx0HCA7t.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.cron.update-months": {
			"id": "routes/api.cron.update-months",
			"parentId": "root",
			"path": "/api/cron/update-months",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.cron.update-months-S278okNY.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.admin.add-points": {
			"id": "routes/api.admin.add-points",
			"parentId": "root",
			"path": "/api/admin/add-points",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.admin.add-points-DbewInDF.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.admin.customers": {
			"id": "routes/api.admin.customers",
			"parentId": "root",
			"path": "/api/admin/customers",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.admin.customers-kftYVwh1.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.admin.balance": {
			"id": "routes/api.admin.balance",
			"parentId": "root",
			"path": "/api/admin/balance",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.admin.balance-CCmgwKiH.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.admin.rates": {
			"id": "routes/api.admin.rates",
			"parentId": "root",
			"path": "/api/admin/rates",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.admin.rates-aZPeDokv.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.admin.cache-emails": {
			"id": "routes/api.admin.cache-emails",
			"parentId": "root",
			"path": "/api/admin/cache-emails",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.admin.cache-emails-8TQqOTGZ.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.admin.reset": {
			"id": "routes/api.admin.reset",
			"parentId": "root",
			"path": "/api/admin/reset",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.admin.reset-DIDBFD-7.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		}
	},
	"url": "/assets/manifest-b5ddbc11.js",
	"version": "b5ddbc11",
	"sri": void 0
};
//#endregion
//#region \0virtual:react-router/server-build
var assetsBuildDirectory = "build\\client";
var basename = "/";
var future = {
	"unstable_optimizeDeps": false,
	"unstable_passThroughRequests": false,
	"unstable_subResourceIntegrity": false,
	"unstable_trailingSlashAwareDataRequests": false,
	"unstable_previewServerPrerendering": false,
	"v8_middleware": false,
	"v8_splitRouteModules": false,
	"v8_viteEnvironmentApi": false
};
var ssr = true;
var isSpaMode = false;
var prerender = [];
var routeDiscovery = {
	"mode": "lazy",
	"manifestPath": "/__manifest"
};
var publicPath = "/";
var entry = { module: entry_server_exports };
var routes = {
	"root": {
		id: "root",
		parentId: void 0,
		path: "",
		index: void 0,
		caseSensitive: void 0,
		module: root_exports
	},
	"routes/app.rewards": {
		id: "routes/app.rewards",
		parentId: "root",
		path: "/app/rewards",
		index: void 0,
		caseSensitive: void 0,
		module: app_rewards_exports
	},
	"routes/app.admin": {
		id: "routes/app.admin",
		parentId: "root",
		path: "/app/admin",
		index: void 0,
		caseSensitive: void 0,
		module: app_admin_exports
	},
	"routes/api.redeem": {
		id: "routes/api.redeem",
		parentId: "root",
		path: "/api/redeem",
		index: void 0,
		caseSensitive: void 0,
		module: api_redeem_exports
	},
	"routes/api.balance": {
		id: "routes/api.balance",
		parentId: "root",
		path: "/api/balance",
		index: void 0,
		caseSensitive: void 0,
		module: api_balance_exports
	},
	"routes/api.wallet": {
		id: "routes/api.wallet",
		parentId: "root",
		path: "/api/wallet",
		index: void 0,
		caseSensitive: void 0,
		module: api_wallet_exports
	},
	"routes/api.proxy.wallet": {
		id: "routes/api.proxy.wallet",
		parentId: "root",
		path: "/api/proxy/wallet",
		index: void 0,
		caseSensitive: void 0,
		module: api_proxy_wallet_exports
	},
	"routes/api.order": {
		id: "routes/api.order",
		parentId: "root",
		path: "/api/order",
		index: void 0,
		caseSensitive: void 0,
		module: api_order_exports
	},
	"routes/api.referral.generate": {
		id: "routes/api.referral.generate",
		parentId: "root",
		path: "/api/referral/generate",
		index: void 0,
		caseSensitive: void 0,
		module: api_referral_generate_exports
	},
	"routes/api.referral.apply": {
		id: "routes/api.referral.apply",
		parentId: "root",
		path: "/api/referral/apply",
		index: void 0,
		caseSensitive: void 0,
		module: api_referral_apply_exports
	},
	"routes/webhooks.orders.create": {
		id: "routes/webhooks.orders.create",
		parentId: "root",
		path: "/webhooks/orders/create",
		index: void 0,
		caseSensitive: void 0,
		module: webhooks_orders_create_exports
	},
	"routes/webhooks.app.uninstalled": {
		id: "routes/webhooks.app.uninstalled",
		parentId: "root",
		path: "/webhooks/app/uninstalled",
		index: void 0,
		caseSensitive: void 0,
		module: webhooks_app_uninstalled_exports
	},
	"routes/webhooks.orders.paid": {
		id: "routes/webhooks.orders.paid",
		parentId: "root",
		path: "/webhooks/orders/paid",
		index: void 0,
		caseSensitive: void 0,
		module: webhooks_orders_paid_exports
	},
	"routes/api.subscription": {
		id: "routes/api.subscription",
		parentId: "root",
		path: "/api/subscription",
		index: void 0,
		caseSensitive: void 0,
		module: api_subscription_exports
	},
	"routes/api.subscription.manage": {
		id: "routes/api.subscription.manage",
		parentId: "root",
		path: "/api/subscription/manage",
		index: void 0,
		caseSensitive: void 0,
		module: api_subscription_manage_exports
	},
	"routes/api.points.expire": {
		id: "routes/api.points.expire",
		parentId: "root",
		path: "/api/points/expire",
		index: void 0,
		caseSensitive: void 0,
		module: api_points_expire_exports
	},
	"routes/api.points.transfer": {
		id: "routes/api.points.transfer",
		parentId: "root",
		path: "/api/points/transfer",
		index: void 0,
		caseSensitive: void 0,
		module: api_points_transfer_exports
	},
	"routes/api.points.checkout": {
		id: "routes/api.points.checkout",
		parentId: "root",
		path: "/api/points/checkout",
		index: void 0,
		caseSensitive: void 0,
		module: api_points_checkout_exports
	},
	"routes/webhooks.subscriptions.create": {
		id: "routes/webhooks.subscriptions.create",
		parentId: "root",
		path: "/webhooks/subscriptions/create",
		index: void 0,
		caseSensitive: void 0,
		module: webhooks_subscriptions_create_exports
	},
	"routes/webhooks.subscriptions.billing": {
		id: "routes/webhooks.subscriptions.billing",
		parentId: "root",
		path: "/webhooks/subscriptions/billing",
		index: void 0,
		caseSensitive: void 0,
		module: webhooks_subscriptions_billing_exports
	},
	"routes/api.webhooks.register": {
		id: "routes/api.webhooks.register",
		parentId: "root",
		path: "/api/webhooks/register",
		index: void 0,
		caseSensitive: void 0,
		module: api_webhooks_register_exports
	},
	"routes/api.admin.test": {
		id: "routes/api.admin.test",
		parentId: "root",
		path: "/api/admin/test",
		index: void 0,
		caseSensitive: void 0,
		module: api_admin_test_exports
	},
	"routes/api.cron.update-months": {
		id: "routes/api.cron.update-months",
		parentId: "root",
		path: "/api/cron/update-months",
		index: void 0,
		caseSensitive: void 0,
		module: api_cron_update_months_exports
	},
	"routes/api.admin.add-points": {
		id: "routes/api.admin.add-points",
		parentId: "root",
		path: "/api/admin/add-points",
		index: void 0,
		caseSensitive: void 0,
		module: api_admin_add_points_exports
	},
	"routes/api.admin.customers": {
		id: "routes/api.admin.customers",
		parentId: "root",
		path: "/api/admin/customers",
		index: void 0,
		caseSensitive: void 0,
		module: api_admin_customers_exports
	},
	"routes/api.admin.balance": {
		id: "routes/api.admin.balance",
		parentId: "root",
		path: "/api/admin/balance",
		index: void 0,
		caseSensitive: void 0,
		module: api_admin_balance_exports
	},
	"routes/api.admin.rates": {
		id: "routes/api.admin.rates",
		parentId: "root",
		path: "/api/admin/rates",
		index: void 0,
		caseSensitive: void 0,
		module: api_admin_rates_exports
	},
	"routes/api.admin.cache-emails": {
		id: "routes/api.admin.cache-emails",
		parentId: "root",
		path: "/api/admin/cache-emails",
		index: void 0,
		caseSensitive: void 0,
		module: api_admin_cache_emails_exports
	},
	"routes/api.admin.reset": {
		id: "routes/api.admin.reset",
		parentId: "root",
		path: "/api/admin/reset",
		index: void 0,
		caseSensitive: void 0,
		module: api_admin_reset_exports
	}
};
var allowedActionOrigins = false;
//#endregion
export { allowedActionOrigins, server_manifest_default as assets, assetsBuildDirectory, basename, entry, future, isSpaMode, prerender, publicPath, routeDiscovery, routes, ssr };
