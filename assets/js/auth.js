import { CONFIG } from "./config.js";

let tokenClient = null;
let accessToken = null;
let userInfo = null;

function saveSession(token, user){
  localStorage.setItem("mockrise_token", token || "");
  localStorage.setItem("mockrise_user", JSON.stringify(user || {}));
}

function loadSession(){
  const t = localStorage.getItem("mockrise_token") || null;
  let u = null;
  try{ u = JSON.parse(localStorage.getItem("mockrise_user") || "null"); }catch{}
  if(t) accessToken = t;
  if(u) userInfo = u;
}

async function getUserInfo(){
  const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo",{
    headers:{ Authorization:`Bearer ${accessToken}` }
  });
  return await res.json();
}

function initTokenClient(){
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CONFIG.CLIENT_ID,
    scope: CONFIG.SCOPE,
    callback: async (resp)=>{
      if(!resp?.access_token){
        alert("❌ Login Failed");
        return;
      }

      accessToken = resp.access_token;
      userInfo = await getUserInfo();

      const email = String(userInfo?.email || "").toLowerCase().trim();
      if(email !== String(CONFIG.ADMIN_EMAIL).toLowerCase().trim()){
        alert("❌ Admin only");
        logout();
        return;
      }

      saveSession(accessToken, userInfo);
      window.location.href = "./home.html";
    }
  });
}

export function login(){
  if(!window.google?.accounts?.oauth2){
    alert("Google script load नहीं हुआ ❌");
    return;
  }
  if(!tokenClient) initTokenClient();
  tokenClient.requestAccessToken({ prompt: "select_account" });
}

export function logout(){
  accessToken = null;
  userInfo = null;
  localStorage.removeItem("mockrise_token");
  localStorage.removeItem("mockrise_user");
}

export function getToken(){
  if(!accessToken) loadSession();
  return accessToken;
}

export function getUser(){
  if(!userInfo) loadSession();
  return userInfo;
}

export function requireAuthOrRedirect(){
  const t = getToken();
  const u = getUser();

  if(!t || !u?.email){
    window.location.href = "./index.html";
    return false;
  }

  if(String(u.email).toLowerCase() !== String(CONFIG.ADMIN_EMAIL).toLowerCase()){
    window.location.href = "./index.html";
    return false;
  }

  return true;
}
