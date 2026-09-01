let selected = null;
let couponData = null;

async function loadProducts(){
  const r = await fetch("/api/products");
  const ps = await r.json();
  document.querySelector("#products").innerHTML = ps.map(p => `
    <article class="card">
      <h3>${esc(p.name)}</h3>
      <p class="muted">${esc(p.description || "")}</p>
      <div class="price">R$ ${p.price.toFixed(2).replace(".",",")}</div>
      <p class="muted">${p.stock} em estoque</p>
      <button ${p.stock <= 0 ? "disabled" : ""} onclick='selectProduct(${JSON.stringify(p)})'>Comprar</button>
    </article>`).join("");
}
function selectProduct(p){
  selected=p;
  document.querySelector("#checkout").classList.remove("hidden");
  document.querySelector("#selected").innerHTML=`<div class="card"><b>${esc(p.name)}</b><div class="price">R$ ${p.price.toFixed(2).replace(".",",")}</div></div>`;
  scrollTo({top:document.querySelector("#checkout").offsetTop-80,behavior:"smooth"});
}
async function checkCoupon(){
  const code=document.querySelector("#coupon").value;
  const box=document.querySelector("#couponMsg");
  couponData=null;
  if(!code){box.textContent="Digite um cupom.";return}
  const r=await fetch("/api/coupons/check",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code})});
  const d=await r.json();
  if(!r.ok){box.textContent=d.error;return}
  couponData=d;
  box.textContent=`Cupom aplicado: ${d.type==="percent"?d.value+"%":"R$ "+d.value.toFixed(2)}`;
}
async function createOrder(){
  if(!selected)return;
  const discordUser=document.querySelector("#discordUser").value.trim();
  if(!discordUser)return alert("Informe seu usuário/ID do Discord.");
  const r=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId:selected.id,quantity:1,couponCode:couponData?.code||"",discordUser})});
  const d=await r.json();
  const box=document.querySelector("#payment");
  if(!r.ok){box.textContent=d.error;return}
  box.innerHTML=`<b>Pedido criado:</b> ${d.orderId}<br><br>
  <b>Total:</b> R$ ${d.total.toFixed(2).replace(".",",")}<br><br>
  <strong>Pix:</strong> ${esc(d.payment.message)}<br>
  <small>Quando a API Pix do Inter estiver configurada, este bloco pode mostrar o QR Code/copia e cola e o webhook liberará o produto automaticamente.</small>`;
}
async function addProduct(e){
  e.preventDefault(); const key=document.querySelector("#adminKey").value;
  const body={name:pName.value,description:pDesc.value,price:Number(pPrice.value),stock:Number(pStock.value),delivery:pDelivery.value};
  const r=await fetch("/api/admin/products",{method:"POST",headers:{"Content-Type":"application/json","x-admin-key":key},body:JSON.stringify(body)});
  document.querySelector("#adminOutput").textContent=JSON.stringify(await r.json(),null,2); loadProducts();
}
async function addCoupon(e){
  e.preventDefault(); const key=document.querySelector("#adminKey").value;
  const body={code:cCode.value,type:cType.value,value:Number(cValue.value)};
  const r=await fetch("/api/admin/coupons",{method:"POST",headers:{"Content-Type":"application/json","x-admin-key":key},body:JSON.stringify(body)});
  document.querySelector("#adminOutput").textContent=JSON.stringify(await r.json(),null,2);
}
async function loadAdmin(){
  const key=document.querySelector("#adminKey").value;
  const h={"x-admin-key":key};
  const [p,o]=await Promise.all([fetch("/api/admin/products",{headers:h}),fetch("/api/admin/orders",{headers:h})]);
  document.querySelector("#adminOutput").textContent=JSON.stringify({products:await p.json(),orders:await o.json()},null,2);
}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
loadProducts();
