import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const widgetCode = `(function(){

if(window.terreaLoaded) return;
window.terreaLoaded = true;

const style = document.createElement("style");
style.innerHTML = \`
#terrea-floating{
  position:fixed;bottom:20px;right:20px;width:60px;height:60px;
  background:#000;color:#fff;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  font-size:26px;cursor:pointer;z-index:999999;
  box-shadow:0 6px 20px rgba(0,0,0,.25);
  transition:transform .2s;
}
#terrea-floating:hover{transform:scale(1.1);}
#terrea-popup{
  position:fixed;top:0;left:0;width:100%;height:100%;
  background:rgba(0,0,0,.5);display:none;
  align-items:center;justify-content:center;z-index:999999;
}
.terrea-box{
  background:#fff;padding:25px;border-radius:12px;
  width:360px;max-width:90%;box-shadow:0 10px 40px rgba(0,0,0,.2);
  font-family:sans-serif;
}
.terrea-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;}
.terrea-header h3{margin:0;font-size:18px;font-weight:600;}
#terrea-close{cursor:pointer;font-size:20px;opacity:.6;transition:.2s;line-height:1;}
#terrea-close:hover{opacity:1;}
.terrea-balance{
  background:#f5f5f5;border-radius:8px;padding:15px;
  text-align:center;margin-bottom:15px;
}
.terrea-balance-num{font-size:36px;font-weight:700;color:#000;}
.terrea-balance-label{font-size:12px;color:#666;margin-top:4px;}
.terrea-redeem-btn{
  width:100%;padding:12px;background:#000;color:#fff;
  border:none;border-radius:8px;font-size:14px;
  cursor:pointer;transition:opacity .2s;
}
.terrea-redeem-btn:hover{opacity:.8;}
.terrea-redeem-btn:disabled{opacity:.4;cursor:not-allowed;}
.terrea-tx{margin-top:15px;}
.terrea-tx-title{font-size:12px;color:#999;margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em;}
.terrea-tx-item{
  display:flex;justify-content:space-between;
  padding:6px 0;border-bottom:1px solid #f0f0f0;font-size:13px;
}
.terrea-tx-plus{color:#22c55e;font-weight:600;}
.terrea-tx-minus{color:#ef4444;font-weight:600;}
.terrea-login{text-align:center;padding:20px;color:#666;font-size:14px;}
.terrea-msg{text-align:center;padding:10px;font-size:13px;border-radius:6px;margin-top:10px;}
.terrea-msg.success{background:#f0fdf4;color:#166534;}
.terrea-msg.error{background:#fef2f2;color:#991b1b;}
\`;
document.head.appendChild(style);

const button = document.createElement("div");
button.id = "terrea-floating";
button.innerHTML = "🎁";
document.body.appendChild(button);

const popup = document.createElement("div");
popup.id = "terrea-popup";
popup.innerHTML = \`
<div class="terrea-box">
  <div class="terrea-header">
    <h3>Terrea Rewards</h3>
    <span id="terrea-close">✕</span>
  </div>
  <div id="terrea-content"><div class="terrea-login">Загрузка...</div></div>
</div>
\`;
document.body.appendChild(popup);

function getCustomerId(){
  const meta = document.querySelector('meta[name="customer-id"]');
  return meta ? meta.getAttribute("content") : null;
}

async function loadWallet(){
  const customerId = getCustomerId();
  const content = document.getElementById("terrea-content");

  if(!customerId){
    content.innerHTML = \`<div class="terrea-login">
      <div style="font-size:32px;margin-bottom:10px">🎁</div>
      <p>Войдите в аккаунт чтобы увидеть ваши баллы</p>
      <a href="/account/login" style="color:#000;font-weight:600">Войти →</a>
    </div>\`;
    return;
  }

  content.innerHTML = \`<div class="terrea-login">Загрузка...</div>\`;

  try {
    const res = await fetch("/apps/rewards/wallet?customer_id=" + customerId);
    const data = await res.json();

    let txHtml = "";
    if(data.transactions && data.transactions.length > 0){
      txHtml = \`<div class="terrea-tx">
        <div class="terrea-tx-title">История</div>
        \${data.transactions.map(t => \`
          <div class="terrea-tx-item">
            <span>\${t.description || t.type}</span>
            <span class="\${t.amount > 0 ? 'terrea-tx-plus' : 'terrea-tx-minus'}">\${t.amount > 0 ? '+' : ''}\${t.amount}</span>
          </div>
        \`).join("")}
      </div>\`;
    }

    const canRedeem = data.balance >= 500;

    content.innerHTML = \`
      <div class="terrea-balance">
        <div class="terrea-balance-num">\${data.balance || 0}</div>
        <div class="terrea-balance-label">баллов накоплено</div>
      </div>
      \${canRedeem ? \`<button class="terrea-redeem-btn" id="terrea-redeem">
        Списать 500 баллов → скидка
      </button>\` : \`<button class="terrea-redeem-btn" disabled>
        Нужно 500 баллов для скидки
      </button>\`}
      <div id="terrea-msg"></div>
      \${txHtml}
    \`;

    if(canRedeem){
      document.getElementById("terrea-redeem").onclick = async () => {
        const btn = document.getElementById("terrea-redeem");
        btn.disabled = true;
        btn.textContent = "Обрабатываем...";
        try {
          const r = await fetch("/apps/rewards/wallet/redeem", {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify({customer_id: customerId, points: 500})
          });
          const d = await r.json();
          if(d.success){
            document.getElementById("terrea-msg").innerHTML = \`<div class="terrea-msg success">
              ✅ Ваш код: <strong>\${d.code}</strong>
            </div>\`;
            setTimeout(loadWallet, 1500);
          } else {
            document.getElementById("terrea-msg").innerHTML = \`<div class="terrea-msg error">Ошибка: \${d.error}</div>\`;
            btn.disabled = false;
            btn.textContent = "Списать 500 баллов → скидка";
          }
        } catch(e){
          document.getElementById("terrea-msg").innerHTML = \`<div class="terrea-msg error">Ошибка соединения</div>\`;
          btn.disabled = false;
        }
      };
    }

  } catch(e) {
    content.innerHTML = \`<div class="terrea-login">Ошибка загрузки. Попробуйте позже.</div>\`;
  }
}

button.onclick = () => {
  popup.style.display = "flex";
  loadWallet();
};

document.addEventListener("click", (e) => {
  if(e.target.id === "terrea-close" || e.target.id === "terrea-popup"){
    popup.style.display = "none";
  }
});

})();`;

  return new Response(widgetCode, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=60",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
