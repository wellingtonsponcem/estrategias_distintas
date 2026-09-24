import "./style.css";

// Elements & Navigation IDs
const progress = document.getElementById("progress");
const desktopLinks = [...document.querySelectorAll(".nav-link")];
const mobileLinks = [...document.querySelectorAll(".mobile-nav-link")];
const ids = desktopLinks.map(a => a.getAttribute("href")).filter(Boolean);
const sections = ids.map(id => document.querySelector(id)).filter(Boolean);

// Mobile action bar elements
const mobileCurrentSlideText = document.getElementById("mobileCurrentSlideText");
const mobileSlideCounterBadge = document.getElementById("mobileSlideCounterBadge");
const mobileMenuDrawer = document.getElementById("mobileMenuDrawer");
const mobileDrawerOverlay = document.getElementById("mobileDrawerOverlay");

function onScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
  if (progress) progress.style.width = pct + "%";

  let activeIndex = 0;
  let activeId = ids[0];

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    if (window.scrollY + 140 >= s.offsetTop) {
      activeId = "#" + s.id;
      activeIndex = i;
    }
  }

  // Update Desktop links
  desktopLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === activeId));
  
  // Update Mobile links
  mobileLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === activeId));

  // Update Mobile Action Bar text and badge
  if (mobileSlideCounterBadge) {
    mobileSlideCounterBadge.textContent = `${activeIndex + 1}/${ids.length}`;
  }
  if (mobileCurrentSlideText) {
    const activeSection = sections[activeIndex];
    const sectionTitle = activeSection?.querySelector("h2, h1")?.textContent?.trim() || "Índice";
    mobileCurrentSlideText.textContent = sectionTitle;
  }
}

window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Mobile Navigation Controls
window.goToNextSlide = function() {
  const curIndex = ids.findIndex(h => {
    const el = document.querySelector(h);
    return el && window.scrollY + 220 >= el.offsetTop && window.scrollY + 220 < el.offsetTop + el.offsetHeight;
  });
  const nextId = ids[Math.min(ids.length - 1, curIndex + 1)];
  if (nextId) document.querySelector(nextId)?.scrollIntoView({ behavior: "smooth" });
};

window.goToPrevSlide = function() {
  const curIndex = ids.findIndex(h => {
    const el = document.querySelector(h);
    return el && window.scrollY + 220 >= el.offsetTop && window.scrollY + 220 < el.offsetTop + el.offsetHeight;
  });
  const prevId = ids[Math.max(0, curIndex - 1)];
  if (prevId) document.querySelector(prevId)?.scrollIntoView({ behavior: "smooth" });
};

window.openMobileMenu = function() {
  if (mobileMenuDrawer) mobileMenuDrawer.classList.add("mobile-drawer-open");
  if (mobileDrawerOverlay) mobileDrawerOverlay.classList.add("mobile-overlay-visible");
  document.body.style.overflow = "hidden";
};

window.closeMobileMenu = function() {
  if (mobileMenuDrawer) mobileMenuDrawer.classList.remove("mobile-drawer-open");
  if (mobileDrawerOverlay) mobileDrawerOverlay.classList.remove("mobile-overlay-visible");
  document.body.style.overflow = "";
};

// Keyboard navigation
const order = ids;
window.addEventListener("keydown", (e) => {
  const welcome = document.getElementById("welcomeScreen");
  const isWelcomeOpen = welcome && welcome.style.display !== "none" && welcome.getAttribute("data-dismissed") !== "true";

  if (isWelcomeOpen) {
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      window.dismissWelcomeScreen();
      return;
    }
  }

  if (e.key === "Escape") {
    window.closeMobileMenu();
    return;
  }

  if (e.key === "ArrowDown" || e.key === "ArrowRight") {
    e.preventDefault();
    window.goToNextSlide();
  }
  if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
    e.preventDefault();
    window.goToPrevSlide();
  }
});

// Touch swipe gestures for mobile slides
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

window.addEventListener("touchstart", (e) => {
  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

window.addEventListener("touchend", (e) => {
  touchEndX = e.changedTouches[0].screenX;
  touchEndY = e.changedTouches[0].screenY;
  handleTouchSwipe();
}, { passive: true });

function handleTouchSwipe() {
  const diffX = touchEndX - touchStartX;
  const diffY = touchEndY - touchStartY;
  
  // Only trigger horizontal swipe if deltaX is significant and predominantly horizontal
  const welcome = document.getElementById("welcomeScreen");
  const isWelcomeOpen = welcome && welcome.style.display !== "none" && welcome.getAttribute("data-dismissed") !== "true";
  const isDrawerOpen = mobileMenuDrawer && mobileMenuDrawer.classList.contains("mobile-drawer-open");

  if (isWelcomeOpen || isDrawerOpen) return;

  // Swipe left -> Next slide
  if (diffX < -70 && Math.abs(diffY) < 50) {
    window.goToNextSlide();
  }
  // Swipe right -> Prev slide
  else if (diffX > 70 && Math.abs(diffY) < 50) {
    window.goToPrevSlide();
  }
}

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

// Welcome Screen Controller
window.dismissWelcomeScreen = function() {
  const welcome = document.getElementById("welcomeScreen");
  if (!welcome) return;
  welcome.setAttribute("data-dismissed", "true");
  welcome.style.opacity = "0";
  welcome.style.transform = "scale(1.05)";
  welcome.style.filter = "blur(14px)";
  welcome.style.pointerEvents = "none";
  setTimeout(() => {
    welcome.style.display = "none";
  }, 700);
};

window.showWelcomeScreen = function() {
  const welcome = document.getElementById("welcomeScreen");
  if (!welcome) return;
  welcome.removeAttribute("data-dismissed");
  welcome.style.display = "flex";
  welcome.style.pointerEvents = "auto";
  void welcome.offsetHeight; // trigger reflow
  welcome.style.opacity = "1";
  welcome.style.transform = "scale(1)";
  welcome.style.filter = "blur(0)";
  window.scrollTo({ top: 0, behavior: "smooth" });
};


