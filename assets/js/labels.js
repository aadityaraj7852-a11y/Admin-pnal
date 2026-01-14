import { CONFIG } from "./config.js";
import { fetchLabels } from "./blogger.js";
import { $ } from "./ui.js";

export function getActiveLabel(){
  return localStorage.getItem("mockrise_active_label") || CONFIG.DEFAULT_LABELS[0] || "PDF";
}

export async function loadLabelsSidebar(activeLabel){
  const box = $("labelsBox");
  if(!box) return;
  box.innerHTML = `<div class="mutedSmall">Loading labels...</div>`;
  let labels=[];
  try{ labels = await fetchLabels(); } catch{ labels=[]; }
  const merged=[...new Set([...(labels||[]), ...CONFIG.DEFAULT_LABELS])].filter(Boolean);
  box.innerHTML="";
  merged.forEach(lb=>{
    const a=document.createElement("a");
    a.href="#";
    a.className="labelBtn"+(lb===activeLabel?" labelBtnActive":"");
    a.innerHTML = `
      <span style="display:flex;gap:10px;align-items:center;min-width:0;">
        <span class="material-symbols-outlined" style="color:#0a0ac2;">sell</span>
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${lb}</span>
      </span>
      <span class="badge">${lb===activeLabel?"Active":"Open"}</span>
    `;
    a.onclick=(e)=>{
      e.preventDefault();
      localStorage.setItem("mockrise_active_label", lb);
      window.location.reload();
    };
    box.appendChild(a);
  });
}
