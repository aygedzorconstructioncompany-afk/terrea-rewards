<link href="https://fonts.googleapis.com/css2?family=Cabin:wght@400;500;600&display=swap" rel="stylesheet">

<style>
  .sub-wrap { max-width: 860px; margin: 40px auto; font-family: 'Cabin', sans-serif; padding: 0 24px 60px; background: #FFFAE4; color: #212326; }
  .sub-header { margin-bottom: 32px; }
  .sub-header h1 { font-size: 26px; font-weight: 500; color: #1A1B18; margin: 0 0 6px; }
  .sub-header p { font-size: 14px; color: #888; margin: 0; }
  .order-type-wrap { border: 0.5px solid #c8c0b0; border-radius: 6px; overflow: hidden; margin-bottom: 28px; }
  .order-option { display: flex; align-items: flex-start; gap: 16px; padding: 20px 24px; }
  .order-option.sub { background: #f5f0e0; }
  .radio-wrap { width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0; margin-top: 2px; display: flex; align-items: center; justify-content: center; }
  .radio-filled { border: 1.5px solid #1A1B18; background: #1A1B18; }
  .radio-dot { width: 8px; height: 8px; border-radius: 50%; background: #FFFAE4; }
  .opt-desc { font-size: 12px; color: #888; line-height: 1.5; }
  .sub-config { background: #fff; border-radius: 6px; padding: 20px; margin-top: 14px; border: 0.5px solid #ddd5c0; }
  .warning-box { background: #fff8e8; border: 0.5px solid #e0cc88; border-radius: 6px; padding: 14px 16px; display: flex; gap: 12px; align-items: flex-start; }
  .warn-icon { width: 18px; height: 18px; border-radius: 50%; background: #1A1B18; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; font-size: 11px; color: #fff; font-weight: 700; }
  .warn-text { font-size: 12px; color: #1A1B18; line-height: 1.6; }
  .warn-text strong { color: #1A1B18; font-weight: 600; }
  .section-label { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #888; margin-bottom: 16px; font-weight: 500; }
  .products-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 28px; }
  .product-card { border: 0.5px solid #e0d8c8; border-radius: 6px; padding: 14px; background: #fff; cursor: pointer; position: relative; transition: border-color 0.2s; }
  .product-card.selected { border-color: #1A1B18; background: #f5f0e0; }
  .product-card-check { position: absolute; top: 10px; right: 10px; width: 20px; height: 20px; border-radius: 50%; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; font-size: 11px; }
  .product-card.selected .product-card-check { background: #1A1B18; border-color: #1A1B18; color: #FFFAE4; }
  .product-img { width: 100%; height: 80px; background: #f0ece0; border-radius: 4px; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; font-size: 28px; overflow: hidden; }
  .product-img img { width: 100%; height: 100%; object-fit: cover; }
  .product-name { font-size: 12px; color: #1A1B18; font-weight: 500; margin-bottom: 4px; line-height: 1.3; }
  .product-price { font-size: 13px; color: #888; }
  .btn-sub { width: 100%; padding: 16px; background: #1A1B18; color: #FFFAE4; border: none; border-radius: 4px; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; cursor: pointer; font-family: 'Cabin', sans-serif; font-weight: 500; transition: opacity 0.2s; margin-bottom: 10px; }
  .btn-sub:hover { opacity: 0.85; }
  .btn-sub:disabled { opacity: 0.4; cursor: not-allowed; }
  .manage-section { margin-top: 40px; padding-top: 32px; border-top: 0.5px solid #e0d8c8; }
  .manage-card { border: 0.5px solid #d0c8b8; border-radius: 6px; overflow: hidden; margin-bottom: 16px; }
  .manage-top { background: #fff; padding: 20px 24px; }
  .manage-status { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
  .status-pulse { width: 9px; height: 9px; border-radius: 50%; background: #22c55e; flex-shrink: 0; }
  .status-pulse.paused { background: #888; }
  .status-text { font-size: 15px; font-weight: 500; color: #1A1B18; }
  .status-hint { font-size: 12px; color: #888; }
  .manage-btns { display: grid; grid-template-columns: 1fr 1fr; }
  .manage-btn { padding: 14px; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; border: none; cursor: pointer; font-family: 'Cabin', sans-serif; font-weight: 500; transition: opacity 0.2s; }
  .manage-btn:hover { opacity: 0.8; }
  .manage-btn-mod { background: #f0ece0; color: #1A1B18; }
  .manage-btn-cancel { background: #1A1B18; color: #FFFAE4; }
  .manage-msg { font-size: 12px; min-height: 18px; padding: 8px 24px; }
  .no-sub-box { text-align: center; padding: 40px 20px; background: #fff; border: 0.5px solid #e0d8c8; border-radius: 6px; }
  .no-sub-box p { font-size: 14px; color: #888; margin: 0 0 6px; }
  .no-sub-box span { font-size: 12px; color: #bbb; }
  .msg { font-size: 13px; padding: 12px 16px; border-radius: 6px; margin-top: 12px; display: none; }
  .msg.success { background: #f0fdf4; color: #166534; display: block; }
  .msg.error { background: #fef2f2; color: #991b1b; display: block; }
  .login-box { text-align: center; padding: 80px 20px; }
  .login-box p { font-size: 15px; color: #888; margin: 0 0 12px; }
  .login-box .login-hint { font-size: 12px; color: #aaa; margin: 0 0 20px; }
  .login-box a.login-btn { display: inline-block; padding: 13px 32px; background: #1A1B18; color: #FFFAE4; border-radius: 4px; text-decoration: none; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; }
  @media (max-width: 600px) {
    .products-grid { grid-template-columns: 1fr 1fr; }
  }
</style>

<div class="sub-wrap">
  {% if customer %}

  <div class="sub-header">
    <h1>Subscribe & Save</h1>
  </div>

  <div style="background:#fff;border:0.5px solid #e0d8c8;border-radius:8px;padding:28px 32px;margin-bottom:32px;">
    <p style="font-size:18px;font-weight:500;color:#1A1B18;margin:0 0 6px;font-family:'Cabin',sans-serif;">Set your home care on repeat</p>
    <p style="font-size:13px;color:#888;margin:0 0 24px;font-family:'Cabin',sans-serif;">Choose your favourites, and we'll renew your order each month.</p>
    <p style="font-size:11px;font-weight:600;color:#1A1B18;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 16px;font-family:'Cabin',sans-serif;">With Terréa Circle, your care comes back to you: in form of rewards</p>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">
      <div style="background:#FFFAE4;border-radius:6px;padding:14px;"><p style="font-size:13px;font-weight:600;color:#1A1B18;margin:0 0 4px;font-family:'Cabin',sans-serif;">Start 10%</p><p style="font-size:11px;color:#888;margin:0;font-family:'Cabin',sans-serif;">Months 1–3<br>(paid on the 4th month)</p></div>
      <div style="background:#FFFAE4;border-radius:6px;padding:14px;"><p style="font-size:13px;font-weight:600;color:#1A1B18;margin:0 0 4px;font-family:'Cabin',sans-serif;">Stay 15%</p><p style="font-size:11px;color:#888;margin:0;font-family:'Cabin',sans-serif;">Months 4–6<br>(paid on the 7th month)</p></div>
      <div style="background:#FFFAE4;border-radius:6px;padding:14px;"><p style="font-size:13px;font-weight:600;color:#1A1B18;margin:0 0 4px;font-family:'Cabin',sans-serif;">Belong 20%</p><p style="font-size:11px;color:#888;margin:0;font-family:'Cabin',sans-serif;">Months 7–9<br>(paid on the 10th month)</p></div>
      <div style="background:#FFFAE4;border-radius:6px;padding:14px;"><p style="font-size:13px;font-weight:600;color:#1A1B18;margin:0 0 4px;font-family:'Cabin',sans-serif;">Belong+ — 20%</p><p style="font-size:11px;color:#888;margin:0;font-family:'Cabin',sans-serif;">Month 10+<br>(paid every month)</p></div>
    </div>
    <p style="font-size:12px;color:#888;margin:0;border-top:0.5px solid #e0d8c8;padding-top:16px;font-family:'Cabin',sans-serif;">Rewards are added to your Terréa Wallet and can be used towards your next order.</p>
  </div>

  <div class="order-type-wrap">
    <div class="order-option sub">
      <div class="radio-wrap radio-filled"><div class="radio-dot"></div></div>
      <div style="flex:1;">
        <p class="opt-desc" style="margin-bottom:14px;">Your order will be created automatically every month. Earn cashback on every order.</p>
        <div class="sub-config">
          <div class="warning-box">
            <div class="warn-icon">!</div>
            <p class="warn-text"><strong>Important:</strong> This is an automatic monthly order. Your saved payment method will be charged 30 days after your order is placed. You can pause or cancel at any time.</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <p class="section-label">Select products</p>
  <div class="products-grid" id="products-grid">
    <div style="text-align:center;padding:40px;color:#bbb;grid-column:1/-1;font-size:13px;">Loading products...</div>
  </div>

  <div class="manage-section">
    <p class="section-label">Your current subscription</p>
    <div id="manage-area">
      <div style="text-align:center;padding:20px;color:#bbb;font-size:13px;">Loading...</div>
    </div>
  </div>

{% else %}
<div class="login-box">
  <p>Please log in to manage your subscription</p>
  {% if request.query_string contains 'ref=' %}
  <p class="login-hint">After logging in you'll receive a referral bonus on your first order.</p>
  <a class="login-btn" href="/account/register">Create an account</a>
  {% else %}
  <a class="login-btn" href="/account/login">Log In</a>
  {% endif %}
</div>
{% endif %}
</div>

<script>
var API = "https://terrea-rewards-1.onrender.com";
var SHOP = "terrea-home-rituals.myshopify.com";
var customerId = "{{ customer.id }}";

fetch('/cart/clear.js', { method: 'POST' }).catch(function(){});

var urlParams = new URLSearchParams(window.location.search);
var urlRef = urlParams.get('ref');
if (urlRef) {
  var refCode = urlRef.toUpperCase();
  document.cookie = 'terrea_ref=' + refCode + '; path=/; max-age=86400';
  try { localStorage.setItem('terrea_ref_code', refCode); } catch(e) {}
}

var selectedProducts = [];
var productSellingPlans = {};

async function loadProducts() {
  try {
    var res = await fetch('/collections/all/products.json?limit=250');
    var data = await res.json();
    var grid = document.getElementById('products-grid');
    if (!data.products || data.products.length === 0) {
      grid.innerHTML = '<div style="text-align:center;padding:40px;color:#bbb;grid-column:1/-1;">No products found</div>';
      return;
    }
    for (var i = 0; i < data.products.length; i++) {
      var p = data.products[i];
      try {
        var planRes = await fetch('/products/' + p.handle + '.js');
        var planData = await planRes.json();
        if (planData.selling_plan_groups && planData.selling_plan_groups.length > 0) {
          productSellingPlans[p.id] = planData.selling_plan_groups[0].selling_plans[0].id;
        }
      } catch(e) {}
    }
    grid.innerHTML = data.products.map(function(p) {
      var img = p.images && p.images[0] ? '<img loading="lazy" src="' + p.images[0].src + '" alt="' + p.title + '">' : '🧴';
      var imgSrc = p.images && p.images[0] ? p.images[0].src : '';
      var priceVal = p.variants && p.variants[0] ? parseFloat(p.variants[0].price).toFixed(2) : '0';
      var priceDisplay = p.variants && p.variants[0] ? '£' + priceVal : '';
      return '<div class="product-card" onclick="toggleProduct(this,\'' + p.id + '\',\'' + p.variants[0].id + '\',\'' + p.handle + '\',\'' + priceVal + '\',\'' + imgSrc.replace(/'/g, '') + '\',\'' + p.title.replace(/'/g, '').replace(/"/g, '') + '\')" data-product-id="' + p.id + '" data-variant-id="' + p.variants[0].id + '" data-img="' + imgSrc + '" data-title="' + p.title.replace(/"/g, '&quot;') + '">' +
        '<div class="product-card-check">✓</div>' +
        '<div class="product-img">' + img + '</div>' +
        '<p class="product-name">' + p.title + '</p>' +
        '<p class="product-price">' + priceDisplay + '</p>' +
        '</div>';
    }).join('');
  } catch(e) {
    document.getElementById('products-grid').innerHTML = '<div style="text-align:center;padding:40px;color:#bbb;grid-column:1/-1;">Error loading products</div>';
  }
}

function toggleProduct(el, productId, variantId, handle, price, imgSrc, title) {
  el.classList.toggle('selected');
  var idx = selectedProducts.findIndex(function(p) { return p.productId === productId; });
  if (idx > -1) { selectedProducts.splice(idx, 1); }
  else { selectedProducts.push({ productId: productId, variantId: variantId, handle: handle, price: price, imgSrc: imgSrc, title: title }); }
}

async function confirmOrder() {
  if (selectedProducts.length === 0) { showMsg('Please select at least one product', 'error'); return; }
  var btn = document.getElementById('btn-confirm');
  if (btn) { btn.disabled = true; btn.textContent = 'Processing...'; }
  try {
    var items = selectedProducts.map(function(p) {
      var item = { id: parseInt(p.variantId), quantity: 1 };
      if (productSellingPlans[p.productId]) { item.selling_plan = productSellingPlans[p.productId]; }
      return item;
    });

    var clearRes = await fetch('/cart/clear.js', { method: 'POST' });
    if (clearRes.status === 403) { window.location.reload(); return; }

    var cartRes = await fetch('/cart/add.js', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items })
    });
    if (cartRes.status === 403) { window.location.reload(); return; }

    var cartData = await cartRes.json();

    if (cartData.items && cartData.items.length > 0) {
      try {
        // Получаем текущие данные подписки
        var subRes = await fetch(API + '/api/subscription?customer_id=' + customerId + '&shop=' + SHOP);
        var subData = await subRes.json();
        var existing = subData.subscribedProducts || [];
        var existingDetails = subData.productDetails || [];

        // Добавляем новые product_id
        selectedProducts.forEach(function(p) {
          if (!existing.includes(String(p.productId))) {
            existing.push(String(p.productId));
          }
        });

        // Добавляем детали товаров
        cartData.items.forEach(function(item) {
          var found = existingDetails.find(function(e) { return String(e.id) === String(item.product_id); });
          if (!found) {
            existingDetails.push({
              id: String(item.product_id),
              title: item.product_title,
              images: item.image ? [{ src: item.image }] : []
            });
          }
        });

        // Сохраняем товары
        await fetch(API + '/api/subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_id: customerId,
            shop: SHOP,
            action: 'update_products',
            products: existing,
            productDetails: existingDetails
          })
        });

        // Всегда активируем подписку при новом заказе
        await fetch(API + '/api/subscription/manage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_id: customerId,
            shop: SHOP,
            action: 'resume'
          })
        });

        console.log('[subscription] Products saved and status set to active:', existing);
      } catch(e) {
        console.log('[subscription] Could not save products:', e);
      }

      window.location.href = '/checkout';

    } else {
      showMsg('Error adding products to cart. Please try again.', 'error');
      if (btn) { btn.disabled = false; btn.textContent = 'Confirm subscription order'; }
    }
  } catch(e) {
    showMsg('Error: ' + e.message, 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Confirm subscription order'; }
  }
}

async function loadManage() {
  if (!customerId) return;
  try {
    var res = await fetch(API + '/api/subscription?customer_id=' + customerId + '&shop=' + SHOP);
    var data = await res.json();
    var area = document.getElementById('manage-area');
    if (!data || !data.startedAt || data.status === 'cancelled' || data.status === 'canceled') {
      area.innerHTML = '<div class="no-sub-box"><p>No active subscription yet</p><span>Create one above to start earning cashback rewards</span></div>' +
        '<div class="manage-btns" style="grid-template-columns:1fr;">' +
        '<button class="manage-btn manage-btn-cancel" id="btn-confirm" onclick="confirmOrder()">Confirm subscription order</button>' +
        '</div>';
      return;
    }
    var isActive = data.active !== false && data.status !== 'paused';
    var pulseClass = isActive ? 'status-pulse' : 'status-pulse paused';
    var statusText = isActive ? 'Active subscription' : 'Paused subscription';
    var statusHint = isActive ? 'Running · Next charge on order generation' : 'Paused — progress saved';
    area.innerHTML = '<div class="manage-card">' +
      '<div class="manage-top">' +
        '<div class="manage-status">' +
          '<div class="' + pulseClass + '"></div>' +
          '<div><div class="status-text">' + statusText + '</div><div class="status-hint">' + statusHint + '</div></div>' +
        '</div>' +
      '</div>' +
      '<div class="manage-btns" style="grid-template-columns:1fr 1fr;">' +
        '<button class="manage-btn manage-btn-cancel" id="btn-confirm" onclick="confirmOrder()">Confirm subscription order</button>' +
        '<a href="/pages/my-subscriptions" class="manage-btn manage-btn-mod" style="display:flex;align-items:center;justify-content:center;text-decoration:none;">Manage orders</a>' +
      '</div>' +
      '<p id="manage-msg" class="manage-msg"></p>' +
    '</div>';
  } catch(e) {
    document.getElementById('manage-area').innerHTML = '<div class="no-sub-box"><p>Could not load subscription</p></div>';
  }
}

function showMsg(text, type) {
  var el = document.getElementById('order-msg');
  if (!el) return;
  el.className = 'msg ' + type; el.textContent = text;
}

window.onload = function() {
  loadProducts();
  loadManage();
  if (urlRef && customerId) {
    fetch(API + '/api/referral/apply', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({customer_id: customerId, code: urlRef.toUpperCase(), shop: SHOP})
    })
    .then(function(r){ return r.json(); })
    .then(function(d){ if (d.success) console.log('[referral] Applied on subscribe page'); });
  }
};
</script>

{% schema %}
{
  "name": "Subscribe & Save Page",
  "settings": []
}
{% endschema %}
