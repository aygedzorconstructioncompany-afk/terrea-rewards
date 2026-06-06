import '@shopify/ui-extensions/preact';
import { render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
const API='https://terrea-rewards-1.onrender.com';
const SHOP='terrea-home-rituals.myshopify.com';
function Extension(){
  const [line2,setLine2]=useState('...');
  const [ready,setReady]=useState(false);
  useEffect(()=>{
    async function load(){
      try{
        const token=await shopify.sessionToken.get();
        const payload=JSON.parse(atob(token.split('.')[1]));
        const id=(payload.sub||'').replace('gid://shopify/Customer/','');
        if(!id){setLine2('');setReady(true);return;}
        const res=await fetch(API+'/api/referral/generate?customer_id='+id+'&shop='+SHOP);
        const d=await res.json();
        if(d.referredByName||d.referredBy){
          var n=d.referredByName||d.referredBy;
          setLine2('Referred by: '+n+(d.referredByName&&d.referredBy?' ('+d.referredBy+')':''));
        } else { setLine2(''); }
      }catch(e){setLine2('');}
      finally{setReady(true);}
    }
    load();
  },[]);
  if(!ready)return null;
  return(
    <s-banner>
      <s-text><s-link href="https://terrea.co.uk/pages/profile#edit-email" target="_top">Edit email</s-link>{'  ' + (line2 ? ('· ' + line2) : '')}</s-text>
    </s-banner>
  );
}
export default async()=>{render(<Extension/>,document.body);};
