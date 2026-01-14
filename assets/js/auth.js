import { CONFIG } from "./config.js";

let tokenClient=null;
let accessToken=null;
let userInfo=null;

function initTokenClient(){
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CONFIG.CLIENT_ID,
    scope: CONFIG.SCOPE,
    callback: async (resp)=>{
      if(!resp?.access_token){ alert("❌ Login Failed"); return; }
      accessToken = resp.access_token;
      userInfo = await getUserInfo();

      const email = String(userInfo?.email||"").toLowerCase().trim();
      if(!email){ alert("❌ Email नहीं मिली (scope issue)"); logout(); return; }

      if(email !== CONFIG.ADMIN_EMAIL.toLowerCase().trim()){
        alert(`❌ Access Denied\n\nLogged: ${email}\nAllowed: ${CONFIG.ADMIN_EMAIL}`);
        logout(); return;
      }

      localStorage.setItem("mockrise_token", accessToken);
      localStorage.setItem("mockrise_user", JSON.stringify(userInfo));
      window.dispatchEvent(new CustomEvent("mockrise:login",{detail:userInfo}));
    }
  });
}

export async function login(){
  if(!tokenClient) initTokenClient();
  tokenClient.requestAccessToken({prompt:"consent select_account"});
}

export function logout(){
  accessToken=null; userInfo=null;
  localStorage.removeItem("mockrise_token");
  localStorage.removeItem("mockrise_user");
  window.dispatchEvent(new CustomEvent("mockrise:logout"));
}

export function getToken(){
  if(accessToken) return accessToken;
  accessToken = localStorage.getItem("mockrise_token") || null;
  return accessToken;
}

export function getUser(){
  if(userInfo) return userInfo;
  try{ userInfo = JSON.parse(localStorage.getItem("mockrise_user")||"null"); }
  catch{ userInfo=null; }
  return userInfo;
}

export function requireAuthOrRedirect(){
  const t=getToken(); const u=getUser();
  if(!t || !u?.email){ window.location.href="/index.html"; return false; }
  return true;
}

async function getUserInfo(){
  const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo",{
    headers:{ Authorization:`Bearer ${accessToken}` }
  });
  return await res.json();
}
