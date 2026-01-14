import { CONFIG } from "../config.js";

/*
  ✅ Auth System (Simple)
  हम मान रहे हैं login के बाद localStorage में ये set होगा:
  localStorage.setItem("mockrise_logged_in","1");
*/

function isLoggedIn(){
  return localStorage.getItem("mockrise_logged_in") === "1";
}

function goLogin(){
  window.location.href = "./index.html";
}

/* ✅ Block dashboard without login */
if(!isLoggedIn()){
  goLogin();
}

/* ✅ Sidebar Toggle */
const sideBar = document.getElementById("sideBar");
const overlay = document.getElementById("sideOverlay");
const toggleMenu = document.getElementById("toggleMenu");

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

/* ✅ Website Buttons */
const openSiteBtn = document.getElementById("openSiteBtn");
const copySiteBtn = document.getElementById("copySiteBtn");

if(openSiteBtn){
  openSiteBtn.href = CONFIG.WEBSITE_URL;
}

copySiteBtn?.addEventListener("click", async ()=>{
  try{
    await navigator.clipboard.writeText(CONFIG.WEBSITE_URL);
    alert("Copied");
  }catch(e){
    prompt("Copy this:", CONFIG.WEBSITE_URL);
  }
});

/* ✅ Logout button working (Header वाला) */
document.getElementById("logoutTopBtn")?.addEventListener("click", ()=>{
  // clear login
  localStorage.removeItem("mockrise_logged_in");
  // go login page
  goLogin();
});
