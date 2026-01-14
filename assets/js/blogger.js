import { CONFIG } from "./config.js";
import { getToken } from "./auth.js";

function bloggerUrl(path, params = {}) {
  const url = new URL(`https://www.googleapis.com/blogger/v3/${path}`);
  url.searchParams.set("key", CONFIG.BLOGGER_KEY);

  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  }
  return url.toString();
}

async function readJsonSafe(res){
  try { return await res.json(); }
  catch { return null; }
}

function mustToken(){
  const token = getToken();
  if(!token) throw new Error("Google token missing ❌ (Logout करके दुबारा login कर)");
  return token;
}

async function apiGET(path, params = {}) {
  const token = getToken();
  const res = await fetch(bloggerUrl(path, params), {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  const data = await readJsonSafe(res);
  if(!res.ok){
    console.log("Blogger GET Error:", data);
    throw new Error(data?.error?.message || `GET Failed (${res.status})`);
  }
  return data;
}

async function apiPOST(path, bodyObj) {
  const token = mustToken();

  const res = await fetch(bloggerUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(bodyObj)
  });

  const data = await readJsonSafe(res);
  if(!res.ok){
    console.log("Blogger POST Error:", data);
    throw new Error(data?.error?.message || `POST Failed (${res.status})`);
  }

  return data;
}

async function apiDELETE(path) {
  const token = mustToken();

  const res = await fetch(bloggerUrl(path), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });

  if (res.status === 204) return { ok: true };

  const data = await readJsonSafe(res);
  if(!res.ok){
    console.log("Blogger DELETE Error:", data);
    throw new Error(data?.error?.message || `DELETE Failed (${res.status})`);
  }
  return { ok: true, data };
}

// ✅ Labels
export async function fetchLabels() {
  // ✅ ये endpoint कभी-कभी fail करता है, इसलिए fallback भी रखा
  try{
    const d = await apiGET(`blogs/${CONFIG.BLOGGER_ID}/posts/labels`);
    return d.items || [];
  }catch(e){
    // fallback: posts से labels निकालेंगे
    const d = await apiGET(`blogs/${CONFIG.BLOGGER_ID}/posts`, {
      maxResults: 20,
      fields: "items(labels)"
    });
    const set = new Set();
    (d.items || []).forEach(p => (p.labels || []).forEach(l => set.add(l)));
    return [...set];
  }
}

// ✅ Posts by label
export async function fetchPostsByLabel(label, maxResults = 20) {
  const d = await apiGET(`blogs/${CONFIG.BLOGGER_ID}/posts`, {
    labels: label,
    maxResults,
    fields: "items(id,title,updated,published,url,labels)"
  });
  return d.items || [];
}

// ✅ Publish
export async function publishPost({ title, html, labels = [] }) {
  const body = {
    kind: "blogger#post",
    blog: { id: CONFIG.BLOGGER_ID },
    title,
    content: html,
    labels
  };

  const r = await apiPOST(`blogs/${CONFIG.BLOGGER_ID}/posts/`, body);

  if (!r?.id) throw new Error("Publish failed ❌");
  return r;
}

// ✅ Delete
export async function deletePost(postId) {
  return await apiDELETE(`blogs/${CONFIG.BLOGGER_ID}/posts/${postId}`);
}
