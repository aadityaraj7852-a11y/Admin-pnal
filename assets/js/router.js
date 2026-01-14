export function setupSidebarToggle() {
  const menuBtn = document.getElementById("menuBtn");
  const sidebar = document.getElementById("sidebar");

  if (!menuBtn || !sidebar) return;

  menuBtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  // outside click close
  document.addEventListener("click", (e) => {
    if (!sidebar.classList.contains("open")) return;
    const isClickInside = sidebar.contains(e.target) || menuBtn.contains(e.target);
    if (!isClickInside) sidebar.classList.remove("open");
  });
}
