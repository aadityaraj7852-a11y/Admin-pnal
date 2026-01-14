import { CONFIG } from "../config.js";

const $ = (id) => document.getElementById(id);

function setStatus(txt){
  $("statusTxt").textContent = txt;
}

/* ✅ Sidebar toggle (mobile) */
function openSidebar(){
  $("sideBar").classList.add("open");
  $("sideOverlay").classList.add("show");
}
function closeSidebar(){
  $("sideBar").classList.remove("open");
  $("sideOverlay").classList.remove("show");
}

$("toggleMenu").addEventListener("click", ()=>{
  const open = $("sideBar").classList.contains("open");
  open ? closeSidebar() : openSidebar();
});
$("sideOverlay").addEventListener("click", closeSidebar);

/* ✅ Website */
$("siteUrl").textContent = CONFIG.WEBSITE_URL;
$("openSiteBtn").href = CONFIG.WEBSITE_URL;

$("copySiteBtn").addEventListener("click", async ()=>{
  try{
    await navigator.clipboard.writeText(CONFIG.WEBSITE_URL);
    alert("✅ Copied");
  }catch(e){
    alert("❌ Copy failed");
  }
});

/* ✅ Sidebar search */
const searchInput = $("sideSearchInput");
if(searchInput){
  searchInput.addEventListener("input", ()=>{
    const q = searchInput.value.trim().toLowerCase();
    document.querySelectorAll("#menuBox .labelBtn").forEach(btn=>{
      const txt = btn.innerText.toLowerCase();
      btn.style.display = txt.includes(q) ? "" : "none";
    });
  });
}

/* ✅ Blogger labels count */
async function fetchLabelsCount(){
  const url =
    `https://www.googleapis.com/blogger/v3/blogs/${CONFIG.BLOGGER_ID}/posts/labels`+
    `?key=${CONFIG.BLOGGER_KEY}`;

  const res = await fetch(url);
  const data = await res.json();
  return data.items || [];
}

function findCount(allLabels, labelName){
  const x = allLabels.find(z => String(z.label||"").toLowerCase() === String(labelName).toLowerCase());
  return x?.posts ?? 0;
}

async function initCounts(){
  try{
    setStatus("Loading...");
    const labels = await fetchLabelsCount();

    const v = findCount(labels, CONFIG.LABELS.VIDEO);
    const p = findCount(labels, CONFIG.LABELS.PDF);
    const w = findCount(labels, CONFIG.LABELS.WEEKLY);
    const q = findCount(labels, CONFIG.LABELS.QUIZ);
    const e = findCount(labels, CONFIG.LABELS.EBOOK);
    const c = findCount(labels, CONFIG.LABELS.CA);
    const b = findCount(labels, CONFIG.LABELS.BANNER);

    // stats
    $("statVideo").textContent = v;
    $("statPdf").textContent = p;
    $("statWeekly").textContent = w;
    $("statQuiz").textContent = q;
    $("statEbook").textContent = e;
    $("statCA").textContent = c;
    $("statBanner").textContent = b;

    // sidebar badges
    $("countVideo").textContent = v;
    $("countPdf").textContent = p;
    $("countWeekly").textContent = w;
    $("countQuiz").textContent = q;
    $("countEbook").textContent = e;
    $("countCA").textContent = c;
    $("countBanner").textContent = b;

    setStatus("Ready ✅");
  }catch(e){
    console.log(e);
    setStatus("Counts failed ❌ (API/Key check)");
  }
}

initCounts();
