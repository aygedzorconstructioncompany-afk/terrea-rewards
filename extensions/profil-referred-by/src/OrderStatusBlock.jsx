import '@shopify/ui-extensions/preact';
import { render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
const API  = 'https://terrea-rewards-1.onrender.com';
const SHOP = 'terrea-home-rituals.myshopify.com';
function Extension() {
  const [debug, setDebug] = useState('loading...');
  useEffect(() => {
    async function load() {
      try {
        const token   = await shopify.sessionToken.get();
        const payload = JSON.parse(atob(token.split('.')[1]));
        const cid     = (payload.sub||'').replace('gid://shopify/Customer/','');
        const res = await fetch(API+'/api/referral/generate?customer_id='+cid+'&shop='+SHOP);
        const d = await res.json();
        setDebug(JSON.stringify(d).slice(0,200));
      } catch(e) { setDebug('ERR:'+e.message); }
    }
    load();
  }, []);
  return (<s-banner><s-text>{debug}</s-text></s-banner>);
}
export default async () => { render(<Extension />, document.body); };
