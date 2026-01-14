(function () {
  const CFG = window.CONFIG;

  function must(v, name) {
    if (!v) throw new Error(`${name} missing in config.js`);
    return v;
  }

  const BLOG_ID = must(CFG?.blogger?.blogId, "CONFIG.blogger.blogId");
  const API_KEY = must(CFG?.blogger?.apiKey, "CONFIG.blogger.apiKey");

  async function getAccessToken() {
    // Google Identity Services (GIS)
    if (window.google?.accounts?.oauth2) {
      // token is stored by auth.js generally
      const t = window.AUTH?.getToken?.();
      if (t?.access_token) return t.access_token;
    }

    // fallback: if auth.js saved token in localStorage
    try {
      const raw = localStorage.getItem("mockrise_token");
      if (!raw) return null;
      const tok = JSON.parse(raw);
      return tok?.access_token || null;
    } catch (e) {
      return null;
    }
  }

  async function callBlogger(url, options = {}) {
    const token = await getAccessToken();
    if (!token) throw new Error("No access token. Please login with Google again.");

    const res = await fetch(url, {
      method: options.method || "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }

    if (!res.ok) {
      console.log("Blogger API Error:", data);
      throw new Error(data?.error?.message || `Blogger API failed (${res.status})`);
    }

    return data;
  }

  async function createPost({ title, contentHTML, labels = [] }) {
    const url =
      `https://www.googleapis.com/blogger/v3/blogs/${BLOG_ID}/posts/` +
      `?key=${API_KEY}`;

    const payload = {
      kind: "blogger#post",
      title: title,
      content: contentHTML,
      labels: labels
    };

    return callBlogger(url, { method: "POST", body: payload });
  }

  async function listPostsByLabel(label) {
    const url =
      `https://www.googleapis.com/blogger/v3/blogs/${BLOG_ID}/posts` +
      `?key=${API_KEY}&labels=${encodeURIComponent(label)}&maxResults=50&fetchBodies=false`;

    return callBlogger(url);
  }

  async function getAllLabelsSafe() {
    // Blogger v3 में "labels list" direct endpoint नहीं है,
    // इसलिए हम latest posts से labels निकाल रहे हैं ✅
    const url =
      `https://www.googleapis.com/blogger/v3/blogs/${BLOG_ID}/posts` +
      `?key=${API_KEY}&maxResults=50&fetchBodies=false`;

    const data = await callBlogger(url);
    const items = data?.items || [];

    const set = new Set();
    items.forEach(p => (p.labels || []).forEach(l => set.add(l)));

    return [...set];
  }

  async function getPostsByLabelSafe(label) {
    const data = await listPostsByLabel(label);
    const items = data?.items || [];
    return items.map(p => ({
      title: p.title || "",
      published: p.published || "",
      url: p.url || p.selfLink || ""
    }));
  }

  window.BLOGGER = {
    createPost,
    getPostsByLabelSafe,
    getAllLabelsSafe
  };
})();
