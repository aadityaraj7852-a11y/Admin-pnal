import { CONFIG } from "../config.js";
import { Auth } from "../auth.js";

Auth.requireAdmin();

const $ = (id) => document.getElementById(id);

// Sidebar toggle
const sideBar = $("sideBar");
const overlay = $("sideOverlay");
const toggleMenu = $("toggleMenu");

function openSidebar(){
  sideBar.classList.add("open");
  overlay.classList.add("show");
  document.body.style.overflow = "hidden";
}
function closeSidebar(){
  sideBar.classList.remove("open");
  overlay.classList.remove("show");
  document.body.style.overflow = "";
}

toggleMenu?.addEventListener("click", ()=>{
  if(sideBar.classList.contains("open")) closeSidebar();
  else openSidebar();
});
overlay?.addEventListener("click", closeSidebar);

// Logout
$("logoutTopBtn")?.addEventListener("click", ()=> Auth.logout());

// UI Elements
const vTitle = $("vTitle");
const vClass = $("vClass");
const vUrl   = $("vUrl");
const vThumb = $("vThumb");
const vLabel = $("vLabel");
const vVis   = $("vVis");

const btnPublish = $("btnPublish");
const btnClear   = $("btnClear");
const btnRefresh = $("btnRefresh");

const qSearch = $("qSearch");
const listBox = $("listBox");
const writeStatus = $("writeStatus");

// ✅ currently Write is locked (next step: access token)
writeStatus.innerHTML = `<i class="fa-solid fa-lock"></i> Write Locked`;

function clearForm(){
  vTitle.value = "";
  vClass.value = "";
  vUrl.value   = "";
  vThumb.value = "";
  vLabel.value = "Video";
  vVis.value   = "public";
}

btnClear.addEventListener("click", clearForm);

// ✅ Blogger read posts by label
async function fetchVideoPosts(){
  try{
    listBox.innerHTML = `<div class="mutedSmall">Loading...</div>`;

    const label = encodeURIComponent("Video");
    const url =
      `https://www.googleapis.com/blogger/v3/blogs/${CONFIG.blogger.blogId}/posts`+
      `?key=${CONFIG.blogger.apiKey}`+
      `&labels=${label}`+
      `&maxResults=30`+
      `&fields=items(id,title,content,updated,url,labels)`;

    const res = await fetch(url);
    const data = await res.json();

    const items = data.items || [];
    renderList(items);
  }catch(e){
    listBox.innerHTML = `<div class="mutedSmall">Load failed</div>`;
  }
}

// ✅ parse our JSON from post content
function extractJSON(content){
  if(!content) return null;
  const m = content.match(/\{[\s\S]*\}/);
  if(!m) return null;
  try{ return JSON.parse(m[0]); }catch{ return null; }
}

function renderList(items){
  const q = (qSearch.value || "").trim().toLowerCase();

  const filtered = items.filter(p=>{
    const title = (p.title||"").toLowerCase();
    return !q || title.includes(q);
  });

  if(!filtered.length){
    listBox.innerHTML = `<div class="mutedSmall">No videos found</div>`;
    return;
  }

  listBox.innerHTML = "";

  filtered.forEach(p=>{
    const meta = extractJSON(p.content) || {};
    const thumb = meta.thumb || "https://i.imgur.com/4M34hi2.png";
    const cls = meta.class || "-";
    const url = meta.url || p.url || "";

    const el = document.createElement("div");
    el.className = "postItem";

    el.innerHTML = `
      <div class="postLeft">
        <img class="thumb" src="${thumb}" alt="thumb" />
        <div class="postMeta">
          <div class="postTitle" title="${p.title}">${p.title}</div>
          <div class="postSub">
            <span class="tagMini"><i class="fa-solid fa-tag"></i> ${cls}</span>
            <span class="tagMini"><i class="fa-solid fa-folder"></i> ${((p.labels||[])[0]||"Video")}</span>
          </div>
        </div>
      </div>

      <div class="postActions">
        <button class="btnMini" data-act="open" data-url="${url}">
          <i class="fa-solid fa-arrow-up-right-from-square"></i> Open
        </button>

        <button class="btnMini" data-act="copy" data-url="${url}">
          <i class="fa-regular fa-copy"></i> Copy
        </button>

        <button class="btnMini" data-act="edit" data-id="${p.id}">
          <i class="fa-solid fa-pen"></i> Edit
        </button>

        <button class="btnMini btnDanger" data-act="del" data-id="${p.id}">
          <i class="fa-solid fa-trash"></i> Delete
        </button>
      </div>
    `;

    el.addEventListener("click", async (ev)=>{
      const btn = ev.target.closest("button");
      if(!btn) return;

      const act = btn.dataset.act;

      if(act==="open"){
        const u = btn.dataset.url || "";
        if(!u) return alert("No link");
        window.open(u, "_blank");
      }

      if(act==="copy"){
        const u = btn.dataset.url || "";
        if(!u) return alert("No link");
        try{
          await navigator.clipboard.writeText(u);
          alert("Copied");
        }catch{
          alert(u);
        }
      }

      if(act==="edit"){
        alert("Edit next step (write token required)");
      }

      if(act==="del"){
        alert("Delete next step (write token required)");
      }
    });

    listBox.appendChild(el);
  });
}

// Search
qSearch.addEventListener("input", ()=>{
  // just reload current DOM filtering:
  fetchVideoPosts();
});

// Refresh
btnRefresh.addEventListener("click", fetchVideoPosts);

// Publish (currently locked)
btnPublish.addEventListener("click", ()=>{
  alert("Publish के लिए Blogger write token लगेगा (मैं next message में complete code दे दूँगा).");
});

// Init
fetchVideoPosts();
