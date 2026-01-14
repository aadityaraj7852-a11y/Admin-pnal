
import { requireAuthOrRedirect, getUser, logout } from "../auth.js";
import { setStatus, renderUser } from "../ui.js";
import { getActiveLabel, loadLabelsSidebar } from "../labels.js";
import { fetchPostsByLabel, publishPost, deletePost } from "../blogger.js";

if(!requireAuthOrRedirect()){}
renderUser(getUser());
document.getElementById("logoutBtn").onclick=()=>{ logout(); window.location.href="/index.html"; };

const activeLabel = getActiveLabel();
await loadLabelsSidebar(activeLabel);

async function loadPosts(){
  const posts = await fetchPostsByLabel(activeLabel, 12);
  const box = document.getElementById("postsBox");
  box.innerHTML="";
  if(!posts.length){
    box.innerHTML=`<div class="mutedSmall">No posts found.</div>`;
    return;
  }
  posts.forEach(p=>{
    const div=document.createElement("div");
    div.className="card";
    div.innerHTML=`
      <div style="font-weight:950;">${p.title||"-"}</div>
      <div class="mutedSmall">Updated: ${new Date(p.updated||p.published||Date.now()).toLocaleString("en-IN")}</div>
      <div style="margin-top:10px;display:flex;gap:10px;flex-wrap:wrap;">
        <a class="btnGhost" target="_blank" href="${p.url}">Open</a>
        <button class="btnGhost" data-del="1">Delete</button>
      </div>`;
    div.querySelector("[data-del]").onclick=async()=>{
      if(!confirm("Delete post?")) return;
      setStatus("Deleting...", "warn");
      await deletePost(p.id);
      setStatus("Deleted ✅", "ok");
      await loadPosts();
    };
    box.appendChild(div);
  });
}
await loadPosts();

import { publishPost } from "../blogger.js";
import { setStatus } from "../ui.js";

function safe(s=""){return String(s||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");}

document.getElementById("publishBtn").onclick = async ()=>{
  const title = document.getElementById("title").value.trim();
  const q = document.getElementById("q").value.trim();
  const A = document.getElementById("a").value.trim();
  const B = document.getElementById("b").value.trim();
  const C = document.getElementById("c").value.trim();
  const D = document.getElementById("d").value.trim();
  const ans = document.getElementById("ans").value.trim().toUpperCase();

  if(!title) return alert("Title required");
  if(!q) return alert("Question required");

  const html = `
  <div style="font-family:Lexend,Arial;line-height:1.6;">
    <h2 style="margin:0;font-weight:900;">${safe(title)}</h2>
    <p style="margin:8px 0 0;font-weight:900;color:#0a0ac2;">✅ ${safe(activeLabel)} • QUIZ</p>

    <div style="margin-top:12px;padding:12px;border:1px solid #e9e9f2;border-radius:18px;background:#fff;">
      <div style="font-weight:950;">Q. ${safe(q)}</div>
      <ol style="margin-top:10px;font-weight:900;">
        <li>${safe(A)}</li>
        <li>${safe(B)}</li>
        <li>${safe(C)}</li>
        <li>${safe(D)}</li>
      </ol>
      <p style="margin-top:10px;font-weight:950;color:#16a34a;">✅ Answer: ${safe(ans||"-")}</p>
    </div>

    <p style="margin-top:14px;font-size:12px;color:#6b7280;font-weight:900;">Mockrise Admin • Auto Generated ✅</p>
  </div>`;

  setStatus("Publishing Quiz...", "warn");
  await publishPost({title, html, labels:[activeLabel,"QUIZ"]});
  setStatus("Published ✅", "ok");

  ["title","q","a","b","c","d","ans"].forEach(id=>document.getElementById(id).value="");
  await loadPosts();
};
