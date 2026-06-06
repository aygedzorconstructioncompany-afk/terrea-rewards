import '@shopify/ui-extensions/preact';
import { render } from 'preact';
import { useState, useEffect } from 'preact/hooks';

const API  = 'https://terrea-rewards-1.onrender.com';
const SHOP = 'terrea-home-rituals.myshopify.com';

function Extension() {
  const [cid,           setCid]           = useState(null);
  const [referredBy,    setReferredBy]    = useState(null);
  const [referredByName,setReferredByName]= useState(null);
  const [currentEmail,  setCurrentEmail]  = useState('');
  const [newEmail,      setNewEmail]      = useState('');
  const [editing,       setEditing]       = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [message,       setMessage]       = useState(null);
  const [ready,         setReady]         = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const token   = await shopify.sessionToken.get();
        const payload = JSON.parse(atob(token.split('.')[1]));
        const id      = (payload.sub || '').replace('gid://shopify/Customer/', '');
        if (!id) { setReady(true); return; }
        setCid(id);

        const res = await fetch(
          `${API}/api/referral/generate?customer_id=${id}&shop=${SHOP}`
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

  async function handleSave() {
    if (!newEmail || !cid) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`${API}/api/customer/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: cid, email: newEmail, shop: SHOP }),
      });
      const d = await res.json();
      if (d.success) {
        setCurrentEmail(newEmail);
        setEditing(false);
        setMessage('✓ Email updated! Please check your inbox to confirm.');
      } else {
        setMessage('Error: ' + (d.error || 'Unknown error'));
      }
    } catch (e) {
      setMessage('Error: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  if (!ready) return null;

  return (
    <s-banner>
      {(referredByName || referredBy) && (
        <s-text>
          Referred by: {referredByName || referredBy}
          {referredByName && referredBy ? ` (${referredBy})` : ''}
        </s-text>
      )}
      {message && <s-text>{message}</s-text>}
      {!editing && (
        <s-text>
          {'  '}
          <s-link onClick={() => { setEditing(true); setNewEmail(''); }}>
            Edit email
          </s-link>
        </s-text>
      )}
      {editing && (
        <s-text>
          New email: {newEmail}
          {' | '}
          <s-link onClick={handleSave}>{saving ? 'Saving...' : 'Save'}</s-link>
          {' '}
          <s-link onClick={() => setEditing(false)}>Cancel</s-link>
        </s-text>
      )}
    </s-banner>
  );
}

export default async () => {
  render(<Extension />, document.body);
};