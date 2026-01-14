import { CONFIG } from "../config.js";
import { Auth } from "../auth.js";

const $ = (id) => document.getElementById(id);

function setStatus(txt) {
  if ($("statusText")) $("statusText").textContent = txt;
}

function initGoogle() {
  // inject client id into HTML tag
  const onload = document.getElementById("g_id_onload");
  if (onload) onload.setAttribute("data-client_id", CONFIG.googleClientId);

  // listen for GIS credential event
  window.addEventListener("mockrise_gis", async () => {
    try {
      setStatus("Signing in...");
      const cred = window.__MOCKRISE_GIS_CREDENTIAL || "";
      await Auth.googleLoginFromCredential(cred);
      window.location.href = "./home.html";
    } catch (e) {
      alert("Access Denied ❌\nOnly admin allowed.");
      setStatus("Denied");
      Auth.clear();
    }
  });
}

function initBackup() {
  const form = $("backupForm");
  if (!form) return;

  $("bEmail").value = CONFIG.adminEmail;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    try {
      Auth.backupLogin($("bEmail").value, $("bPass").value);
      window.location.href = "./home.html";
    } catch (err) {
      alert("Login failed ❌");
    }
  });

  if ($("tinyHint")) {
    $("tinyHint").textContent = "Backup password config.js में change कर सकते हो";
  }
}

(function init(){
  // already logged in
  if (Auth.isLoggedIn() && Auth.isAdmin()) {
    window.location.href = "./home.html";
    return;
  }

  setStatus("Ready");
  initGoogle();
  initBackup();
})();
