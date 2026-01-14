export function getYouTubeId(url=""){
  const u=String(url).trim();
  const s=u.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/); if(s) return s[1];
  const w=u.match(/[?&]v=([a-zA-Z0-9_-]{6,})/); if(w) return w[1];
  const e=u.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/); if(e) return e[1];
  return null;
}
export function getDriveFileId(url=""){
  const u=String(url).trim();
  const m1=u.match(/\/file\/d\/([a-zA-Z0-9_-]{10,})/); if(m1) return m1[1];
  const m2=u.match(/[?&]id=([a-zA-Z0-9_-]{10,})/); if(m2) return m2[1];
  return null;
}
export function makeVideoEmbed(url=""){
  const yt=getYouTubeId(url);
  if(yt) return `<iframe width="100%" height="320" style="border:0;border-radius:18px;box-shadow:0 12px 30px rgba(0,0,0,.08);" src="https://www.youtube.com/embed/${yt}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
  const dr=getDriveFileId(url);
  if(dr) return `<iframe width="100%" height="320" style="border:0;border-radius:18px;box-shadow:0 12px 30px rgba(0,0,0,.08);" src="https://drive.google.com/file/d/${dr}/preview" allow="autoplay"></iframe>`;
  return `<a href="${url}" target="_blank" style="font-weight:900;color:#0a0ac2;">▶ Open Video</a>`;
}
export function makePdfEmbed(url=""){
  const dr=getDriveFileId(url);
  if(dr) return `<iframe width="100%" height="520" style="border:0;border-radius:18px;box-shadow:0 12px 30px rgba(0,0,0,.08);" src="https://drive.google.com/file/d/${dr}/preview"></iframe>`;
  return `<a href="${url}" target="_blank" style="font-weight:900;color:#0a0ac2;">📄 Open PDF</a>`;
}
export function makeImageEmbed(url=""){
  return `<img src="${url}" style="max-width:100%;border-radius:18px;box-shadow:0 12px 30px rgba(0,0,0,.08);" />`;
}
export function buildPostHtml({type,title,label,desc,mainLink,extraLink,bodyText}){
  const safe=(s="")=>String(s||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
  let embed="";
  if(type==="VIDEO") embed=makeVideoEmbed(mainLink);
  if(type==="PDF") embed=makePdfEmbed(mainLink);
  if(type==="IMAGE") embed=makeImageEmbed(mainLink);
  return `<div style="font-family:Lexend,Arial;line-height:1.6;">
    <h2 style="margin:0;font-weight:900;">${safe(title)}</h2>
    <p style="margin:8px 0 0;font-weight:900;color:#0a0ac2;">✅ ${safe(label)} • ${safe(type)}</p>
    ${desc?`<p style="margin:10px 0;font-weight:800;color:#111118;">${safe(desc)}</p>`:""}
    ${embed?`<div style="margin-top:12px;">${embed}</div>`:""}
    ${extraLink?`<div style="margin-top:12px;"><a href="${safe(extraLink)}" target="_blank" style="font-weight:900;color:#0a0ac2;">🔗 Extra Link</a></div>`:""}
    ${bodyText?`<div style="margin-top:12px;"><pre style="white-space:pre-wrap;background:#f5f5f8;border:1px solid #e9e9f2;padding:12px;border-radius:14px;font-weight:800;">${safe(bodyText)}</pre></div>`:""}
    <p style="margin-top:14px;font-size:12px;color:#6b7280;font-weight:900;">Mockrise Admin • Auto Generated ✅</p>
  </div>`;
}
