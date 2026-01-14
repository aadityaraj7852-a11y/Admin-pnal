import { CONFIG } from "../config.js";
import { Auth } from "../auth.js";
import { setupSidebarToggle } from "../router.js";

const $ = (id) => document.getElementById(id);

async function countByLabel(label) {
  try {
    const url =
      `https://www.googleapis.com/blogger/v3/blogs/${CONFIG.blogger.blogId}/posts` +
      `?key=${CONFIG.blogger.apiKey}` +
      `&labels=${encodeURIComponent(label)}` +
      `&maxResults=1` +
      `&fetchBodies=false`;

    const res = await fetch(url);
    const data = await res.json();
    // totalItems return sometimes exists
    if (typeof data.totalItems === "number") return data.totalItems;
    if (Array.isArray(data.items)) return data.items.length;
    return 0;
  } catch (e) {
    return 0;
  }
}

async function loadCounts() {
  const L = CONFIG.blogger.labels;

  $("countVideos").textContent = await countByLabel(L.videos);
  $("countPDF").textContent = await countByLabel(L.pdf);
  $("countTest").textContent = await countByLabel(L.weeklyTest);
  $("countQuiz").textContent = await countByLabel(L.quiz);
  $("countEbook").textContent = await countByLabel(L.ebook);
  $("countCA").textContent = await countByLabel(L.currentAffairs);
  $("countBanner").textContent = await countByLabel(L.banner);
}

(function init(){
  // ✅ block without login
  Auth.requireAuth();

  setupSidebarToggle();

  const s = Auth.getSession();
  if ($("adminEmailTxt")) $("adminEmailTxt").textContent = s?.email || "—";

  // actions
  $("logoutBtn").addEventListener("click", () => Auth.logout());

  $("openSiteBtn").addEventListener("click", () => {
    window.open(CONFIG.websiteUrl, "_blank");
  });

  $("copySiteBtn").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(CONFIG.websiteUrl);
      alert("Copied ✅");
    } catch (e) {
      alert(CONFIG.websiteUrl);
    }
  });

  loadCounts();
})();
