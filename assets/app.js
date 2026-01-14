// =============================
// Mockrise Blogger Admin Panel
// =============================

// ✅ CONFIG (तूने जो दिया वही लगा दिया)
const CONFIG = {
  BLOGGER_ID: "1505425628593992085",
  BLOGGER_KEY: "AIzaSyCpBV7mDpohv2rcqjchBil9TsZuV5VNQIk",
  CLIENT_ID: "294178060526-p8n98a97f69l3fa2dfap0md4phud16jp.apps.googleusercontent.com",
  ADMIN_EMAIL: "aadityaraj7852@gmail.com",

  // ✅ Required scope for create/delete posts
  SCOPE: "https://www.googleapis.com/auth/blogger",

  // UI Defaults
  DEFAULT_LABELS_SHORTCUTS: ["Test", "Video Lecture", "PDF", "Daily Quiz", "Cutoff", "OMR Checking", "Result Name"]
};

const $ = (id) => document.getElementById(id);

// UI
const statusTxt = $("statusTxt");
const labelsBox = $("labelsBox");
const postsBox = $("postsBox");
const activeLabelPill = $("activeLabelPill");
const postsCountPill = $("postsCountPill");

// User
const userName = $("userName");
const userEmail = $("userEmail");
const userPic = $("userPic");

// Buttons
const loginBtn = $("loginBtn");
const logoutBtn = $("logoutBtn");
const refreshBtn = $("refreshBtn");
const publishBtn = $("publishBtn");
const autoJsonBtn = $("autoJsonBtn");
const clearBtn = $("clearBtn");
const addLabelBtn = $("addLabelBtn");

// Inputs
const newLabelInput = $("newLabelInput");
const postTitle = $("postTitle");
const postType = $("postType");
const postContent = $("postContent");
const pdfLink = $("pdfLink");
const videoLink = $("videoLink");

// State
let accessToken = null;
let loggedUser = null;
let activeLabel = null;
let labelShortcuts = [...CONFIG.DEFAULT_LABELS_SHORTCUTS];

function setStatus(text, type="ok"){
  statusTxt.textContent = text;
  statusTxt.style.color = type==="ok" ? "#16a34a" : type==="warn" ? "#f59e0b" : "#dc2626";
}

function escapeHtml(str=""){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}

function makePostHtml({type, text, pdf, video}){
  const chips = [];
  if(type) chips.push(`✅ Type: ${type}`);
  if(pdf) chips.push(`📄 PDF: ${pdf}`);
  if(video) chips.push(`🎥 Video: ${video}`);

  const chipLine = chips.length ? `<p><b>${escapeHtml(chips.join(" | "))}</b></p>` : "";
  const safeText = escapeHtml(text || "");

  // Blogger content can contain HTML, so we format nicely:
  return `
    <div style="font-family:Lexend,Arial;line-height:1.6;">
      ${chipLine}
      <pre style="white-space:pre-wrap;background:#f5f5f8;border:1px solid #e9e9f2;padding:12px;border-radius:14px;font-weight:800;">${safeText}</pre>
    </div>
  `;
}

// -----------------------------
// Google OAuth Token (GIS)
// -----------------------------
let tokenClient = null;

function initTokenClient(){
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CONFIG.CLIENT_ID,
    scope: CONFIG.SCOPE,
    callback: (resp) => {
      if(resp && resp.access_token){
        accessToken = resp.access_token;
        setStatus("Logged in ✅ Token ready", "ok");
        afterLoginLoad();
      }else{
        setStatus("Token failed ❌", "err");
      }
    }
  });
}

async function requestToken(){
  if(!tokenClient) initTokenClient();
  tokenClient.requestAccessToken({ prompt: "consent" });
}

// ⚠️ Email verify requires ID token,
// so we use Google "userinfo" endpoint after getting token:
async function fetchUserInfo(){
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return await res.json();
}

function lockAdmin(user){
  const email = (user?.email || "").toLowerCase().trim();
  const allowed = CONFIG.ADMIN_EMAIL.toLowerCase().trim();

  if(email !== allowed){
    alert("❌ Access Denied! ये Admin panel सिर्फ owner के लिए है.");
    accessToken = null;
    loggedUser = null;
    renderUser();
    setStatus("Access denied", "err");
    throw new Error("Not admin");
  }
}

// -----------------------------
// Blogger API Helpers
// -----------------------------
function bloggerUrl(path, params={}){
  const url = new URL(`https://www.googleapis.com/blogger/v3/${path}`);
  url.searchParams.set("key", CONFIG.BLOGGER_KEY);
  Object.entries(params).forEach(([k,v])=>{
    if(v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  });
  return url.toString();
}

async function apiGET(path, params={}){
  const url = bloggerUrl(path, params);
  const res = await fetch(url, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
  });
  const data = await res.json();
  return data;
}

async function apiPOST(path, bodyObj){
  const url = bloggerUrl(path);
  const res = await fetch(url, {
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "Authorization": `Bearer ${accessToken}`
    },
    body: JSON.stringify(bodyObj)
  });
  const data = await res.json();
  return data;
}

async function apiDELETE(path){
  const url = bloggerUrl(path);
  const res = await fetch(url, {
    method:"DELETE",
    headers:{
      "Authorization": `Bearer ${accessToken}`
    }
  });

  // Blogger delete response empty can be 204
  if(res.status === 204) return { ok:true };
  try{
    return await res.json();
  }catch(e){
    return { ok: res.ok };
  }
}

// -----------------------------
// Labels + Posts Load
// -----------------------------
function renderUser(){
  userName.textContent = loggedUser?.name || "Not logged in";
  userEmail.textContent = loggedUser?.email || "—";
  userPic.src = loggedUser?.picture || "https://i.ibb.co/2FsfXqM/user.png";
}

function renderLabels(){
  labelsBox.innerHTML = "";

  const all = [...new Set(labelShortcuts)].filter(Boolean);

  all.forEach((lb)=>{
    const btn = document.createElement("button");
    btn.className = "labelBtn" + (activeLabel===lb ? " labelBtnActive" : "");
    btn.innerHTML = `
      <span style="display:flex;gap:10px;align-items:center;min-width:0;">
        <span class="material-symbols-outlined" style="color:#0a0ac2;">sell</span>
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(lb)}</span>
      </span>
      <span class="badge">Open</span>
    `;
    btn.onclick = async ()=>{
      activeLabel = lb;
      activeLabelPill.textContent = `Label: ${lb}`;
      renderLabels();
      await loadPostsByLabel(lb);
    };
    labelsBox.appendChild(btn);
  });
}

async function loadLabelsFromBlogger(){
  // Blogger V3 labels
  const data = await apiGET(`blogs/${CONFIG.BLOGGER_ID}/posts/labels`, {});
  const items = data.items || [];

  // merge + unique
  labelShortcuts = [...new Set([...items, ...labelShortcuts])];

  // auto set first label if not selected
  if(!activeLabel && labelShortcuts.length){
    activeLabel = labelShortcuts[0];
    activeLabelPill.textContent = `Label: ${activeLabel}`;
  }
  renderLabels();
}

async function loadPostsByLabel(label){
  try{
    setStatus("Loading posts...", "warn");
    postsBox.innerHTML = `<div class="mutedSmall">Loading…</div>`;

    const data = await apiGET(`blogs/${CONFIG.BLOGGER_ID}/posts`, {
      labels: label,
      maxResults: 20,
      fields: "items(id,title,published,updated,labels,url)"
    });

    const items = data.items || [];
    postsCountPill.textContent = `${items.length} posts`;

    if(!items.length){
      postsBox.innerHTML = `<div class="mutedSmall">No posts found in <b>${escapeHtml(label)}</b>.</div>`;
      setStatus("No posts", "warn");
      return;
    }

    postsBox.innerHTML = "";
    items.forEach((p)=>{
      const div = document.createElement("div");
      div.className = "postItem";
      div.innerHTML = `
        <div style="min-width:0;">
          <div class="postTitle">${escapeHtml(p.title || "-")}</div>
          <div class="postMeta">
            Updated: ${escapeHtml(new Date(p.updated || p.published || Date.now()).toLocaleString("en-IN"))}
          </div>
          <div class="postMeta">
            <a href="${escapeHtml(p.url || "#")}" target="_blank" style="color:#0a0ac2;font-weight:900;">Open Post</a>
          </div>
        </div>
        <div class="postActions">
          <button class="btnDanger" data-id="${escapeHtml(p.id)}">
            <span class="material-symbols-outlined">delete</span>
            Delete
          </button>
        </div>
      `;

      div.querySelector(".btnDanger").onclick = async ()=>{
        const ok = confirm("Delete this post? ❌");
        if(!ok) return;
        await deletePost(p.id);
        await loadPostsByLabel(activeLabel);
      };

      postsBox.appendChild(div);
    });

    setStatus("Posts loaded ✅", "ok");
  }catch(e){
    console.log(e);
    setStatus("Load failed ❌", "err");
    postsBox.innerHTML = `<div class="mutedSmall">Failed to load posts.</div>`;
  }
}

async function deletePost(postId){
  if(!accessToken){
    alert("Login first ✅");
    return;
  }
  setStatus("Deleting...", "warn");
  const data = await apiDELETE(`blogs/${CONFIG.BLOGGER_ID}/posts/${postId}`);
  if(data?.ok || data?.error===undefined){
    setStatus("Deleted ✅", "ok");
  }else{
    console.log(data);
    setStatus("Delete failed ❌", "err");
    alert("Delete error ❌ (permissions/scope check)");
  }
}

// -----------------------------
// Publish Post
// -----------------------------
function autoTemplate(){
  const t = postType.value;
  const base = {
    type: t,
    title: postTitle.value || "Mockrise Post",
    time: new Date().toISOString(),
    links: {
      pdf: pdfLink.value || "",
      video: videoLink.value || ""
    }
  };

  postContent.value =
`{
  "type": "${base.type}",
  "title": "${base.title}",
  "createdAt": "${base.time}",
  "pdf": "${base.links.pdf}",
  "video": "${base.links.video}",
  "data": {
    "note": "Yaha apna JSON add karo"
  }
}`;
}

function clearForm(){
  postTitle.value = "";
  postContent.value = "";
  pdfLink.value = "";
  videoLink.value = "";
  postType.value = "TEXT";
}

async function publishPost(){
  if(!accessToken){
    alert("पहले Google Login करो ✅");
    return;
  }
  if(!activeLabel){
    alert("पहले label select करो ✅");
    return;
  }

  const title = postTitle.value.trim();
  if(!title){
    alert("Title required ❌");
    return;
  }

  setStatus("Publishing...", "warn");

  const html = makePostHtml({
    type: postType.value,
    text: postContent.value,
    pdf: pdfLink.value.trim(),
    video: videoLink.value.trim()
  });

  const body = {
    kind: "blogger#post",
    blog: { id: CONFIG.BLOGGER_ID },
    title,
    content: html,
    labels: [activeLabel, postType.value] // label + type दोनों add ✅
  };

  const resp = await apiPOST(`blogs/${CONFIG.BLOGGER_ID}/posts/`, body);

  if(resp?.id){
    setStatus("Published ✅", "ok");
    clearForm();
    await loadLabelsFromBlogger();
    await loadPostsByLabel(activeLabel);
    alert("✅ Post Published Successfully!");
  }else{
    console.log(resp);
    setStatus("Publish failed ❌", "err");
    alert("❌ Publish Failed!\n\nScope/Consent screen check कर।");
  }
}

// -----------------------------
// After Login Load
// -----------------------------
async function afterLoginLoad(){
  try{
    setStatus("Fetching user...", "warn");
    const user = await fetchUserInfo();
    loggedUser = user;
    renderUser();

    // ✅ Admin lock
    lockAdmin(user);

    // ✅ Load labels + posts
    setStatus("Loading labels...", "warn");
    await loadLabelsFromBlogger();
    renderLabels();

    if(activeLabel){
      await loadPostsByLabel(activeLabel);
    }
