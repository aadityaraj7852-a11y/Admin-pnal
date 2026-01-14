const ADMIN_EMAIL = "aadityaraj7852@gmail.com";

// ✅ अगर already login है तो direct home
if(localStorage.getItem("mockrise_logged_in") === "1"){
  window.location.href = "./home.html";
}

const email = document.getElementById("email");
const pass = document.getElementById("pass");
const loginBtn = document.getElementById("loginBtn");

loginBtn.addEventListener("click", ()=>{
  const e = (email.value || "").trim().toLowerCase();
  const p = (pass.value || "").trim();

  if(!e) return alert("Email डाल");
  if(!p) return alert("Password डाल");

  // ✅ Admin email check
  if(e !== ADMIN_EMAIL.toLowerCase()){
    return alert("Access Denied (Admin only)");
  }

  // ✅ Simple login (demo)
  localStorage.setItem("mockrise_logged_in","1");
  localStorage.setItem("mockrise_email", e);

  window.location.href = "./home.html";
});
