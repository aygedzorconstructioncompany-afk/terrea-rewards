function closeRewards() {
  document.getElementById('terrea-rewards-popup').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function() {
  const button = document.getElementById('terrea-rewards-button');
  if (button) {
    button.addEventListener('click', function() {
      const popup = document.getElementById('terrea-rewards-popup');
      const isVisible = popup.style.display === 'block';
      popup.style.display = isVisible ? 'none' : 'block';
      if (!isVisible && window.terreaCustomerId) {
        fetchRewardsData();
      } else if (!isVisible) {
        document.getElementById('rewards-balance').innerText = 'Please log in to see your rewards';
      }
    });
  }
});

function fetchRewardsData() {
  const balanceEl = document.getElementById('rewards-balance');
  const historyEl = document.getElementById('rewards-history');
  const redeemEl = document.getElementById('rewards-redeem');

  balanceEl.innerText = 'Loading...';

  fetch('/apps/proxy/api/wallet?customer_id=' + window.terreaCustomerId)
    .then(res => res.json())
    .then(data => {
      const balance = data.balance || 0;
      balanceEl.innerHTML = '<strong>' + balance + ' points</strong>';

      if (data.transactions && data.transactions.length > 0) {
        let html = '<hr><p><strong>Recent Activity:</strong></p>';
        data.transactions.slice(0, 5).forEach(t => {
          const sign = t.amount > 0 ? '+' : '';
          html += '<div>' + (t.description || t.type) + ': <b>' + sign + t.amount + ' pts</b></div>';
        });
        historyEl.innerHTML = html;
      }

      if (balance >= 500) {
        redeemEl.innerHTML = '<hr><button onclick="redeemPoints()" style="background:#008060;color:white;padding:8px 16px;border:none;border-radius:4px;cursor:pointer;">Redeem 500 pts → Get Discount</button>';
      } else {
        redeemEl.innerHTML = '<hr><p style="color:#666;">Earn ' + (500 - balance) + ' more points to get a discount!</p>';
      }
    })
    .catch(() => {
      balanceEl.innerText = 'Error loading rewards';
    });
}

function redeemPoints() {
  fetch('/apps/proxy/api/wallet/redeem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer_id: window.terreaCustomerId, points: 500 })
  })
  .then(res => res.json())
  .then(data => {
    if (data.code) {
      alert('🎉 Your discount code: ' + data.code + '\n\nUse it at checkout!');
      fetchRewardsData();
    } else {
      alert(data.error || 'Error');
    }
  });
}