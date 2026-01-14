
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

import { buildPostHtml } from "../utils/converter.js";
document.getElementById("publishBtn").onclick = async ()=>{
  const title=document.getElementById("title").value.trim();
  const mainLink=document.getElementById("mainLink").value.trim();
  const desc=document.getElementById("desc").value.trim();
  if(!title) return alert("Title required");
  setStatus("Publishing OMR...", "warn");
  const html=buildPostHtml({type:"OMR", title, label:activeLabel, desc, mainLink:"", extraLink: mainLink, bodyText:""});
  await publishPost({title, html, labels:[activeLabel,"OMR"]});
  setStatus("Published ✅", "ok");
  ["title","mainLink","desc"].forEach(id=>document.getElementById(id).value="");
  await loadPosts();
};
