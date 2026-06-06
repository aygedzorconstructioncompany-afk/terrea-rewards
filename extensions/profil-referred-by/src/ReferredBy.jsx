import '@shopify/ui-extensions/preact';
import { render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
const API='https://terrea-rewards-1.onrender.com';
const SHOP='terrea-home-rituals.myshopify.com';
function ReferredBy(){
  const [refLine,setRefLine]=useState(null);
  const [ready,setReady]=useState(false);
  useEffect(()=>{
    async function load(){
      try{
        const token=await shopify.sessionToken.get();
        const payload=JSON.parse(atob(token.split('.')[1]));
        const id=(payload.sub||'').replace('gid://shopify/Customer/','');
        if(!id){setReady(true);return;}
        const res=await fetch(API+'/api/referral/generate?customer_id='+id+'&shop='+SHOP);
        const d=await res.json();
        if(d.referredByName||d.referredBy){
          var n=d.referredByName||d.referredBy;
          setRefLine('Referred by: '+n+(d.referredByName&&d.referredBy?' ('+d.referredBy+')':''));
        }
      }catch(e){console.error('[ref]',e.message);}
      finally{setReady(true);}
    }
    load();
  },[]);
  if(!ready||!refLine)return null;
  return(<s-banner><s-text>{refLine}</s-text></s-banner>);
}
export default async()=>{render(<ReferredBy/>,document.body);};
