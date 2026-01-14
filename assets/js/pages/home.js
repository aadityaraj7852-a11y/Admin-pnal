import { CONFIG } from "../config.js";

const $ = (id) => document.getElementById(id);

function setStatus(txt){
  $("statusTxt").textContent = txt;
}

function toggleSidebar(){
  const side = $("sideBar");
  side.classList.toggle("open");
}

$("toggleMenu").addEventListener("click", toggleSidebar);

$("siteUrl").textContent = CONFIG.WEBSITE_URL;
$("openSiteBtn").href = CONFIG.WEBSITE_URL;

$("copySiteBtn").addEventListener("click", async ()=>{
  try{
    await navigator.clipboard.writeText(CONFIG.WEBSITE_URL);
    alert("✅ Copied: " + CONFIG.WEBSITE_URL);
  }catch(e){
    alert("❌ Copy failed");
  }
});

async function fetchLabels(){
  // ✅ Blogger Labels list + count
  const url =
    `https://www.googleapis.com/blogger/v3/blogs/${CONFIG.BLOGGER_ID}/posts/labels`+
    `?key=${CONFIG.BLOGGER_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  // Example response: { items: [{label:"PDF", posts:10}, ...] }
  return data.items || [];
}

async function fetchLatestPosts(label=""){
  const base =
    `https://www.googleapis.com/blogger/v3/blogs/${CONFIG.BLOGGER_ID}/posts`+
    `?key=${CONFIG.BLOGGER_KEY}`+
    `&maxResults=10`+
    `&fields=items(id,title,published,labels,url)`;

  const url = label ? (base + `&labels=${encodeURIComponent(label)}`) : base;

  const res = await fetch(url);
  const data = await res.json();
  return data.items || [];
}

function renderLabels(labels){
  const box = $("labelsList");
  box.innerHTML = "";

  if(!labels.length){
    box.innerHTML = `<div class="mutedSmall">No labels found</div>`;
    return;
  }

  labels.forEach((l)=>{
    const div = document.createElement("div");
    div.className = "labelBtn";
    div.innerHTML = `
      <span>🏷️ ${l.label}</span>
      <span class="badge">${l.posts ?? 0}</span>
    `;
    div.onclick = ()=>{
      $("activeLabelSelect").value = l.label;
      $("activeLabelPill").textContent = l.label;
      loadLatestPosts(l.label);
      if(window.innerWidth < 980) $("sideBar").classList.remove("open");
    };
    box.appendChild(div);
  });

  // ✅ Active Label dropdown fill
  const sel = $("activeLabelSelect");
  sel.innerHTML = `<option value="">All Labels</option>`;
  labels.forEach((l)=>{
    const opt = document.createElement("option");
    opt.value = l.label;
    opt.textContent = `${l.label} (${l.posts ?? 0})`;
    sel.appendChild(opt);
  });
}

function setCounts(labels){
  // ✅ counts by known labels
  const findCount = (name)=>{
    const x = labels.find(z=> String(z.label||"").toLowerCase() === String(name).toLowerCase());
    return x?.posts ?? 0;
  };

  const v = findCount(CONFIG.LABELS.VIDEO);
  const p = findCount(CONFIG.LABELS.PDF);
  const i = findCount(CONFIG.LABELS.IMAGE);
  const t = findCount(CONFIG.LABELS.TEST);

  $("statVideo").textContent = v;
  $("statPdf").textContent = p;
  $("statImage").textContent = i;
  $("statTest").textContent = t;

  $("countVideo").textContent = v;
  $("countPdf").textContent = p;
  $("countImage").textContent = i;
  $("countTest").textContent = t;
}

function formatDate(iso){
  try{
    const d = new Date(iso);
    return d.toLocaleString("en-IN", { dateStyle:"medium", timeStyle:"short" });
  }catch(e){
    return iso;
  }
}

function renderPosts(posts){
  const box = $("latestPostsBox");
  box.innerHTML = "";

  if(!posts.length){
    box.innerHTML = `<div class="mutedSmall">No posts found</div>`;
    return;
  }

  posts.forEach((p)=>{
    const div = document.createElement("div");
    div.className = "postItem";
    div.innerHTML = `
      <div style="min-width:0">
        <div class="postTitle">${p.title || "Untitled"}</div>
        <div class="postMeta">
          🕒 ${formatDate(p.published)}  
          ${p.labels?.length ? ` • 🏷️ ${p.labels.join(", ")}` : ""}
        </div>
      </div>
      <div class="postActions">
        <a class="btnGhost" target="_blank" href="${p.url}">Open</a>
      </div>
    `;
    box.appendChild(div);
  });
}

async function loadLatestPosts(label=""){
  try{
    setStatus("Loading posts...");
    const posts = await fetchLatestPosts(label);

    // ✅ Search filter (title)
    const q = $("postSearch").value.trim().toLowerCase();
    const filtered = q
      ? posts.filter(x => String(x.title||"").toLowerCase().includes(q))
      : posts;

    renderPosts(filtered);
    setStatus("Ready ✅");
  }catch(e){
    console.log(e);
    setStatus("Failed ❌");
    $("latestPostsBox").innerHTML = `<div class="mutedSmall">Posts load failed</div>`;
  }
}

$("activeLabelSelect").addEventListener("change", ()=>{
  const label = $("activeLabelSelect").value;
  $("activeLabelPill").textContent = label || "All";
  loadLatestPosts(label);
});

$("postSearch").addEventListener("input", ()=>{
  const label = $("activeLabelSelect").value;
  loadLatestPosts(label);
});

$("labelSearch").addEventListener("input", ()=>{
  const q = $("labelSearch").value.trim().toLowerCase();
  const all = Array.from($("labelsList").querySelectorAll(".labelBtn"));
  all.forEach(btn=>{
    const txt = btn.textContent.toLowerCase();
    btn.style.display = txt.includes(q) ? "" : "none";
  });
});

async function init(){
  try{
    setStatus("Loading dashboard...");
    const labels = await fetchLabels();

    renderLabels(labels);
    setCounts(labels);

    await loadLatestPosts("");

    setStatus("Ready ✅");
  }catch(e){
    console.log(e);
    setStatus("Failed ❌");
    $("labelsList").innerHTML = `<div class="mutedSmall">Labels load failed</div>`;
  }
}

init();
