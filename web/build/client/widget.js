(function(){

if(window.terreaLoaded) return;
window.terreaLoaded = true;

/* CSS ВИДЖЕТА */
const style = document.createElement("style");
style.innerHTML = `
#terrea-floating{
position:fixed;
bottom:20px;
right:20px;
width:60px;
height:60px;
background:#000;
color:#fff;
border-radius:50%;
display:flex;
align-items:center;
justify-content:center;
font-size:26px;
cursor:pointer;
z-index:999999;
box-shadow:0 6px 20px rgba(0,0,0,.25);
}

#terrea-popup{
position:fixed;
top:0;
left:0;
width:100%;
height:100%;
background:rgba(0,0,0,.5);
display:none;
align-items:center;
justify-content:center;
z-index:999999;
}

.terrea-box{
background:#fff;
padding:25px;
border-radius:12px;
width:360px;
max-width:90%;
box-shadow:0 10px 40px rgba(0,0,0,.2);
}

/* HEADER */

.terrea-header{
display:flex;
justify-content:space-between;
align-items:center;
margin-bottom:15px;
}

.terrea-header h3{
margin:0;
font-size:18px;
}

/* CLOSE BUTTON */

#terrea-close{
cursor:pointer;
font-size:20px;
opacity:.6;
transition:.2s;
}

#terrea-close:hover{
opacity:1;
}
`;
document.head.appendChild(style);

/* КНОПКА */
const button = document.createElement("div");
button.id = "terrea-floating";
button.innerHTML = "🎁";

document.body.appendChild(button);

/* POPUP */
const popup = document.createElement("div");
popup.id = "terrea-popup";

popup.innerHTML = `
<div class="terrea-box">

<div class="terrea-header">
<h3>Terrea Rewards</h3>
<span id="terrea-close">✕</span>
</div>

<div id="terrea-content">
Loading...
</div>

</div>
`;

document.body.appendChild(popup);

/* OPEN POPUP */
button.onclick = async () => {

popup.style.display = "flex";

const res = await fetch("/apps/rewards/wallet");

const html = await res.text();

document.getElementById("terrea-content").innerHTML = html;

};


/* CLOSE */
document.addEventListener("click",(e)=>{

if(e.target.id === "terrea-close"){
popup.style.display = "none";
}

});