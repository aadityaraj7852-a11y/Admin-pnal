
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
  const title=document.getElementById("title").value.trim();
  const gen=document.getElementById("gen").value.trim();
  const obc=document.getElementById("obc").value.trim();
  const sc=document.getElementById("sc").value.trim();
  const st=document.getElementById("st").value.trim();
  if(!title) return alert("Exam name required");

  const html = `
  <div style="font-family:Lexend,Arial;line-height:1.6;">
    <h2 style="margin:0;font-weight:900;">${safe(title)}</h2>
    <p style="margin:8px 0 0;font-weight:900;color:#0a0ac2;">✅ ${safe(activeLabel)} • CUTOFF</p>

    <div style="margin-top:12px;display:grid;gap:10px;">
      <div style="padding:12px;border:1px solid #e9e9f2;border-radius:18px;font-weight:900;">General: ${safe(gen||"--")}</div>
      <div style="padding:12px;border:1px solid #e9e9f2;border-radius:18px;font-weight:900;">OBC: ${safe(obc||"--")}</div>
      <div style="padding:12px;border:1px solid #e9e9f2;border-radius:18px;font-weight:900;">SC: ${safe(sc||"--")}</div>
      <div style="padding:12px;border:1px solid #e9e9f2;border-radius:18px;font-weight:900;">ST: ${safe(st||"--")}</div>
    </div>

    <p style="margin-top:14px;font-size:12px;color:#6b7280;font-weight:900;">Mockrise Admin • Auto Generated ✅</p>
  </div>`;

  setStatus("Publishing Cutoff...", "warn");
  await publishPost({title, html, labels:[activeLabel,"CUTOFF"]});
  setStatus("Published ✅", "ok");

  ["title","gen","obc","sc","st"].forEach(id=>document.getElementById(id).value="");
  await loadPosts();
};
