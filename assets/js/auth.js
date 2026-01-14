import { CONFIG } from "./config.js";

const KEY = "mockrise_admin_session_v1";

function base64UrlDecode(str) {
  try {
    const pad = "=".repeat((4 - (str.length % 4)) % 4);
    const base64 = (str + pad).replace(/-/g, "+").replace(/_/g, "/");
    return decodeURIComponent(
      atob(base64)
        .split("")
        .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
  } catch (e) {
    return "";
  }
}

function decodeJWT(jwt) {
  try {
    const parts = jwt.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    return payload;
  } catch (e) {
    return null;
  }
}

export const Auth = {
  getSession() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "null");
    } catch (e) {
      return null;
    }
  },

  setSession(session) {
    localStorage.setItem(KEY, JSON.stringify(session));
  },

  clear() {
    localStorage.removeItem(KEY);
  },

  isLoggedIn() {
    const s = this.getSession();
    if (!s) return false;
    if (!s.email) return false;
    return true;
  },

  isAdmin() {
    const s = this.getSession();
    if (!s?.email) return false;
    return s.email.toLowerCase() === CONFIG.adminEmail.toLowerCase();
  },

  requireAuth() {
    if (!this.isLoggedIn() || !this.isAdmin()) {
      window.location.href = "./index.html";
    }
  },

  async googleLoginFromCredential(credential) {
    const payload = decodeJWT(credential);
    if (!payload?.email) throw new Error("Google credential invalid");

    const email = String(payload.email).toLowerCase();
    if (email !== CONFIG.adminEmail.toLowerCase()) {
      throw new Error("Access Denied (not admin)");
    }

    this.setSession({
      provider: "google",
      email: payload.email,
      name: payload.name || "Admin",
      picture: payload.picture || "",
      time: Date.now()
    });

    return true;
  },

  backupLogin(email, pass) {
    if (!CONFIG.backupLogin.enabled) throw new Error("Backup disabled");

    if (String(email).toLowerCase() !== CONFIG.adminEmail.toLowerCase()) {
      throw new Error("Email not allowed");
    }
    if (String(pass) !== CONFIG.backupLogin.password) {
      throw new Error("Wrong password");
    }

    this.setSession({
      provider: "backup",
      email: CONFIG.adminEmail,
      name: "Admin",
      picture: "",
      time: Date.now()
    });

    return true;
  },

  logout() {
    this.clear();
    window.location.href = "./index.html";
  }
};
