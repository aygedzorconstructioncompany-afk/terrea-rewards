// app/routes/widget[.js].tsx

import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const widgetScript = `
(function() {
  'use strict';

  // Ждём загрузки DOM
  function init() {
    // Получаем customer ID из meta тега (установленного в theme.liquid)
    const customerMeta = document.querySelector('meta[name="customer-id"]');
    const customerId = customerMeta ? customerMeta.getAttribute('content') : null;

    if (!customerId) return; // Не авторизован — не показываем виджет

    const API_BASE = 'https://terrea-rewards-1.onrender.com';

    // Создаём виджет
    const widget = document.createElement('div');
    widget.id = 'terrea-rewards-widget';
    widget.style.cssText = [
      'position: fixed',
      'bottom: 24px',
      'right: 24px',
      'z-index: 9999',
      'background: #fff',
      'border: 1px solid #e0e0e0',
      'border-radius: 12px',
      'padding: 16px 20px',
      'box-shadow: 0 4px 20px rgba(0,0,0,0.1)',
      'font-family: sans-serif',
      'font-size: 14px',
      'cursor: pointer',
      'min-width: 180px',
    ].join(';');

    widget.innerHTML = '<span>🌿 Загрузка баллов...</span>';
    document.body.appendChild(widget);

    // Загружаем баллы
    fetch(API_BASE + '/api/points/' + customerId)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        widget.innerHTML = '<span>🌿 Ваши баллы: <strong>' + (data.points || 0) + '</strong></span>';
        widget.addEventListener('click', function() {
          window.location.href = '/pages/rewards';
        });
      })
      .catch(function() {
        widget.remove();
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
`;

  return new Response(widgetScript, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
