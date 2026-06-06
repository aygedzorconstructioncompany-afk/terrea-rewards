import '@shopify/ui-extensions/preact';
import { render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
const API='https://terrea-rewards-1.onrender.com';
const SHOP='terrea-home-rituals.myshopify.com';
function Extension(){
  const [referredBy,setReferredBy]=useState(null);
  const [refName,setRefName]=useState(null);
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
        if(d.referredByName)setRefName(d.referredByName);
        if(d.referredBy)setReferredBy(d.referredBy);
      }catch(e){console.error('[ref]',e.message);}
      finally{setReady(true);}
    }
    load();
  },[]);
  if(!ready)return null;
  var name=refName||referredBy;
  var refLine=name?('Referred by: '+name+(refName&&referredBy?' ('+referredBy+')':'')):null;
  return(
    <div>
      <s-banner>
        <s-text><s-link href="https://terrea.co.uk/pages/profile#edit-email" target="_top">Edit email</s-link></s-text>
      </s-banner>
      {refLine&&(
        <s-banner>
          <s-text>{refLine}</s-text>
        </s-banner>
      )}
    </div>
  );
}
export default async()=>{render(<Extension/>,document.body);};
