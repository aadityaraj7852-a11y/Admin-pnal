import { CONFIG } from "../config.js";

const sideBar = document.getElementById("sideBar");
const overlay = document.getElementById("sideOverlay");
const toggleMenu = document.getElementById("toggleMenu");

const openSiteBtn = document.getElementById("openSiteBtn");
const copySiteBtn = document.getElementById("copySiteBtn");

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

/* ✅ Open Website */
if(openSiteBtn){
  openSiteBtn.href = CONFIG.WEBSITE_URL;
}

/* ✅ Copy Link */
copySiteBtn?.addEventListener("click", async ()=>{
  try{
    await navigator.clipboard.writeText(CONFIG.WEBSITE_URL);
    alert("Copied");
  }catch(e){
    prompt("Copy this:", CONFIG.WEBSITE_URL);
  }
});

/* ✅ Menu click = close sidebar */
document.querySelectorAll("#menuBox a").forEach(a=>{
  a.addEventListener("click", closeSidebar);
});

/* ✅ Top logout button -> click sidebar logout */
document.getElementById("logoutTopBtn")?.addEventListener("click", ()=>{
  document.getElementById("logoutBtn")?.click();
});
