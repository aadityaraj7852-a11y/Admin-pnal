import { initFirebaseStorage, uploadFileWithProgress } from "../uploader.js";

const $ = (id) => document.getElementById(id);

let storageRef = null;

function toast(msg){
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"), 2000);
}

function setStatus(txt){
  $("statusTxt").textContent = txt;
}

function bytesToSize(bytes){
  if(!bytes) return "0 MB";
  const gb = 1024*1024*1024;
  const mb = 1024*1024;
  const kb = 1024;

  if(bytes >= gb) return (bytes/gb).toFixed(2) + " GB";
  if(bytes >= mb) return (bytes/mb).toFixed(2) + " MB";
  return (bytes/kb).toFixed(2) + " KB";
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

async function requireAdmin(){
  const ok = await window.AUTH.requireAdmin();
  if(!ok){
    location.href = "./index.html";
    return false;
  }
  return true;
}

async function loadLabelsInto(selectEl){
  // ✅ Blogger labels list fetch (posts labels से)
  const labels = await window.BLOGGER.getAllLabelsSafe();

  // ✅ base labels from config
  const base = window.CONFIG.blogger.labelsOrder || [];

  // merge + unique
  const merged = [...new Set([...base, ...labels])];

  selectEl.innerHTML = "";
  merged.forEach(l=>{
    const opt = document.createElement("option");
    opt.value = l;
    opt.textContent = l;
    selectEl.appendChild(opt);
  });

  if(!merged.length){
    const opt = document.createElement("option");
    opt.value = window.CONFIG.blogger.labels.videos;
    opt.textContent = window.CONFIG.blogger.labels.videos;
    selectEl.appendChild(opt);
  }
}

async function promptNewLabel(){
  const name = prompt("नया Label नाम लिखो:");
  if(!name) return null;
  return name.trim();
}

function setProgress(pct, loaded, total, speed){
  $("barFill").style.width = `${pct}%`;
  $("progTxt").textContent = `${pct}% • ${bytesToSize(loaded)} / ${bytesToSize(total)}`;
  $("speedTxt").textContent = speed ? `${bytesToSize(speed)}/s` : "0 KB/s";
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
          <i class="fa-solid fa-copy"></i> Copy Link
        </button>
      </div>
    `;
    box.appendChild(div);
  });

  box.querySelectorAll("[data-open]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const u = btn.getAttribute("data-open");
      window.open(u, "_blank");
    });
  });

  box.querySelectorAll("[data-copy]").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      const u = btn.getAttribute("data-copy");
      await navigator.clipboard.writeText(u);
      toast("Copied ✅");
    });
  });

  setStatus("Ready");
}

async function main(){
  setupSidebarToggle();

  $("adminEmailTxt").textContent = window.CONFIG.admin.email;

  // ✅ logout
  $("logoutBtn").addEventListener("click", async ()=>{
    await window.AUTH.logout();
    location.href = "./index.html";
  });

  const ok = await requireAdmin();
  if(!ok) return;

  // ✅ init firebase storage
  storageRef = await initFirebaseStorage();

  // ✅ load labels
  await loadLabelsInto($("labelSel"));
  await loadLabelsInto($("filterLabelSel"));

  // default filter to Videos label
  $("filterLabelSel").value = window.CONFIG.blogger.labels.videos || $("filterLabelSel").value;

  $("newLabelBtn").addEventListener("click", async ()=>{
    const newLabel = await promptNewLabel();
    if(!newLabel) return;

    // add into selects instantly
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
    toast("Label ready ✅ अब post publish करो");
  });

  $("refreshBtn").addEventListener("click", refreshList);
  $("filterLabelSel").addEventListener("change", refreshList);
  $("searchInp").addEventListener("input", ()=>{
    clearTimeout(window.__srchT);
    window.__srchT=setTimeout(refreshList,250);
  });

  $("clearBtn").addEventListener("click", ()=>{
    $("titleInp").value="";
    $("fileInp").value="";
    setProgress(0,0,0,0);
    toast("Cleared");
  });

  $("uploadBtn").addEventListener("click", async ()=>{
    try{
      const title = ($("titleInp").value || "").trim();
      const label = $("labelSel").value;
      const file = $("fileInp").files?.[0];

      if(!title){ toast("Title डाल"); return; }
      if(!label){ toast("Label select कर"); return; }
      if(!file){ toast("Video file चुन"); return; }

      setStatus("Uploading...");

      // ✅ upload to firebase storage
      const folder = window.CONFIG.firebase.folders.videos;
      const safeName = `${Date.now()}_${file.name}`.replace(/\s+/g,"_");
      const path = `${folder}/${safeName}`;

      let lastTime = Date.now();
      let lastBytes = 0;

      const { downloadURL } = await uploadFileWithProgress(storageRef, path, file, (snap)=>{
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        const now = Date.now();
        const dt = Math.max(1, (now - lastTime) / 1000);
        const db = snap.bytesTransferred - lastBytes;
        const speed = db / dt;

        lastTime = now;
        lastBytes = snap.bytesTransferred;

        setProgress(pct, snap.bytesTransferred, snap.totalBytes, speed);
      });

      setStatus("Publishing...");

      // ✅ Create Blogger post (Video label + URL)
      // Video embed नहीं, सिर्फ link publish (fast + safe)
      const html = `
        <div style="font-family:Arial">
          <h3>${title}</h3>
          <p><b>Video Link:</b> <a href="${downloadURL}" target="_blank">${downloadURL}</a></p>
        </div>
      `;

      const postRes = await window.BLOGGER.createPost({
        title,
        contentHTML: html,
        labels: [label],
      });

      setStatus("Done ✅");
      toast("Uploaded & Published ✅");

      // refresh list label wise
      $("filterLabelSel").value = label;
      await refreshList();

      // reset
      $("titleInp").value = "";
      $("fileInp").value = "";
      setProgress(0,0,0,0);

    }catch(err){
      console.log(err);
      setStatus("Failed");
      toast("Upload/Publish Failed ❌");
    }
  });

  // initial list
  await refreshList();
}

main();
