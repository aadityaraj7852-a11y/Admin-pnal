import { CONFIG } from "./config.js";
import { getToken } from "./auth.js";

function bloggerUrl(path, params={}){
  const url = new URL(`https://www.googleapis.com/blogger/v3/${path}`);
  url.searchParams.set("key", CONFIG.BLOGGER_KEY);
  for(const [k,v] of Object.entries(params)){
    if(v!==undefined && v!==null && v!=="") url.searchParams.set(k,v);
  }
  return url.toString();
}

async function apiGET(path, params={}){
  const token=getToken();
  const res = await fetch(bloggerUrl(path, params),{
    headers: token ? {Authorization:`Bearer ${token}`} : {}
  });
  return await res.json();
}

async function apiPOST(path, bodyObj){
  const token=getToken();
  const res = await fetch(bloggerUrl(path),{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      Authorization:`Bearer ${token}`
    },
    body: JSON.stringify(bodyObj)
  });
  return await res.json();
}

async function apiDELETE(path){
  const token=getToken();
  const res = await fetch(bloggerUrl(path),{
    method:"DELETE",
    headers:{ Authorization:`Bearer ${token}` }
  });
  if(res.status===204) return {ok:true};
  try{ return await res.json(); } catch { return {ok:res.ok}; }
}

export async function fetchLabels(){
  const d = await apiGET(`blogs/${CONFIG.BLOGGER_ID}/posts/labels`);
  return d.items || [];
}

export async function fetchPostsByLabel(label, maxResults=20){
  const d = await apiGET(`blogs/${CONFIG.BLOGGER_ID}/posts`,{
    labels: label,
    maxResults,
    fields: "items(id,title,updated,published,url,labels)"
  });
  return d.items || [];
}

export async function publishPost({title, html, labels=[]}){
  const body = { kind:"blogger#post", blog:{id:CONFIG.BLOGGER_ID}, title, content: html, labels };
  const r = await apiPOST(`blogs/${CONFIG.BLOGGER_ID}/posts/`, body);
  if(!r?.id) throw new Error("Publish failed");
  return r;
}

export async function deletePost(postId){
  const r = await apiDELETE(`blogs/${CONFIG.BLOGGER_ID}/posts/${postId}`);
  if(!r?.ok && r?.error) throw new Error("Delete failed");
  return r;
}
