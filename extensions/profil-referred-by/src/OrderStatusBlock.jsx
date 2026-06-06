import '@shopify/ui-extensions/preact';
import { render } from 'preact';
import { useState, useEffect } from 'preact/hooks';

const API  = 'https://terrea-rewards-1.onrender.com';
const SHOP = 'terrea-home-rituals.myshopify.com';

function Extension() {
  const [referredBy,     setReferredBy]     = useState(null);
  const [referredByName, setReferredByName] = useState(null);
  const [ready,          setReady]          = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const token   = await shopify.sessionToken.get();
        const payload = JSON.parse(atob(token.split('.')[1]));
        const cid     = (payload.sub || '').replace('gid://shopify/Customer/', '');
        if (!cid) { setReady(true); return; }

        const res = await fetch(
          API + '/api/referral/generate?customer_id=' + cid + '&shop=' + SHOP
        );
        const d = await res.json();
        if (d.referredByName) setReferredByName(d.referredByName);
        if (d.referredBy)     setReferredBy(d.referredBy);
      } catch (e) {
        console.error('[profil-referred-by]', e.message);
      } finally {
        setReady(true);
      }
    }
    load();
  }, []);

  // Ждём загрузки данных
  if (!ready) return null;

  var name = referredByName || referredBy;
  var refLine = name
    ? ('Referred by: ' + name + (referredByName && referredBy ? ' (' + referredBy + ')' : ''))
    : null;

  // Если есть referral — рендерим s-banner с обоими текстами
  if (refLine) {
    return (
      <s-banner>
        <s-text>{refLine}</s-text>
        <s-text>
          <s-link href="https://terrea.co.uk/pages/profile" target="_top">Edit email &amp; profile →</s-link>
        </s-text>
      </s-banner>
    );
  }

  // Если нет referral — только ссылка
  return (
    <s-banner>
      <s-text>
        <s-link href="https://terrea.co.uk/pages/profile" target="_top">Edit email &amp; profile →</s-link>
      </s-text>
    </s-banner>
  );
}

export default async () => {
  render(<Extension />, document.body);
};
