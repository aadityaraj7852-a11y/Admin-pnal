import { CONFIG } from "../config.js";

const $ = (id) => document.getElementById(id);

function setStatus(txt){
  $("statusTxt").textContent = txt;
}

function toggleSidebar(){
  $("sideBar").classList.toggle("open");
}
$("toggleMenu").addEventListener("click", toggleSidebar);

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

/* ✅ Blogger label count */
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

async function init(){
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

    // Stats
    $("statVideo").textContent = v;
    $("statPdf").textContent = p;
    $("statWeekly").textContent = w;
    $("statQuiz").textContent = q;
    $("statEbook").textContent = e;
    $("statCA").textContent = c;
    $("statBanner").textContent = b;

    // Sidebar badges
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

init();
