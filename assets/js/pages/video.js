import { CONFIG } from "../config.js";
import { requireAdmin, logout } from "../auth.js";
import { fetchAllLabels, fetchPostsByLabel, publishVideoPost } from "../blogger.js";

const $ = (id) => document.getElementById(id);

function toast(msg){
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"), 1800);
}

function setStatus(txt){
  $("statusTxt").textContent = txt;
}

function normalizeYT(url){
  url = (url || "").trim();
  if(!url) return "";

  if(!url.includes("youtu")) return "";

  // shorts -> watch
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

function setupSidebar(){
  const sidebar = $("sidebar");
  const overlay = $("overlay");
  const btn = $("menuBtn");

  btn.addEventListener("click", ()=>{
    sidebar.classList.toggle("open");
    overlay.classList.toggle("show");
  });

  overlay.addEventListener("click", ()=>{
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
  });
}

function fillSelect(sel, arr, defaultVal){
  sel.innerHTML = "";
  arr.forEach(x=>{
    const opt = document.createElement("option");
    opt.value = x;
    opt.textContent = x;
    sel.appendChild(opt);
  });
  if(defaultVal && arr.includes(defaultVal)) sel.value = defaultVal;
}

async function loadLabels(){
  setStatus("Loading labels...");
  let labels = [];

  // ✅ config वाले labels पहले
  const base = CONFIG?.BLOGGER_LABEL_ORDER || [];
  const baseSet = new Set(base);

  try{
    const fromApi = await fetchAllLabels();
    labels = [...new Set([...base, ...(fromApi || [])])].filter(Boolean);
  }catch(e){
    labels = [...baseSet];
  }

  if(!labels.length){
    labels = ["Videos"];
  }

  // ✅ dropdowns
  fillSelect($("labelSel"), labels, "Videos");
  fillSelect($("filterLabelSel"), labels, "Videos");

  setStatus("Ready");
}

async function refreshList(){
  const label = $("filterLabelSel").value;
  const q = ($("searchInp").value || "").toLowerCase().trim();

  setStatus("Loading...");
  $("listBox").innerHTML = `<div class="emptyTxt">Loading...</div>`;

  try{
    const posts = await fetchPostsByLabel(label, 30);

    const filtered = (posts || []).filter(p=>{
      const t = (p.title || "").toLowerCase();
      return !q || t.includes(q);
    });

    if(!filtered.length){
      $("listBox").innerHTML = `<div class="emptyTxt">No videos found</div>`;
      setStatus("Ready");
      return;
    }

    $("listBox").innerHTML = "";

    filtered.forEach(p=>{
      const item = document.createElement("div");
      item.className = "rowItem";

      item.innerHTML = `
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

      item.querySelector("[data-open]").addEventListener("click", ()=>{
        window.open(p.url, "_blank");
      });

      item.querySelector("[data-copy]").addEventListener("click", async ()=>{
        try{
          await navigator.clipboard.writeText(p.url);
          toast("Copied ✅");
        }catch{
          alert(p.url);
        }
      });

      $("listBox").appendChild(item);
    });

    setStatus("Ready");
  }catch(e){
    console.log(e);
    $("listBox").innerHTML = `<div class="emptyTxt">Load failed ❌</div>`;
    setStatus("Failed");
    toast("Load failed ❌");
  }
}

async function main(){
  setupSidebar();

  $("adminEmailTxt").textContent = CONFIG.ADMIN_EMAIL;

  // ✅ logout (GitHub pages FIX)
  $("logoutBtn").onclick = ()=>{
    logout();
    window.location.href = "./index.html";
  };

  // ✅ admin guard
  const ok = requireAdmin();
  if(!ok){
    window.location.href = "./index.html";
    return;
  }

  await loadLabels();
  await refreshList();

  // ✅ create new label
  $("newLabelBtn").addEventListener("click", ()=>{
    const name = prompt("New Label name:");
    if(!name) return;
    const label = name.trim();
    if(!label) return;

    const add = (sel)=>{
      const exists = [...sel.options].some(o=>o.value === label);
      if(!exists){
        const opt = document.createElement("option");
        opt.value = label;
        opt.textContent = label;
        sel.appendChild(opt);
      }
    };

    add($("labelSel"));
    add($("filterLabelSel"));

    $("labelSel").value = label;
    toast("Label added ✅ अब Publish दबाओ");
  });

  // ✅ clear
  $("clearBtn").addEventListener("click", ()=>{
    $("titleInp").value = "";
    $("ytInp").value = "";
    toast("Cleared ✅");
  });

  // ✅ publish
  $("publishBtn").addEventListener("click", async ()=>{
    try{
      const title = ($("titleInp").value || "").trim();
      const label = $("labelSel").value;
      const yt = normalizeYT($("ytInp").value);

      if(!title) return toast("Title डाल");
      if(!label) return toast("Label select कर");
      if(!yt) return toast("Valid YouTube link डाल");

      setStatus("Publishing...");

      await publishVideoPost({ title, ytUrl: yt, label });

      toast("Published ✅");
      setStatus("Done ✅");

      // reset + refresh
      $("titleInp").value = "";
      $("ytInp").value = "";

      $("filterLabelSel").value = label;
      await refreshList();

      setStatus("Ready");
    }catch(e){
      console.log(e);
      setStatus("Failed");
      toast("Publish Failed ❌");
      alert("Publish Failed ❌\n\nConsole में error देखो");
    }
  });

  $("refreshBtn").addEventListener("click", refreshList);
  $("filterLabelSel").addEventListener("change", refreshList);

  $("searchInp").addEventListener("input", ()=>{
    clearTimeout(window.__sr);
    window.__sr = setTimeout(refreshList, 250);
  });
}

main();
