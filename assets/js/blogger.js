import { CONFIG } from "./config.js";
import { getToken } from "./auth.js";

/**
 * ✅ Blogger Helper (Read + Write)
 * - Labels fetch (direct endpoint + fallback from posts)
 * - Posts fetch by label
 * - Publish post
 */

function apiUrl(path, params = {}) {
  const url = new URL(`https://www.googleapis.com/blogger/v3/${path}`);
  url.searchParams.set("key", CONFIG.BLOGGER_KEY);

  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  });

  return url.toString();
}

async function jsonSafe(res) {
  try { return await res.json(); } catch { return null; }
}

function mustToken() {
  const t = getToken();
  if (!t) throw new Error("Google token missing ❌ Logout करके दुबारा Login कर");
  return t;
}

async function GET(path, params = {}) {
  const token = getToken();
  const res = await fetch(apiUrl(path, params), {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  const data = await jsonSafe(res);
  if (!res.ok) {
    console.log("Blogger GET error:", data);
    throw new Error(data?.error?.message || `GET Failed (${res.status})`);
  }
  return data;
}

async function POST(path, bodyObj) {
  const token = mustToken();

  const res = await fetch(apiUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(bodyObj)
  });

  const data = await jsonSafe(res);
  if (!res.ok) {
    console.log("Blogger POST error:", data);
    throw new Error(data?.error?.message || `POST Failed (${res.status})`);
  }
  return data;
}

/** ✅ Labels fetch (direct + fallback) */
export async function fetchAllLabels() {
  // ✅ Direct labels endpoint (अगर चल गया तो best)
  try {
    const d = await GET(`blogs/${CONFIG.BLOGGER_ID}/posts/labels`);
    const items = d?.items || [];
    if (items.length) return items;
  } catch (e) {
    // ignore fallback
  }

  // ✅ Fallback: last posts से labels निकालेंगे
  const d2 = await GET(`blogs/${CONFIG.BLOGGER_ID}/posts`, {
    maxResults: 50,
    fields: "items(labels)"
  });

  const set = new Set();
  (d2.items || []).forEach(p => (p.labels || []).forEach(l => set.add(l)));

  return Array.from(set);
}

/** ✅ Posts by label */
export async function fetchPostsByLabel(label, maxResults = 30) {
  const d = await GET(`blogs/${CONFIG.BLOGGER_ID}/posts`, {
    labels: label,
    maxResults,
    fields: "items(id,title,published,url,labels)"
  });

  return d.items || [];
}

/** ✅ Publish YouTube video post */
export async function publishVideoPost({ title, ytUrl, label }) {
  const vid = extractYouTubeId(ytUrl);

  const embed = vid
    ? `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${vid}" frameborder="0" allowfullscreen></iframe>`
    : `<a href="${ytUrl}" target="_blank">${ytUrl}</a>`;

  const html = `
    <div style="font-family:Arial">
      <h2>${escapeHTML(title)}</h2>
      <div style="margin:12px 0">${embed}</div>
      <p><a href="${ytUrl}" target="_blank">Open on YouTube</a></p>
    </div>
  `;

  const body = {
    kind: "blogger#post",
    blog: { id: CONFIG.BLOGGER_ID },
    title,
    content: html,
    labels: [label] // ✅ यही label create करेगा automatically
  };

  return await POST(`blogs/${CONFIG.BLOGGER_ID}/posts/`, body);
}

/* helpers */
function escapeHTML(s){
  return String(s || "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function extractYouTubeId(url){
  try{
    const u = new URL(url);
    const v = u.searchParams.get("v");
    if(v) return v;

    // youtu.be/ID
    if(u.hostname.includes("youtu.be")){
      const id = u.pathname.replace("/","").trim();
      if(id) return id;
    }

    // shorts
    if(u.pathname.includes("/shorts/")){
      const id = u.pathname.split("/shorts/")[1]?.split("/")[0];
      if(id) return id;
    }

    return "";
  }catch{
    return "";
  }
}
