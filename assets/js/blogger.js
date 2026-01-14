import { CONFIG } from "./config.js";
import { getToken } from "./auth.js";

function apiUrl(path, params = {}){
  const url = new URL(`https://www.googleapis.com/blogger/v3/${path}`);
  url.searchParams.set("key", CONFIG.BLOGGER_KEY);

  for(const [k,v] of Object.entries(params)){
    if(v!==undefined && v!==null && v!=="") url.searchParams.set(k,v);
  }
  return url.toString();
}

async function jsonSafe(res){
  try{ return await res.json(); }catch{ return null; }
}

function mustToken(){
  const t = getToken();
  if(!t) throw new Error("Token missing ❌ Logout करके फिर Login कर");
  return t;
}

// ✅ Labels (direct + fallback)
export async function fetchLabels(){
  const token = getToken();
  const headers = token ? { Authorization:`Bearer ${token}` } : {};

  // Try direct labels endpoint
  try{
    const res = await fetch(apiUrl(`blogs/${CONFIG.BLOGGER_ID}/posts/labels`), { headers });
    if(res.ok){
      const data = await res.json();
      return data.items || [];
    }
  }catch(e){}

  // Fallback: last posts से labels निकाल
  const res2 = await fetch(apiUrl(`blogs/${CONFIG.BLOGGER_ID}/posts`, {
    maxResults: 50,
    fields: "items(labels)"
  }), { headers });

  const data2 = await jsonSafe(res2);
  if(!res2.ok) return [];

  const set = new Set();
  (data2.items || []).forEach(p => (p.labels||[]).forEach(l => set.add(l)));
  return [...set];
}

// ✅ Posts by label
export async function fetchPostsByLabel(label){
  const token = getToken();
  const headers = token ? { Authorization:`Bearer ${token}` } : {};

  const res = await fetch(apiUrl(`blogs/${CONFIG.BLOGGER_ID}/posts`,{
    labels: label,
    maxResults: 30,
    fields:"items(id,title,published,url,labels)"
  }), { headers });

  const data = await jsonSafe(res);
  if(!res.ok){
    console.log("fetchPostsByLabel error:", data);
    return [];
  }
  return data.items || [];
}

// ✅ Publish YouTube Video Post (Label create यही करेगा ✅)
export async function publishYouTubePost(title, label, youtubeUrl){
  const token = mustToken();

  const html = `
    <div style="font-family:Arial">
      <h2>${title}</h2>
      <p><a href="${youtubeUrl}" target="_blank">Watch Video</a></p>
    </div>
  `;

  const body = {
    kind:"blogger#post",
    title,
    content: html,
    labels:[label]
  };

  const res = await fetch(apiUrl(`blogs/${CONFIG.BLOGGER_ID}/posts/`),{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      Authorization:`Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  const data = await jsonSafe(res);
  if(!res.ok){
    console.log("publish error:", data);
    throw new Error(data?.error?.message || "Publish failed ❌");
  }
  return data;
}
