import '@shopify/ui-extensions/preact';
import { render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
const API='https://terrea-rewards-1.onrender.com';
const SHOP='terrea-home-rituals.myshopify.com';
function Extension(){
  const [cid,setCid]=useState(null);
  const [referredBy,setReferredBy]=useState(null);
  const [refName,setRefName]=useState(null);
  const [ready,setReady]=useState(false);
  const [editing,setEditing]=useState(false);
  const [newEmail,setNewEmail]=useState('');
  const [saving,setSaving]=useState(false);
  const [msg,setMsg]=useState(null);
  useEffect(()=>{
    async function load(){
      try{
        const token=await shopify.sessionToken.get();
        const payload=JSON.parse(atob(token.split('.')[1]));
        const id=(payload.sub||'').replace('gid://shopify/Customer/','');
        if(!id){setReady(true);return;}
        setCid(id);
        const res=await fetch(API+'/api/referral/generate?customer_id='+id+'&shop='+SHOP);
        const d=await res.json();
        if(d.referredByName)setRefName(d.referredByName);
        if(d.referredBy)setReferredBy(d.referredBy);
      }catch(e){console.error('[ref]',e.message);}
      finally{setReady(true);}
    }
    load();
  },[]);
  async function handleSave(){
    if(!newEmail||!cid)return;
    setSaving(true);setMsg(null);
    try{
      const res=await fetch(API+'/api/customer/update',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({customer_id:cid,email:newEmail,shop:SHOP})});
      const d=await res.json();
      if(d.success){setMsg({ok:true,text:'Email updated! Check your inbox.'});setTimeout(()=>setEditing(false),2500);}
      else{setMsg({ok:false,text:'Error: '+(d.error||'Unknown')});}
    }catch(e){setMsg({ok:false,text:'Error: '+e.message});}
    finally{setSaving(false);}
  }
  if(!ready)return null;
  var name=refName||referredBy;
  var refLine=name?('Referred by: '+name+(refName&&referredBy?' ('+referredBy+')':'')):null;
  if(editing){return(<s-banner><input type="email" value={newEmail} onInput={(e)=>setNewEmail(e.target.value)} placeholder="new@email.com" style="width:100%;padding:8px 10px;border:1px solid #ccc;border-radius:5px;font-size:14px;box-sizing:border-box;margin:4px 0 8px;display:block"/>{msg&&(<s-text>{msg.text}</s-text>)}<s-text><s-link onClick={handleSave}>{saving?'Saving...':'Save'}</s-link>{'  '}<s-link onClick={()=>{setEditing(false);setMsg(null);}}>Cancel</s-link></s-text></s-banner>);}
  if(refLine){return(<s-banner><s-text><s-link onClick={()=>{setEditing(true);setNewEmail('');setMsg(null);}}>Edit email</s-link>{'  ·  '+refLine}</s-text></s-banner>);}
  return(<s-banner><s-text><s-link onClick={()=>{setEditing(true);setNewEmail('');setMsg(null);}}>Edit email</s-link></s-text></s-banner>);
}
export default async()=>{render(<Extension/>,document.body);};
