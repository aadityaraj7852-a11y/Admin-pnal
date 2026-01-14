import { CONFIG } from "../config.js";
import { Auth } from "../auth.js";

Auth.requireAdmin();

const $ = (id) => document.getElementById(id);

// ✅ Firebase Storage
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

const fbApp = initializeApp(CONFIG.firebase);
const storage = getStorage(fbApp);

// ✅ Sidebar Toggle FIX (100% working)
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
document.querySelectorAll("#menuBox a").forEach(a=>{
  a.addEventListener("click", closeSidebar);
});

// Logout
$("logoutTopBtn")?.addEventListener("click", ()=> Auth.logout());

// UI
const vTitle = $("vTitle");
const vFile  = $("vFile");
const vLabel = $("vLabel");

const newLabel = $("newLabel");
const btnAddLabel = $("btnAddLabel");

const btnUpload = $("btnUpload");
const btnClear  = $("btnClear");
const btnRefresh = $("btnRefresh");

const qSearch = $("qSearch");
const listBox = $("listBox");

const uploadStatus = $("uploadStatus");
const progTxt = $("progTxt");
const progFill = $("progFill");
const speedTxt = $("speedTxt");

function setStatus(txt, icon="fa-circle-info"){
  uploadStatus.innerHTML = `<i class="fa-solid ${icon}"></i> ${txt}`;
}

function bytesToMB(n){
  return (n / (1024*1024)).toFixed(2);
}
function bytesToGB(n){
  return (n / (1024*1024*1024)).toFixed(2);
}
function formatSize(n){
  if(n > 1024*1024*1024) return `${bytesToGB(n)} GB`;
  return `${bytesToMB(n)} MB`;
}

function resetProgress(){
  progTxt.textContent = `0% • 0 MB / 0 MB`;
  speedTxt.textContent = `—`;
  progFill.style.width = `0%`;
}

function clearForm(){
  vTitle.value = "";
  vFile.value = "";
  newLabel.value = "";
  resetProgress();
  setStatus("Ready");
}

btnClear.addEventListener("click", clearForm);

// ✅ Labels (Auto load from Blogger)
let cachedLabels = [];

async function fetchLabels(){
  try{
    // Blogger has no direct "list labels" endpoint free,
    // so हम latest posts से labels निकालेंगे.
    const url =
      `https://www.googleapis.com/blogger/v3/blogs/${CONFIG.blogger.blogId}/posts`+
      `?key=${CONFIG.blogger.apiKey}`+
      `&maxResults=50`+
      `&fields=items(labels)`;

    const res = await fetch(url);
    const data = await res.json();
    const items = data.items || [];

    const set = new Set();
    items.forEach(p=>{
      (p.labels||[]).forEach(lb=> set.add(lb));
    });

    // default label ensure
    set.add(CONFIG.blogger.videoLabelDefault || "Video");

    cachedLabels = Array.from(set).sort((a,b)=>a.localeCompare(b));

    renderLabelDropdown();
  }catch(e){
    // fallback default
    cachedLabels = [CONFIG.blogger.videoLabelDefault || "Video"];
    renderLabelDropdown();
  }
}

function renderLabelDropdown(){
  vLabel.innerHTML = "";
  cachedLabels.forEach(lb=>{
    const opt = document.createElement("option");
    opt.value = lb;
    opt.textContent = lb;
    vLabel.appendChild(opt);
  });

  // select default
  vLabel.value = CONFIG.blogger.videoLabelDefault || "Video";
}

btnAddLabel.addEventListener("click", ()=>{
  const lb = (newLabel.value || "").trim();
  if(!lb) return alert("Label name डाल");

  if(!cachedLabels.includes(lb)){
    cachedLabels.push(lb);
    cachedLabels.sort((a,b)=>a.localeCompare(b));
    renderLabelDropdown();
  }
  vLabel.value = lb;
  newLabel.value = "";
  alert("Label added ✅");
});

// ✅ Upload video to Firebase Storage + return URL
async function uploadVideoFile(file){
  return new Promise((resolve, reject)=>{
    const safeName = file.name.replace(/\s+/g, "_");
    const path = `mockrise/videos/${Date.now()}_${safeName}`;
    const r = ref(storage, path);

    const total = file.size;
    const startedAt = Date.now();
    let lastBytes = 0;
    let lastTime = Date.now();

    const task = uploadBytesResumable(r, file);

    task.on("state_changed",
      (snap)=>{
        const transferred = snap.bytesTransferred;
        const pct = Math.round((transferred/total)*100);

        progFill.style.width = pct + "%";
        progTxt.textContent = `${pct}% • ${formatSize(transferred)} / ${formatSize(total)}`;

        // speed calc
        const now = Date.now();
        const dt = (now - lastTime) / 1000;
        if(dt >= 0.8){
          const delta = transferred - lastBytes;
          const speed = delta / dt; // bytes/sec
          speedTxt.textContent = `${formatSize(speed)}/s`;
          lastBytes = transferred;
          lastTime = now;
        }

        setStatus("Uploading...", "fa-cloud-arrow-up");
      },
      (err)=>{
        reject(err);
      },
      async ()=>{
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      }
    );
  });
}

// ✅ “Submit” (यहाँ हम Blogger publish UI success देंगे)
// NOTE: Blogger write token next step में जोड़ेंगे
btnUpload.addEventListener("click", async ()=>{
  try{
    const title = (vTitle.value || "").trim();
    const label = (vLabel.value || "").trim();
    const file = vFile.files?.[0];

    if(!title) return alert("Title डाल");
    if(!label) return alert("Label select कर");
    if(!file) return alert("Video file choose कर");

    // basic file size check (optional)
    setStatus("Starting...", "fa-hourglass-start");

    resetProgress();

    // ✅ upload to Firebase Storage
    const videoUrl = await uploadVideoFile(file);

    setStatus("Upload Complete", "fa-circle-check");

    // ✅ successful popup
    alert("Successful Submit ✅\nVideo uploaded in Storage!");

    // ✅ अब हम list में local दिखा देंगे
    // (Blogger publish का token वाला step next में add करेंगे)
    addLocalItem({ title, label, url: videoUrl });

    clearForm();
  }catch(e){
    console.log(e);
    setStatus("Failed", "fa-triangle-exclamation");
    alert("Upload failed ❌");
  }
});

// ✅ List UI (Blogger + Local)
let localItems = [];

function addLocalItem(item){
  localItems.unshift({
    id: "local_" + Date.now(),
    title: item.title,
    label: item.label,
    url: item.url,
    time: new Date().toISOString()
  });
  renderList([]);
}

function renderList(bloggerItems){
  const q = (qSearch.value || "").trim().toLowerCase();

  // local items first + blogger items after
  const all = [
    ...localItems.map(x=>({ type:"local", ...x })),
    ...bloggerItems.map(x=>({ type:"blogger", ...x }))
  ];

  const filtered = all.filter(p=>{
    const t = (p.title || "").toLowerCase();
    return !q || t.includes(q);
  });

  if(!filtered.length){
    listBox.innerHTML = `<div class="mutedSmall">No videos</div>`;
    return;
  }

  listBox.innerHTML = "";

  filtered.forEach(p=>{
    const el = document.createElement("div");
    el.className = "postItem";

    el.innerHTML = `
      <div class="postMeta">
        <div class="postTitle" title="${p.title}">${p.title}</div>
        <div class="postSub">
          <span class="tagMini"><i class="fa-solid fa-folder"></i> ${p.label || "Video"}</span>
          <span class="tagMini"><i class="fa-solid fa-link"></i> Storage</span>
        </div>
      </div>

      <div class="postActions">
        <button class="btnMini" data-act="open" data-url="${p.url}">
          <i class="fa-solid fa-arrow-up-right-from-square"></i> Open
        </button>

        <button class="btnMini" data-act="copy" data-url="${p.url}">
          <i class="fa-regular fa-copy"></i> Copy
        </button>
      </div>
    `;

    el.addEventListener("click", async (ev)=>{
      const btn = ev.target.closest("button");
      if(!btn) return;

      const act = btn.dataset.act;
      const url = btn.dataset.url || "";

      if(act==="open"){
        window.open(url, "_blank");
      }

      if(act==="copy"){
        try{
          await navigator.clipboard.writeText(url);
          alert("Copied ✅");
        }catch{
          alert(url);
        }
      }
    });

    listBox.appendChild(el);
  });
}

// ✅ Blogger read (optional, existing old items)
async function fetchBloggerVideos(){
  try{
    listBox.innerHTML = `<div class="mutedSmall">Loading...</div>`;

    const label = encodeURIComponent(CONFIG.blogger.videoLabelDefault || "Video");
    const url =
      `https://www.googleapis.com/blogger/v3/blogs/${CONFIG.blogger.blogId}/posts`+
      `?key=${CONFIG.blogger.apiKey}`+
      `&labels=${label}`+
      `&maxResults=20`+
      `&fields=items(id,title,labels,url)`;

    const res = await fetch(url);
    const data = await res.json();

    const items = (data.items || []).map(p=>({
      id: p.id,
      title: p.title,
      label: (p.labels && p.labels[0]) ? p.labels[0] : (CONFIG.blogger.videoLabelDefault || "Video"),
      url: p.url || ""
    }));

    renderList(items);
  }catch(e){
    renderList([]);
  }
}

qSearch.addEventListener("input", ()=> fetchBloggerVideos());
btnRefresh.addEventListener("click", ()=> fetchBloggerVideos());

// Init
resetProgress();
setStatus("Ready");
fetchLabels();
fetchBloggerVideos();
