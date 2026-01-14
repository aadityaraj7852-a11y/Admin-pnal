export const $ = (id)=>document.getElementById(id);

export function setStatus(text, type="ok"){
  const el = $("statusTxt");
  if(!el) return;
  el.textContent = text;
  el.style.color = type==="ok" ? "#16a34a" : type==="warn" ? "#f59e0b" : "#dc2626";
}

export function renderUser(user){
  const n=$("userName"), e=$("userEmail"), p=$("userPic");
  if(n) n.textContent = user?.name || "Not logged in";
  if(e) e.textContent = user?.email || "—";
  if(p) p.src = user?.picture || "https://i.ibb.co/2FsfXqM/user.png";
}
