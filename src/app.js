import "./style.css";

// progress + spy
const progress = document.getElementById("progress");
const links = [...document.querySelectorAll(".nav-link")];
const ids = links.map(a => a.getAttribute("href")).filter(Boolean);
const sections = ids.map(id => document.querySelector(id)).filter(Boolean);

function onScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
  if (progress) progress.style.width = pct + "%";

  let active = ids[0];
  for (const s of sections) {
    if (window.scrollY + 120 >= s.offsetTop) active = "#" + s.id;
  }
  links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === active));
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// keyboard nav
const order = ids;
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown" || e.key === "ArrowRight") {
    e.preventDefault();
    const cur = order.findIndex(h => {
      const el = document.querySelector(h);
      return el && window.scrollY + 200 >= el.offsetTop && window.scrollY + 200 < el.offsetTop + el.offsetHeight;
    });
    const next = order[Math.min(order.length - 1, cur + 1)];
    if (next) document.querySelector(next)?.scrollIntoView({ behavior: "smooth" });
  }
  if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
    e.preventDefault();
    const cur = order.findIndex(h => {
      const el = document.querySelector(h);
      return el && window.scrollY + 200 >= el.offsetTop && window.scrollY + 200 < el.offsetTop + el.offsetHeight;
    });
    const prev = order[Math.max(0, cur - 1)];
    if (prev) document.querySelector(prev)?.scrollIntoView({ behavior: "smooth" });
  }
});

document.getElementById("presentBtn")?.addEventListener("click", () => {
  document.documentElement.requestFullscreen?.();
});

// Prototype Viewer Controller
const previewIframe = document.getElementById("prototypeFrame");
const addressBarUrl = document.getElementById("addressBarUrl");
const externalLinkBtn = document.getElementById("externalLinkBtn");
const tabButtons = document.querySelectorAll(".proto-tab-btn");
const deviceButtons = document.querySelectorAll(".proto-device-btn");
const frameWrapper = document.getElementById("protoFrameWrapper");

const screenRoutes = {
  home: {
    url: "/assets/stitch-screens/home.html",
    path: "https://institutolonganima.com.br/"
  },
  "quem-sou-eu": {
    url: "/assets/stitch-screens/quem-sou-eu.html",
    path: "https://institutolonganima.com.br/quem-sou-eu"
  },
  especialidades: {
    url: "/assets/stitch-screens/especialidades.html",
    path: "https://institutolonganima.com.br/especialidades"
  },
  artigos: {
    url: "/assets/stitch-screens/artigos.html",
    path: "https://institutolonganima.com.br/artigos"
  },
  contato: {
    url: "/assets/stitch-screens/contato.html",
    path: "https://institutolonganima.com.br/contato"
  }
};

window.switchPrototypeScreen = function(screenKey) {
  const data = screenRoutes[screenKey];
  if (!data) return;
  
  const frame = document.getElementById("prototypeFrame");
  if (frame) frame.src = data.url;

  const addr = document.getElementById("addressBarUrl");
  if (addr) addr.textContent = data.path;

  const extBtn = document.getElementById("externalLinkBtn");
  if (extBtn) extBtn.href = data.url;

  document.querySelectorAll(".proto-tab-btn").forEach(btn => {
    const isTarget = btn.getAttribute("data-screen") === screenKey;
    if (isTarget) {
      btn.className = "proto-tab-btn px-3 py-1.5 rounded-xl font-semibold transition flex items-center gap-1.5 bg-brand-teal text-white shadow-sm shrink-0";
      const dot = btn.querySelector("span");
      if (dot) dot.className = "w-2 h-2 rounded-full bg-amber-300";
    } else {
      btn.className = "proto-tab-btn px-3 py-1.5 rounded-xl font-semibold transition flex items-center gap-1.5 bg-white text-brand-marrom hover:bg-white/80 border border-brand-sandDark shrink-0";
      const dot = btn.querySelector("span");
      if (dot) dot.className = "w-2 h-2 rounded-full bg-brand-teal";
    }
  });

  // Scroll smooth to preview if needed
  const previewSection = document.getElementById("site-preview");
  if (previewSection && window.scrollY > previewSection.offsetTop + 400) {
    previewSection.scrollIntoView({ behavior: "smooth" });
  }
};

window.setPrototypeDevice = function(device) {
  const wrapper = document.getElementById("protoFrameWrapper");
  if (!wrapper) return;

  document.querySelectorAll(".proto-device-btn").forEach(btn => {
    const isCurrent = btn.getAttribute("data-device") === device;
    if (isCurrent) {
      btn.className = "proto-device-btn px-2.5 py-1 rounded-lg font-medium bg-brand-teal text-white transition flex items-center gap-1";
    } else {
      btn.className = "proto-device-btn px-2.5 py-1 rounded-lg font-medium bg-white text-brand-ink/70 hover:bg-brand-sand border border-brand-sandDark transition flex items-center gap-1";
    }
  });

  if (device === "mobile") {
    wrapper.style.maxWidth = "390px";
    wrapper.style.height = "720px";
  } else if (device === "tablet") {
    wrapper.style.maxWidth = "768px";
    wrapper.style.height = "700px";
  } else {
    wrapper.style.maxWidth = "100%";
    wrapper.style.height = "680px";
  }
};

window.reloadPrototypeFrame = function() {
  const frame = document.getElementById("prototypeFrame");
  if (frame) {
    const src = frame.src;
    frame.src = "";
    setTimeout(() => { frame.src = src; }, 50);
  }
};

