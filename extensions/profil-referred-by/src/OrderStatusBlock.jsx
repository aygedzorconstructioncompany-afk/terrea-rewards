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
        if (d && d.referredByName) setReferredByName(d.referredByName);
        if (d && d.referredBy)     setReferredBy(d.referredBy);
      } catch (e) {
        console.error('[profil-referred-by]', e.message);
      } finally {
        setReady(true);
      }
    }
    load();
  }, []);

  if (!ready) return null;

  // Формируем текст Referred by
  var refText = null;
  if (referredByName && referredBy) {
    refText = 'Referred by: ' + referredByName + ' (' + referredBy + ')';
  } else if (referredByName) {
    refText = 'Referred by: ' + referredByName;
  } else if (referredBy) {
    refText = 'Referred by: ' + referredBy;
  }

  return (
    <s-banner>
      {refText ? (
        <s-text>{refText}</s-text>
      ) : null}
      <s-text>
        <s-link href="https://terrea.co.uk/pages/profile" target="_top">
          Edit email & profile →
        </s-link>
      </s-text>
    </s-banner>
  );
}

export default async () => {
  render(<Extension />, document.body);
};