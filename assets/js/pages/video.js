import { CONFIG } from "../config.js";
import { requireAuthOrRedirect, logout } from "../auth.js";
import { fetchLabels, fetchPostsByLabel, publishYouTubePost } from "../blogger.js";

const $ = (id)=>document.getElementById(id);

function toast(msg){
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"), 1800);
}

function setStatus(txt){
  $("statusTxt").textContent = txt;
}

// ✅ Sidebar toggle
function sidebarInit(){
  const sb = $("sidebar");
  const ov = $("overlay");
  $("menuBtn").onclick = ()=>{
    sb.classList.toggle("open");
    ov.classList.toggle("show");
  };
  ov.onclick = ()=>{
    sb.classList.remove("open");
    ov.classList.remove("show");
  };
}

function normalizeYT(url){
  url = (url||"").trim();
  if(!url.includes("youtu")) return "";
  return url;
}

async function loadAllLabels(){
  setStatus("Loading labels...");
  let labels = [];

  try{
    labels = await fetchLabels();
  }catch(e){
    labels = [];
  }

  // ✅ base labels add
  const base = CONFIG.BLOGGER_LABEL_ORDER || [];
  labels = [...new Set([...base, ...labels])].filter(Boolean);

  if(!labels.length) labels = ["Videos"];

  const fill = (sel)=>{
    sel.innerHTML="";
    labels.forEach(l=>{
      const opt=document.createElement("option");
      opt.value=l;
      opt.textContent=l;
      sel.appendChild(opt);
    });
  };

  fill($("labelSel"));
  fill($("filterLabelSel"));

  $("labelSel").value = "Videos";
  $("filterLabelSel").value = "Videos";

  setStatus("Ready");
}

async function refreshList(){
  const label = $("filterLabelSel").value;
  const q = ($("searchInp").value || "").toLowerCase().trim();

  setStatus("Loading...");
  $("listBox").innerHTML = `<div class="emptyTxt">Loading...</div>`;

  const posts = await fetchPostsByLabel(label);

  const filtered = (posts||[]).filter(p=>{
    const t=(p.title||"").toLowerCase();
    return !q || t.includes(q);
  });

  $("listBox").innerHTML = "";

  if(!filtered.length){
    $("listBox").innerHTML = `<div class="emptyTxt">No videos found</div>`;
    setStatus("Ready");
    return;
  }

  filtered.forEach(p=>{
    const div = document.createElement("div");
    div.className="rowItem";
    div.innerHTML=`
      <div class="rowLeft">
        <div class="rowTitle">${p.title||"-"}</div>
        <div class="rowMeta">${new Date(p.published).toLocaleString("en-IN")}</div>
      </div>
      <div class="rowRight">
        <button class="smallBtn openBtn"><i class="fa-solid fa-up-right-from-square"></i> Open</button>
        <button class="smallBtn copyBtn"><i class="fa-solid fa-copy"></i> Copy</button>
      </div>
    `;

    div.querySelector(".openBtn").onclick=()=>window.open(p.url,"_blank");
    div.querySelector(".copyBtn").onclick=async ()=>{
      await navigator.clipboard.writeText(p.url);
      toast("Copied ✅");
    };

    $("listBox").appendChild(div);
  });

  setStatus("Ready");
}

async function init(){
  sidebarInit();

  // ✅ logout
  $("logoutBtn").onclick=()=>{
    logout();
    window.location.href="./index.html";
  };

  if(!requireAuthOrRedirect()) return;

  $("adminEmailTxt").textContent = CONFIG.ADMIN_EMAIL;

  await loadAllLabels();
  await refreshList();

  // ✅ New label add
  $("newLabelBtn").onclick=()=>{
    const name = prompt("New label name:");
    if(!name) return;
    const label = name.trim();
    if(!label) return;

    const add = (sel)=>{
      const exists=[...sel.options].some(o=>o.value===label);
      if(!exists){
        const opt=document.createElement("option");
        opt.value=label;
        opt.textContent=label;
        sel.appendChild(opt);
      }
    };

    add($("labelSel"));
    add($("filterLabelSel"));
    $("labelSel").value=label;

    toast("Label Added ✅ अब Publish दबाओ");
  };

  // ✅ Clear
  $("clearBtn").onclick=()=>{
    $("titleInp").value="";
    $("ytInp").value="";
    toast("Cleared ✅");
  };

  // ✅ Publish
  $("publishBtn").onclick=async ()=>{
    try{
      const title = ($("titleInp").value||"").trim();
      const label = $("labelSel").value;
      const yt = normalizeYT($("ytInp").value);

      if(!title) return toast("Title डाल");
      if(!label) return toast("Label select कर");
      if(!yt) return toast("YouTube link सही डाल");

      setStatus("Publishing...");

      await publishYouTubePost(title, label, yt);

      toast("Published ✅");
      setStatus("Done ✅");

      $("titleInp").value="";
      $("ytInp").value="";

      $("filterLabelSel").value=label;
      await refreshList();

      setStatus("Ready");
    }catch(e){
      console.log(e);
      setStatus("Failed ❌");
      alert("Publish Failed ❌\nConsole में error देखो");
    }
  };

  $("refreshBtn").onclick=refreshList;
  $("filterLabelSel").onchange=refreshList;

  $("searchInp").oninput=()=>{
    clearTimeout(window.__s);
    window.__s=setTimeout(refreshList,250);
  };
}

init();
