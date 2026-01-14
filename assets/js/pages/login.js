import { login } from "../auth.js";
import { setStatus } from "../ui.js";

document.getElementById("loginBtn").onclick = async ()=>{
  setStatus("Opening Google login...", "warn");
  await login();
};

window.addEventListener("mockrise:login", ()=>{
  setStatus("Login success ✅ Redirecting...", "ok");
  window.location.href = "/home.html";
});
