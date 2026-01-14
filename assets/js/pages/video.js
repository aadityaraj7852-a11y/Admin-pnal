const $ = (id) => document.getElementById(id);

function toast(msg){
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"), 2000);
}

function setStatus(txt){
  $("statusTxt").textContent = txt;
}

/** ✅ Sidebar toggle fix */
function setupSidebarToggle(){
  const sidebar = $("sidebar");
  const overlay = $("overlay");
  const menuBtn  = $("menuBtn");

  function open(){
    sidebar.classList.add("open");
    overlay.classList.add("show");
  }
  function close(){
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
  }

  menuBtn.addEventListener("click", ()=>{
    if(sidebar.classList.contains("open")) close();
    else open();
  });

  overlay.addEventListener("click", close);
}

function normalizeYouTube(url){
  url = (url || "").trim();
  if(!url) return "";

  // allow youtu.be / youtube.com
  if(!url.includes("youtu")) return "";

  // convert shorts to watch
  if(url.includes("/shorts/")){
    const id = url.split("/shorts/")[1]?.split(/[?&]/)[0];
    if(id) return `https://www.youtube.com/watch?v=${id}`;
  }

  // youtu.be -> watch
  if(url.includes("youtu.be/")){
    const id = url.split("youtu.be/")[1]?.split(/[?&]/)[0];
    if(id) return `https://www.youtube.com/watch?v=${id}`;
  }

  return url;
}

function extractVideoId(url){
  if(!url) return "";
  try{
    const u = new URL(url);
    if(u.searchParams.get("v")) return u.searchParams.get("v");
    // fallback
    return "";
  }catch(e){
    return "";
  }
}

async function loadLabelsInto(selectEl){
  // ✅ fallback labels from config
  const base = window.CONFIG?.blogger?.labelsOrder || [];

  // ✅ labels from blogger
  let labels = [];
  try{
    labels = await window.BLOGGER.getAllLabelsSafe();
  }catch(e){
    labels = [];
  }

  const merged = [...new Set([...base, ...labels])].filter(Boolean);

  selectEl.innerHTML = "";

  if(!merged.length){
    const opt = document.createElement("option");
    opt.value = window.CONFIG.blogger.labels.videos || "Videos";
    opt.textContent = window.CONFIG.blogger.labels.videos || "Videos";
    selectEl.appendChild(opt);
    return;
  }

  merged.forEach(l=>{
    const opt = document.createElement("option");
    opt.value = l;
    opt.textContent = l;
    selectEl.appendChild(opt);
  });
}

async function promptNewLabel(){
  const name = prompt("नया Label नाम लिखो:");
  if(!name) return null;
  return name.trim();
}

async function refreshList(){
  setStatus("Loading...");
  const label = $("filterLabelSel").value;
  const search = ($("searchInp").value || "").toLowerCase();

  const posts = await window.BLOGGER.getPostsByLabelSafe(label);

  const list = (posts || [])
    .filter(p => (p.title || "").toLowerCase().includes(search))
    .slice(0, 30);

  const box = $("listBox");
  box.innerHTML = "";

  if(!list.length){
    box.innerHTML = `<div class="emptyTxt">No videos found</div>`;
    setStatus("Ready");
    return;
  }

  list.forEach(p=>{
    const div = document.createElement("div");
    div.className = "rowItem";
    div.innerHTML = `
      <div class="rowLeft">
        <div class="rowTitle">${p.title || "-"}</div>
        <div class="rowMeta">${new Date(p.published).toLocaleString("en-IN")}</div>
      </div>
      <div class="rowRight">
        <button class="smallBtn" data-open="${p.url}">
          <i class="fa-solid fa-up-right-from-square"></i> Open
        </button>
        <button class="smallBtn" data-copy="${p.url}">
          <i class="fa-solid fa-copy"></i> Copy
        </button>
      </div>
    `;
    box.appendChild(div);
  });

  box.querySelectorAll("[data-open]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      window.open(btn.getAttribute("data-open"), "_blank");
    });
  });

  box.querySelectorAll("[data-copy]").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      await navigator.clipboard.writeText(btn.getAttribute("data-copy"));
      toast("Copied");
    });
  });

  setStatus("Ready");
}

async function main(){
  setupSidebarToggle();

  $("adminEmailTxt").textContent = window.CONFIG.admin.email;

  $("logoutBtn").addEventListener("click", async ()=>{
    await window.AUTH.logout();
    location.href = "./index.html";
  });

  // ✅ admin check
  const ok = await window.AUTH.requireAdmin();
  if(!ok){
    location.href = "./index.html";
    return;
  }

  // ✅ load labels
  await loadLabelsInto($("labelSel"));
  await loadLabelsInto($("filterLabelSel"));

  // default label to videos
  const def = window.CONFIG.blogger.labels.videos || $("filterLabelSel").value;
  $("filterLabelSel").value = def;

  $("newLabelBtn").addEventListener("click", async ()=>{
    const newLabel = await promptNewLabel();
    if(!newLabel) return;

    const addOpt = (sel)=>{
      const exists = [...sel.options].some(o=>o.value===newLabel);
      if(!exists){
        const opt=document.createElement("option");
        opt.value=newLabel;
        opt.textContent=newLabel;
        sel.appendChild(opt);
      }
    };

    addOpt($("labelSel"));
    addOpt($("filterLabelSel"));
    $("labelSel").value = newLabel;

    toast("Label ready");
  });

  $("clearBtn").addEventListener("click", ()=>{
    $("titleInp").value = "";
    $("ytInp").value = "";
    toast("Cleared");
  });

  $("publishBtn").addEventListener("click", async ()=>{
    try{
      const title = ($("titleInp").value || "").trim();
      const label = $("labelSel").value;
      let yt = normalizeYouTube($("ytInp").value);

      if(!title){ toast("Title डाल"); return; }
      if(!label){ toast("Label select कर"); return; }
      if(!yt){ toast("Valid YouTube link डाल"); return; }

      const vid = extractVideoId(yt);

      setStatus("Publishing...");

      const embed = vid
        ? `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${vid}" frameborder="0" allowfullscreen></iframe>`
        : `<a href="${yt}" target="_blank">${yt}</a>`;

      const html = `
        <div style="font-family:Arial">
          <h2>${title}</h2>
          <div style="margin:10px 0">${embed}</div>
          <p><a href="${yt}" target="_blank">Open on YouTube</a></p>
        </div>
      `;

      // ✅ Blogger Post create
      await window.BLOGGER.createPost({
        title,
        contentHTML: html,
        labels: [label]
      });

      setStatus("Done");
      toast("Published Successfully");

      // reset
      $("titleInp").value = "";
      $("ytInp").value = "";

      // refresh list
      $("filterLabelSel").value = label;
      await refreshList();

    }catch(e){
      console.log(e);
      setStatus("Failed");
      toast("Publish Failed");
    }
  });

  $("refreshBtn").addEventListener("click", refreshList);

  $("filterLabelSel").addEventListener("change", refreshList);

  $("searchInp").addEventListener("input", ()=>{
    clearTimeout(window.__srchT);
    window.__srchT=setTimeout(refreshList, 250);
  });

  await refreshList();
}

main();
