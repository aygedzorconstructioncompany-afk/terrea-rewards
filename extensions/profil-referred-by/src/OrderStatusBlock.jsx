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
      if(d.success){setMsg({ok:true,text:'✓ Email updated! Check your inbox.'});setTimeout(()=>setEditing(false),2500);}
      else{setMsg({ok:false,text:'Error: '+(d.error||'Unknown')});}
    }catch(e){setMsg({ok:false,text:'Error: '+e.message});}
    finally{setSaving(false);}
  }
  if(!ready)return null;
  var name=refName||referredBy;
  var refLine=name?('Referred by: '+name+(refName&&referredBy?' ('+referredBy+')':'')):null;
  if(editing){return(<s-banner><div style="padding:2px 0"><div style="font-size:12px;color:#555;margin-bottom:6px;font-weight:500">Edit email address</div><input type="email" value={newEmail} onInput={(e)=>setNewEmail(e.target.value)} placeholder="new@email.com" style="width:100%;padding:8px 10px;border:1px solid #ccc;border-radius:5px;font-size:14px;box-sizing:border-box;margin-bottom:8px;outline:none"/>{msg&&(<div style={'font-size:12px;margin-bottom:8px;color:'+(msg.ok?'#2d7a2d':'#c0392b')}>{msg.text}</div>)}<div style="display:flex;gap:8px"><button onClick={handleSave} disabled={saving} style="padding:7px 16px;background:#1A1B18;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px">{saving?'Saving...':'Save'}</button><button onClick={()=>{setEditing(false);setMsg(null);}} style="padding:7px 16px;background:transparent;color:#666;border:1px solid #ccc;border-radius:4px;cursor:pointer;font-size:12px">Cancel</button></div></div></s-banner>);}
  return(<s-banner><s-text><button onClick={()=>{setEditing(true);setNewEmail('');setMsg(null);}} style="background:none;border:none;cursor:pointer;text-decoration:underline;color:inherit;font:inherit;padding:0">Edit email</button>{refLine?('  ·  '+refLine):''}</s-text></s-banner>);
}
export default async()=>{render(<Extension/>,document.body);};
